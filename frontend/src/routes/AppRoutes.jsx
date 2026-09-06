import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import MainLayout from '../layouts/MainLayout';

import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import Expenses from '../pages/Expenses';
import Balances from '../pages/Balances';
import WhoOwesWhom from '../pages/WhoOwesWhom';
import Loans from '../pages/Loans';
import Settlements from '../pages/Settlements';
import Reports from '../pages/Reports';
import Members from '../pages/Members';
import ActivityFeed from '../pages/ActivityFeed';
import Settings from '../pages/Settings';
import NotFound from '../pages/NotFound';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/balances" element={<Balances />} />
          <Route path="/debts" element={<WhoOwesWhom />} />
          <Route path="/loans" element={<Loans />} />
          <Route path="/settlements" element={<Settlements />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/members" element={<Members />} />
          <Route path="/activity" element={<ActivityFeed />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
