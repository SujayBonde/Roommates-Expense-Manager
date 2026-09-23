import React, { useState, useEffect, useCallback } from 'react';
import { useHousehold } from '../context/HouseholdContext';
import axiosClient from '../api/axiosClient';
import { formatCurrency } from '../utils/formatters';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  ResponsiveContainer,
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

const CHART_COLORS = ['#0d9488', '#0284c7', '#d97706', '#7c3aed', '#e11d48', '#059669', '#ea580c', '#64748b'];

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

  const contributionData = report?.memberContributions?.map((m) => ({
    name: m.name.split(' ')[0],
    paid: parseFloat(m.totalPaid),
    share: parseFloat(m.totalShare),
  })) || [];

  return (
    <div className="space-y-5">
      {/* Header & Date Range Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-1 border-b border-slate-200/60 dark:border-slate-800/60">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Financial Reports & Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Statement for {report?.period || 'Selected timeframe'}
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex flex-wrap gap-1 p-1 bg-slate-100 dark:bg-slate-800/70 rounded-lg w-fit">
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
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                period === tab.id
                  ? 'bg-white dark:bg-[#111622] text-slate-900 dark:text-white shadow-sm'
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
        <div className="p-3.5 bg-white dark:bg-[#111622] rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-subtle flex flex-wrap items-center gap-3 animate-slide-up text-xs font-medium">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">From:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">To:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none"
            />
          </div>
          <button
            onClick={fetchReport}
            className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold transition-colors ml-auto text-xs"
          >
            Apply Range
          </button>
        </div>
      )}

      {loading && !report ? (
        <LoadingSpinner text="Crunching analytics..." />
      ) : (
        <>
          {/* 5 KPI Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <div className="p-4 bg-white dark:bg-[#111622] rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-subtle">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Total Expenditure
              </span>
              <span className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                {formatCurrency(report?.totalExpenses)}
              </span>
            </div>

            <div className="p-4 bg-white dark:bg-[#111622] rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-subtle">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Daily Average
              </span>
              <span className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                {formatCurrency(report?.dailyAverage)}
              </span>
            </div>

            <div className="p-4 bg-white dark:bg-[#111622] rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-subtle">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Highest Single Spend
              </span>
              <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100 block truncate tabular-nums">
                {formatCurrency(report?.highestExpenseAmount)}
              </span>
              <span className="text-[11px] text-slate-400 truncate block mt-0.5">
                "{report?.highestExpenseTitle || 'None'}"
              </span>
            </div>

            <div className="p-4 bg-white dark:bg-[#111622] rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-subtle">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Top Category
              </span>
              <span className="text-base font-bold text-teal-700 dark:text-teal-400 block truncate">
                {report?.mostExpensiveCategory || 'None'}
              </span>
            </div>

            <div className="p-4 bg-white dark:bg-[#111622] rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-subtle">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Top Spender
              </span>
              <span className="text-base font-bold text-slate-900 dark:text-slate-100 block truncate">
                {report?.topSpenderName || 'None'}
              </span>
              <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-bold block mt-0.5 tabular-nums">
                {formatCurrency(report?.topSpenderAmount)}
              </span>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Category Doughnut Chart */}
            <div className="p-5 bg-white dark:bg-[#111622] rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-subtle space-y-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Category Breakdown
                </h3>
                <p className="text-[11px] text-slate-400">Proportional spend across tags</p>
              </div>

              <div className="h-56 w-full">
                {categoryData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No expense data for this timeframe
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val) => formatCurrency(val)}
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderRadius: '8px',
                          color: '#fff',
                          border: 'none',
                          fontSize: '11px',
                          padding: '8px 12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Legend Table */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                {categoryData.map((c, i) => (
                  <div key={c.name} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-850">
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="font-medium text-slate-700 dark:text-slate-300 truncate">{c.name}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100 shrink-0 tabular-nums">
                      {c.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Member Contributions Bar Chart */}
            <div className="p-5 bg-white dark:bg-[#111622] rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-subtle space-y-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Member Upfront Paid vs. Share
                </h3>
                <p className="text-[11px] text-slate-400">Total upfront payment vs consumption share</p>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={contributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip
                      formatter={(val) => formatCurrency(val)}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '8px',
                        color: '#fff',
                        border: 'none',
                        fontSize: '11px',
                        padding: '8px 12px',
                      }}
                    />
                    <Bar dataKey="paid" name="Total Paid" fill="#0d9488" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="share" name="Total Share" fill="#64748b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                {contributionData.map((m) => (
                  <div key={m.name} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-850 flex justify-between">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{m.name}</span>
                    <span className="font-mono text-teal-700 dark:text-teal-400 font-bold tabular-nums">
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
