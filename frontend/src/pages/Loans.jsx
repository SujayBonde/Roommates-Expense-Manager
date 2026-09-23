import React, { useState, useEffect } from 'react';
import { useHousehold } from '../context/HouseholdContext';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import { formatCurrency, formatDate } from '../utils/formatters';
import { StatusBadge } from '../components/Badge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import {
  HandCoins,
  Plus,
  ArrowRight,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Calendar,
} from 'lucide-react';

export default function Loans() {
  const { currentHousehold, members } = useHousehold();
  const { user } = useAuth();

  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Loan Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [borrowerId, setBorrowerId] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [loanDesc, setLoanDesc] = useState('');
  const [loanDate, setLoanDate] = useState(new Date().toISOString().split('T')[0]);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  // Partial Payment Modal
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState('');

  const fetchLoans = async () => {
    if (!currentHousehold) return;
    try {
      setLoading(true);
      const res = await axiosClient.get(`/loans?householdId=${currentHousehold.id}`);
      setLoans(res.data || []);
    } catch (err) {
      console.error('Failed to load loans', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, [currentHousehold]);

  const handleCreateLoan = async (e) => {
    e.preventDefault();
    const num = parseFloat(loanAmount) || 0;
    if (num <= 0) {
      setAddError('Amount must be greater than 0');
      return;
    }
    if (!borrowerId) {
      setAddError('Select a borrower');
      return;
    }

    try {
      setAddLoading(true);
      setAddError('');
      await axiosClient.post('/loans', {
        borrowerId: parseInt(borrowerId),
        amount: num,
        description: loanDesc.trim(),
        date: loanDate,
        householdId: currentHousehold.id,
      });
      setIsAddOpen(false);
      setLoanAmount('');
      setLoanDesc('');
      fetchLoans();
    } catch (err) {
      setAddError(err.response?.data?.message || 'Failed to create loan');
    } finally {
      setAddLoading(false);
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    const num = parseFloat(payAmount) || 0;
    if (num <= 0) {
      setPayError('Payment amount must be greater than 0');
      return;
    }
    if (selectedLoan && num > parseFloat(selectedLoan.remainingAmount)) {
      setPayError(`Payment cannot exceed remaining debt of ${formatCurrency(selectedLoan.remainingAmount)}`);
      return;
    }

    try {
      setPayLoading(true);
      setPayError('');
      await axiosClient.post(`/loans/${selectedLoan.id}/payments`, {
        amount: num,
        paymentDate: payDate,
        note: payNote.trim(),
      });
      setSelectedLoan(null);
      setPayAmount('');
      setPayNote('');
      fetchLoans();
    } catch (err) {
      setPayError(err.response?.data?.message || 'Failed to record repayment');
    } finally {
      setPayLoading(false);
    }
  };

  const handleDeleteLoan = async (loanId) => {
    if (!window.confirm('Are you sure you want to delete this loan record?')) return;
    try {
      await axiosClient.delete(`/loans/${loanId}`);
      fetchLoans();
    } catch (err) {
      console.error('Failed to delete loan', err);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60 dark:border-slate-800/60">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Personal Loans & Advances
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Direct 1-on-1 cash advances between roommates, partial repayments, and remaining balances
          </p>
        </div>

        <button
          onClick={() => {
            const other = members.find((m) => m.userId !== user?.id);
            setBorrowerId(other ? other.userId.toString() : '');
            setIsAddOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Personal Loan</span>
        </button>
      </div>

      {loading && loans.length === 0 ? (
        <LoadingSpinner text="Loading loan ledgers..." />
      ) : loans.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#111622] rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-subtle">
          <HandCoins className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">No personal loans recorded</h3>
          <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm mx-auto">
            Need to track an emergency cash loan or personal expense advance? Create a record to track partial payments and full settlement.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loans.map((loan) => {
            const original = parseFloat(loan.originalAmount) || 0;
            const remaining = parseFloat(loan.remainingAmount) || 0;
            const paid = parseFloat(loan.paidAmount) || 0;
            const progressPct = original > 0 ? Math.min(100, Math.round((paid / original) * 100)) : 100;

            const isLenderMe = loan.lenderId === user?.id;
            const isBorrowerMe = loan.borrowerId === user?.id;
            const canDelete = isLenderMe || members.find((m) => m.userId === user?.id)?.isAdmin;

            return (
              <div
                key={loan.id}
                className="p-5 bg-white dark:bg-[#111622] rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-subtle flex flex-col justify-between space-y-3.5"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <StatusBadge status={loan.status} />
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(loan.date)}</span>
                      {canDelete && (
                        <button
                          onClick={() => handleDeleteLoan(loan.id)}
                          title="Delete loan record"
                          className="ml-1.5 p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between mb-1">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
                      {formatCurrency(original)}
                    </h3>
                    <span className="text-xs font-semibold text-slate-500">
                      Remaining: <span className="font-mono font-bold text-rose-700 dark:text-rose-400 tabular-nums">{formatCurrency(remaining)}</span>
                    </span>
                  </div>

                  {loan.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic mb-2.5">
                      "{loan.description}"
                    </p>
                  )}

                  {/* Parties banner */}
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-medium">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Lender</span>
                      <span className={isLenderMe ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-slate-700 dark:text-slate-300'}>
                        {loan.lenderName} {isLenderMe ? '(You)' : ''}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block uppercase">Borrower</span>
                      <span className={isBorrowerMe ? 'text-rose-700 dark:text-rose-400 font-bold' : 'text-slate-700 dark:text-slate-300'}>
                        {loan.borrowerName} {isBorrowerMe ? '(You)' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-[11px] font-medium text-slate-500">
                      <span>Repaid: {formatCurrency(paid)}</span>
                      <span>{progressPct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Repayment History list if any */}
                {loan.payments && loan.payments.length > 0 && (
                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Repayments ({loan.payments.length})
                    </span>
                    <div className="max-h-24 overflow-y-auto space-y-1 text-xs divide-y divide-slate-50 dark:divide-slate-800/60">
                      {loan.payments.map((p) => (
                        <div key={p.id} className="pt-1 flex items-center justify-between text-slate-600 dark:text-slate-300 text-[11px]">
                          <span>
                            {formatDate(p.paymentDate)} {p.note ? `• ${p.note}` : ''}
                          </span>
                          <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                            +{formatCurrency(p.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                {remaining > 0 && (
                  <button
                    onClick={() => {
                      setSelectedLoan(loan);
                      setPayAmount(remaining.toString());
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Record Repayment</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Loan Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Record Personal Loan">
        {addError && (
          <div className="mb-3.5 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{addError}</span>
          </div>
        )}

        <form onSubmit={handleCreateLoan} className="space-y-3.5">
          <div className="p-2.5 bg-slate-50 dark:bg-slate-850 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400">
            Lender (Person providing funds): <span className="font-bold text-slate-900 dark:text-slate-100">{user?.name} (You)</span>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
              Borrower (Roommate receiving funds) *
            </label>
            <select
              value={borrowerId}
              onChange={(e) => setBorrowerId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-1 focus:ring-slate-900 dark:focus:ring-white outline-none"
              required
            >
              {members
                .filter((m) => m.userId !== user?.id)
                .map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.name} ({m.email})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
              Principal Amount (₹) *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                ₹
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="500"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:ring-1 focus:ring-slate-900 dark:focus:ring-white outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
              Date *
            </label>
            <input
              type="date"
              value={loanDate}
              onChange={(e) => setLoanDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-1 focus:ring-slate-900 dark:focus:ring-white outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
              Description / Memo (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Emergency grocery cash, cab fare split"
              value={loanDesc}
              onChange={(e) => setLoanDesc(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-1 focus:ring-slate-900 dark:focus:ring-white outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addLoading}
              className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold shadow-sm disabled:opacity-50 transition-colors"
            >
              {addLoading ? 'Saving...' : 'Create Loan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Partial Repayment Modal */}
      <Modal
        isOpen={!!selectedLoan}
        onClose={() => setSelectedLoan(null)}
        title="Record Loan Repayment"
      >
        {payError && (
          <div className="mb-3.5 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-medium">
            {payError}
          </div>
        )}

        <form onSubmit={handleAddPayment} className="space-y-3.5">
          <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200/80 dark:border-slate-800 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Original Principal:</span>
              <span className="font-bold font-mono">{formatCurrency(selectedLoan?.originalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Outstanding Balance:</span>
              <span className="font-bold font-mono text-rose-700 dark:text-rose-400">
                {formatCurrency(selectedLoan?.remainingAmount)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
              Repayment Amount (₹) *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                ₹
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={selectedLoan?.remainingAmount}
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:ring-1 focus:ring-slate-900 dark:focus:ring-white outline-none"
                required
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Enter partial amount or the full balance to mark this loan settled.
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
              Payment Date *
            </label>
            <input
              type="date"
              value={payDate}
              onChange={(e) => setPayDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-1 focus:ring-slate-900 dark:focus:ring-white outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
              Payment Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. UPI transfer, cash handed over"
              value={payNote}
              onChange={(e) => setPayNote(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-1 focus:ring-slate-900 dark:focus:ring-white outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setSelectedLoan(null)}
              className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={payLoading}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm disabled:opacity-50 transition-colors"
            >
              {payLoading ? 'Saving...' : 'Confirm Repayment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
