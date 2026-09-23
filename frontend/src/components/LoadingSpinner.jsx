import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ size = 'md', text = 'Loading...' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-2.5">
      <Loader2 className={`${sizeClasses[size]} text-teal-600 dark:text-teal-400 animate-spin`} />
      {text && <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{text}</p>}
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="w-full h-12 bg-slate-100 dark:bg-slate-800/40 rounded-lg animate-pulse my-1.5" />
  );
}

export function SkeletonCard() {
  return (
    <div className="p-5 bg-white dark:bg-[#111622] border border-slate-200/90 dark:border-slate-800 rounded-xl animate-pulse space-y-3">
      <div className="w-1/3 h-3.5 bg-slate-200 dark:bg-slate-800 rounded" />
      <div className="w-2/3 h-7 bg-slate-200 dark:bg-slate-800 rounded" />
      <div className="w-1/2 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
    </div>
  );
}
