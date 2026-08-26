import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import FullPageLoader from './FullPageLoader';

const PROFILE_TYPE_PATH = '/app/perfil/tipo';

export default function RequireAuth({ children, profile }) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageLoader />;

  if (!isAuthenticated) {
    return <Navigate to="/entrar" replace state={{ from: location.pathname + location.search }} />;
  }

  if (!user.profile_type && location.pathname !== PROFILE_TYPE_PATH) {
    return <Navigate to={PROFILE_TYPE_PATH} replace />;
  }

  if (profile && user.profile_type !== profile) return <Navigate to="/app" replace />;

  return children;
}
