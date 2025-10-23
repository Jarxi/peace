import React from 'react';
import { ClockIcon, ShoppingCartIcon, StarIcon, UsersIcon, TagIcon } from './icons';

interface GlobalStatsProps {
  totalVisits: number;
  totalSold: number;
  mostRecentPurchase: Date | null;
  topProductAll: string;
  topProductChatGPT: string;
  mostRecentSoldProduct: string;
  totalVisitsChatGPT: number;
  totalSoldChatGPT: number;
}

const formatTimeAgo = (date: Date | null): string => {
    if (!date) return 'N/A';
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 2) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

const StatCard: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: string | number;
    subValue?: string;
}> = ({ icon, label, value, subValue }) => (
    <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-gray-200">
        <div className="text-blue-500">
            {icon}
        </div>
        <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
            <p className="text-lg font-bold text-slate-900 truncate" title={String(value)}>{value}</p>
            {subValue && (
                <p className="text-xs text-slate-500 truncate" title={subValue}>
                    {subValue}
                </p>
            )}
        </div>
    </div>
);


const GlobalStats: React.FC<GlobalStatsProps> = ({
  totalVisits,
  totalSold,
  mostRecentPurchase,
  topProductAll,
  topProductChatGPT,
  mostRecentSoldProduct,
  totalVisitsChatGPT,
  totalSoldChatGPT,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard
            icon={<UsersIcon className="h-8 w-8" />}
            label="Total Visits (All Time)"
            value={totalVisits.toLocaleString()}
            subValue={`(${totalVisitsChatGPT.toLocaleString()} from ChatGPT)`}
        />
        <StatCard
            icon={<ShoppingCartIcon className="h-8 w-8" />}
            label="Total Sales (All Time)"
            value={totalSold.toLocaleString()}
            subValue={`(${totalSoldChatGPT.toLocaleString()} from ChatGPT)`}
        />
        <StatCard
            icon={<ClockIcon className="h-8 w-8" />}
            label="Most Recent Sale"
            value={formatTimeAgo(mostRecentPurchase)}
        />
        <StatCard
            icon={<TagIcon className="h-8 w-8" />}
            label="Last Product Sold"
            value={mostRecentSoldProduct}
        />
        <StatCard
            icon={<StarIcon className="h-8 w-8" />}
            label="Top Product (All)"
            value={topProductAll}
        />
        <StatCard
            icon={<StarIcon className="h-8 w-8" />}
            label="Top Product (ChatGPT)"
            value={topProductChatGPT}
        />
    </div>
  );
};

export default GlobalStats;
