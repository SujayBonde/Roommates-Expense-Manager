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
  HandCoins,
  TrendingUp,
  PieChart as PieIcon,
  Users,
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

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6', '#f43f5e', '#14b8a6'];

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
    return <LoadingSpinner text="Loading dashboard insights..." />;
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
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-700 text-white shadow-xl shadow-brand-500/15">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-md mb-2">
            🏠 {currentHousehold?.name || 'My Household'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name?.split(' ')[0] || 'Roommate'} 👋
          </h1>
          <p className="mt-1 text-sm text-brand-100 max-w-xl">
            Here's a live summary of your flat's shared expenses, your debts, and who owes what.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setEditingExpense(null);
              setIsAddExpenseOpen(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-brand-700 hover:bg-brand-50 font-bold text-sm shadow-md transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* 6 Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
        <StatCard
          title="Total Expenses"
          amount={formatCurrency(balances?.totalExpenses)}
          subtitle="Household total"
          icon={Receipt}
          variant="default"
        />
        <StatCard
          title="You Paid"
          amount={formatCurrency(balances?.myPaid)}
          subtitle="Total spent by you"
          icon={Wallet}
          variant="default"
        />
        <StatCard
          title="Your Share"
          amount={formatCurrency(balances?.myShare)}
          subtitle="Your owed portion"
          icon={Scale}
          variant="default"
        />
        <StatCard
          title="You Need To Pay"
          amount={formatCurrency(balances?.myNeedToPay)}
          subtitle="Outstanding debts"
          icon={ArrowDownRight}
          variant={parseFloat(balances?.myNeedToPay) > 0 ? 'negative' : 'default'}
        />
        <StatCard
          title="You Will Receive"
          amount={formatCurrency(balances?.myWillReceive)}
          subtitle="Others owe you"
          icon={ArrowUpRight}
          variant={parseFloat(balances?.myWillReceive) > 0 ? 'positive' : 'default'}
        />
        <StatCard
          title="Net Balance"
          amount={
            isNetPositive
              ? `+${formatCurrency(netBalanceNum)}`
              : formatCurrency(netBalanceNum)
          }
          subtitle={
            isNetPositive
              ? 'You are owed money'
              : isNetZero
              ? 'All settled up!'
              : 'You owe money'
          }
          icon={TrendingUp}
          variant={isNetPositive ? 'positive' : isNetZero ? 'default' : 'negative'}
        />
      </div>

      {/* Recharts Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Monthly Expense Trend */}
        <div className="lg:col-span-2 p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Monthly Expenses Trend
              </h3>
              <p className="text-xs text-slate-400">Total spending history</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
              6 Months
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `₹${val}`} />
                <Tooltip
                  formatter={(val) => [formatCurrency(val), 'Amount']}
                  contentStyle={{
                    backgroundColor: '#1e1b4b',
                    borderRadius: '12px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Donut */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="mb-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Category Distribution
            </h3>
            <p className="text-xs text-slate-400">Where the money went</p>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            {categoryData.length === 0 ? (
              <p className="text-xs text-slate-400">No expense records</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
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

          <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            {categoryData.slice(0, 4).map((c, i) => (
              <span key={c.name} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                {c.name}: {formatCurrency(c.value)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Member Contributions Chart */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Member Paid vs. Share
            </h3>
            <p className="text-xs text-slate-400">Comparison of who paid and who consumed</p>
          </div>
        </div>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={contributionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
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
      </div>

      {/* Bottom Grid: Recent Expenses & Who Owes Whom */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Expenses */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Recent Expenses
              </h3>
              <p className="text-xs text-slate-400">Latest flat purchases</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentExpenses.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">No expenses recorded yet.</p>
            ) : (
              recentExpenses.map((exp) => (
                <div
                  key={exp.id}
                  onClick={() => setSelectedExpense(exp)}
                  className="py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <CategoryBadge category={exp.category} />
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate max-w-[180px] sm:max-w-xs">
                        {exp.title}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Paid by <span className="font-semibold">{exp.paidByName}</span> • {formatDate(exp.expenseDate)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100 block">
                      {formatCurrency(exp.amount)}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Your share: {formatCurrency(exp.myShare)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Who Owes Whom Summary */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Who Owes Whom
              </h3>
              <p className="text-xs text-slate-400">Direct balances between roommates</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {debts?.directDebts?.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">All debts are cleared! 🎉</p>
            ) : (
              debts?.directDebts?.map((debt, index) => (
                <div
                  key={index}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <span className="font-bold text-rose-600 dark:text-rose-400">{debt.fromUserName}</span>
                    <span className="text-slate-400">owes</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{debt.toUserName}</span>
                  </div>
                  <span className="text-sm font-black text-slate-900 dark:text-slate-100 font-mono">
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
