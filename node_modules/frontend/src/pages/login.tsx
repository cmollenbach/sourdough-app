import { useState, useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useAuth } from "../hooks/useAuthHook";
import { useToast } from "../context/ToastContext";
import { useLocation, useHistory, Link } from "react-router-dom";
import { SocialLoginButtons } from '../components/Auth/SocialLoginButtons';
import { FormSkeleton } from "../components/Shared/FormSkeleton";

interface LoginFormInputs {
  email: string;
  password: string;
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [formReady, setFormReady] = useState(false);
  const { login, setAuthenticatedUser } = useAuth(); // Destructure setAuthenticatedUser
  const { showToast } = useToast();
  const location = useLocation();
  const history = useHistory();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>();

  const from: string = (location.state as { from?: { pathname: string } })?.from?.pathname || "/recipes";

  // Ensure form is ready before showing to prevent race conditions
  useEffect(() => {
    const timer = setTimeout(() => setFormReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const onSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      history.replace(from);
    } catch (err: unknown) {
      let msg = "Login failed";
      if (err instanceof Error) {
        msg = err.message || msg;
      }
      showToast(msg, { type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (token: string, provider: string) => {
    let endpoint = '';
    if (provider === 'google') endpoint = '/auth/oauth/google';
    // if (provider === 'apple') endpoint = '/auth/oauth/apple';
    setLoading(true);

    try {
      // Use Vite's way of accessing environment variables
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      if (!apiUrl) {
        showToast("API URL not configured. Please contact support.", { type: "error" });
        setLoading(false); // Ensure loading is set to false if API URL is missing
        return;
      }

      const res = await fetch(apiUrl + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token }),
      });

      if (res.ok) {
        const { token: jwt, user } = await res.json();
        // Use setAuthenticatedUser for social login
        setAuthenticatedUser(user, jwt);
        history.replace(from);
        showToast(`Welcome back, ${user.displayName || user.email}!`, { type: "success" });
      } else {
        const errorData = await res.json().catch(() => ({ message: "Social login failed. Please try again." }));
        showToast(errorData.error || errorData.message || "Social login failed.", { type: "error" });
      }
    } catch (err) {
      console.error("Social login fetch error:", err); // Log the actual error for debugging
      showToast("An unexpected error occurred during social login.", { type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Show skeleton while form is initializing
  if (!formReady) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <div className="h-16 w-16 rounded-xl bg-secondary-200 dark:bg-secondary-700 animate-pulse" />
        <div className="h-8 w-64 rounded bg-secondary-200 dark:bg-secondary-700 animate-pulse" />
        <div className="h-4 w-56 rounded bg-secondary-200 dark:bg-secondary-700 animate-pulse" />
        <FormSkeleton />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 py-10">
      <img src="/favicon.svg" alt="Loafly Logo" className="h-16 w-16 rounded-full shadow-soft" />
      <div className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-3xl font-bold text-text-primary">Loafly: Bake with Confidence and Joy.</h1>
        <p className="text-text-secondary">Sign up in seconds with Google or your email to start baking.</p>
      </div>
      <SocialLoginButtons onLoginSuccess={handleSocialLogin} />
      <div className="my-4 flex w-full max-w-sm items-center">
        <div className="flex-grow border-t border-border-subtle" />
        <span className="mx-2 text-sm text-text-tertiary">or</span>
        <div className="flex-grow border-t border-border-subtle" />
      </div>
      <form className="flex w-full max-w-sm flex-col gap-3" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <input
            id="email"
            type="email"
            placeholder="Email"
            className={`form-input w-full ${errors.email ? "border-danger-500" : ""}`}
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Invalid email address",
              },
            })}
          />
          {errors.email && <p className="mt-1 text-xs text-danger-600">{errors.email.message}</p>}
        </div>
        <div>
          <input
            id="password"
            type="password"
            placeholder="Password"
            className={`form-input w-full ${errors.password ? "border-danger-500" : ""}`}
            {...register("password", { required: "Password is required" })}
          />
          {errors.password && <p className="mt-1 text-xs text-danger-600">{errors.password.message}</p>}
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
      <div className="mt-4 flex w-full max-w-sm flex-col gap-2">
        <Link to="/register" className="btn-primary w-full">Sign up with Email</Link>
      </div>
      <div className="mt-4 text-sm text-text-secondary">
        <span>Already have an account? </span>
        <Link to="/" className="font-semibold text-primary-600 underline transition-colors hover:text-primary-500">
          Login
        </Link>
      </div>
    </div>
  );
}
