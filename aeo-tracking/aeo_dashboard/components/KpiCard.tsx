import React from 'react';

interface KpiCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon }) => {
  return (
    <div className="bg-slate-900/80 p-6 rounded-lg border border-emerald-500/20 flex items-start justify-between shadow-lg shadow-emerald-500/5">
      <div>
        <p className="text-xs font-medium text-emerald-400 uppercase tracking-widest">{title}</p>
        <p className="text-3xl font-bold text-slate-100 mt-2">{value}</p>
      </div>
      <div className="p-3 bg-emerald-950 text-emerald-400 rounded-md">
        {icon}
      </div>
    </div>
  );
};

export default KpiCard;