import React, { useState, useEffect } from 'react';
import { useHousehold } from '../context/HouseholdContext';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import { formatCurrency } from '../utils/formatters';
import { LoadingSpinner } from '../components/LoadingSpinner';
import RecordSettlementModal from '../components/RecordSettlementModal';
import {
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="pb-1 border-b border-slate-200/60 dark:border-slate-800/60">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Who Owes Whom
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Pairwise ledger balances and algorithmically simplified settlement transfers for {currentHousehold?.name}
        </p>
      </div>

      {/* Minimum Settlement Algorithm Banner & Cards */}
      <div className="p-5 rounded-xl bg-white dark:bg-[#111622] border border-slate-200/90 dark:border-slate-800 shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Optimal Settlement Path (Minimum Cash Flow)
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Simplifies circular and multi-party debts into the absolute minimum number of direct transactions.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 w-fit">
            {minSettlements.length} transfer{minSettlements.length === 1 ? '' : 's'} required
          </span>
        </div>

        {minSettlements.length === 0 ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">All debts are cleared</p>
            <p className="text-[11px] text-slate-400 mt-0.5">No outstanding transfers required at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {minSettlements.map((tx, idx) => {
              const isPayerMe = tx.fromUserId === user?.id;
              const isReceiverMe = tx.toUserId === user?.id;

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border transition-colors flex flex-col justify-between ${
                    isPayerMe
                      ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
                      : isReceiverMe
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
                      : 'bg-slate-50/60 dark:bg-slate-850 border-slate-200/80 dark:border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Transfer #{idx + 1}
                      </span>
                      <span className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                        {formatCurrency(tx.amount)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-medium py-2 px-2.5 bg-white dark:bg-slate-900/80 rounded border border-slate-200/60 dark:border-slate-800 mb-3">
                      <span className={isPayerMe ? 'text-rose-700 dark:text-rose-400 font-bold' : 'text-slate-700 dark:text-slate-300'}>
                        {tx.fromUserName} {isPayerMe ? '(You)' : ''}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className={isReceiverMe ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-slate-700 dark:text-slate-300'}>
                        {tx.toUserName} {isReceiverMe ? '(You)' : ''}
                      </span>
                    </div>
                  </div>

                  {isPayerMe && (
                    <button
                      onClick={() => handleSettleClick(tx.toUserId, tx.amount)}
                      className="w-full py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Record Settlement</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Direct Bilateral Debts Section */}
      <div className="space-y-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Direct Pairwise Debts
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Un-simplified bilateral ledger calculated directly from individual shared transactions
          </p>
        </div>

        {directDebts.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-[#111622] rounded-xl border border-slate-200/90 dark:border-slate-800">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Zero Direct Debts</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Everyone is completely squared up.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {directDebts.map((debt, index) => {
              const isPayerMe = debt.fromUserId === user?.id;
              const isReceiverMe = debt.toUserId === user?.id;

              return (
                <div
                  key={index}
                  className="p-4 bg-white dark:bg-[#111622] rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-subtle flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Bilateral Balance
                      </span>
                      <span className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                        {formatCurrency(debt.amount)}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 mb-3 flex items-center justify-between text-xs font-medium">
                      <span className={isPayerMe ? 'text-rose-700 dark:text-rose-400 font-bold' : 'text-slate-700 dark:text-slate-300'}>
                        {debt.fromUserName} {isPayerMe ? '(You)' : ''}
                      </span>
                      <span className="text-slate-400 text-[11px]">owes</span>
                      <span className={isReceiverMe ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-slate-700 dark:text-slate-300'}>
                        {debt.toUserName} {isReceiverMe ? '(You)' : ''}
                      </span>
                    </div>
                  </div>

                  {isPayerMe && (
                    <button
                      onClick={() => handleSettleClick(debt.toUserId, debt.amount)}
                      className="w-full py-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
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
