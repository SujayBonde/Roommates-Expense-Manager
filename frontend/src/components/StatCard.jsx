import React from 'react';

export default function StatCard({ title, amount, subtitle, icon: Icon, trend, variant = 'default' }) {
  const variantStyles = {
    default: 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100',
    primary: 'bg-gradient-to-br from-brand-500 to-brand-700 text-white border-transparent shadow-brand-500/20',
    positive: 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-100',
    negative: 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-100',
    warning: 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-100',
  };

  const iconBgStyles = {
    default: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
    primary: 'bg-white/20 text-white',
    positive: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300',
    negative: 'bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-300',
    warning: 'bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300',
  };

  return (
    <div className={`p-5 rounded-2xl border shadow-sm transition-all duration-200 hover:shadow-md ${variantStyles[variant]}`}>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold uppercase tracking-wider ${variant === 'primary' ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>
          {title}
        </span>
        {Icon && (
          <div className={`p-2.5 rounded-xl ${iconBgStyles[variant]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="mt-3">
        <h3 className="text-2xl font-bold tracking-tight">{amount}</h3>
        {subtitle && (
          <p className={`mt-1 text-xs font-medium ${variant === 'primary' ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
