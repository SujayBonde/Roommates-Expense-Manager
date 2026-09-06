import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  Scale,
  HandCoins,
  Menu,
  X,
  ArrowLeftRight,
  CheckCircle2,
  BarChart3,
  Users,
  Activity,
  Settings,
} from 'lucide-react';

export default function MobileNav() {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const mainItems = [
    { name: 'Home', path: '/', icon: LayoutDashboard },
    { name: 'Expenses', path: '/expenses', icon: Receipt },
    { name: 'Balances', path: '/balances', icon: Scale },
    { name: 'Loans', path: '/loans', icon: HandCoins },
  ];

  const moreItems = [
    { name: 'Who Owes Whom', path: '/debts', icon: ArrowLeftRight },
    { name: 'Settlements', path: '/settlements', icon: CheckCircle2 },
    { name: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
    { name: 'Roommates', path: '/members', icon: Users },
    { name: 'Activity Feed', path: '/activity', icon: Activity },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Slide-over sheet for "More" menu */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
            onClick={() => setShowMoreMenu(false)}
          />
          <div className="fixed bottom-16 inset-x-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-3xl p-6 shadow-2xl animate-slide-up max-h-[75vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">More Options</h3>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {moreItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setShowMoreMenu(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 p-3 rounded-xl border text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400'
                          : 'border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Sticky Navigation */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-2 shadow-lg">
        {mainItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-14 py-1 text-[11px] font-semibold transition-colors ${
                  isActive
                    ? 'text-brand-600 dark:text-brand-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}

        {/* More Button */}
        <button
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          className={`flex flex-col items-center justify-center w-14 py-1 text-[11px] font-semibold transition-colors ${
            showMoreMenu
              ? 'text-brand-600 dark:text-brand-400'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span>More</span>
        </button>
      </nav>
    </>
  );
}
