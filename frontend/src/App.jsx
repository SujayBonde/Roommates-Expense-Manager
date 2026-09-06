import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { HouseholdProvider } from './context/HouseholdContext';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <HouseholdProvider>
            <AppRoutes />
          </HouseholdProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
