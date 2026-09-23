import React, { useState } from 'react';
import Modal from '../components/Modal';
import { CategoryBadge } from '../components/Badge';
import { formatCurrency, formatDate, getSplitTypeLabel } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';
import { Calendar, User, Edit2, Trash2 } from 'lucide-react';
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
      <div className="space-y-4">
        {/* Header summary */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-800/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CategoryBadge category={expense.category} />
              <span className="text-[11px] font-medium text-slate-400">
                {getSplitTypeLabel(expense.splitType)}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {expense.title}
            </h2>
            {expense.description && (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {expense.description}
              </p>
            )}
          </div>
          <div className="sm:text-right">
            <span className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums tracking-tight">
              {formatCurrency(expense.amount)}
            </span>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(expense.expenseDate)}</span>
            </div>
          </div>
        </div>

        {/* Payer info */}
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400">
              <User className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Paid by</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {expense.paidByName} {isPayer ? '(You)' : ''}
              </span>
            </div>
          </div>
          <span className="text-xs font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
            {formatCurrency(expense.amount)}
          </span>
        </div>

        {/* Breakdown Table: Member | Share | Paid | Balance */}
        <div>
          <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            Participant Shares & Ledger
          </h4>
          <div className="overflow-hidden border border-slate-200/90 dark:border-slate-800 rounded-lg">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
              <thead className="bg-slate-50 dark:bg-slate-850 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="py-2 px-3 text-left">Member</th>
                  <th scope="col" className="py-2 px-3 text-right">Share Owed</th>
                  <th scope="col" className="py-2 px-3 text-right">Paid</th>
                  <th scope="col" className="py-2 px-3 text-right">Net Position</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {expense.participants?.map((p) => {
                  const net = parseFloat(p.netBalance) || 0;
                  const isPositive = net > 0;
                  const isZero = Math.abs(net) < 0.001;

                  return (
                    <tr key={p.id || p.userId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                      <td className="py-2 px-3 text-slate-800 dark:text-slate-200 font-semibold">
                        {p.userName} {p.userId === user?.id ? '(You)' : ''}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-600 dark:text-slate-300 font-mono tabular-nums">
                        {formatCurrency(p.shareAmount)}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-600 dark:text-slate-300 font-mono tabular-nums">
                        {formatCurrency(p.paidAmount)}
                      </td>
                      <td
                        className={`py-2 px-3 text-right font-bold font-mono tabular-nums ${
                          isPositive
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : isZero
                            ? 'text-slate-500'
                            : 'text-rose-700 dark:text-rose-400'
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
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            {deleteConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                  Delete this expense?
                </span>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors"
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setDeleteConfirm(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Expense</span>
              </button>
            )}

            <button
              onClick={() => {
                onClose();
                onEdit(expense);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors"
            >
              <Edit2 className="w-3 h-3" />
              <span>Edit Details</span>
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
