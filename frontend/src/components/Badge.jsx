import React from 'react';
import { getCategoryMeta } from '../utils/formatters';

export function CategoryBadge({ category }) {
  const meta = getCategoryMeta(category);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${meta.bg}`}>
      {meta.label}
    </span>
  );
}

export function StatusBadge({ status }) {
  const styles = {
    PENDING: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60',
    PARTIALLY_PAID: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800/60',
    PAID: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60',
  };

  const labels = {
    PENDING: 'Pending',
    PARTIALLY_PAID: 'Partially Paid',
    PAID: 'Paid',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${styles[status] || styles.PENDING}`}>
      {labels[status] || status}
    </span>
  );
}

export function BalanceBadge({ balance }) {
  const num = typeof balance === 'string' ? parseFloat(balance) : balance;
  if (num > 0) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
        Gets back
      </span>
    );
  }
  if (num < 0) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
        Owes
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60">
      Settled
    </span>
  );
}
