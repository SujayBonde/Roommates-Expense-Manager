import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 mb-3 border border-slate-200 dark:border-slate-700">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">404 - Page Not Found</h1>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm">
        The requested address does not exist or has been relocated.
      </p>
      <Link
        to="/"
        className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold text-xs shadow-sm transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
}
