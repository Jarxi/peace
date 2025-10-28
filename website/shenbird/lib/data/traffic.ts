export type TrafficSourceMetric = {
  source: string
  label: string
  total_events: number
  unique_users?: number
}

export type TrafficMetricKey = 'total_events' | 'unique_users'

export type TrafficBucket = {
  bucket_start: string
  bucket_end: string
  metrics: TrafficSourceMetric[]
}

export type AggregatedTrafficStore = {
  label: string | null
  timezone: string
  interval_hours: number
  generated_at: string
  buckets: TrafficBucket[]
}

export type AggregatedTrafficResponse = {
  stores: Record<string, AggregatedTrafficStore>
  interval_hours: number
  timezone: string
  generated_at: string
}

export type ChartSeriesDefinition = {
  source: string
  label: string
  color: string
}

export const DEFAULT_TRAFFIC_SERIES: ChartSeriesDefinition[] = [
  { source: "all", label: "All Traffic", color: "#3b82f6" },
  { source: "chatgpt", label: "ChatGPT", color: "#ef4444" },
  { source: "google", label: "Google", color: "#f59e0b" },
  { source: "facebook", label: "Facebook", color: "#6366f1" },
]

export function buildChartDataFromBuckets(
  buckets: TrafficBucket[],
  series: ChartSeriesDefinition[],
  metricKey: TrafficMetricKey = 'total_events',
) {
  return buckets
    .sort(
      (a, b) =>
        new Date(a.bucket_start).getTime() - new Date(b.bucket_start).getTime(),
    )
    .map((bucket) => {
      const point: Record<string, string | number> = {
        time: new Date(bucket.bucket_start).toLocaleString([], {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      }

      const metricsMap = new Map(
        bucket.metrics.map((metric) => [metric.source.toLowerCase(), metric]),
      )

      series.forEach(({ source }) => {
        const metric = metricsMap.get(source.toLowerCase())
        const value = metric?.[metricKey]
        point[source] = typeof value === 'number' ? value : 0
      })

      return point
    })
}
