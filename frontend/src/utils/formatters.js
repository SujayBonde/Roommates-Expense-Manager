/**
 * Formats a number or numeric string to Indian Rupee (₹) format
 */
export function formatCurrency(amount) {
  if (amount === undefined || amount === null) return '₹0.00';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '₹0.00';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Formats date into readable string like "05 Sep 2026"
 */
export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Formats date and time into readable string like "05 Sep 2026, 04:15 PM"
 */
export function formatDateTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Metadata for expense categories including icons, colors, and badges
 */
export const CATEGORY_META = {
  RENT: {
    label: 'Rent',
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    badgeColor: '#8b5cf6',
  },
  ELECTRICITY: {
    label: 'Electricity',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    badgeColor: '#f59e0b',
  },
  INTERNET: {
    label: 'Internet',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    badgeColor: '#3b82f6',
  },
  GROCERIES: {
    label: 'Groceries',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    badgeColor: '#10b981',
  },
  FOOD: {
    label: 'Food & Dining',
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
    badgeColor: '#f97316',
  },
  TRAVEL: {
    label: 'Travel',
    color: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-100 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
    badgeColor: '#06b6d4',
  },
  HOUSEHOLD: {
    label: 'Household',
    color: 'text-teal-600 dark:text-teal-400',
    bg: 'bg-teal-100 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800',
    badgeColor: '#14b8a6',
  },
  SHOPPING: {
    label: 'Shopping',
    color: 'text-pink-600 dark:text-pink-400',
    bg: 'bg-pink-100 dark:bg-pink-950/50 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800',
    badgeColor: '#ec4899',
  },
  ENTERTAINMENT: {
    label: 'Entertainment',
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    badgeColor: '#f43f5e',
  },
  OTHER: {
    label: 'Other',
    color: 'text-slate-600 dark:text-slate-400',
    bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    badgeColor: '#64748b',
  },
};

export function getCategoryMeta(category) {
  return CATEGORY_META[category] || CATEGORY_META.OTHER;
}

export function getSplitTypeLabel(type) {
  switch (type) {
    case 'EQUAL': return 'Equal Split';
    case 'EXACT': return 'Custom Amount';
    case 'PERCENTAGE': return 'Percentage (%)';
    case 'SHARES': return 'Shares Multiplier';
    default: return type;
  }
}
