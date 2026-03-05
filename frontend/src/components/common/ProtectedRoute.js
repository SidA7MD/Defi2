import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../common';

export function ProtectedRoute({ children, roles }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner size="lg" text="Authenticating..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
