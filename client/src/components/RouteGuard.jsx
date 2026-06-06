import React from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Route guard for public-only pages like login/register
export const PublicRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (user) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'owner') return <Navigate to="/owner" replace />;
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

// Route guard for authenticated/role-restricted dashboards
export const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If they are visiting the root path, redirect them to their respective home dashboard instead of 403
    if (window.location.pathname === '/') {
      if (user.role === 'admin') return <Navigate to="/admin" replace />;
      if (user.role === 'owner') return <Navigate to="/owner" replace />;
    }

    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background px-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-destructive">403 - Access Denied</h1>
        <p className="mt-2 text-muted-foreground">You do not have the required permissions to view this page.</p>
        <button
          onClick={() => {
            if (user.role === 'admin') navigate('/admin');
            else if (user.role === 'owner') navigate('/owner');
            else navigate('/');
          }}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Go Home
        </button>
      </div>
    );
  }

  return <Outlet />;
};
