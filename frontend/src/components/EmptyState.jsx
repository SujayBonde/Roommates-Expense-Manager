import React from 'react';
import { Plus } from 'lucide-react';

export default function EmptyState({ icon: Icon, title, description, actionText, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center p-10 sm:p-14 text-center bg-white dark:bg-[#111622] border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-subtle">
      {Icon && (
        <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl mb-3.5">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">{title}</h3>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          {actionText}
        </button>
      )}
    </div>
  );
}
