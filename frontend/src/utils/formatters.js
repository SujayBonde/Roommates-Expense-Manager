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
 * Metadata for expense categories with refined, accessible badge styling
 */
export const CATEGORY_META = {
  RENT: {
    label: 'Rent',
    color: 'text-violet-700 dark:text-violet-300',
    bg: 'bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800/60',
    badgeColor: '#7c3aed',
  },
  ELECTRICITY: {
    label: 'Electricity',
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
    badgeColor: '#d97706',
  },
  INTERNET: {
    label: 'Internet',
    color: 'text-sky-700 dark:text-sky-300',
    bg: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/60',
    badgeColor: '#0284c7',
  },
  GROCERIES: {
    label: 'Groceries',
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
    badgeColor: '#059669',
  },
  FOOD: {
    label: 'Food & Dining',
    color: 'text-orange-700 dark:text-orange-300',
    bg: 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800/60',
    badgeColor: '#ea580c',
  },
  TRAVEL: {
    label: 'Travel',
    color: 'text-cyan-700 dark:text-cyan-300',
    bg: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/60',
    badgeColor: '#0891b2',
  },
  HOUSEHOLD: {
    label: 'Household',
    color: 'text-teal-700 dark:text-teal-300',
    bg: 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800/60',
    badgeColor: '#0d9488',
  },
  SHOPPING: {
    label: 'Shopping',
    color: 'text-pink-700 dark:text-pink-300',
    bg: 'bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800/60',
    badgeColor: '#db2777',
  },
  ENTERTAINMENT: {
    label: 'Entertainment',
    color: 'text-rose-700 dark:text-rose-300',
    bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
    badgeColor: '#e11d48',
  },
  OTHER: {
    label: 'Other',
    color: 'text-slate-700 dark:text-slate-300',
    bg: 'bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/60',
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
