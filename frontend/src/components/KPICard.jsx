import React from 'react';

const KPICard = ({ title, value, icon: Icon, color, subtitle }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex items-center justify-between shadow-sm">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        <h3 className="text-2xl font-bold text-white mt-2">{value}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-1 font-medium">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-lg bg-slate-850 border border-slate-750 ${color || 'text-blue-400'}`}>
        <Icon size={24} />
      </div>
    </div>
  );
};

export default KPICard;
