"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchAggregatedTraffic, fetchDashboardActivity } from '@/lib/data/vendor';
import type { StoreActivity, DashboardSourceFilter } from '@/lib/data/vendor';
import type { AggregatedTrafficStore, TrafficMetricKey } from '@/lib/data/traffic';
import { buildChartDataFromBuckets, DEFAULT_TRAFFIC_SERIES } from '@/lib/data/traffic';
import KeyMetricsChart from './KeyMetricsChart';
import ActivityTable from './ActivityTable';
import ClaimStoreModal from './ClaimStoreModal';
import SourcePerformanceHighlights from './SourcePerformanceHighlights';


const SOURCE_FILTER_OPTIONS: Array<{ value: DashboardSourceFilter; label: string }> = [
  { value: 'all', label: 'All sources' },
  { value: 'chatgpt', label: 'ChatGPT' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'google', label: 'Google' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'reddit', label: 'Reddit' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'bing', label: 'Bing' },
  { value: 'duckduckgo', label: 'DuckDuckGo' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'pinterest', label: 'Pinterest' },
  { value: 'copilot', label: 'Copilot' },
  { value: 'claude', label: 'Claude' },
  { value: 'perplexity', label: 'Perplexity' },
  { value: 'mistral', label: 'Mistral' },
];

const AUTO_REFRESH_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 5, label: '5s' },
  { value: 10, label: '10s' },
  { value: 30, label: '30s' },
  { value: 60, label: '60s' },
];

const METRIC_OPTIONS: Array<{ value: TrafficMetricKey; label: string }> = [
  { value: 'total_events', label: 'Total events' },
  { value: 'unique_users', label: 'Unique users' },
];

const fetchRecentActivityEvents = async (
  sourceFilter: DashboardSourceFilter,
  limit: number,
  signal?: AbortSignal,
) => {
  try {
    if (signal?.aborted) {
      return [];
    }

    const stores = await fetchDashboardActivity(sourceFilter, limit);

    if (signal?.aborted) {
      return [];
    }

    return stores.map((store) => ({
      storeId: store.storeId,
      events: store.events.slice(0, limit),
    }));
  } catch (error) {
    if ((error as Error)?.name !== 'AbortError') {
      console.error('[dashboard] recent_activity fetch error', error);
    }
    return [];
  }
};

