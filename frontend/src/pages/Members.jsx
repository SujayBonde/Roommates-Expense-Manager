import React, { useState, useEffect } from 'react';
import { useHousehold } from '../context/HouseholdContext';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import { formatCurrency, formatDate } from '../utils/formatters';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  Users,
  Copy,
  Check,
  Shield,
  UserX,
  LogOut,
  Mail,
  Calendar,
} from 'lucide-react';

export default function Members() {
  const { currentHousehold, members, refreshCurrentHousehold } = useHousehold();
  const { user } = useAuth();

  const [balances, setBalances] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const currentMember = members.find((m) => m.userId === user?.id);
  const isAdmin = currentMember?.isAdmin;

  const fetchBalances = async () => {
    if (!currentHousehold) return;
    try {
      setLoading(true);
      const res = await axiosClient.get(`/households/${currentHousehold.id}/balances`);
      setBalances(res.data);
    } catch (err) {
      console.error('Failed to load member balances', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, [currentHousehold]);

  const handleCopyCode = () => {
    if (currentHousehold?.inviteCode) {
      navigator.clipboard.writeText(currentHousehold.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleRemoveMember = async (targetUserId, targetName) => {
    if (!window.confirm(`Are you sure you want to remove ${targetName} from the household?`)) return;
    try {
      await axiosClient.delete(`/households/${currentHousehold.id}/members/${targetUserId}`);
      refreshCurrentHousehold();
      fetchBalances();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleLeaveHousehold = async () => {
    if (!window.confirm(`Are you sure you want to leave ${currentHousehold.name}?`)) return;
    try {
      await axiosClient.post(`/households/${currentHousehold.id}/leave`);
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to leave household');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Roommates & Household
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Flat members, invite code, and individual balance statements for {currentHousehold?.name}
          </p>
        </div>

        <button
          onClick={handleLeaveHousehold}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-colors w-fit"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Leave Household</span>
        </button>
      </div>

      {/* Invite Code Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-700 text-white shadow-xl shadow-brand-500/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-white/80 uppercase tracking-wider block mb-1">
            Invite Roommates to {currentHousehold?.name}
          </span>
          <p className="text-xs text-brand-100 max-w-md">
            Share this invite code with your flatmates so they can join this group and sync expenses.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-black/20 backdrop-blur-md p-2 rounded-2xl border border-white/15">
          <span className="text-lg font-mono font-black tracking-widest px-3 text-white">
            {currentHousehold?.inviteCode}
          </span>
          <button
            onClick={handleCopyCode}
            className="p-2.5 rounded-xl bg-white text-brand-700 hover:bg-brand-50 font-bold text-xs flex items-center gap-1.5 shadow transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>
        </div>
      </div>

      {/* Roommates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {members.map((m) => {
          const balanceItem = balances?.memberBalances?.find((b) => b.userId === m.userId);
          const net = parseFloat(balanceItem?.netBalance) || 0;
          const isPositive = net > 0;
          const isZero = Math.abs(net) < 0.001;
          const isMe = m.userId === user?.id;

          return (
            <div
              key={m.userId}
              className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={m.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}`}
                      alt={m.name}
                      className="w-14 h-14 rounded-2xl object-cover ring-2 ring-slate-100 dark:ring-slate-800 shadow-sm"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                          {m.name}
                        </h3>
                        {isMe && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300">
                            You
                          </span>
                        )}
                        {m.isAdmin && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {m.email}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Joined {formatDate(m.joinedAt)}
                      </p>
                    </div>
                  </div>

                  {isAdmin && !isMe && (
                    <button
                      onClick={() => handleRemoveMember(m.userId, m.name)}
                      title="Remove member"
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Financial Summary */}
                <div className="grid grid-cols-3 gap-2 mt-5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-center">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                      Total Paid
                    </span>
                    <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">
                      {formatCurrency(balanceItem?.totalPaid || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                      Total Share
                    </span>
                    <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">
                      {formatCurrency(balanceItem?.totalShare || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                      Net Balance
                    </span>
                    <span
                      className={`text-xs font-bold font-mono ${
                        isPositive
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isZero
                          ? 'text-slate-500'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isPositive ? `+${formatCurrency(net)}` : formatCurrency(net)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
