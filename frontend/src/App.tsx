import { BrowserRouter, Switch, Route, Redirect } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import RecipeBuilderPage from "./pages/recipes/[id]";
import BakesListPage from "./pages/bakes";
import BakeHistoryPage from "./pages/history";
import SettingsPage from "./pages/settings";
import IngredientsSettingsPage from "./pages/settings/ingredients";
import EntityRequestsSettingsPage from "./pages/settings/entity-requests";
import LoginPage from "./pages/login";
import AccountPage from "./pages/account";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SettingsProvider, useSettings } from "./context/SettingsContext";
import { ToastProvider } from "./context/ToastContext";
import "./App.css";
import UserSettingsPage from "./pages/settings/user";
import RequireAuth from "./components/Auth/RequireAuth";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";
import LandingPage from "./pages/landing";
import RegisterPage from "./pages/register";

function AppRoutes() {
  const { user, loading } = useAuth();
  const { darkMode } = useSettings();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark"); // Target html tag
    } else {
      document.documentElement.classList.remove("dark"); // Target html tag
    }
  }, [darkMode]);

  if (loading) {
    return (
      <div className="page-bg min-h-screen flex items-center justify-center p-8 text-center text-text-secondary">
        Loading...
      </div>
    );
  }

  return (
    <div className="page-bg min-h-screen flex flex-col">
      <BrowserRouter>
        <Navbar />
        <Switch>
          <Route path="/" exact component={LandingPage} />
          <Route
            path="/login"
            render={() =>
              user ? <Redirect to="/recipes" /> : <LoginPage />
            }
          />
          <Route path="/register" component={RegisterPage} />
          <Route
            path="/recipes/:id"
            render={() => (
              <RequireAuth>
                <RecipeBuilderPage />
              </RequireAuth>
            )}
          />
          <Route
            path="/bakes"
            render={() => (
              <RequireAuth>
                <BakesListPage />
              </RequireAuth>
            )}
          />
          <Route
            path="/history"
            render={() => (
              <RequireAuth>
                <BakeHistoryPage />
              </RequireAuth>
            )}
          />
          <Route
            path="/settings"
            exact
            render={() => (
              <RequireAuth>
                <SettingsPage />
              </RequireAuth>
            )}
          />
          <Route
            path="/settings/ingredients"
            render={() => (
              <RequireAuth>
                <IngredientsSettingsPage />
              </RequireAuth>
            )}
          />
          <Route
            path="/settings/entity-requests"
            render={() => (
              <RequireAuth>
                <EntityRequestsSettingsPage />
              </RequireAuth>
            )}
          />
          <Route
            path="/settings/user"
            render={() => (
              <RequireAuth>
                <UserSettingsPage />
              </RequireAuth>
            )}
          />
          <Route
            path="/account"
            render={() => (
              <RequireAuth>
                <AccountPage />
              </RequireAuth>
            )}
          />
          <Route render={() => <NotFound />} />
        </Switch>
      </BrowserRouter>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <SettingsProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </SettingsProvider>
    </ToastProvider>
  );
}
