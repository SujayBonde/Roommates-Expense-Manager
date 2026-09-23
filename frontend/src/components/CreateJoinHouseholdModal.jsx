import React, { useState } from 'react';
import Modal from './Modal';
import { useHousehold } from '../context/HouseholdContext';
import { ArrowRight } from 'lucide-react';

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
    <Modal isOpen={isOpen} onClose={onClose} title="Household Workspace">
      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-850 p-1 rounded-lg mb-5">
        <button
          type="button"
          onClick={() => {
            setTab('create');
            setError('');
          }}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            tab === 'create'
              ? 'bg-white dark:bg-[#111622] text-slate-900 dark:text-white shadow-sm'
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
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            tab === 'join'
              ? 'bg-white dark:bg-[#111622] text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Join with Code
        </button>
      </div>

      {error && (
        <div className="p-2.5 mb-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-medium">
          {error}
        </div>
      )}

      {tab === 'create' ? (
        <form onSubmit={handleCreate} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
              Household / Flat Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Flat 302, Sunshine Villa"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-1 focus:ring-slate-900 dark:focus:ring-white outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
              Description (Optional)
            </label>
            <textarea
              placeholder="e.g. Roommates sharing rent and groceries"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-1 focus:ring-slate-900 dark:focus:ring-white outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 disabled:opacity-50 text-white dark:text-slate-900 font-semibold text-xs shadow-sm transition-colors"
            >
              {loading ? 'Creating...' : 'Create Household'}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleJoin} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
              Invite Code *
            </label>
            <input
              type="text"
              placeholder="e.g. FLAT302"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-mono uppercase tracking-wider focus:ring-1 focus:ring-slate-900 dark:focus:ring-white outline-none"
              required
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Ask your roommate for the group invite code (found under Household Settings).
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 disabled:opacity-50 text-white dark:text-slate-900 font-semibold text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5"
            >
              <span>{loading ? 'Joining...' : 'Join Household'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
