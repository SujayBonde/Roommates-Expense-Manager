import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import { useHousehold } from '../context/HouseholdContext';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import { CATEGORY_META, formatCurrency } from '../utils/formatters';
import { Check, AlertCircle, Calculator } from 'lucide-react';

const CATEGORIES = [
  'RENT', 'ELECTRICITY', 'INTERNET', 'GROCERIES', 'FOOD',
  'TRAVEL', 'HOUSEHOLD', 'SHOPPING', 'ENTERTAINMENT', 'OTHER'
];

export default function AddExpenseModal({ isOpen, onClose, onSuccess, initialExpense }) {
  const { currentHousehold, members } = useHousehold();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [splitType, setSplitType] = useState('EQUAL'); // EQUAL, EXACT, PERCENTAGE, SHARES
  const [category, setCategory] = useState('GROCERIES');
  const [paidById, setPaidById] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);

  // Selected participants & their custom values: { [userId]: { selected: boolean, value: string } }
  const [participantState, setParticipantState] = useState({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize form when opened or initialExpense changes
  useEffect(() => {
    if (initialExpense) {
      setTitle(initialExpense.title || '');
      setDescription(initialExpense.description || '');
      setAmount(initialExpense.amount?.toString() || '');
      setSplitType(initialExpense.splitType || 'EQUAL');
      setCategory(initialExpense.category || 'GROCERIES');
      setPaidById(initialExpense.paidById?.toString() || user?.id?.toString() || '');
      setExpenseDate(initialExpense.expenseDate || new Date().toISOString().split('T')[0]);

      const state = {};
      members.forEach((m) => {
        const found = initialExpense.participants?.find((p) => p.userId === m.userId);
        state[m.userId] = {
          selected: !!found,
          value: found?.shareValue?.toString() || '',
        };
      });
      setParticipantState(state);
    } else {
      setTitle('');
      setDescription('');
      setAmount('');
      setSplitType('EQUAL');
      setCategory('GROCERIES');
      setPaidById(user?.id?.toString() || (members[0]?.userId?.toString() || ''));
      setExpenseDate(new Date().toISOString().split('T')[0]);

      const state = {};
      members.forEach((m) => {
        state[m.userId] = { selected: true, value: '' };
      });
      setParticipantState(state);
    }
  }, [isOpen, initialExpense, members, user]);

  const toggleParticipant = (userId) => {
    setParticipantState((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        selected: !prev[userId]?.selected,
      },
    }));
  };

  const updateParticipantValue = (userId, value) => {
    setParticipantState((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        value,
      },
    }));
  };

  // Calculation helpers for validation
  const numAmount = parseFloat(amount) || 0;
  const selectedParticipants = Object.entries(participantState)
    .filter(([_, data]) => data.selected)
    .map(([userId, data]) => ({
      userId: parseInt(userId),
      value: parseFloat(data.value) || 0,
    }));

  let allocationSummary = '';
  let isValidAllocation = true;

  if (splitType === 'EXACT') {
    const totalCustom = selectedParticipants.reduce((sum, p) => sum + p.value, 0);
    const diff = numAmount - totalCustom;
    if (Math.abs(diff) > 0.01) {
      isValidAllocation = false;
      allocationSummary = diff > 0
        ? `₹${diff.toFixed(2)} remaining to allocate`
        : `Over-allocated by ₹${Math.abs(diff).toFixed(2)}`;
    } else {
      allocationSummary = 'Exact amounts match total!';
    }
  } else if (splitType === 'PERCENTAGE') {
    const totalPct = selectedParticipants.reduce((sum, p) => sum + p.value, 0);
    const diff = 100 - totalPct;
    if (Math.abs(diff) > 0.01) {
      isValidAllocation = false;
      allocationSummary = `Total: ${totalPct.toFixed(1)}% (needs 100%)`;
    } else {
      allocationSummary = '100% fully allocated!';
    }
  } else if (splitType === 'SHARES') {
    const totalShares = selectedParticipants.reduce((sum, p) => sum + p.value, 0);
    if (totalShares <= 0) {
      isValidAllocation = false;
      allocationSummary = 'Each participant must have at least 1 share';
    } else {
      allocationSummary = `Total: ${totalShares} shares`;
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter an expense title');
      return;
    }
    if (numAmount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }
    if (selectedParticipants.length === 0) {
      setError('Select at least one participant');
      return;
    }
    if (!isValidAllocation) {
      setError(`Split values do not match requirements: ${allocationSummary}`);
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      amount: numAmount,
      splitType,
      category,
      paidById: parseInt(paidById),
      householdId: currentHousehold.id,
      expenseDate,
      participants: selectedParticipants.map((p) => ({
        userId: p.userId,
        shareValue: splitType === 'EQUAL' ? null : p.value,
      })),
    };

    try {
      setLoading(true);
      setError('');
      if (initialExpense) {
        await axiosClient.put(`/expenses/${initialExpense.id}`, payload);
      } else {
        await axiosClient.post('/expenses', payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialExpense ? 'Edit Expense' : 'Add New Expense'}
      maxWidth="max-w-2xl"
    >
      {error && (
        <div className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title and Amount */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Expense Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Monthly Grocery, Wi-Fi bill, Dinner"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Amount (₹) *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold">
                ₹
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="4000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm font-semibold focus:ring-2 focus:ring-brand-500 outline-none"
                required
              />
            </div>
          </div>
        </div>

        {/* Paid By & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Paid By *
            </label>
            <select
              value={paidById}
              onChange={(e) => setPaidById(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              required
            >
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.name} {m.userId === user?.id ? '(You)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Date *
            </label>
            <input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              required
            />
          </div>
        </div>

        {/* Category Pill Buttons */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
            Category
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const meta = CATEGORY_META[cat];
              const isSelected = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    isSelected
                      ? 'bg-brand-600 text-white border-brand-600 shadow-sm shadow-brand-500/20'
                      : 'bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-brand-300'
                  }`}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Split Type Selector */}
        <div className="pt-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
            Split Method
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-100 dark:bg-slate-800/60 p-1.5 rounded-2xl">
            {[
              { id: 'EQUAL', label: 'Equal Split', desc: 'Divided equally' },
              { id: 'EXACT', label: 'Exact Amount', desc: '₹ per member' },
              { id: 'PERCENTAGE', label: 'Percentage', desc: '% per member' },
              { id: 'SHARES', label: 'Shares', desc: 'Multiplier' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setSplitType(st.id)}
                className={`py-2 px-3 rounded-xl text-left transition-all ${
                  splitType === st.id
                    ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm border border-slate-200/50 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="text-xs font-bold truncate">{st.label}</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{st.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Participants Selection & Custom Inputs */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Participants ({selectedParticipants.length})
            </span>
            {allocationSummary && (
              <span
                className={`text-xs font-bold ${
                  isValidAllocation
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {allocationSummary}
              </span>
            )}
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/40">
            {members.map((m) => {
              const state = participantState[m.userId] || { selected: false, value: '' };
              const isSelected = state.selected;

              let calculatedPreview = '';
              if (isSelected && numAmount > 0) {
                if (splitType === 'EQUAL') {
                  const share = (numAmount / Math.max(1, selectedParticipants.length)).toFixed(2);
                  calculatedPreview = `≈ ₹${share}`;
                } else if (splitType === 'PERCENTAGE' && state.value) {
                  const pct = parseFloat(state.value) || 0;
                  calculatedPreview = `₹${((numAmount * pct) / 100).toFixed(2)}`;
                } else if (splitType === 'SHARES' && state.value) {
                  const totalShares = selectedParticipants.reduce((sum, p) => sum + p.value, 0);
                  const shares = parseFloat(state.value) || 0;
                  if (totalShares > 0) {
                    calculatedPreview = `₹${((numAmount * shares) / totalShares).toFixed(2)}`;
                  }
                }
              }

              return (
                <div
                  key={m.userId}
                  className={`p-3.5 flex items-center justify-between gap-3 transition-colors ${
                    isSelected ? 'bg-white dark:bg-slate-900' : 'opacity-60 bg-transparent'
                  }`}
                >
                  <label className="flex items-center gap-3 cursor-pointer flex-1 select-none">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleParticipant(m.userId)}
                      className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                    />
                    <img
                      src={m.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}`}
                      alt={m.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {m.name} {m.userId === user?.id ? '(You)' : ''}
                      </div>
                      {calculatedPreview && (
                        <div className="text-xs font-medium text-brand-600 dark:text-brand-400">
                          {calculatedPreview}
                        </div>
                      )}
                    </div>
                  </label>

                  {/* Custom Input for EXACT, PERCENTAGE, SHARES */}
                  {isSelected && splitType !== 'EQUAL' && (
                    <div className="w-32 shrink-0">
                      <div className="relative">
                        <input
                          type="number"
                          step={splitType === 'SHARES' ? '1' : '0.01'}
                          min="0"
                          placeholder={
                            splitType === 'EXACT'
                              ? '₹ Amount'
                              : splitType === 'PERCENTAGE'
                              ? '%'
                              : 'Shares'
                          }
                          value={state.value}
                          onChange={(e) => updateParticipantValue(m.userId, e.target.value)}
                          className="w-full px-3 py-1.5 text-right font-mono text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 outline-none"
                          required
                        />
                        <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400 pointer-events-none">
                          {splitType === 'EXACT' ? '₹' : splitType === 'PERCENTAGE' ? '%' : 'x'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Description textarea */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
            Notes / Details (Optional)
          </label>
          <textarea
            placeholder="Add any extra details, receipt notes, etc."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
          />
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !isValidAllocation}
            className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-brand-500/25 transition-all"
          >
            {loading ? 'Saving...' : initialExpense ? 'Update Expense' : 'Save Expense'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
