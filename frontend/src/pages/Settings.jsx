import React, { useState } from 'react';
import { useHousehold } from '../context/HouseholdContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import axiosClient from '../api/axiosClient';
import {
  Settings as SettingsIcon,
  RefreshCw,
  Copy,
  Check,
  Building,
  Shield,
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
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Household Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage flat profile, invite codes, and system preferences
        </p>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs font-semibold animate-fade-in">
          {message}
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-semibold animate-fade-in">
          {error}
        </div>
      )}

      {/* Household Profile Section */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Building className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Household Profile
          </h2>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Household Name
            </label>
            <input
              type="text"
              value={name}
              disabled={!isAdmin}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-60 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Description
            </label>
            <textarea
              value={description}
              disabled={!isAdmin}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-60 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>

          {isAdmin ? (
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 disabled:opacity-50 transition-all"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          ) : (
            <p className="text-xs text-slate-400 italic">
              Only household administrators can edit flat details.
            </p>
          )}
        </form>
      </div>

      {/* Invite Code Section */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Invite Code
            </h2>
            <p className="text-xs text-slate-400">Share this code with new roommates to join</p>
          </div>
          {isAdmin && (
            <button
              onClick={handleRegenerateCode}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Regenerate Code</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700 max-w-sm">
          <span className="font-mono text-xl font-black text-slate-900 dark:text-slate-100 tracking-wider">
            {currentHousehold?.inviteCode}
          </span>
          <button
            onClick={handleCopyCode}
            className="ml-auto px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Appearance & Theme Section */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Appearance & Theme
          </h2>
          <p className="text-xs text-slate-400">Customize how RoomMate looks on your device</p>
        </div>

        <div className="grid grid-cols-3 gap-3 max-w-md">
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
                className={`p-3.5 rounded-2xl border text-center flex flex-col items-center gap-2 transition-all ${
                  isSelected
                    ? 'border-brand-600 bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 font-bold'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
