import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ size = 'md', text = 'Loading...' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-3">
      <Loader2 className={`${sizeClasses[size]} text-brand-600 animate-spin`} />
      {text && <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{text}</p>}
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="w-full h-14 bg-slate-100 dark:bg-slate-800/60 rounded-xl animate-pulse my-2" />
  );
}

export function SkeletonCard() {
  return (
    <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl animate-pulse space-y-3">
      <div className="w-1/3 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
      <div className="w-2/3 h-8 bg-slate-200 dark:bg-slate-800 rounded" />
      <div className="w-1/2 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
    </div>
  );
}
