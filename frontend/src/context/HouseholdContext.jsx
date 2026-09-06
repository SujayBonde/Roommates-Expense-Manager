import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuth } from './AuthContext';

const HouseholdContext = createContext();

export function HouseholdProvider({ children }) {
  const { user, token } = useAuth();
  const [households, setHouseholds] = useState([]);
  const [currentHousehold, setCurrentHousehold] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHouseholds = useCallback(async () => {
    if (!token || !user) {
      setHouseholds([]);
      setCurrentHousehold(null);
      setMembers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await axiosClient.get('/households');
      const list = res.data || [];
      setHouseholds(list);

      // Select active household from localStorage or pick the first one
      const savedId = localStorage.getItem('rm_current_household_id');
      let active = list.find((h) => h.id.toString() === savedId);
      if (!active && list.length > 0) {
        active = list[0];
      }

      if (active) {
        setCurrentHousehold(active);
        localStorage.setItem('rm_current_household_id', active.id.toString());
        // Fetch members
        const membersRes = await axiosClient.get(`/households/${active.id}/members`);
        setMembers(membersRes.data || []);
      } else {
        setCurrentHousehold(null);
        setMembers([]);
      }
    } catch (err) {
      console.error('Failed to fetch households', err);
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    fetchHouseholds();
  }, [fetchHouseholds]);

  const switchHousehold = async (householdId) => {
    const target = households.find((h) => h.id === householdId);
    if (target) {
      setCurrentHousehold(target);
      localStorage.setItem('rm_current_household_id', target.id.toString());
      try {
        const membersRes = await axiosClient.get(`/households/${target.id}/members`);
        setMembers(membersRes.data || []);
      } catch (err) {
        console.error('Failed to load members for household', err);
      }
    }
  };

  const refreshCurrentHousehold = async () => {
    if (!currentHousehold) return;
    try {
      const [hRes, mRes] = await Promise.all([
        axiosClient.get(`/households/${currentHousehold.id}`),
        axiosClient.get(`/households/${currentHousehold.id}/members`),
      ]);
      setCurrentHousehold(hRes.data);
      setMembers(mRes.data);
    } catch (err) {
      console.error('Error refreshing household', err);
    }
  };

  const createHousehold = async (data) => {
    const res = await axiosClient.post('/households', data);
    await fetchHouseholds();
    return res.data;
  };

  const joinHousehold = async (inviteCode) => {
    const res = await axiosClient.post('/households/join', { inviteCode });
    await fetchHouseholds();
    return res.data;
  };

  return (
    <HouseholdContext.Provider
      value={{
        households,
        currentHousehold,
        members,
        loading,
        switchHousehold,
        refreshHouseholds: fetchHouseholds,
        refreshCurrentHousehold,
        createHousehold,
        joinHousehold,
      }}
    >
      {children}
    </HouseholdContext.Provider>
  );
}

export function useHousehold() {
  const context = useContext(HouseholdContext);
  if (!context) throw new Error('useHousehold must be used within HouseholdProvider');
  return context;
}