const AnalyticsDashboard: React.FC = () => {
  const [storeActivities, setStoreActivities] = useState<StoreActivity[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<DashboardSourceFilter>('all');
  const [metricType, setMetricType] = useState<TrafficMetricKey>('total_events');
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(30);
  const activityRequestIdRef = useRef(0);

  const trafficSeries = useMemo(() => DEFAULT_TRAFFIC_SERIES.map((series) => ({ ...series })), []);
  const [trafficStores, setTrafficStores] = useState<Record<string, AggregatedTrafficStore>>({});
  const trafficStoreOptions = useMemo(
    () =>
      Object.entries(trafficStores).map(([id, info]) => ({
        id,
        label: info.label ?? id,
      })),
    [trafficStores],
  );
  const [trafficStoreId, setTrafficStoreId] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    const loadAggregated = async () => {
      const response = await fetchAggregatedTraffic();
      if (cancelled) {
        return;
      }
      setTrafficStores(response.stores ?? {});
    };

    void loadAggregated();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (trafficStoreId && trafficStores[trafficStoreId]) {
      return;
    }
    const fallbackId = Object.keys(trafficStores)[0] ?? '';
    if (fallbackId !== trafficStoreId) {
      setTrafficStoreId(fallbackId);
    }
  }, [trafficStores, trafficStoreId]);

  const aggregatedData = useMemo(() => {
    if (!trafficStoreId) {
      return [];
    }
    const store = trafficStores[trafficStoreId];
    if (!store) {
      return [];
    }
    return buildChartDataFromBuckets(store.buckets, trafficSeries, metricType);
  }, [metricType, trafficSeries, trafficStoreId, trafficStores]);

  const loadRecentActivity = useCallback(
    async ({ signal, filter }: { signal?: AbortSignal; filter: DashboardSourceFilter }) => {
      const requestId = activityRequestIdRef.current + 1;
      activityRequestIdRef.current = requestId;

      const stores = await fetchRecentActivityEvents(filter, 10, signal);
      if (signal?.aborted) {
        return;
      }
      if (activityRequestIdRef.current !== requestId) {
        return;
      }
      setStoreActivities(stores);
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadRecentActivity({ signal: controller.signal, filter: sourceFilter });
    return () => controller.abort();
  }, [loadRecentActivity, sourceFilter]);

  useEffect(() => {
    if (!autoRefreshEnabled) {
      return;
    }

    let controller = new AbortController();

    const tick = () => {
      controller.abort();
      controller = new AbortController();
      void loadRecentActivity({ signal: controller.signal, filter: sourceFilter });
    };

    const intervalId = window.setInterval(tick, autoRefreshInterval * 1000);
    tick();

    return () => {
      controller.abort();
      window.clearInterval(intervalId);
    };
  }, [autoRefreshEnabled, autoRefreshInterval, loadRecentActivity, sourceFilter]);

  const recentActivityEvents = useMemo(() => {
    return selectedStoreId === 'all'
      ? storeActivities.flatMap((store) => store.events)
      : storeActivities.find((store) => store.storeId === selectedStoreId)?.events ?? [];
  }, [selectedStoreId, storeActivities]);

  useEffect(() => {
    const storeIds = storeActivities.map((store) => store.storeId);
    if (selectedStoreId !== 'all' && !storeIds.includes(selectedStoreId)) {
      setSelectedStoreId('all');
    }
  }, [storeActivities, selectedStoreId]);

  return (
    <>
      <SourcePerformanceHighlights />

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <h2 className="text-lg font-semibold text-slate-900 mb-3 sm:mb-0">Trending</h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 shadow-sm">
              <span>Metric</span>
              <select
                value={metricType}
                onChange={(event) => setMetricType(event.target.value as TrafficMetricKey)}
                className="rounded-md border border-slate-200 bg-transparent px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-0"
              >
                {METRIC_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            {trafficStoreOptions.length > 0 && (
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 shadow-sm">
                <span>Store</span>
                <select
                  value={trafficStoreId}
                  onChange={(event) => setTrafficStoreId(event.target.value)}
                  className="rounded-md border border-slate-200 bg-transparent px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-0"
                >
                  {trafficStoreOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
        {aggregatedData.length > 0 ? (
          <KeyMetricsChart data={aggregatedData} series={trafficSeries} />
        ) : (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
            Data usually appears about an hour after you install the Shopify app.
          </div>
        )}
      </div>

      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600 shadow-sm">
              <span>Source</span>
              <select
                value={sourceFilter}
                onChange={(event) => setSourceFilter(event.target.value as DashboardSourceFilter)}
                className="rounded-md border border-slate-200 bg-transparent px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-0"
              >
                {SOURCE_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            {storeActivities.length > 0 && (
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600 shadow-sm">
                <span>Store</span>
                <select
                  value={selectedStoreId}
                  onChange={(event) => setSelectedStoreId(event.target.value)}
                  className="rounded-md border border-slate-200 bg-transparent px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-0"
                >
                  <option value="all">All</option>
                  {storeActivities.map((store) => (
                    <option key={store.storeId} value={store.storeId}>
                      {store.storeId}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600 shadow-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={autoRefreshEnabled}
                  onChange={(event) => setAutoRefreshEnabled(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-0"
                />
                <span>Auto refresh</span>
              </label>
              <select
                value={autoRefreshInterval}
                onChange={(event) => setAutoRefreshInterval(Number(event.target.value))}
                disabled={!autoRefreshEnabled}
                className="rounded-md border border-slate-200 bg-transparent px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                {AUTO_REFRESH_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <ActivityTable events={recentActivityEvents} />
        {recentActivityEvents.length === 0 && (
          <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.5a.75.75 0 00-1.5 0v4.25c0 .2.08.39.22.53l2 2a.75.75 0 001.06-1.06l-1.78-1.78V6.5z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="font-medium text-slate-700">No activity yet</p>
            <p className="mt-1 text-xs text-slate-500">
              Data usually appears within a few seconds after an event happens.
            </p>
          </div>
        )}
     </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsClaimModalOpen(true)}
        className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-40"
        title="Link another store"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Claim Store Modal */}
      <ClaimStoreModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
      />
    </>
  );
};

export default AnalyticsDashboard;
