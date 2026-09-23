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

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', path: '/', icon: LayoutDashboard },
      { name: 'Expenses', path: '/expenses', icon: Receipt },
      { name: 'Balances', path: '/balances', icon: Scale },
    ],
  },
  {
    label: 'Settlements & Debts',
    items: [
      { name: 'Who Owes Whom', path: '/debts', icon: ArrowLeftRight },
      { name: 'Settlements', path: '/settlements', icon: CheckCircle2 },
      { name: 'Personal Loans', path: '/loans', icon: HandCoins },
      { name: 'Reports', path: '/reports', icon: BarChart3 },
    ],
  },
  {
    label: 'Household',
    items: [
      { name: 'Roommates', path: '/members', icon: Users },
      { name: 'Activity', path: '/activity', icon: Activity },
      { name: 'Settings', path: '/settings', icon: Settings },
    ],
  },
];

export default function Sidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-slate-200/90 dark:border-slate-800 bg-white/70 dark:bg-[#0e131d]/60 p-3.5 space-y-6 min-h-[calc(100vh-3.5rem)]">
      <nav className="space-y-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="space-y-1">
            <div className="px-2.5 pb-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        isActive
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
