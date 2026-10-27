import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useWork } from './context/WorkContext';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { UsersPage } from './pages/UsersPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { WorksPage } from './pages/WorksPage';
import { SettingsPage } from './pages/SettingsPage';
import { ReportsPage } from './pages/ReportsPage';
import { LoginPage } from './pages/LoginPage';
import { WaitingApprovalPage } from './pages/WaitingApprovalPage';

const ProtectedRoute: React.FC<{ children: React.ReactElement; requireAdmin?: boolean }> = ({
  children,
  requireAdmin = false,
}) => {
  const { currentUser, isMainAdmin } = useAuth();
  const { hasAccessToAnyWork, loading } = useWork();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // If user has no access to any work and is not a main admin, show holding screen
  if (!loading && !hasAccessToAnyWork && !isMainAdmin) {
    return <Navigate to="/waiting-assignment" replace />;
  }

  if (requireAdmin && !isMainAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/waiting-assignment" element={<WaitingApprovalPage />} />

      {/* Main Authenticated Application */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="works" element={<WorksPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route
          path="settings"
          element={
            <ProtectedRoute requireAdmin={true}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

