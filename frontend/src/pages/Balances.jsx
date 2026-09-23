import React, { useState, useEffect } from 'react';
import { useHousehold } from '../context/HouseholdContext';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import { formatCurrency } from '../utils/formatters';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ArrowUpRight, ArrowDownRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Balances() {
  const { currentHousehold } = useHousehold();
  const { user } = useAuth();

  const [balances, setBalances] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchBalances = async () => {
    if (!currentHousehold) return;
    try {
      setLoading(true);
      const res = await axiosClient.get(`/households/${currentHousehold.id}/balances`);
      setBalances(res.data);
    } catch (err) {
      console.error('Failed to load balances', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, [currentHousehold]);

  if (loading && !balances) {
    return <LoadingSpinner text="Calculating member balances..." />;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60 dark:border-slate-800/60">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Roommate Balances
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Calculated as: Total Amount Paid upfront minus Total Consumed Share
          </p>
        </div>

        <Link
          to="/debts"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold shadow-subtle transition-colors"
        >
          <span>View Who Owes Whom</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Grid of Member Balances */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {balances?.memberBalances?.map((m) => {
          const net = parseFloat(m.netBalance) || 0;
          const isPositive = net > 0;
          const isZero = Math.abs(net) < 0.001;
          const isMe = m.userId === user?.id;

          return (
            <div
              key={m.userId}
              className={`p-5 rounded-xl border shadow-subtle transition-colors ${
                isMe
                  ? 'bg-white dark:bg-[#111622] border-teal-500/40 dark:border-teal-500/30'
                  : 'bg-white dark:bg-[#111622] border-slate-200/90 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3.5">
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
                    </div>
                    <p className="text-[11px] text-slate-400">{m.email}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-lg font-bold font-mono tabular-nums block ${
                      isPositive
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : isZero
                        ? 'text-slate-500 dark:text-slate-400'
                        : 'text-rose-700 dark:text-rose-400'
                    }`}
                  >
                    {isPositive ? `+${formatCurrency(net)}` : formatCurrency(net)}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Net Balance
                  </span>
                </div>
              </div>

              {/* Breakdown metrics */}
              <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100 dark:border-slate-800/80 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] font-medium">Total Paid (Upfront & Settled)</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs font-mono tabular-nums mt-0.5 block">
                    {formatCurrency(m.totalPaid)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-medium">Total Consumed (Owed Portion)</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs font-mono tabular-nums mt-0.5 block">
                    {formatCurrency(m.totalShare)}
                  </span>
                </div>
              </div>

              {/* Status footer */}
              <div className="mt-3 flex items-center justify-between">
                <div className="text-xs font-medium">
                  {isPositive ? (
                    <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      Gets back {formatCurrency(m.shouldReceive)}
                    </span>
                  ) : isZero ? (
                    <span className="text-slate-500 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      Completely settled
                    </span>
                  ) : (
                    <span className="text-rose-700 dark:text-rose-400 flex items-center gap-1">
                      <ArrowDownRight className="w-3.5 h-3.5" />
                      Needs to pay {formatCurrency(m.shouldPay)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
