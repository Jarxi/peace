"use client"

import React, { useEffect, useMemo, useState } from "react"
import {
  fetchSourcePerformance,
  SourcePerformanceRow,
  SourceMetric,
  StoreSourcePerformance,
} from "@/lib/data/vendor"

const DEFAULT_VISIBLE_SOURCES = 4
const DEFAULT_SOURCE_PRIORITY = ["All", "ChatGPT", "Google", "Facebook"]

const formatPercent = (value: number | null) =>
  value === null ? null : `${(value * 100).toFixed(1)}%`

const renderMetricCell = (
  metric: SourceMetric,
  unit: "events" | "items",
  previousMetric?: SourceMetric,
) => {
  const eventConversion =
    previousMetric && previousMetric.total_events > 0
      ? metric.total_events / previousMetric.total_events
      : null
  const userConversion =
    previousMetric && previousMetric.unique_users > 0
      ? metric.unique_users / previousMetric.unique_users
      : null
  const eventPercent =
    eventConversion !== null ? formatPercent(eventConversion) : null
  const userPercent =
    userConversion !== null ? formatPercent(userConversion) : null
  const conversionParts: string[] = []
  if (eventPercent) {
    conversionParts.push(`${eventPercent} events`)
  }
  if (userPercent) {
    conversionParts.push(`${userPercent} users`)
  }

  return (
    <div className="space-y-1">
      <div className="text-sm font-semibold text-slate-900">
        {metric.total_events} {unit}
      </div>
      <div className="text-xs text-slate-500">
        {metric.unique_users} unique users
      </div>
      {metric.most_popular ? (
        <div className="text-xs text-slate-500">
          <span className="text-slate-400">Top: </span>
          {metric.most_popular.url ? (
            <a
              href={metric.most_popular.url}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:text-blue-500"
            >
              {metric.most_popular.title.length > 42
                ? `${metric.most_popular.title.slice(0, 41)}…`
                : metric.most_popular.title}
            </a>
          ) : (
            <span className="text-slate-600">
              {metric.most_popular.title.length > 42
                ? `${metric.most_popular.title.slice(0, 41)}…`
                : metric.most_popular.title}
            </span>
          )}
          {typeof metric.most_popular.total_events === "number" &&
            metric.most_popular.total_events > 0 && (
              <span className="ml-1 text-slate-400">
                ({metric.most_popular.total_events})
              </span>
            )}
        </div>
      ) : (
        <div className="text-xs text-slate-400">No standout item yet</div>
      )}
      {conversionParts.length > 0 && (
        <div className="text-xs text-slate-400">
          Conversion {conversionParts.join(" • ")}
        </div>
      )}
    </div>
  )
}

const SourcePerformanceHighlights: React.FC = () => {
  const [stores, setStores] = useState<StoreSourcePerformance[]>([])
  const [selectedStoreId, setSelectedStoreId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAllSources, setShowAllSources] = useState(false)

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const result = await fetchSourcePerformance()
        if (!isMounted) {
          return
        }

        const storeList = result.stores ?? []
        setStores(storeList)
        if (storeList.length > 0) {
          setSelectedStoreId(storeList[0].vendor_store_id)
        } else {
          setSelectedStoreId("")
        }
      } catch (err) {
        console.error("Failed to load source performance", err)
        if (isMounted) {
          setError("Failed to load source performance")
          setStores([])
          setSelectedStoreId("")
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      isMounted = false
    }
  }, [])

  const selectedStore = useMemo(
    () => stores.find((store) => store.vendor_store_id === selectedStoreId),
    [stores, selectedStoreId],
  )

  useEffect(() => {
    setShowAllSources(false)
  }, [selectedStoreId])

  const allSummaries = selectedStore?.source_performance ?? []

  const visibleSummaries = useMemo(() => {
    if (showAllSources) {
      return allSummaries
    }

    const lowerCaseMap = new Map(
      allSummaries.map((row) => [row.primary_source.toLowerCase(), row]),
    )

    const prioritized: SourcePerformanceRow[] = []
    const taken = new Set<string>()

    for (const label of DEFAULT_SOURCE_PRIORITY) {
      const match = lowerCaseMap.get(label.toLowerCase())
      if (match && !taken.has(match.primary_source)) {
        prioritized.push(match)
        taken.add(match.primary_source)
        if (prioritized.length >= DEFAULT_VISIBLE_SOURCES) {
          break
        }
      }
    }

    if (prioritized.length < DEFAULT_VISIBLE_SOURCES) {
      for (const row of allSummaries) {
        if (prioritized.length >= DEFAULT_VISIBLE_SOURCES) {
          break
        }
        if (!taken.has(row.primary_source)) {
          prioritized.push(row)
          taken.add(row.primary_source)
        }
      }
    }

    return prioritized
  }, [allSummaries, showAllSources])

  const hasData = visibleSummaries.length > 0

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Source Performance Highlights (past week)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Data usually appears about an hour after you install the Shopify app.
          </p>
        </div>
        {stores.length > 1 && (
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 shadow-sm">
            <span>Store</span>
            <select
              value={selectedStoreId}
              onChange={(event) => setSelectedStoreId(event.target.value)}
              className="rounded-md border border-slate-200 bg-transparent px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-0"
            >
              {stores.map((store) => (
                <option
                  key={store.vendor_store_id}
                  value={store.vendor_store_id}
                >
                  {store.vendor_store_id}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
          Loading summary metrics…
        </div>
      ) : error ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-rose-500">
          {error}
        </div>
      ) : !hasData ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
          Data usually appears about an hour after you install the Shopify app.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Source
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Product Views
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Added to Cart
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Sales
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleSummaries.map((row) => (
                  <tr key={row.primary_source} className="bg-white">
                    <td className="px-4 py-4 align-top text-sm font-semibold text-slate-900">
                      {row.primary_source}
                    </td>
                    <td className="px-4 py-4 align-top">
                      {renderMetricCell(
                        row.metrics.product_view,
                        "events",
                        row.metrics.product_view,
                      )}
                    </td>
                    <td className="px-4 py-4 align-top">
                      {renderMetricCell(
                        row.metrics.product_added_to_cart,
                        "events",
                        row.metrics.product_view,
                      )}
                    </td>
                    <td className="px-4 py-4 align-top">
                      {renderMetricCell(
                        row.metrics.sale,
                        "items",
                        row.metrics.product_view,
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {allSummaries.length > DEFAULT_VISIBLE_SOURCES && (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => setShowAllSources((prev) => !prev)}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition-colors"
                aria-expanded={showAllSources}
              >
                {showAllSources ? "Show fewer sources" : "Show all sources"}
                <svg
                  className={`h-3 w-3 transition-transform ${
                    showAllSources ? "rotate-180" : ""
                  }`}
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4 6L8 10L12 6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default SourcePerformanceHighlights
