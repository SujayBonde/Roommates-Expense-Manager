import React, { useState } from 'react';
import Modal from '../components/Modal';
import { CategoryBadge } from '../components/Badge';
import { formatCurrency, formatDate, getSplitTypeLabel } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';
import { Calendar, User, Edit2, Trash2, Split } from 'lucide-react';
import axiosClient from '../api/axiosClient';

export default function ExpenseDetailModal({ isOpen, onClose, expense, onEdit, onDeleteSuccess }) {
  const { user } = useAuth();
  const { members } = useHousehold();
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  if (!expense) return null;

  const currentMember = members.find((m) => m.userId === user?.id);
  const isPayer = expense.paidById === user?.id;
  const canModify = isPayer || currentMember?.isAdmin;

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await axiosClient.delete(`/expenses/${expense.id}`);
      onDeleteSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to delete expense', err);
    } finally {
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Expense Breakdown" maxWidth="max-w-xl">
      <div className="space-y-6">
        {/* Header summary */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <CategoryBadge category={expense.category} />
              <span className="text-xs font-semibold text-slate-400">
                {getSplitTypeLabel(expense.splitType)}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {expense.title}
            </h2>
            {expense.description && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {expense.description}
              </p>
            )}
          </div>
          <div className="sm:text-right">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {formatCurrency(expense.amount)}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(expense.expenseDate)}</span>
            </div>
          </div>
        </div>

        {/* Payer info */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
              <User className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Paid by</span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {expense.paidByName} {isPayer ? '(You)' : ''}
              </span>
            </div>
          </div>
          <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(expense.amount)}
          </span>
        </div>

        {/* Breakdown Table: Member | Share | Paid | Balance */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
            Participant Shares & Balances
          </h4>
          <div className="overflow-hidden border border-slate-200/80 dark:border-slate-800 rounded-xl">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-500 dark:text-slate-400">
                <tr>
                  <th scope="col" className="py-2.5 px-3.5 text-left">Member</th>
                  <th scope="col" className="py-2.5 px-3.5 text-right">Share</th>
                  <th scope="col" className="py-2.5 px-3.5 text-right">Paid</th>
                  <th scope="col" className="py-2.5 px-3.5 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {expense.participants?.map((p) => {
                  const net = parseFloat(p.netBalance) || 0;
                  const isPositive = net > 0;
                  const isZero = Math.abs(net) < 0.001;

                  return (
                    <tr key={p.id || p.userId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 px-3.5 text-slate-800 dark:text-slate-200 font-semibold">
                        {p.userName} {p.userId === user?.id ? '(You)' : ''}
                      </td>
                      <td className="py-2.5 px-3.5 text-right text-slate-600 dark:text-slate-300 font-mono">
                        {formatCurrency(p.shareAmount)}
                      </td>
                      <td className="py-2.5 px-3.5 text-right text-slate-600 dark:text-slate-300 font-mono">
                        {formatCurrency(p.paidAmount)}
                      </td>
                      <td
                        className={`py-2.5 px-3.5 text-right font-bold font-mono ${
                          isPositive
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isZero
                            ? 'text-slate-500'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {isPositive ? `+${formatCurrency(net)}` : formatCurrency(net)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions (Edit / Delete) */}
        {canModify && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            {deleteConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                  Are you sure?
                </span>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm"
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setDeleteConfirm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Expense</span>
              </button>
            )}

            <button
              onClick={() => {
                onClose();
                onEdit(expense);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-50 dark:bg-brand-950/60 hover:bg-brand-100 dark:hover:bg-brand-900 text-brand-700 dark:text-brand-300 text-xs font-bold transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Expense</span>
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
