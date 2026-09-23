import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';
import axiosClient from '../api/axiosClient';
import StatCard from '../components/StatCard';
import { CategoryBadge } from '../components/Badge';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Receipt,
  Scale,
  Plus,
  ArrowLeftRight,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import AddExpenseModal from './AddExpenseModal';
import ExpenseDetailModal from './ExpenseDetailModal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Link } from 'react-router-dom';

const CHART_COLORS = ['#0d9488', '#0284c7', '#d97706', '#7c3aed', '#e11d48', '#059669', '#ea580c', '#64748b'];

export default function Dashboard() {
  const { user } = useAuth();
  const { currentHousehold } = useHousehold();

  const [balances, setBalances] = useState(null);
  const [debts, setDebts] = useState(null);
  const [report, setReport] = useState(null);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);

  const fetchDashboardData = async () => {
    if (!currentHousehold) return;
    try {
      setLoading(true);
      const [balRes, debtRes, reportRes, expRes] = await Promise.allSettled([
        axiosClient.get(`/households/${currentHousehold.id}/balances`),
        axiosClient.get(`/households/${currentHousehold.id}/debts`),
        axiosClient.get(`/reports/monthly?householdId=${currentHousehold.id}`),
        axiosClient.get(`/expenses?householdId=${currentHousehold.id}&size=5`),
      ]);

      if (balRes.status === 'fulfilled') setBalances(balRes.value.data);
      if (debtRes.status === 'fulfilled') setDebts(debtRes.value.data);
      if (reportRes.status === 'fulfilled') setReport(reportRes.value.data);
      if (expRes.status === 'fulfilled') setRecentExpenses(expRes.value.data?.content || []);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [currentHousehold]);

  if (loading && !balances) {
    return <LoadingSpinner text="Loading financial overview..." />;
  }

  const netBalanceNum = parseFloat(balances?.myNetBalance) || 0;
  const isNetPositive = netBalanceNum > 0;
  const isNetZero = Math.abs(netBalanceNum) < 0.001;

  // Chart formatted data
  const categoryData = report?.categoryBreakdown?.map((c) => ({
    name: c.category,
    value: parseFloat(c.amount),
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
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60 dark:border-slate-800/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Financial Overview
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
              {currentHousehold?.name}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time ledger summary for shared expenses and settlements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingExpense(null);
              setIsAddExpenseOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Account Position & Primary Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Personal Net Position Card */}
        <div className="lg:col-span-1 p-5 rounded-xl border bg-white dark:bg-[#111622] border-slate-200/90 dark:border-slate-800 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Your Net Balance
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                  isNetPositive
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                    : isNetZero
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
                }`}
              >
                {isNetPositive ? 'You are owed' : isNetZero ? 'Settled up' : 'You owe'}
              </span>
            </div>

            <div className="mt-3">
              <div
                className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight tabular-nums ${
                  isNetPositive
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : isNetZero
                    ? 'text-slate-700 dark:text-slate-300'
                    : 'text-rose-700 dark:text-rose-400'
                }`}
              >
                {isNetPositive ? `+${formatCurrency(netBalanceNum)}` : formatCurrency(netBalanceNum)}
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {isNetPositive
                  ? `Roommates owe you ${formatCurrency(netBalanceNum)} in total.`
                  : isNetZero
                  ? 'All shared debts are completely balanced.'
                  : `You have an outstanding balance of ${formatCurrency(Math.abs(netBalanceNum))}.`}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold">
            <Link
              to="/debts"
              className="text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1 text-[11px]"
            >
              <span>View Debt Matrix</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* 3 Key Breakdown Metrics */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Total Household Expenses"
            amount={formatCurrency(balances?.totalExpenses)}
            subtitle="Cumulative flat spend"
            icon={Receipt}
            variant="default"
          />
          <StatCard
            title="You Have Paid"
            amount={formatCurrency(balances?.myPaid)}
            subtitle="Total contributed by you"
            icon={Wallet}
            variant="default"
          />
          <StatCard
            title="Your Consumed Share"
            amount={formatCurrency(balances?.myShare)}
            subtitle="Your portion of items"
            icon={Scale}
            variant="default"
          />
          <StatCard
            title="You Need To Pay"
            amount={formatCurrency(balances?.myNeedToPay)}
            subtitle="Unsettled obligations"
            icon={ArrowDownRight}
            variant={parseFloat(balances?.myNeedToPay) > 0 ? 'negative' : 'default'}
          />
          <StatCard
            title="You Will Receive"
            amount={formatCurrency(balances?.myWillReceive)}
            subtitle="Incoming payments"
            icon={ArrowUpRight}
            variant={parseFloat(balances?.myWillReceive) > 0 ? 'positive' : 'default'}
          />
          <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111622] shadow-subtle flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Settlement Status
              </span>
              <CheckCircle2 className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-2">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {debts?.minimumSettlements?.length === 0
                  ? 'All settled up'
                  : `${debts?.minimumSettlements?.length || 0} transfer${debts?.minimumSettlements?.length === 1 ? '' : 's'} pending`}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Optimal cash flow enabled
              </p>
            </div>
            <div className="mt-2">
              <Link
                to="/settlements"
                className="text-[11px] font-semibold text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1"
              >
                <span>Settlement history</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly Expense Trend */}
        <div className="lg:col-span-2 p-5 bg-white dark:bg-[#111622] rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Monthly Spending Trend
              </h3>
              <p className="text-[11px] text-slate-400">Total household expenditure over time</p>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              6 Months
            </span>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                <Tooltip
                  formatter={(val) => [formatCurrency(val), 'Expenses']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '11px',
                    padding: '8px 12px',
                  }}
                />
                <Area type="monotone" dataKey="amount" stroke="#0d9488" strokeWidth={2} fillOpacity={1} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Donut */}
        <div className="p-5 bg-white dark:bg-[#111622] rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-subtle flex flex-col justify-between">
          <div className="mb-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Category Distribution
            </h3>
            <p className="text-[11px] text-slate-400">Spending breakdown by tag</p>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            {categoryData.length === 0 ? (
              <p className="text-xs text-slate-400">No expense records found</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={72}
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

          <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            {categoryData.slice(0, 4).map((c, i) => (
              <span key={c.name} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                <span>{c.name}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Member Contributions Bar Chart */}
      <div className="p-5 bg-white dark:bg-[#111622] rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-subtle">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Paid vs. Consumed Share
            </h3>
            <p className="text-[11px] text-slate-400">Comparison of who paid upfront versus their consumption share</p>
          </div>
        </div>
        <div className="h-52 w-full">
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
      </div>

      {/* Bottom Grid: Recent Expenses & Who Owes Whom */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Expenses List */}
        <div className="p-5 bg-white dark:bg-[#111622] rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-subtle">
          <div className="flex items-center justify-between mb-3.5">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Recent Expenses
              </h3>
              <p className="text-[11px] text-slate-400">Latest recorded purchases</p>
            </div>
            <Link
              to="/expenses"
              className="text-[11px] font-semibold text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1"
            >
              <span>All expenses</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {recentExpenses.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">No expenses recorded yet.</p>
            ) : (
              recentExpenses.map((exp) => (
                <div
                  key={exp.id}
                  onClick={() => setSelectedExpense(exp)}
                  className="py-2.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <CategoryBadge category={exp.category} />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {exp.title}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        Paid by {exp.paidByName} • {formatDate(exp.expenseDate)}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold font-mono text-slate-900 dark:text-slate-100 block tabular-nums">
                      {formatCurrency(exp.amount)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Your share: {formatCurrency(exp.myShare)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Direct Debts Matrix Summary */}
        <div className="p-5 bg-white dark:bg-[#111622] rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-subtle">
          <div className="flex items-center justify-between mb-3.5">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Direct Debts
              </h3>
              <p className="text-[11px] text-slate-400">Pending balances between roommates</p>
            </div>
            <Link
              to="/debts"
              className="text-[11px] font-semibold text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1"
            >
              <span>Settlement plan</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {debts?.directDebts?.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                <span>All balances are settled</span>
              </div>
            ) : (
              debts?.directDebts?.map((debt, index) => (
                <div
                  key={index}
                  className="p-2.5 rounded-lg bg-slate-50/70 dark:bg-slate-800/30 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                    <span className="font-semibold text-rose-700 dark:text-rose-400">{debt.fromUserName}</span>
                    <span className="text-slate-400 text-[11px]">owes</span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">{debt.toUserName}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
                    {formatCurrency(debt.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add / Edit Expense Modal */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => {
          setIsAddExpenseOpen(false);
          setEditingExpense(null);
        }}
        onSuccess={fetchDashboardData}
        initialExpense={editingExpense}
      />

      {/* Expense Detail Breakdown Modal */}
      <ExpenseDetailModal
        isOpen={!!selectedExpense}
        onClose={() => setSelectedExpense(null)}
        expense={selectedExpense}
        onEdit={(exp) => {
          setEditingExpense(exp);
          setIsAddExpenseOpen(true);
        }}
        onDeleteSuccess={fetchDashboardData}
      />
    </div>
  );
}
