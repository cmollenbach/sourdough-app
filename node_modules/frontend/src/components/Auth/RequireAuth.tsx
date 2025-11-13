import React from 'react'; // Add this import
import { useLocation, Redirect } from "react-router-dom"; // Reverted to Redirect for RRDv5
import { useAuth } from "../../hooks/useAuthHook"; // Updated import path

interface RequireAuthProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export default function RequireAuth({ children, adminOnly = false }: RequireAuthProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state during auth check to prevent content flash
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to={{ pathname: "/", state: { from: location } }} />;
  }

  if (adminOnly && user.role !== 'ADMIN') {
    return <Redirect to="/unauthorized" />; // Or your dedicated "forbidden" page
  }

  return <>{children}</>;
}