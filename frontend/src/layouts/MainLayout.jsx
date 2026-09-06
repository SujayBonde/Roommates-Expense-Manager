import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import MobileNav from '../components/MobileNav';
import CreateJoinHouseholdModal from '../components/CreateJoinHouseholdModal';
import { useHousehold } from '../context/HouseholdContext';
import EmptyState from '../components/EmptyState';
import { Building } from 'lucide-react';

export default function MainLayout() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { currentHousehold, loading } = useHousehold();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar onOpenCreateJoin={() => setIsModalOpen(true)} />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-8 animate-fade-in">
          {!currentHousehold && !loading ? (
            <EmptyState
              icon={Building}
              title="No Household Selected"
              description="You are not part of any household yet. Create a new flat group or join one with an invite code."
              actionText="Create or Join Household"
              onAction={() => setIsModalOpen(true)}
            />
          ) : (
            <Outlet />
          )}
        </main>
      </div>

      <MobileNav />

      <CreateJoinHouseholdModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
