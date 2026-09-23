import React, { useState, useEffect, useCallback } from 'react';
import { useHousehold } from '../context/HouseholdContext';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import { formatCurrency, formatDate, getSplitTypeLabel } from '../utils/formatters';
import { CategoryBadge } from '../components/Badge';
import { LoadingSpinner, SkeletonRow } from '../components/LoadingSpinner';
import AddExpenseModal from './AddExpenseModal';
import ExpenseDetailModal from './ExpenseDetailModal';
import {
  Search,
  Plus,
  Receipt,
  ChevronLeft,
  ChevronRight,
  Eye,
  RotateCcw,
} from 'lucide-react';

const CATEGORIES = [
  'ALL', 'RENT', 'ELECTRICITY', 'INTERNET', 'GROCERIES', 'FOOD',
  'TRAVEL', 'HOUSEHOLD', 'SHOPPING', 'ENTERTAINMENT', 'OTHER'
];

export default function Expenses() {
  const { currentHousehold, members } = useHousehold();
  const { user } = useAuth();

  const [expenses, setExpenses] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [paidById, setPaidById] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [loading, setLoading] = useState(false);

  // Modals
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);

  const fetchExpenses = useCallback(async () => {
    if (!currentHousehold) return;
    try {
      setLoading(true);
      let url = `/expenses?householdId=${currentHousehold.id}&page=${page}&size=10`;
      if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;
      if (category !== 'ALL') url += `&category=${category}`;
      if (paidById !== 'ALL') url += `&paidById=${paidById}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;

      const res = await axiosClient.get(url);
      setExpenses(res.data?.content || []);
      setTotalPages(res.data?.totalPages || 1);
      setTotalElements(res.data?.totalElements || 0);
    } catch (err) {
      console.error('Failed to load expenses', err);
    } finally {
      setLoading(false);
    }
  }, [currentHousehold, page, search, category, paidById, startDate, endDate]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleResetFilters = () => {
    setSearch('');
    setCategory('ALL');
    setPaidById('ALL');
    setStartDate('');
    setEndDate('');
    setPage(0);
  };

  const hasActiveFilters = search || category !== 'ALL' || paidById !== 'ALL' || startDate || endDate;

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60 dark:border-slate-800/60">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Expenses History
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Detailed ledger of all flat expenditures, splits, and payer allocations
          </p>
        </div>

        <button
          onClick={() => {
            setEditingExpense(null);
            setIsAddExpenseOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-3 bg-white dark:bg-[#111622] rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-subtle space-y-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Search box */}
          <div className="relative sm:col-span-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search expenses by title or note..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 text-xs focus:ring-1 focus:ring-slate-900 dark:focus:ring-white outline-none transition-colors"
            />
          </div>

          {/* Category */}
          <div>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(0);
              }}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 text-xs focus:ring-1 focus:ring-slate-900 dark:focus:ring-white outline-none transition-colors"
            >
              <option value="ALL">All Categories</option>
              {CATEGORIES.filter((c) => c !== 'ALL').map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Paid By */}
          <div>
            <select
              value={paidById}
              onChange={(e) => {
                setPaidById(e.target.value);
                setPage(0);
              }}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 text-xs focus:ring-1 focus:ring-slate-900 dark:focus:ring-white outline-none transition-colors"
            >
              <option value="ALL">All Payers</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-center">
            <button
              onClick={handleResetFilters}
              disabled={!hasActiveFilters}
              className="w-full py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80 disabled:opacity-40 text-slate-600 dark:text-slate-400 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-[#111622] rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-subtle overflow-hidden">
        {loading && expenses.length === 0 ? (
          <div className="p-5 space-y-2">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">No expenses found</h3>
            <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm mx-auto">
              No records match your active query. Clear your filters or add a new expense.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-900/50 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="py-2.5 px-3.5 text-left font-semibold">Date</th>
                  <th scope="col" className="py-2.5 px-3.5 text-left font-semibold">Expense Title</th>
                  <th scope="col" className="py-2.5 px-3.5 text-left font-semibold">Category</th>
                  <th scope="col" className="py-2.5 px-3.5 text-left font-semibold">Paid By</th>
                  <th scope="col" className="py-2.5 px-3.5 text-left font-semibold">Split Type</th>
                  <th scope="col" className="py-2.5 px-3.5 text-right font-semibold">Amount</th>
                  <th scope="col" className="py-2.5 px-3.5 text-right font-semibold">My Share</th>
                  <th scope="col" className="py-2.5 px-3.5 text-center font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {expenses.map((exp) => (
                  <tr
                    key={exp.id}
                    onClick={() => setSelectedExpense(exp)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3.5 text-slate-500 dark:text-slate-400 whitespace-nowrap text-[11px]">
                      {formatDate(exp.expenseDate)}
                    </td>
                    <td className="py-3 px-3.5 font-semibold text-slate-900 dark:text-slate-100">
                      {exp.title}
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <CategoryBadge category={exp.category} />
                    </td>
                    <td className="py-3 px-3.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      <span>{exp.paidByName}</span>
                      {exp.paidById === user?.id && (
                        <span className="ml-1 text-[10px] font-semibold text-teal-600 dark:text-teal-400">
                          (You)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-slate-500 whitespace-nowrap text-[11px]">
                      {getSplitTypeLabel(exp.splitType)}
                    </td>
                    <td className="py-3 px-3.5 text-right font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums whitespace-nowrap">
                      {formatCurrency(exp.amount)}
                    </td>
                    <td className="py-3 px-3.5 text-right font-semibold text-teal-700 dark:text-teal-400 font-mono tabular-nums whitespace-nowrap">
                      {formatCurrency(exp.myShare)}
                    </td>
                    <td className="py-3 px-3.5 text-center whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedExpense(exp);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="View breakdown"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 dark:border-slate-800/80 text-xs">
            <span className="text-[11px] text-slate-500">
              Page {page + 1} of {totalPages} ({totalElements} total entries)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                disabled={page === 0}
                className="p-1 rounded border border-slate-200 dark:border-slate-800 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
                disabled={page >= totalPages - 1}
                className="p-1 rounded border border-slate-200 dark:border-slate-800 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Next page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Expense Modal */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => {
          setIsAddExpenseOpen(false);
          setEditingExpense(null);
        }}
        onSuccess={fetchExpenses}
        initialExpense={editingExpense}
      />

      {/* Expense Detail Breakdown Modal */}
      <ExpenseDetailModal
        isOpen={!!selectedExpense}
        onClose={() => setSelectedExpense(null)}
        expense={selectedExpense}
        onEdit={(exp) => {
          setEditingExpense(exp);
          setIsAddExpenseOpen(true);
        }}
        onDeleteSuccess={fetchExpenses}
      />
    </div>
  );
}
