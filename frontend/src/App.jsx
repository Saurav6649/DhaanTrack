import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SWRConfig } from 'swr';
import { swrConfig } from './api/swrConfig.js';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ProtectedRoute } from './components/layout/ProtectedRoute.jsx';
import { GuestRoute } from './components/layout/GuestRoute.jsx';
import { AdminLayout } from './components/layout/AdminLayout.jsx';
import { OperatorLayout } from './components/layout/OperatorLayout.jsx';
import { LoadingSpinner } from './components/common/LoadingSpinner.jsx';

// Public Pages
import { LandingPage } from './pages/landing/LandingPage.jsx';
import { LoginPage } from './pages/auth/LoginPage.jsx';
import { MachinesServicesPage } from './pages/machines/MachinesServicesPage.jsx';
import { DashboardPage } from './pages/admin/DashboardPage.jsx';
import { WorksPage } from './pages/admin/WorksPage.jsx';
import { UsersMachinesPage } from './pages/admin/UsersMachinesPage.jsx';
import { UserMachineDetailPage } from './pages/admin/UserMachineDetailPage.jsx';
import { ContractorsPage } from './pages/admin/ContractorsPage.jsx';
import { ExpensesPage } from './pages/admin/ExpensesPage.jsx';
import { ReportsPage } from './pages/admin/ReportsPage.jsx';
import { MasterDataPage } from './pages/admin/MasterDataPage.jsx';
import { RecycleBinPage } from './pages/admin/RecycleBinPage.jsx';

// Operator Pages
import { OperatorDashboardPage } from './pages/operator/OperatorDashboardPage.jsx';
import { TimerPage } from './pages/operator/TimerPage.jsx';
import { FieldCalculatorPage } from './pages/operator/FieldCalculatorPage.jsx';
import { QuickCalculatorPage } from './pages/operator/QuickCalculatorPage.jsx';
import { TodayWorksPage } from './pages/operator/TodayWorksPage.jsx';
import { OperatorPaymentsPage } from './pages/operator/OperatorPaymentsPage.jsx';
import { OperatorExpensesPage } from './pages/operator/OperatorExpensesPage.jsx';
import { OperatorProfilePage } from './pages/operator/OperatorProfilePage.jsx';
import { WorkHistoryPage } from './pages/operator/WorkHistoryPage.jsx';
import { ExpenseHistoryPage } from './pages/operator/ExpenseHistoryPage.jsx';
import { OperatorCustomersPage } from './pages/operator/OperatorCustomersPage.jsx';

// Role-governed Dashboard Router
const DashboardRedirector = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner label="Authenticating session..." size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' ? (
    <Navigate to="/admin/dashboard" replace />
  ) : (
    <Navigate to="/app/dashboard" replace />
  );
};

export const App = () => {
  return (
    <SWRConfig value={swrConfig}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Promotional Landing Page */}
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/login"
              element={
                <GuestRoute>
                  <LoginPage />
                </GuestRoute>
              }
            />
            <Route path="/dashboard" element={<DashboardRedirector />} />
            <Route path="/machines" element={<MachinesServicesPage />} />

            {/* Admin Portal (Protected: ADMIN) */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="works" element={<WorksPage />} />
              <Route path="users-machines" element={<UsersMachinesPage />} />
              <Route path="users-machines/:id" element={<UserMachineDetailPage />} />
              <Route path="contractors" element={<ContractorsPage />} />
              <Route path="expenses" element={<ExpensesPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="master-data" element={<MasterDataPage />} />
              <Route path="recycle-bin" element={<RecycleBinPage />} />
            </Route>

            {/* User / Operator Portal (Protected: USER) */}
            <Route
              path="/app"
              element={
                <ProtectedRoute requiredRole="USER">
                  <OperatorLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/app/dashboard" replace />} />
              <Route path="dashboard" element={<OperatorDashboardPage />} />
              <Route path="timer" element={<TimerPage />} />
              <Route path="field-calculator" element={<FieldCalculatorPage />} />
              <Route path="quick-calculator" element={<QuickCalculatorPage />} />
              <Route path="today-works" element={<TodayWorksPage />} />
              <Route path="customers" element={<OperatorCustomersPage />} />
              <Route path="payments" element={<OperatorPaymentsPage />} />
              <Route path="expenses" element={<OperatorExpensesPage />} />
              <Route path="profile" element={<OperatorProfilePage />} />
              <Route path="history/work" element={<WorkHistoryPage />} />
              <Route path="history/expense" element={<ExpenseHistoryPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </SWRConfig>
  );
};

export default App;
