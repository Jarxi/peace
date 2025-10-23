import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { MARKETPLACE_MODULE } from "../../../../../modules/marketplace"
import MarketplaceModuleService from "../../../../../modules/marketplace/service"
import TrafficAggregated from "../../../../../modules/marketplace/models/traffic-aggregated"

type TrafficSourceMetric = {
  source: string
  label: string
  total_events: number
  unique_users: number
}

type TrafficBucket = {
  bucket_start: string
  bucket_end: string
  metrics: TrafficSourceMetric[]
}

type StoreTrafficBuckets = {
  label: string | null
  buckets: TrafficBucket[]
}

const SOURCE_LABELS: Record<string, string> = {
  all: "All Traffic",
  chatgpt: "ChatGPT",
  google: "Google",
  facebook: "Facebook",
}

const BUCKET_INTERVAL_HOURS = 6
const BUCKET_INTERVAL_MS = BUCKET_INTERVAL_HOURS * 60 * 60 * 1000
const INCLUDE_OTHER = false

const resolveVendorStores = async (req: AuthenticatedMedusaRequest) => {
  const service: MarketplaceModuleService = req.scope.resolve(MARKETPLACE_MODULE)

  const vendorAdmin = await service.retrieveVendorAdmin(
    req.auth_context!.actor_id!,
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

  const claimStates = await service.listVendorStoreClaimStates({
    vendor_id: vendorAdmin.vendor_id,
  })

  const seen = new Set<string>()
  const stores: Array<{ platformId: string; storeId: string }> = []

  for (const state of claimStates) {
    if (!state.platform_id || !state.store_id) {
      continue
    }
    const key = `${state.platform_id}:${state.store_id}`
    if (seen.has(key)) {
      continue
    }
    seen.add(key)
    stores.push({ platformId: state.platform_id, storeId: state.store_id })
  }

  return { service, stores }
}

const fetchAggregatedRows = async (
  service: MarketplaceModuleService,
  store: { platformId: string; storeId: string },
) => {
  const rows = await service.listTrafficAggregateds(
    {
      platform_id: store.platformId,
      store_id: store.storeId,
    },
    {
      order: { hour_bucket: "ASC" },
    },
  )

  return Array.isArray(rows) ? rows : []
}

const normalizeMetrics = (
  metrics: unknown,
): Record<string, { total_events: number; unique_users: number }> => {
  let recordValue = metrics
  if (typeof metrics === 'string') {
    try {
      recordValue = JSON.parse(metrics)
    } catch {
      return {}
    }
  }

  if (!recordValue || typeof recordValue !== 'object') {
    return {}
  }

  const record = recordValue as Record<string, unknown>
  const result: Record<string, { total_events: number; unique_users: number }> =
    {}

  for (const [key, value] of Object.entries(record)) {
    if (!value || typeof value !== "object") {
      continue
    }
    const metric = value as Record<string, unknown>
    const total = Number.parseFloat(String(metric.total_events ?? 0))
    const unique = Number.parseFloat(String(metric.unique_users ?? 0))
    result[key.toLowerCase()] = {
      total_events: Number.isFinite(total) ? Math.max(0, Math.round(total)) : 0,
      unique_users: Number.isFinite(unique)
        ? Math.max(0, Math.round(unique))
        : 0,
    }
  }

  return result
}

const buildBuckets = (
  rows: Record<string, unknown>[],
  includeOther = false,
): TrafficBucket[] => {
  if (!rows.length) {
    return []
  }

  const buckets = new Map<
    number,
    Map<string, { total_events: number; unique_users: number }>
  >()

  for (const row of rows) {
    const record = row as Record<string, unknown>
    const sourceRaw = record.primary_source ?? record.source
    if (typeof sourceRaw !== 'string' || !sourceRaw) {
      continue
    }
    const source = sourceRaw.toLowerCase()

    const bucketDateRaw = record.hour_bucket
    const bucketDate = typeof bucketDateRaw === 'string' || bucketDateRaw instanceof Date
      ? new Date(bucketDateRaw)
      : null
    if (!bucketDate || Number.isNaN(bucketDate.getTime())) {
      continue
    }

    const bucketKey = bucketDate.getTime()
    if (!buckets.has(bucketKey)) {
      buckets.set(bucketKey, new Map())
    }

    const metrics = buckets.get(bucketKey)!
    const parsed = normalizeMetrics(record.metrics)
    const productView = parsed.product_view ?? {
      total_events: 0,
      unique_users: 0,
    }

    metrics.set(source, {
      total_events: productView.total_events,
      unique_users: productView.unique_users,
    })
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
    .map(([startMs, metricMap]) => {
      const startDate = new Date(startMs)
      const endDate = new Date(startMs + BUCKET_INTERVAL_MS)

      const series: TrafficSourceMetric[] = []
      let totals = { total_events: 0, unique_users: 0 }

      for (const [source, metric] of metricMap.entries()) {
        const isTrackedSource = SOURCE_LABELS[source] != null
        if (!isTrackedSource && !(includeOther && source === 'other')) {
          continue
        }

        series.push({
          source,
          label: SOURCE_LABELS[source] ?? source,
          total_events: metric.total_events,
          unique_users: metric.unique_users,
        })
        totals = {
          total_events: totals.total_events + metric.total_events,
          unique_users: totals.unique_users + metric.unique_users,
        }
      }

      series.sort((a, b) => {
        if (a.source === 'all') return -1
        if (b.source === 'all') return 1
        return a.label.localeCompare(b.label)
      })

      series.unshift({
        source: 'all',
        label: SOURCE_LABELS.all,
        total_events: totals.total_events,
        unique_users: totals.unique_users,
      })

      return {
        bucket_start: startDate.toISOString(),
        bucket_end: endDate.toISOString(),
        metrics: series,
      }
    })
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

  const { service, stores } = await resolveVendorStores(req)
  const storePayload: Record<string, StoreTrafficBuckets> = {}

  for (const store of stores) {
    try {
      const rows = await fetchAggregatedRows(service, store)
      const buckets = buildBuckets(rows as Record<string, unknown>[])

      storePayload[store.storeId] = {
        label: store.storeId,
        buckets,
      }
    } catch (error) {
      console.error(
        "[dashboard] Failed to load aggregated traffic for store",
        store,
        error,
      )

      storePayload[store.storeId] = {
        label: store.storeId,
        buckets: [],
      }
    }
  }

  res.json({
    stores: storePayload,
    interval_hours: BUCKET_INTERVAL_HOURS,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    generated_at: new Date().toISOString(),
  })
}
