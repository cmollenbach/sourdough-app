import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useAuth } from "../hooks/useAuthHook";
import { useToast } from "../context/ToastContext";
import { useLocation, useHistory, Link } from "react-router-dom";
import { SocialLoginButtons } from '../components/Auth/SocialLoginButtons';

interface LoginFormInputs {
  email: string;
  password: string;
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const { login, setAuthenticatedUser } = useAuth(); // Destructure setAuthenticatedUser
  const { addToast } = useToast();
  const location = useLocation();
  const history = useHistory();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>();

  const from: string = (location.state as { from?: { pathname: string } })?.from?.pathname || "/recipes";

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
      addToast({ message: msg, type: "error" });
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
        addToast({ message: "API URL not configured. Please contact support.", type: "error" });
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
        addToast({ message: `Welcome back, ${user.displayName || user.email}!`, type: "success" });
      } else {
        const errorData = await res.json().catch(() => ({ message: "Social login failed. Please try again." }));
        addToast({ message: errorData.error || errorData.message || "Social login failed.", type: "error" });
      }
    } catch (err) {
      console.error("Social login fetch error:", err); // Log the actual error for debugging
      addToast({ message: "An unexpected error occurred during social login.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-2">Welcome to Loafly!</h1>
      <p className="mb-4 text-gray-600">Sign in with Google or your email to start baking.</p>
      <SocialLoginButtons onLoginSuccess={handleSocialLogin} />
      <div className="my-4 flex items-center w-72">
        <div className="flex-grow border-t border-gray-300"></div>
        <span className="mx-2 text-gray-400 text-sm">or</span>
        <div className="flex-grow border-t border-gray-300"></div>
      </div>
      <form className="flex flex-col gap-3 w-72" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <input
            id="email"
            type="email"
            placeholder="Email"
            className={`form-input w-full ${errors.email ? "border-red-500" : ""}`}
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Invalid email address",
              },
            })}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <input
            id="password"
            type="password"
            placeholder="Password"
            className={`form-input w-full ${errors.password ? "border-red-500" : ""}`}
            {...register("password", { required: "Password is required" })}
          />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
      <div className="mt-4">
        <span>Don't have an account? </span>
        <Link to="/register" className="text-blue-600 underline">Register</Link>
      </div>
    </div>
  );
}
