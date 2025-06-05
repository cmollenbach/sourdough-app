import { BrowserRouter, Switch, Route, Redirect } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import RecipesListPage from "./pages/recipes";
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

function AppRoutes() {
  const { user, loading } = useAuth();
  const { darkMode } = useSettings();

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, [darkMode]);

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Navbar />
      <Switch>
        <Route
          path="/login"
          render={() =>
            user ? <Redirect to="/recipes" /> : <LoginPage />
          }
        />
        <Route
          path="/recipes"
          exact
          render={() => (
            <RequireAuth>
              <RecipesListPage />
            </RequireAuth>
          )}
        />
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
