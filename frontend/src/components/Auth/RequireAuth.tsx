import React from 'react'; // Add this import
import { useLocation, Redirect } from "react-router-dom"; // Reverted to Redirect for RRDv5
import { useAuth } from "../../hooks/useAuthHook"; // Updated import path

interface RequireAuthProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export default function RequireAuth({ children, adminOnly = false }: RequireAuthProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading session...</div>;
  }

  if (!user) {
    return <Redirect to={{ pathname: "/login", state: { from: location } }} />;
  }

  if (adminOnly && user.role !== 'ADMIN') {
  return <Redirect to="/unauthorized" />; // Or your dedicated "forbidden" page
  }

  return children;
}