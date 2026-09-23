import React, { useState, useEffect } from 'react';
import { useHousehold } from '../context/HouseholdContext';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import { formatCurrency, formatDate } from '../utils/formatters';
import { LoadingSpinner } from '../components/LoadingSpinner';
import RecordSettlementModal from '../components/RecordSettlementModal';
import {
  CheckCircle2,
  Plus,
  ArrowRight,
  Calendar,
  CreditCard,
} from 'lucide-react';

export default function Settlements() {
  const { currentHousehold } = useHousehold();
  const { user } = useAuth();

  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchSettlements = async () => {
    if (!currentHousehold) return;
    try {
      setLoading(true);
      const res = await axiosClient.get(`/settlements?householdId=${currentHousehold.id}`);
      setSettlements(res.data || []);
    } catch (err) {
      console.error('Failed to load settlements', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlements();
  }, [currentHousehold]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60 dark:border-slate-800/60">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Settlement Payments
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Audit history of debt repayments and balance-clearing transfers in {currentHousehold?.name}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Record Settlement</span>
        </button>
      </div>

      {loading && settlements.length === 0 ? (
        <LoadingSpinner text="Loading settlement audit..." />
      ) : settlements.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#111622] rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-subtle">
          <CheckCircle2 className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">No settlements recorded</h3>
          <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm mx-auto">
            When roommates transfer funds via UPI, cash, or bank transfer to clear balances, record them here to automatically recalculate net debts.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#111622] rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-subtle overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {settlements.map((s) => {
              const isPayerMe = s.payerId === user?.id;
              const isReceiverMe = s.receiverId === user?.id;

              return (
                <div
                  key={s.id}
                  className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-slate-700/60">
                      <CreditCard className="w-4 h-4" />
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100">
                        <span className={isPayerMe ? 'text-rose-700 dark:text-rose-400' : ''}>
                          {s.payerName} {isPayerMe ? '(You)' : ''}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className={isReceiverMe ? 'text-emerald-700 dark:text-emerald-400' : ''}>
                          {s.receiverName} {isReceiverMe ? '(You)' : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(s.paymentDate)}
                        </span>
                        {s.note && <span>• "{s.note}"</span>}
                      </div>
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <span className="text-sm font-bold font-mono text-emerald-700 dark:text-emerald-400 tabular-nums">
                      {formatCurrency(s.amount)}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
                      Cleared
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Record Settlement Modal */}
      <RecordSettlementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchSettlements}
      />
    </div>
  );
}
