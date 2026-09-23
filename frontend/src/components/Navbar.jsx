import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';
import { useTheme } from '../context/ThemeContext';
import {
  Bell,
  Sun,
  Moon,
  ChevronDown,
  Plus,
  LogOut,
  Users,
  CheckCheck,
  Check,
  Building2,
} from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { formatDateTime } from '../utils/formatters';

export default function Navbar({ onOpenCreateJoin }) {
  const { user, logout } = useAuth();
  const { currentHousehold, households, switchHousehold } = useHousehold();
  const { theme, toggleTheme } = useTheme();

  const [showHouseholdMenu, setShowHouseholdMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const notificationRef = useRef(null);
  const householdRef = useRef(null);
  const userRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const [listRes, countRes] = await Promise.all([
        axiosClient.get('/notifications'),
        axiosClient.get('/notifications/unread-count'),
      ]);
      setNotifications(listRes.data || []);
      setUnreadCount(countRes.data?.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (householdRef.current && !householdRef.current.contains(event.target)) {
        setShowHouseholdMenu(false);
      }
      if (userRef.current && !userRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await axiosClient.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await axiosClient.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-[#0e131d]/95 backdrop-blur-sm">
      <div className="flex items-center justify-between h-full px-4 sm:px-6 max-w-7xl mx-auto w-full">
        {/* Left: Brand & Household Switcher */}
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-teal-600 flex items-center justify-center text-white shadow-sm">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="hidden sm:flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                  Roommates
                </span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Manager
                </span>
              </div>
            </div>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          {/* Household Selector Dropdown */}
          <div className="relative" ref={householdRef}>
            <button
              onClick={() => setShowHouseholdMenu(!showHouseholdMenu)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 text-xs font-medium transition-colors"
            >
              <Users className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span className="max-w-[120px] sm:max-w-[180px] truncate font-semibold text-slate-800 dark:text-slate-200">
                {currentHousehold ? currentHousehold.name : 'Select Household'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showHouseholdMenu && (
              <div className="absolute left-0 mt-1.5 w-64 bg-white dark:bg-[#111622] rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 py-1 z-50 animate-slide-up">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Your Households
                </div>
                <div className="max-h-56 overflow-y-auto">
                  {households.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => {
                        switchHousehold(h.id);
                        setShowHouseholdMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${
                        currentHousehold?.id === h.id
                          ? 'font-semibold text-teal-600 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-950/20'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="truncate">{h.name}</span>
                      {currentHousehold?.id === h.id && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
                <div className="border-t border-slate-100 dark:border-slate-800/80 my-1 pt-1">
                  <button
                    onClick={() => {
                      setShowHouseholdMenu(false);
                      onOpenCreateJoin();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-teal-700 dark:text-teal-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-semibold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create or Join Group
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Theme Toggle, Notifications, User Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Dark / Light Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-lg transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-lg transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-3.5 min-w-3.5 px-1 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#111622] rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 animate-slide-up overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] font-medium text-teal-700 hover:text-teal-800 dark:text-teal-400 flex items-center gap-1"
                    >
                      <CheckCheck className="w-3 h-3" />
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 flex items-start justify-between gap-3 text-xs transition-colors ${
                          n.isRead ? 'opacity-65' : 'bg-slate-50/70 dark:bg-slate-800/30'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <p className="text-slate-800 dark:text-slate-200 text-xs leading-relaxed">
                            {n.message}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {formatDateTime(n.createdAt)}
                          </p>
                        </div>
                        {!n.isRead && (
                          <button
                            onClick={(e) => handleMarkAsRead(n.id, e)}
                            title="Mark as read"
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-teal-600 dark:text-teal-400 shrink-0"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

          {/* User Menu */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            >
              <img
                src={user?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=0f766e&color=fff`}
                alt={user?.name}
                className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
              />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 hidden md:block max-w-[120px] truncate">
                {user?.name}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 hidden md:block" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-1.5 w-52 bg-white dark:bg-[#111622] rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1 z-50 animate-slide-up">
                <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800/80">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{user?.name}</p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{user?.email}</p>
                </div>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors font-medium text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
