import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { LoadingSpinner } from '../common/LoadingSpinner.jsx';

export const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner label="Authenticating session..." size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole) {
    const isAuthorized =
      user.role === requiredRole ||
      (requiredRole === 'ADMIN' && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'));

    if (!isAuthorized) {
      // Redirect to correct dashboard based on actual role
      const redirectPath =
        user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'
          ? '/admin/dashboard'
          : '/app/dashboard';
      return <Navigate to={redirectPath} replace />;
    }
  }

  return children;
};
