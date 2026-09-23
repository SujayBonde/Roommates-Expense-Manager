import React from 'react';

export default function StatCard({ title, amount, subtitle, icon: Icon, trend, variant = 'default' }) {
  const variantStyles = {
    default: 'bg-white dark:bg-[#111622] border-slate-200/90 dark:border-slate-800 text-slate-900 dark:text-slate-100',
    primary: 'bg-white dark:bg-[#111622] border-teal-200 dark:border-teal-900/60 text-slate-900 dark:text-slate-100',
    positive: 'bg-white dark:bg-[#111622] border-emerald-200 dark:border-emerald-900/60 text-slate-900 dark:text-slate-100',
    negative: 'bg-white dark:bg-[#111622] border-rose-200 dark:border-rose-900/60 text-slate-900 dark:text-slate-100',
    warning: 'bg-white dark:bg-[#111622] border-amber-200 dark:border-amber-900/60 text-slate-900 dark:text-slate-100',
  };

  const iconStyles = {
    default: 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/70',
    primary: 'text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50',
    positive: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50',
    negative: 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50',
    warning: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50',
  };

  const amountColorStyles = {
    default: 'text-slate-900 dark:text-white',
    primary: 'text-teal-700 dark:text-teal-400',
    positive: 'text-emerald-700 dark:text-emerald-400',
    negative: 'text-rose-700 dark:text-rose-400',
    warning: 'text-amber-700 dark:text-amber-400',
  };

  return (
    <div className={`p-4 rounded-xl border shadow-subtle transition-colors ${variantStyles[variant]}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className={`p-1.5 rounded-lg ${iconStyles[variant]}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="mt-2.5">
        <div className={`text-xl font-bold tracking-tight font-mono tabular-nums ${amountColorStyles[variant]}`}>
          {amount}
        </div>
        {subtitle && (
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
