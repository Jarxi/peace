import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { MARKETPLACE_MODULE } from "../../../../../modules/marketplace"
import MarketplaceModuleService from "../../../../../modules/marketplace/service"

type TrafficMetric = {
  total_events: number
  unique_users: number
  most_popular: {
    title: string
    url: string
    product_id?: string
    total_events?: number
  } | null
}

type SourcePerformanceRow = {
  primary_source: string
  metrics: {
    product_view: TrafficMetric
    product_added_to_cart: TrafficMetric
    sale: TrafficMetric
  }
}

type StoreSourcePerformance = {
  vendor_store_id: string
  platform_id: string
  source_performance: SourcePerformanceRow[]
}

type StoreIdentifier = {
  platformId: string
  storeId: string
}

const toNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

const coerceMostPopular = (
  value: unknown,
): TrafficMetric["most_popular"] => {
  if (!value || typeof value !== "object") {
    return null
  }

  const record = value as Record<string, unknown>
  const title = typeof record.title === "string" ? record.title : ""
  const url = typeof record.url === "string" ? record.url : ""
  if (!title && !url) {
    return null
  }

  const product_id =
    typeof record.product_id === "string" ? record.product_id : undefined
  const total_events = Number.isFinite(record.total_events as number)
    ? toNumber(record.total_events)
    : undefined

  return {
    title,
    url,
    product_id,
    total_events,
  }
}

const coerceTrafficMetric = (value: unknown): TrafficMetric => {
  if (!value || typeof value !== "object") {
    return {
      total_events: 0,
      unique_users: 0,
      most_popular: null,
    }
  }

  const record = value as Record<string, unknown>
  return {
    total_events: toNumber(record.total_events),
    unique_users: toNumber(record.unique_users),
    most_popular: coerceMostPopular(record.most_popular),
  }
}

const parseMetrics = (value: unknown): SourcePerformanceRow["metrics"] => {
  if (!value || typeof value !== "object") {
    return {
      product_view: coerceTrafficMetric(undefined),
      product_added_to_cart: coerceTrafficMetric(undefined),
      sale: coerceTrafficMetric(undefined),
    }
  }

  const record = value as Record<string, unknown>
  return {
    product_view: coerceTrafficMetric(record.product_view),
    product_added_to_cart: coerceTrafficMetric(record.product_added_to_cart),
    sale: coerceTrafficMetric(record.sale),
  }
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
    },
  )

  if (!vendorAdmin?.vendor_id) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "No vendor account found for this user",
    )
  }

  const claimStates = await marketplaceModuleService.listVendorStoreClaimStates(
    {
      vendor_id: vendorAdmin.vendor_id,
    },
  )

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

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
) => {
  if (!req.auth_context?.actor_id) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Unauthorized: No vendor authenticated",
    )
  }

  const storeIdentifiers = await resolveVendorStoreIdentifiers(
    req,
    req.auth_context.actor_id,
  )

  if (storeIdentifiers.length === 0) {
    res.json({
      stores: [],
      refreshed_at: new Date().toISOString(),
    })
    return
  }

  const marketplaceModuleService: MarketplaceModuleService =
    req.scope.resolve(MARKETPLACE_MODULE)

  const storeSummaries = await Promise.all(
    storeIdentifiers.map(async (store) => {
      try {
        const summaries =
          await marketplaceModuleService.listVendorStoreTrafficSummaries(
            {
              platform_id: store.platformId,
              store_id: store.storeId,
              deleted_at: null,
            },
            {
              order: { primary_source: "ASC" },
            } as any,
          )

        const rows: SourcePerformanceRow[] = (summaries ?? [])
          .map((entry) => {
            const record = entry as Record<string, unknown>
            const primarySource =
              typeof record.primary_source === "string"
                ? record.primary_source
                : "unknown"

            return {
              primary_source: primarySource,
              metrics: parseMetrics(record.metrics),
            }
          })
          .sort(
            (a, b) =>
              b.metrics.product_view.total_events -
              a.metrics.product_view.total_events,
          )

        return {
          vendor_store_id: store.storeId,
          platform_id: store.platformId,
          source_performance: rows,
        }
      } catch (error) {
        console.error(
          "[dashboard] Failed to load source performance for store",
          store,
          error,
        )
        return {
          vendor_store_id: store.storeId,
          platform_id: store.platformId,
          source_performance: [],
        }
      }
    }),
  )

  res.json({
    stores: storeSummaries,
    refreshed_at: new Date().toISOString(),
  })
}
