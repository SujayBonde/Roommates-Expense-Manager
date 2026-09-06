import React, { useState, useEffect } from 'react';
import { useHousehold } from '../context/HouseholdContext';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import { formatCurrency } from '../utils/formatters';
import { LoadingSpinner } from '../components/LoadingSpinner';
import RecordSettlementModal from '../components/RecordSettlementModal';
import {
  ArrowLeftRight,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Zap,
} from 'lucide-react';

export default function WhoOwesWhom() {
  const { currentHousehold } = useHousehold();
  const { user } = useAuth();

  const [debts, setDebts] = useState(null);
  const [loading, setLoading] = useState(true);

  // Settlement modal state
  const [isSettleOpen, setIsSettleOpen] = useState(false);
  const [settleReceiverId, setSettleReceiverId] = useState('');
  const [settleAmount, setSettleAmount] = useState('');

  const fetchDebts = async () => {
    if (!currentHousehold) return;
    try {
      setLoading(true);
      const res = await axiosClient.get(`/households/${currentHousehold.id}/debts`);
      setDebts(res.data);
    } catch (err) {
      console.error('Failed to load debts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebts();
  }, [currentHousehold]);

  if (loading && !debts) {
    return <LoadingSpinner text="Computing debt matrix & optimal settlements..." />;
  }

  const handleSettleClick = (toUserId, amount) => {
    setSettleReceiverId(toUserId);
    setSettleAmount(amount);
    setIsSettleOpen(true);
  };

  const directDebts = debts?.directDebts || [];
  const minSettlements = debts?.minimumSettlements || [];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Who Owes Whom
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Individual debt breakdown and algorithmically minimized settlement payments for {currentHousehold?.name}
        </p>
      </div>

      {/* Minimum Settlement Algorithm Banner & Cards */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-brand-900 via-indigo-950 to-slate-950 text-white shadow-xl shadow-brand-950/30 border border-brand-800/40 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/20 text-brand-300 border border-brand-400/20">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Minimum Settlement Algorithm (Optimal Cash Flow)
              </h2>
              <p className="text-xs text-brand-200/70">
                Solves circular debts so that all balances are cleared with the absolute minimum number of payments.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-500/30 text-brand-300 border border-brand-400/30 w-fit">
            {minSettlements.length} payment{minSettlements.length === 1 ? '' : 's'} required
          </span>
        </div>

        {minSettlements.length === 0 ? (
          <div className="py-8 text-center bg-white/5 rounded-2xl border border-white/10">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-white">All debts are completely settled!</p>
            <p className="text-xs text-brand-200/60 mt-0.5">No outstanding payments required.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
            {minSettlements.map((tx, idx) => {
              const isPayerMe = tx.fromUserId === user?.id;
              const isReceiverMe = tx.toUserId === user?.id;

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border backdrop-blur-md transition-all ${
                    isPayerMe
                      ? 'bg-rose-500/10 border-rose-400/30 text-white'
                      : isReceiverMe
                      ? 'bg-emerald-500/10 border-emerald-400/30 text-white'
                      : 'bg-white/5 border-white/10 text-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="text-xs font-bold text-brand-200">
                      Step #{idx + 1}
                    </span>
                    <span className="text-base font-black font-mono text-white">
                      {formatCurrency(tx.amount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-semibold py-2 px-3 bg-black/20 rounded-xl mb-3">
                    <span className={isPayerMe ? 'text-rose-300 font-bold' : 'text-slate-200'}>
                      {tx.fromUserName} {isPayerMe ? '(You)' : ''}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-brand-300 shrink-0" />
                    <span className={isReceiverMe ? 'text-emerald-300 font-bold' : 'text-slate-200'}>
                      {tx.toUserName} {isReceiverMe ? '(You)' : ''}
                    </span>
                  </div>

                  {isPayerMe && (
                    <button
                      onClick={() => handleSettleClick(tx.toUserId, tx.amount)}
                      className="w-full py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs shadow transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Settle Now</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Direct Bilateral Debts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Direct Pairwise Debts
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pairwise ledger calculated directly from shared expenses minus payments
            </p>
          </div>
        </div>

        {directDebts.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Zero Direct Debts</p>
            <p className="text-xs text-slate-400 mt-0.5">Everyone is square!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {directDebts.map((debt, index) => {
              const isPayerMe = debt.fromUserId === user?.id;
              const isReceiverMe = debt.toUserId === user?.id;

              return (
                <div
                  key={index}
                  className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Bilateral Debt
                      </span>
                      <span className="text-lg font-black font-mono text-slate-900 dark:text-slate-100">
                        {formatCurrency(debt.amount)}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 mb-4 flex items-center justify-between text-xs font-semibold">
                      <span className={isPayerMe ? 'text-rose-600 font-bold' : 'text-slate-800 dark:text-slate-200'}>
                        {debt.fromUserName} {isPayerMe ? '(You)' : ''}
                      </span>
                      <span className="text-slate-400 text-[11px]">owes</span>
                      <span className={isReceiverMe ? 'text-emerald-600 font-bold' : 'text-slate-800 dark:text-slate-200'}>
                        {debt.toUserName} {isReceiverMe ? '(You)' : ''}
                      </span>
                    </div>
                  </div>

                  {isPayerMe && (
                    <button
                      onClick={() => handleSettleClick(debt.toUserId, debt.amount)}
                      className="w-full py-2 px-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm shadow-brand-500/20 transition-all flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Record Payment</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Settlement Modal */}
      <RecordSettlementModal
        isOpen={isSettleOpen}
        onClose={() => setIsSettleOpen(false)}
        onSuccess={fetchDebts}
        defaultReceiverId={settleReceiverId}
        defaultAmount={settleAmount}
      />
    </div>
  );
}
