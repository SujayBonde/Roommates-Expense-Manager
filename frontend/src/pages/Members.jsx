import React, { useState, useEffect } from 'react';
import { useHousehold } from '../context/HouseholdContext';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import { formatCurrency, formatDate } from '../utils/formatters';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  Copy,
  Check,
  Shield,
  UserX,
  LogOut,
  Mail,
  Calendar,
  KeyRound,
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
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60 dark:border-slate-800/60">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Roommates & Household
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Active members, invite access code, and individual contribution status for {currentHousehold?.name}
          </p>
        </div>

        <button
          onClick={handleLeaveHousehold}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold transition-colors w-fit"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Leave Group</span>
        </button>
      </div>

      {/* Invite Code Card */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#111622] border border-slate-200/90 dark:border-slate-800 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
              Household Invite Code
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Share this code with new flatmates to add them to {currentHousehold?.name}.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-850 p-1.5 rounded-lg border border-slate-200/70 dark:border-slate-700/60">
          <span className="text-sm font-mono font-bold tracking-wider px-2 text-slate-900 dark:text-slate-100">
            {currentHousehold?.inviteCode}
          </span>
          <button
            onClick={handleCopyCode}
            className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold text-xs flex items-center gap-1 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Roommates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {members.map((m) => {
          const balanceItem = balances?.memberBalances?.find((b) => b.userId === m.userId);
          const net = parseFloat(balanceItem?.netBalance) || 0;
          const isPositive = net > 0;
          const isZero = Math.abs(net) < 0.001;
          const isMe = m.userId === user?.id;

          return (
            <div
              key={m.userId}
              className="p-5 bg-white dark:bg-[#111622] rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-subtle flex flex-col justify-between space-y-3.5"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={m.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=0f766e&color=fff`}
                      alt={m.name}
                      className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {m.name}
                        </h3>
                        {isMe && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                            You
                          </span>
                        )}
                        {m.isAdmin && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-0.5">
                            <Shield className="w-2.5 h-2.5" />
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {m.email}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Joined {formatDate(m.joinedAt)}
                      </p>
                    </div>
                  </div>

                  {isAdmin && !isMe && (
                    <button
                      onClick={() => handleRemoveMember(m.userId, m.name)}
                      title="Remove member"
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Financial Summary */}
                <div className="grid grid-cols-3 gap-2 mt-3.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 text-center">
                  <div>
                    <span className="text-[10px] font-medium text-slate-400 block uppercase">
                      Total Paid
                    </span>
                    <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200 tabular-nums">
                      {formatCurrency(balanceItem?.totalPaid || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-medium text-slate-400 block uppercase">
                      Total Share
                    </span>
                    <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200 tabular-nums">
                      {formatCurrency(balanceItem?.totalShare || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-medium text-slate-400 block uppercase">
                      Net Balance
                    </span>
                    <span
                      className={`text-xs font-bold font-mono tabular-nums ${
                        isPositive
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : isZero
                          ? 'text-slate-500'
                          : 'text-rose-700 dark:text-rose-400'
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
