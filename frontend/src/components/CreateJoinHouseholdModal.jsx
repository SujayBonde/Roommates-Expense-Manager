import React, { useState } from 'react';
import Modal from './Modal';
import { useHousehold } from '../context/HouseholdContext';
import { Plus, Users, ArrowRight } from 'lucide-react';

export default function CreateJoinHouseholdModal({ isOpen, onClose }) {
  const { createHousehold, joinHousehold } = useHousehold();
  const [tab, setTab] = useState('create'); // 'create' | 'join'

  // Create form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Join form
  const [inviteCode, setInviteCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a household name');
      return;
    }
    try {
      setLoading(true);
      setError('');
      await createHousehold({ name, description });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create household');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setError('Please enter an invite code');
      return;
    }
    try {
      setLoading(true);
      setError('');
      await joinHousehold(inviteCode.trim());
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join household');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Household Group">
      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl mb-6">
        <button
          type="button"
          onClick={() => {
            setTab('create');
            setError('');
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            tab === 'create'
              ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Create New Group
        </button>
        <button
          type="button"
          onClick={() => {
            setTab('join');
            setError('');
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            tab === 'join'
              ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Join with Code
        </button>
      </div>

      {error && (
        <div className="p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-medium">
          {error}
        </div>
      )}

      {tab === 'create' ? (
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Household / Flat Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Flat 302, Sunshine Villa"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              placeholder="e.g. Roommates sharing rent and groceries"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold text-sm shadow-md transition-all"
          >
            {loading ? 'Creating...' : 'Create Household'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Invite Code *
            </label>
            <input
              type="text"
              placeholder="e.g. FLAT302"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm font-mono uppercase tracking-wider focus:ring-2 focus:ring-brand-500 outline-none"
              required
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Ask your roommate for their group invite code (found in household settings).
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Joining...' : 'Join Household'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}
    </Modal>
  );
}
