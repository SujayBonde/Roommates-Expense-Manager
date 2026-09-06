import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import { useHousehold } from '../context/HouseholdContext';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export default function RecordSettlementModal({
  isOpen,
  onClose,
  onSuccess,
  defaultPayerId,
  defaultReceiverId,
  defaultAmount,
}) {
  const { currentHousehold, members } = useHousehold();
  const { user } = useAuth();

  const [receiverId, setReceiverId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (defaultReceiverId) {
      setReceiverId(defaultReceiverId.toString());
    } else {
      const other = members.find((m) => m.userId !== user?.id);
      setReceiverId(other ? other.userId.toString() : '');
    }
    if (defaultAmount) {
      setAmount(defaultAmount.toString());
    } else {
      setAmount('');
    }
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setNote('');
    setError('');
  }, [isOpen, defaultReceiverId, defaultAmount, members, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const num = parseFloat(amount) || 0;
    if (num <= 0) {
      setError('Amount must be greater than 0');
      return;
    }
    if (!receiverId) {
      setError('Select a payment receiver');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await axiosClient.post('/settlements', {
        receiverId: parseInt(receiverId),
        amount: num,
        paymentDate,
        note: note.trim(),
        householdId: currentHousehold.id,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record settlement');
    } finally {
      setLoading(false);
    }
  };

  const receiverName = members.find((m) => m.userId.toString() === receiverId)?.name || 'Roommate';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Debt Settlement">
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-600 dark:text-slate-400">Payer (You):</span>
          <span className="font-bold text-slate-800 dark:text-slate-200">{user?.name}</span>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
            Paying To *
          </label>
          <select
            value={receiverId}
            onChange={(e) => setReceiverId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
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
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
            Amount Paid (₹) *
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold">
              ₹
            </span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm font-semibold focus:ring-2 focus:ring-brand-500 outline-none"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
            Payment Date *
          </label>
          <input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
            Note / Payment Mode (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Google Pay, PhonePe, Cash"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 disabled:opacity-50 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{loading ? 'Recording...' : `Mark ₹${amount || '0'} as Paid`}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
