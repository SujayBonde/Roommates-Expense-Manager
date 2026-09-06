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
  Receipt,
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Settlement Payments
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Audit history of cleared debts and cash transfers between roommates in {currentHousehold?.name}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow-md shadow-brand-500/20 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>Record Payment</span>
        </button>
      </div>

      {loading && settlements.length === 0 ? (
        <LoadingSpinner text="Loading settlement records..." />
      ) : settlements.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800">
          <CheckCircle2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No settlements recorded</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            When a roommate transfers money via UPI, net banking, or cash to clear their debt, record it here to update balances automatically.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {settlements.map((s) => {
              const isPayerMe = s.payerId === user?.id;
              const isReceiverMe = s.receiverId === user?.id;

              return (
                <div
                  key={s.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
                      <CreditCard className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                        <span className={isPayerMe ? 'text-rose-600 font-extrabold' : ''}>
                          {s.payerName} {isPayerMe ? '(You)' : ''}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        <span className={isReceiverMe ? 'text-emerald-600 font-extrabold' : ''}>
                          {s.receiverName} {isReceiverMe ? '(You)' : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(s.paymentDate)}
                        </span>
                        {s.note && <span>• "{s.note}"</span>}
                      </div>
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(s.amount)}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                      Settled
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
