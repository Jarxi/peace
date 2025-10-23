import React from 'react';
import { EventLog } from '../types';

interface ActivityTableProps {
  events: EventLog[];
}

const ActivityTable: React.FC<ActivityTableProps> = ({ events }) => {
    
  const formatTimeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  const getEventBadgeColor = (eventType: string) => {
    switch (eventType) {
        case 'product_viewed':
            return 'bg-sky-100 text-sky-800 ring-1 ring-inset ring-sky-200';
        case 'add_to_cart':
            return 'bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-200';
        case 'checkout':
            return 'bg-pink-100 text-pink-800 ring-1 ring-inset ring-pink-200';
        case 'clicked':
            return 'bg-teal-100 text-teal-800 ring-1 ring-inset ring-teal-200';
        default:
            return 'bg-gray-100 text-gray-800 ring-1 ring-inset ring-gray-200';
    }
  };

  return (
    <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="text-left bg-gray-50">
          <tr>
            <th className="whitespace-nowrap px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider text-xs">Client ID</th>
            <th className="whitespace-nowrap px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider text-xs">Event</th>
            <th className="whitespace-nowrap px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider text-xs">Product</th>
            <th className="whitespace-nowrap px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider text-xs">Source</th>
            <th className="whitespace-nowrap px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider text-xs">Time</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200">
          {events.map((event) => (
            <tr key={event.clientId + event.occurredAt.toISOString()} className="hover:bg-gray-50 transition-colors">
              <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-500">{event.clientId.substring(0, 8)}...</td>
              <td className="whitespace-nowrap px-4 py-3">
                <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full capitalize ${getEventBadgeColor(event.eventType)}`}>
                    {event.eventType.replace('_', ' ')}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">{event.productName}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">{event.source}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatTimeAgo(event.occurredAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ActivityTable;