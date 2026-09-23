import React, { useState } from 'react';
import { useHousehold } from '../context/HouseholdContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import axiosClient from '../api/axiosClient';
import {
  RefreshCw,
  Copy,
  Check,
  Building2,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';

export default function Settings() {
  const { currentHousehold, members, refreshCurrentHousehold } = useHousehold();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  const [name, setName] = useState(currentHousehold?.name || '');
  const [description, setDescription] = useState(currentHousehold?.description || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const currentMember = members.find((m) => m.userId === user?.id);
  const isAdmin = currentMember?.isAdmin;

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      setMessage('');
      setError('');
      await axiosClient.put(`/households/${currentHousehold.id}`, {
        name: name.trim(),
        description: description.trim(),
      });
      await refreshCurrentHousehold();
      setMessage('Household settings updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateCode = async () => {
    if (!window.confirm('Regenerating will invalidate the existing invite code. Continue?')) return;
    try {
      setLoading(true);
      await axiosClient.post(`/households/${currentHousehold.id}/regenerate-code`);
      await refreshCurrentHousehold();
      setMessage('New invite code generated!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to regenerate code');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (currentHousehold?.inviteCode) {
      navigator.clipboard.writeText(currentHousehold.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="pb-1 border-b border-slate-200/60 dark:border-slate-800/60">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Household Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Manage flat parameters, access codes, and theme preferences
        </p>
      </div>

      {message && (
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-medium animate-fade-in">
          {message}
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-medium animate-fade-in">
          {error}
        </div>
      )}

      {/* Household Profile Section */}
      <div className="p-5 bg-white dark:bg-[#111622] rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-subtle space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <Building2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Household Profile
          </h2>
        </div>

        <form onSubmit={handleUpdate} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
              Household Name
            </label>
            <input
              type="text"
              value={name}
              disabled={!isAdmin}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-60 text-slate-900 dark:text-slate-100 text-xs focus:ring-1 focus:ring-slate-900 dark:focus:ring-white outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
              Description
            </label>
            <textarea
              value={description}
              disabled={!isAdmin}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-60 text-slate-900 dark:text-slate-100 text-xs focus:ring-1 focus:ring-slate-900 dark:focus:ring-white outline-none"
            />
          </div>

          {isAdmin ? (
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold shadow-sm disabled:opacity-50 transition-colors"
            >
              {loading ? 'Saving...' : 'Save Profile Changes'}
            </button>
          ) : (
            <p className="text-[11px] text-slate-400 italic">
              Only household administrators can modify flat details.
            </p>
          )}
        </form>
      </div>

      {/* Invite Code Section */}
      <div className="p-5 bg-white dark:bg-[#111622] rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-subtle space-y-3.5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Invite Access Code
            </h2>
            <p className="text-[11px] text-slate-400">Share this code with roommates so they can join this workspace</p>
          </div>
          {isAdmin && (
            <button
              onClick={handleRegenerateCode}
              disabled={loading}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Regenerate Code</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 max-w-sm">
          <span className="font-mono text-base font-bold text-slate-900 dark:text-slate-100 tracking-wider px-2">
            {currentHousehold?.inviteCode}
          </span>
          <button
            onClick={handleCopyCode}
            className="ml-auto px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400 dark:text-emerald-600" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Appearance & Theme Section */}
      <div className="p-5 bg-white dark:bg-[#111622] rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-subtle space-y-3.5">
        <div className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Interface Theme
          </h2>
          <p className="text-[11px] text-slate-400">Select display mode preference for this device</p>
        </div>

        <div className="grid grid-cols-3 gap-2.5 max-w-sm">
          {[
            { id: 'light', label: 'Light', icon: Sun },
            { id: 'dark', label: 'Dark', icon: Moon },
            { id: 'system', label: 'System', icon: Monitor },
          ].map((t) => {
            const Icon = t.icon;
            const isSelected = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`p-3 rounded-lg border text-center flex flex-col items-center gap-1.5 transition-colors ${
                  isSelected
                    ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900 font-semibold'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
