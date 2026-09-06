import React, { useState, useEffect } from 'react';
import { useHousehold } from '../context/HouseholdContext';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import { formatCurrency } from '../utils/formatters';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Scale, ArrowUpRight, ArrowDownRight, CheckCircle2, User } from 'lucide-react';
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
    return <LoadingSpinner text="Calculating roommate balances..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Roommate Balances
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Calculated as: Total Amount Paid − Total Amount Owed for {currentHousehold?.name}
          </p>
        </div>

        <Link
          to="/debts"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-all"
        >
          <span>View Who Owes Whom</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Grid of Member Balances */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {balances?.memberBalances?.map((m) => {
          const net = parseFloat(m.netBalance) || 0;
          const isPositive = net > 0;
          const isZero = Math.abs(net) < 0.001;
          const isMe = m.userId === user?.id;

          return (
            <div
              key={m.userId}
              className={`p-6 rounded-3xl border shadow-sm transition-all ${
                isMe
                  ? 'bg-white dark:bg-slate-900 border-brand-500/50 ring-2 ring-brand-500/10'
                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={m.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}`}
                    alt={m.name}
                    className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-100 dark:ring-slate-800"
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
                    </div>
                    <p className="text-xs text-slate-400">{m.email}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-xl font-black font-mono block ${
                      isPositive
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : isZero
                        ? 'text-slate-500'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {isPositive ? `+${formatCurrency(net)}` : formatCurrency(net)}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Net Balance
                  </span>
                </div>
              </div>

              {/* Breakdown metrics */}
              <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Total Paid (Expenses + Settled)</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm font-mono">
                    {formatCurrency(m.totalPaid)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Total Share (Owed Portion)</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm font-mono">
                    {formatCurrency(m.totalShare)}
                  </span>
                </div>
              </div>

              {/* Status footer */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  {isPositive ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <ArrowUpRight className="w-4 h-4" />
                      {m.name.split(' ')[0]} should receive {formatCurrency(m.shouldReceive)}
                    </span>
                  ) : isZero ? (
                    <span className="text-slate-500 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      {m.name.split(' ')[0]} is completely settled
                    </span>
                  ) : (
                    <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <ArrowDownRight className="w-4 h-4" />
                      {m.name.split(' ')[0]} needs to pay {formatCurrency(m.shouldPay)}
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
