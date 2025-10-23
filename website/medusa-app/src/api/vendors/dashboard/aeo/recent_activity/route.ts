import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { MARKETPLACE_MODULE } from "../../../../../modules/marketplace"
import MarketplaceModuleService from "../../../../../modules/marketplace/service"

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

const SOURCE_OPTIONS = [
  "all",
  "chatgpt",
  "gemini",
  "google",
  "facebook",
  "reddit",
  "youtube",
  "bing",
  "duckduckgo",
  "instagram",
  "pinterest",
  "copilot",
  "claude",
  "perplexity",
  "mistral",
] as const

type SourceFilter = typeof SOURCE_OPTIONS[number]

const SUPPORTED_EVENT_TYPES = [
  "product_viewed",
  "product_added_to_cart",
  "product_removed_from_cart",
  "checkout_started",
  "checkout_completed",
  "search_submitted",
  "page_viewed",
  "clicked",
]

const isSourceFilter = (value: string): value is SourceFilter =>
  SOURCE_OPTIONS.includes(value as SourceFilter)

type StoreIdentifier = {
  platformId: string
  storeId: string
}

type ActivityDetail = {
  description: string
  url: string
}

type RecentActivityRecord = {
  client_id: string
  event_type: string
  details: ActivityDetail[]
  primary_source: string
  time: string
}

type StoreRecentActivity = {
  vendor_store_id: string
  recent_activity: RecentActivityRecord[]
}

type FetchActivityOptions = {
  count: number
  sourceFilter: SourceFilter
}

const extractClientIdFromMetadata = (metadata: unknown): string => {
  if (!metadata || typeof metadata !== "object") {
    return ""
  }
  const meta = metadata as Record<string, unknown>
  const candidates = [
    meta["clientId"],
    meta["client_id"],
  ].filter((value): value is string => typeof value === "string")

  const first = candidates
    .map((value) => value.trim())
    .find((value) => value.length > 0)

  return first ?? ""
}

const extractDetailsFromMetadata = (metadata: unknown): ActivityDetail[] => {
  if (!metadata || typeof metadata !== "object") {
    return []
  }

  const meta = metadata as Record<string, unknown>
  const rawDetails = meta["details"]

  if (Array.isArray(rawDetails)) {
    return rawDetails
      .map((entry) => {
        if (!entry || typeof entry !== "object") {
          return null
        }

        const detail = entry as Record<string, unknown>
        const description =
          typeof detail.description === "string" ? detail.description : undefined
        const url = typeof detail.url === "string" ? detail.url : undefined

        if (!description && !url) {
          return null
        }

        return {
          description: description ?? "",
          url: url ?? "",
        }
      })
      .filter((value): value is ActivityDetail => value !== null)
  }

  const description =
    typeof meta["product_name"] === "string" ? meta["product_name"] : undefined
  const url =
    typeof meta["product_url"] === "string" ? meta["product_url"] : undefined

  if (!description && !url) {
    return []
  }

  return [
    {
      description: description ?? "",
      url: url ?? "",
    },
  ]
}

const extractDetailsByEventType = (
  event: Record<string, unknown>,
): ActivityDetail[] => {
  const eventType = typeof event.type === "string" ? event.type : ""
  switch (eventType) {
    case "product_viewed":
      return extractProductEventDetails(event, "viewed product")
    case "product_added_to_cart":
      return extractProductEventDetails(event, "added product")
    case "product_removed_from_cart":
      return extractProductEventDetails(event, "removed product")
    case "search_submitted":
      return extractSearchSubmittedDetails(event)
    case "checkout_started":
    case "checkout_completed":
      return extractCheckoutAmountDetails(event)
    case "page_viewed":
      return extractPageViewedDetails(event)
    case "clicked":
      return extractClickedDetails(event)
    default:
      return []
  }
}

const extractClickedDetails = (
  event: Record<string, unknown>,
): ActivityDetail[] => {
  const url = buildEventUrl(
    typeof event.domain === "string" ? event.domain.trim() : "",
    typeof event.path === "string" ? event.path.trim() : "",
  )

  if (!url) {
    return []
  }

  return [
    {
      description: "clicked page",
      url,
    },
  ]
}

const extractPageViewedDetails = (
  event: Record<string, unknown>,
): ActivityDetail[] => {
  const url = buildEventUrl(
    typeof event.domain === "string" ? event.domain.trim() : "",
    typeof event.path === "string" ? event.path.trim() : "",
  )

  if (!url) {
    return []
  }

  return [
    {
      description: "viewed page",
      url,
    },
  ]
}

const extractProductEventDetails = (
  event: Record<string, unknown>,
  fallbackDescription: string,
): ActivityDetail[] => {
  const extracted = extractProductInfo(event)
  if (!extracted) {
    return []
  }

  return [
    {
      description: extracted.title || fallbackDescription,
      url: extracted.url ?? "",
    },
  ]
}

