import { BrowserRouter, Switch, Route, Redirect } from "react-router-dom"; // Using RRDv5
import Navbar from "./components/Navbar/Navbar";
import RecipeBuilderPage from "./pages/recipes/[id]";
import BakesListPage from "./pages/bakes";
import BakeDetailPage from "./pages/bakes/BakeDetailPage"; // Import BakeDetailPage
import BakeHistoryPage from "./pages/history";
import SettingsPage from "./pages/settings";
import IngredientsSettingsPage from "./pages/settings/ingredients";
import EntityRequestsSettingsPage from "./pages/settings/entity-requests";
import LoginPage from "./pages/login";
import AccountPage from "./pages/account";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./hooks/useAuthHook";
import { SettingsProvider, useSettings } from "./context/SettingsContext";
import { ToastProvider } from "./context/ToastContext";
import "./App.css";
import UserSettingsPage from "./pages/settings/user";
import RequireAuth from "./components/Auth/RequireAuth";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";
import LandingPage from "./pages/landing";
import RegisterPage from "./pages/register";
import StepTemplatesPage from "./pages/admin/StepTemplatesPage";
import UserProfilePage from "./pages/user";

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
      <Navbar />
      <main className="flex-grow">
        <Switch>
          <Route path="/" exact render={() => user ? <Redirect to="/recipes" /> : <LandingPage />} />
          <Route path="/login" render={() => user ? <Redirect to="/recipes" /> : <LoginPage />} />
          <Route path="/register" render={() => user ? <Redirect to="/recipes" /> : <RegisterPage />} />
          
          <Route path="/admin/step-templates" render={() => <RequireAuth adminOnly><StepTemplatesPage /></RequireAuth>} />

          {/* Both /recipes and /recipes/:id will now be handled by RecipeBuilderPage */}
          <Route path="/recipes/:id?" render={() => <RequireAuth><RecipeBuilderPage /></RequireAuth>} />
          
          {/* Bake Routes */}
          <Route exact path="/bakes" render={() => <RequireAuth><BakesListPage /></RequireAuth>} />
          <Route path="/bakes/:bakeId" render={() => <RequireAuth><BakeDetailPage /></RequireAuth>} />
          
          <Route path="/history" render={() => <RequireAuth><BakeHistoryPage /></RequireAuth>} />
          
          <Route exact path="/settings" render={() => <RequireAuth><SettingsPage /></RequireAuth>} />
          <Route path="/settings/ingredients" render={() => <RequireAuth><IngredientsSettingsPage /></RequireAuth>} />
          <Route path="/settings/entity-requests" render={() => <RequireAuth><EntityRequestsSettingsPage /></RequireAuth>} />
          <Route path="/settings/user" render={() => <RequireAuth><UserSettingsPage /></RequireAuth>} />
          
          <Route path="/account" render={() => <RequireAuth><AccountPage /></RequireAuth>} />
          <Route path="/profile" render={() => <RequireAuth><UserProfilePage /></RequireAuth>} />
          
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
// Note: Ensure that your project has the necessary dependencies installed for React Router v5