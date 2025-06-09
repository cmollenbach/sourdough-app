import { BrowserRouter, Switch, Route, Redirect } from "react-router-dom"; // Reverted to RRDv5
import Navbar from "./components/Navbar/Navbar";
import RecipeBuilderPage from "./pages/recipes/[id]";
// import RecipeListPage from "./pages/recipes"; // This will no longer be the primary route for /recipes
import BakesListPage from "./pages/bakes";
import BakeHistoryPage from "./pages/history";
import SettingsPage from "./pages/settings";
import IngredientsSettingsPage from "./pages/settings/ingredients";
import EntityRequestsSettingsPage from "./pages/settings/entity-requests";
import LoginPage from "./pages/login";
import AccountPage from "./pages/account";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./hooks/useAuthHook"; // Updated import path
import { SettingsProvider, useSettings } from "./context/SettingsContext";
import { ToastProvider } from "./context/ToastContext";
import "./App.css";
import UserSettingsPage from "./pages/settings/user";
import RequireAuth from "./components/Auth/RequireAuth";
import NotFound from "./pages/NotFound"; // Assuming this component exists
import { useEffect } from "react";
import LandingPage from "./pages/landing"; // Assuming this component exists
import RegisterPage from "./pages/register"; // Assuming this component exists
import StepTemplatesPage from "./pages/admin/StepTemplatesPage";
import UserProfilePage from "./pages/user"; // Import the UserProfilePage component

function AppRoutes() {
  const { user, loading } = useAuth();
  const { darkMode } = useSettings();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
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
      {/* Navbar is now rendered by AppRoutes, within the BrowserRouter from App component */}
      <Navbar />
        <main className="flex-grow">
          <Switch>
            <Route path="/" exact render={() => user ? <Redirect to="/recipes" /> : <LandingPage />} />
            <Route path="/login" render={() => user ? <Redirect to="/recipes" /> : <LoginPage />} />
            <Route path="/register" render={() => user ? <Redirect to="/recipes" /> : <RegisterPage />} />
            
            <Route path="/admin/step-templates" render={() => <RequireAuth adminOnly><StepTemplatesPage /></RequireAuth>} />

            {/* Both /recipes and /recipes/:id will now be handled by RecipeBuilderPage */}
            <Route path="/recipes/:id?" render={() => <RequireAuth><RecipeBuilderPage /></RequireAuth>} />
            <Route path="/bakes" render={() => <RequireAuth><BakesListPage /></RequireAuth>} />
            <Route path="/history" render={() => <RequireAuth><BakeHistoryPage /></RequireAuth>} />
            <Route path="/settings" exact render={() => <RequireAuth><SettingsPage /></RequireAuth>} />
            <Route path="/settings/ingredients" render={() => <RequireAuth><IngredientsSettingsPage /></RequireAuth>} />
            <Route path="/settings/entity-requests" render={() => <RequireAuth><EntityRequestsSettingsPage /></RequireAuth>} />
            <Route path="/settings/user" render={() => <RequireAuth><UserSettingsPage /></RequireAuth>} />
            <Route path="/account" render={() => <RequireAuth><AccountPage /></RequireAuth>} />
            <Route path="/profile" render={() => <RequireAuth><UserProfilePage /></RequireAuth>} /> {/* Add the profile route */}
            
            <Route component={NotFound} /> {/* Catch-all for 404 in v5 */}
          </Switch>
        </main>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <SettingsProvider>
        <AuthProvider>
          <BrowserRouter> {/* BrowserRouter now wraps AppRoutes */}
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </SettingsProvider>
    </ToastProvider>
  );
}