import React, { useMemo } from "react";

export interface ActivityDetail {
  description: string;
  url: string;
}

export interface ActivityEvent {
  clientId: string;
  eventType: string;
  details: ActivityDetail[];
  primarySource: string;
  time: string;
}

interface ActivityTableProps {
  events: ActivityEvent[];
}

const ActivityTable: React.FC<ActivityTableProps> = ({ events }) => {
  const sortedEvents = useMemo(
    () =>
      [...events].sort(
        (a, b) =>
          new Date(b.time).getTime() - new Date(a.time).getTime(),
      ),
    [events],
  )
  const formatTimeAgo = (timeIso: string): string => {
    const occurredAt = new Date(timeIso);
    const diffMs = Date.now() - occurredAt.getTime();

    if (diffMs <= 0) return "just now";

    const seconds = Math.floor(diffMs / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getEventBadgeColor = (eventType: string) => {
    switch (eventType) {
      case "clicked":
        return "bg-teal-100 text-teal-800 ring-1 ring-inset ring-teal-200";
      case "page_viewed":
      case "product_viewed":
        return "bg-sky-100 text-sky-800 ring-1 ring-inset ring-sky-200";
      case "product_added_to_cart":
        return "bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-200";
      case "search_submitted":
        return "bg-indigo-100 text-indigo-800 ring-1 ring-inset ring-indigo-200";
      case "checkout_started":
        return "bg-pink-100 text-pink-800 ring-1 ring-inset ring-pink-200";
      case "checkout_completed":
        return "bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-200";
      case "product_removed_from_cart":
        return "bg-rose-100 text-rose-800 ring-1 ring-inset ring-rose-200";
      default:
        return "bg-gray-100 text-gray-800 ring-1 ring-inset ring-gray-200";
    }
  };

  const formatEventType = (eventType: string) =>
    eventType.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

  return (
    <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="text-left bg-gray-50">
          <tr>
            <th className="whitespace-nowrap px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider text-xs">
              Client ID
            </th>
            <th className="whitespace-nowrap px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider text-xs">
              Event
            </th>
            <th className="whitespace-nowrap px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider text-xs">
              Source
            </th>
            <th className="whitespace-nowrap px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider text-xs">
              Time
            </th>
            <th className="whitespace-nowrap px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider text-xs">
              Details
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200">
          {sortedEvents.map((event) => (
            <tr
              key={`${event.clientId}-${event.time}-${event.eventType}`}
              className="hover:bg-gray-50 transition-colors"
            >
              <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-500">
                {event.clientId.substring(0, 8)}...
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <span
                  className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getEventBadgeColor(
                    event.eventType
                  )}`}
                >
                  {formatEventType(event.eventType)}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                {event.primarySource ? (
                  event.primarySource === "ChatGPT" ? (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700 capitalize">
                      {event.primarySource}
                    </span>
                  ) : (
                    <span className="capitalize">{event.primarySource}</span>
                  )
                ) : (
                  <span className="text-slate-400">Unknown</span>
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                {formatTimeAgo(event.time)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                {(() => {
                  const maxItems = 3;
                  const items = event.details?.slice(0, maxItems) ?? [];

                  const truncate = (value: string, max = 10) =>
                    value.length > max ? `${value.slice(0, max - 1)}…` : value;

                  return items.map((detail, index) => {
                    const labelFallback =
                      detail.description?.trim() || detail.url || "Link";
                    const label =
                      items.length === 1
                        ? labelFallback
                        : truncate(labelFallback);

                    const content = detail.url ? (
                      <a
                        key={`${labelFallback}-${index}`}
                        href={detail.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:text-indigo-500"
                      >
                        {label}
                      </a>
                    ) : (
                      <span key={`${labelFallback}-${index}`}>{label}</span>
                    );

                    const isLast = index === items.length - 1;
                    return (
                      <React.Fragment key={`${labelFallback}-${index}`}>
                        {content}
                        {!isLast && ", "}
                      </React.Fragment>
                    );
                  });
                })()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ActivityTable;
