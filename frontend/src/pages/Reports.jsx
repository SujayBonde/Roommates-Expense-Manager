import React, { useState, useEffect, useCallback } from 'react';
import { useHousehold } from '../context/HouseholdContext';
import axiosClient from '../api/axiosClient';
import { formatCurrency, getCategoryMeta } from '../utils/formatters';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  BarChart3,
  Calendar,
  TrendingUp,
  Receipt,
  Award,
  PieChart as PieIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6', '#f43f5e', '#14b8a6'];

export default function Reports() {
  const { currentHousehold } = useHousehold();

  const [period, setPeriod] = useState('THIS_MONTH'); // THIS_MONTH, LAST_MONTH, 3_MONTHS, 6_MONTHS, CUSTOM
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = useCallback(async () => {
    if (!currentHousehold) return;

    let startDate = '';
    let endDate = '';
    const now = new Date();

    if (period === 'THIS_MONTH') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      endDate = now.toISOString().split('T')[0];
    } else if (period === 'LAST_MONTH') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      endDate = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
    } else if (period === '3_MONTHS') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().split('T')[0];
      endDate = now.toISOString().split('T')[0];
    } else if (period === '6_MONTHS') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().split('T')[0];
      endDate = now.toISOString().split('T')[0];
    } else if (period === 'CUSTOM') {
      startDate = customStart;
      endDate = customEnd;
    }

    try {
      setLoading(true);
      let url = `/reports/monthly?householdId=${currentHousehold.id}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;

      const res = await axiosClient.get(url);
      setReport(res.data);
    } catch (err) {
      console.error('Failed to load report', err);
    } finally {
      setLoading(false);
    }
  }, [currentHousehold, period, customStart, customEnd]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const categoryData = report?.categoryBreakdown?.map((c) => ({
    name: c.category,
    value: parseFloat(c.amount),
    percentage: parseFloat(c.percentage),
  })) || [];

  const trendData = report?.monthlyTrend?.map((t) => ({
    month: t.month,
    amount: parseFloat(t.amount),
  })) || [];

  const contributionData = report?.memberContributions?.map((m) => ({
    name: m.name.split(' ')[0],
    paid: parseFloat(m.totalPaid),
    share: parseFloat(m.totalShare),
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header & Date Range Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Financial Reports & Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Period: {report?.period || 'Selected timeframe'}
          </p>
        </div>

        {/* Period Selector Buttons */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl w-fit">
          {[
            { id: 'THIS_MONTH', label: 'This Month' },
            { id: 'LAST_MONTH', label: 'Last Month' },
            { id: '3_MONTHS', label: 'Last 3M' },
            { id: '6_MONTHS', label: 'Last 6M' },
            { id: 'CUSTOM', label: 'Custom' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPeriod(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                period === tab.id
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Range Picker */}
      {period === 'CUSTOM' && (
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-wrap items-center gap-3 animate-slide-up text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">From:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">To:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
            />
          </div>
          <button
            onClick={fetchReport}
            className="px-4 py-1.5 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 transition-colors ml-auto"
          >
            Apply Range
          </button>
        </div>
      )}

      {loading && !report ? (
        <LoadingSpinner text="Crunching numbers & generating analytics..." />
      ) : (
        <>
          {/* 5 KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Total Expenses
              </span>
              <span className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
                {formatCurrency(report?.totalExpenses)}
              </span>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Daily Average
              </span>
              <span className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
                {formatCurrency(report?.dailyAverage)}
              </span>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Highest Expense
              </span>
              <span className="text-xl font-black font-mono text-slate-900 dark:text-slate-100 block truncate">
                {formatCurrency(report?.highestExpenseAmount)}
              </span>
              <span className="text-[11px] text-slate-400 truncate block mt-0.5">
                "{report?.highestExpenseTitle}"
              </span>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Top Category
              </span>
              <span className="text-xl font-extrabold text-brand-600 dark:text-brand-400 block truncate">
                {report?.mostExpensiveCategory || 'N/A'}
              </span>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Top Spender
              </span>
              <span className="text-lg font-black text-slate-900 dark:text-slate-100 block truncate">
                {report?.topSpenderName || 'N/A'}
              </span>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">
                {formatCurrency(report?.topSpenderAmount)}
              </span>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Doughnut Chart */}
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Category Breakdown
                  </h3>
                  <p className="text-xs text-slate-400">Expense distribution by category</p>
                </div>
              </div>

              <div className="h-64 w-full">
                {categoryData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No data for this period
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val) => formatCurrency(val)}
                        contentStyle={{
                          backgroundColor: '#1e1b4b',
                          borderRadius: '12px',
                          color: '#fff',
                          border: 'none',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Legend Table */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                {categoryData.map((c, i) => (
                  <div key={c.name} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">{c.name}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100 shrink-0">
                      {c.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Member Contributions Bar Chart */}
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Member Financial Contribution
                </h3>
                <p className="text-xs text-slate-400">Who paid vs. Who consumed</p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={contributionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip
                      formatter={(val) => formatCurrency(val)}
                      contentStyle={{
                        backgroundColor: '#1e1b4b',
                        borderRadius: '12px',
                        color: '#fff',
                        border: 'none',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="paid" name="Total Paid" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="share" name="Total Share" fill="#ec4899" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                {contributionData.map((m) => (
                  <div key={m.name} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 flex justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{m.name}</span>
                    <span className="font-mono text-brand-600 dark:text-brand-400 font-bold">
                      Paid: {formatCurrency(m.paid)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
