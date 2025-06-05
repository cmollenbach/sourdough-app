import { useAuth } from "../../context/AuthContext";
import { Redirect, useLocation } from "react-router-dom";
import type { ReactNode } from "react";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    // In React Router v5, you can pass state like this:
    return <Redirect to={{ pathname: "/login", state: { from: location } }} />;
  }

  return <>{children}</>;
}