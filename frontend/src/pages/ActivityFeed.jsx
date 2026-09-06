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
  Building,
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
        return <Receipt className="w-4 h-4 text-brand-600 dark:text-brand-400" />;
      case 'LOAN_CREATED':
      case 'LOAN_PAYMENT':
      case 'LOAN_SETTLED':
        return <HandCoins className="w-4 h-4 text-amber-500" />;
      case 'SETTLEMENT_CREATED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'MEMBER_JOINED':
      case 'MEMBER_LEFT':
      case 'MEMBER_REMOVED':
        return <Users className="w-4 h-4 text-cyan-500" />;
      default:
        return <Building className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Activity Timeline
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Chronological audit trail of all transactions and changes in {currentHousehold?.name}
        </p>
      </div>

      {loading && activities.length === 0 ? (
        <LoadingSpinner text="Loading activity trail..." />
      ) : activities.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800">
          <Activity className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No activity logged yet</h3>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6">
          <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-3 space-y-6">
            {activities.map((act) => (
              <div key={act.id} className="relative pl-6">
                {/* Timeline node icon */}
                <div className="absolute -left-3.5 top-0.5 w-7 h-7 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm">
                  {getActivityIcon(act.activityType)}
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {act.description}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
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
