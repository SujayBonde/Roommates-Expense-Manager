import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  Scale,
  ArrowLeftRight,
  HandCoins,
  CheckCircle2,
  BarChart3,
  Users,
  Activity,
  Settings,
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Expenses', path: '/expenses', icon: Receipt },
  { name: 'Balances', path: '/balances', icon: Scale },
  { name: 'Who Owes Whom', path: '/debts', icon: ArrowLeftRight },
  { name: 'Personal Loans', path: '/loans', icon: HandCoins },
  { name: 'Settlements', path: '/settlements', icon: CheckCircle2 },
  { name: 'Reports', path: '/reports', icon: BarChart3 },
  { name: 'Roommates', path: '/members', icon: Users },
  { name: 'Activity', path: '/activity', icon: Activity },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 p-4 space-y-6 min-h-[calc(100vh-4rem)]">
      <nav className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Info card at bottom of sidebar */}
      <div className="mt-auto p-4 rounded-2xl bg-gradient-to-br from-brand-50 to-indigo-50/50 dark:from-brand-950/40 dark:to-indigo-950/20 border border-brand-100 dark:border-brand-900/40">
        <p className="text-xs font-bold text-brand-900 dark:text-brand-300">RoomMate Manager</p>
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          Equal splits, loans, and minimum transaction settlements in seconds.
        </p>
      </div>
    </aside>
  );
}