const extractSearchSubmittedDetails = (
  event: Record<string, unknown>,
): ActivityDetail[] => {
  const metadata = event.metadata

  if (!metadata || typeof metadata !== "object") {
    return []
  }

  const data = (metadata as Record<string, unknown>).data
  if (!data || typeof data !== "object") {
    return []
  }

  const searchResult = (data as Record<string, unknown>).searchResult
  if (!searchResult || typeof searchResult !== "object") {
    return []
  }

  const queryRaw = (searchResult as Record<string, unknown>).query
  const query =
    typeof queryRaw === "string" ? queryRaw.trim() : ""

  const description = query || "search submitted"

  return [
    {
      description,
      url: "",
    },
  ]
}

const extractCheckoutAmountDetails = (
  event: Record<string, unknown>,
): ActivityDetail[] => {
  const metadata = event.metadata
  if (!metadata || typeof metadata !== "object") {
    return []
  }

  const data = (metadata as Record<string, unknown>).data
  if (!data || typeof data !== "object") {
    return []
  }

  const checkout = (data as Record<string, unknown>).checkout
  if (!checkout || typeof checkout !== "object") {
    return []
  }

  const amountRecord = (checkout as Record<string, unknown>).totalPrice as
    | Record<string, unknown>
    | undefined

  const amountRaw = amountRecord && amountRecord.amount
  const currencyRaw = amountRecord && amountRecord.currencyCode

  const amount = normalizeAmount(amountRaw)
  const currency =
    typeof currencyRaw === "string" && currencyRaw.trim().length > 0
      ? currencyRaw.trim().toUpperCase()
      : undefined

  if (amount === null && !currency) {
    return []
  }

  const formattedAmount = amount !== null ? amount.toFixed(2) : ""
  const parts = ["total"]
  if (currency) {
    parts.push(currency)
  }
  if (formattedAmount) {
    parts.push(formattedAmount)
  }

  const description = parts.join(" ").trim() || "total"

  return [
    {
      description,
      url: "",
    },
  ]
}

type ExtractedProductInfo = {
  title: string
  url?: string | null
}

const extractProductInfo = (
  event: Record<string, unknown>,
): ExtractedProductInfo | null => {
  const metadata = event.metadata

  if (!metadata || typeof metadata !== "object") {
    return null
  }

  const data = (metadata as Record<string, unknown>).data
  if (!data || typeof data !== "object") {
    return null
  }

  const dataRecord = data as Record<string, unknown>
  const variantRecord = ((): unknown => {
    if (dataRecord.productVariant) {
      return dataRecord.productVariant
    }

    const cartLine = dataRecord.cartLine
    if (cartLine && typeof cartLine === "object") {
      const merchandise = (cartLine as Record<string, unknown>).merchandise
      if (merchandise && typeof merchandise === "object") {
        return merchandise
      }
    }

    return undefined
  })()

  const variant =
    variantRecord && typeof variantRecord === "object"
      ? (variantRecord as Record<string, unknown>)
      : undefined
  const product =
    variant?.product && typeof variant.product === "object"
      ? (variant.product as Record<string, unknown>)
      : undefined

  const title =
    (product && typeof product.title === "string" && product.title) ||
    (variant && typeof variant.title === "string" && variant.title) ||
    ""

  const productPath =
    (product && typeof product.url === "string" && product.url) ||
    (variant && typeof variant.url === "string" && variant.url) ||
    ""

  const resolvedUrl = buildEventUrl(
    typeof event.domain === "string" ? event.domain.trim() : "",
    productPath.trim(),
  )

  if (!title && !resolvedUrl) {
    return null
  }

  return {
    title,
    url: resolvedUrl ?? "",
  }
}

const normalizeAmount = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

const buildEventUrl = (domain: string, path: string): string | null => {
  const normalizedDomain = domain || ""
  const normalizedPath = path || ""

  const candidateBases: string[] = []
  if (normalizedDomain) {
    candidateBases.push(
      normalizedDomain.startsWith("http://") ||
        normalizedDomain.startsWith("https://")
        ? normalizedDomain
        : `https://${normalizedDomain.replace(/^\/+/, "")}`,
    )
  }

  if (!candidateBases.length && !normalizedPath) {
    return null
  }

  const sanitizeUrl = (url: URL): string => {
    if (url.searchParams.has("utm_source")) {
      url.searchParams.delete("utm_source")
    }
    return url.toString()
  }

  try {
    if (candidateBases.length) {
      const url = new URL(normalizedPath || "/", candidateBases[0])
      return sanitizeUrl(url)
    }

    // no domain provided; attempt to parse the path directly
    const absoluteUrl = new URL(normalizedPath)
    return sanitizeUrl(absoluteUrl)
  } catch {
    if (!candidateBases.length && normalizedPath.startsWith("/")) {
      try {
        const url = new URL(normalizedPath, "https://placeholder.local")
        if (url.searchParams.has("utm_source")) {
          url.searchParams.delete("utm_source")
        }
        const queryString = url.searchParams.toString()
        return `${url.pathname}${queryString ? `?${queryString}` : ""}${
          url.hash || ""
        }`
      } catch {
        return stripUtmSourceParam(normalizedPath)
      }
    }

    return stripUtmSourceParam(normalizedPath) || null
  }
}

