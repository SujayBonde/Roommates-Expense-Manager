import React, { useState, useEffect } from 'react';
import { useHousehold } from '../context/HouseholdContext';
import axiosClient from '../api/axiosClient';
import { formatDateTime } from '../utils/formatters';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  Activity,
  Receipt,
  HandCoins,
  CheckCircle2,
  Users,
  Building2,
  Clock,
} from 'lucide-react';

export default function ActivityFeed() {
  const { currentHousehold } = useHousehold();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    if (!currentHousehold) return;
    try {
      setLoading(true);
      const res = await axiosClient.get(`/households/${currentHousehold.id}/activities/recent`);
      setActivities(res.data || []);
    } catch (err) {
      console.error('Failed to load activities', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [currentHousehold]);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'EXPENSE_CREATED':
      case 'EXPENSE_UPDATED':
      case 'EXPENSE_DELETED':
        return <Receipt className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />;
      case 'LOAN_CREATED':
      case 'LOAN_PAYMENT':
      case 'LOAN_SETTLED':
        return <HandCoins className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
      case 'SETTLEMENT_CREATED':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
      case 'MEMBER_JOINED':
      case 'MEMBER_LEFT':
      case 'MEMBER_REMOVED':
        return <Users className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />;
      default:
        return <Building2 className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-5">
      <div className="pb-1 border-b border-slate-200/60 dark:border-slate-800/60">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Activity Audit Trail
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Chronological timeline of all changes, expense creations, settlements, and membership updates in {currentHousehold?.name}
        </p>
      </div>

      {loading && activities.length === 0 ? (
        <LoadingSpinner text="Loading activity trail..." />
      ) : activities.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#111622] rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-subtle">
          <Activity className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">No activity logged yet</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Actions taken across this household will appear in this timeline.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#111622] rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-subtle p-5">
          <div className="relative border-l border-slate-200 dark:border-slate-800 ml-3 space-y-5">
            {activities.map((act) => (
              <div key={act.id} className="relative pl-5">
                {/* Timeline node icon */}
                <div className="absolute -left-3 top-0.5 w-6 h-6 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                  {getActivityIcon(act.activityType)}
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                    {act.description}
                  </p>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>{formatDateTime(act.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
