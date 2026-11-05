import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { LoadingSpinner } from '../common/LoadingSpinner.jsx';

/**
 * GuestRoute Guard
 * Ensures only unauthenticated users can access guest routes like /login.
 * 1. During session verification (isLoading), displays a dedicated full-screen loader to prevent login flash.
 * 2. If a valid authenticated session exists, redirects immediately to /dashboard.
 * 3. Otherwise renders the guest content.
 */
export const GuestRoute = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950/40 backdrop-blur-sm">
        <LoadingSpinner label="Checking session..." size="lg" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default GuestRoute;