const stripUtmSourceParam = (input: string): string => {
  if (!input.includes("utm_source")) {
    return input
  }

  const [beforeHash, hashPart = ""] = input.split("#", 2)
  const [pathPart, queryPart = ""] = beforeHash.split("?", 2)

  if (!queryPart) {
    return input
  }

  const params = new URLSearchParams(queryPart)
  if (!params.has("utm_source")) {
    return input
  }

  params.delete("utm_source")
  const queryString = params.toString()
  const hash = hashPart ? `#${hashPart}` : ""

  if (!queryString) {
    return `${pathPart}${hash}`
  }

  return `${pathPart}?${queryString}${hash}`
}

const coerceEventRecord = (event: unknown): Record<string, unknown> => {
  if (!event || typeof event !== "object") {
    return {}
  }
  return event as Record<string, unknown>
}

const resolveVendorStoreIdentifiers = async (
  req: AuthenticatedMedusaRequest,
  actorId: string,
): Promise<StoreIdentifier[]> => {
  const marketplaceModuleService: MarketplaceModuleService =
    req.scope.resolve(MARKETPLACE_MODULE)

  const vendorAdmin = await marketplaceModuleService.retrieveVendorAdmin(
    actorId,
    {
      relations: ["vendor"],
    }
  )

  if (!vendorAdmin?.vendor_id) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "No vendor account found for this user"
    )
  }

  const claimStates = await marketplaceModuleService.listVendorStoreClaimStates({
    vendor_id: vendorAdmin.vendor_id,
  })

  const seen = new Set<string>()
  const identifiers: StoreIdentifier[] = []

  for (const state of claimStates) {
    if (!state.platform_id || !state.store_id) {
      continue
    }
    const key = `${state.platform_id}:${state.store_id}`
    if (seen.has(key)) {
      continue
    }
    seen.add(key)
    identifiers.push({
      platformId: state.platform_id,
      storeId: state.store_id,
    })
  }

  return identifiers
}

const fetchRecentActivityForStore = async (
  store: StoreIdentifier,
  service: MarketplaceModuleService,
  options: FetchActivityOptions,
): Promise<StoreRecentActivity> => {
  try {
    const filters: Record<string, unknown> = {
      store_platform: store.platformId,
      store_id: store.storeId,
      deleted_at: null,
      type: SUPPORTED_EVENT_TYPES,
    }
    if (options.sourceFilter !== "all") {
      filters.primary_source = options.sourceFilter
    }

    const events = await service.listTrafficEvents(
      filters,
      {
        take: options.count,
        order: { occurred_at: "DESC" },
      } as any,
    )

    const recent_activity: RecentActivityRecord[] = (events ?? []).map(
      (event) => {
        const record = coerceEventRecord(event)
        const metadata = record.metadata
        const occurredAt = record.occurred_at
        const occurredIso =
          occurredAt instanceof Date
            ? occurredAt.toISOString()
            : occurredAt
              ? new Date(occurredAt as string | number | Date).toISOString()
              : new Date().toISOString()

        return {
          client_id: extractClientIdFromMetadata(metadata),
          event_type: typeof record.type === "string" ? record.type : "unknown",
          details: extractDetailsByEventType(record),
          primary_source:
            typeof record.primary_source === "string"
              ? record.primary_source
              : "",
          time: occurredIso,
        }
      },
    )
    return {
      vendor_store_id: store.storeId,
      recent_activity,
    }
  } catch (error) {
    console.error(
      "[dashboard] Failed to fetch recent activity for store",
      store,
      error,
    )

    return {
      vendor_store_id: store.storeId,
      recent_activity: [],
    }
  }
}

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  if (!req.auth_context?.actor_id) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Unauthorized: No vendor authenticated"
    )
  }

  const actorId = req.auth_context.actor_id
  const rawNQuery = Array.isArray(req.query.n) ? req.query.n[0] : req.query.n
  const rawN = typeof rawNQuery === "string" ? rawNQuery : ""
  const count = clamp(Number.parseInt(rawN, 10) || 10, 1, 50)
  const rawSourceQuery = Array.isArray(req.query.source)
    ? req.query.source[0]
    : req.query.source
  const rawSource = typeof rawSourceQuery === "string" ? rawSourceQuery : ""
  const normalizedSource = rawSource.toLowerCase()
  const sourceFilter: SourceFilter = isSourceFilter(normalizedSource)
    ? normalizedSource
    : "all"

  // step 1: get all stores owned by this vendor
  const storeIdentifiers = await resolveVendorStoreIdentifiers(req, actorId)
  if (storeIdentifiers.length === 0) {
    res.json({ stores: [] })
    return
  }

  const marketplaceModuleService: MarketplaceModuleService =
    req.scope.resolve(MARKETPLACE_MODULE)

  // step 2: fetch recent activity for each store
  const storeActivities = await Promise.all(
    storeIdentifiers.map((store) =>
      fetchRecentActivityForStore(store, marketplaceModuleService, {
        count,
        sourceFilter,
      })
    )
  )

  // step 3: respond with per-store activity
  res.json({ stores: storeActivities })
}
