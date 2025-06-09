import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useAuth } from "../hooks/useAuthHook";
import { useLocation, useHistory, Link } from "react-router-dom";
import { useToast } from "../context/ToastContext";

interface LoginFormInputs {
  email: string;
  password: string;
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
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
      if (err instanceof Error) {
        addToast({ message: err.message || "Login failed", type: "error" });
      } else {
        addToast({ message: "Login failed", type: "error" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <form className="flex flex-col gap-4 w-72" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 sr-only">Email</label>
          <input
            id="email"
            type="email"
            placeholder="Email"
            className={`border rounded px-3 py-2 w-full ${errors.email ? "border-red-500" : "border-gray-300"}`}
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
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 sr-only">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Password"
            className={`border rounded px-3 py-2 w-full ${errors.password ? "border-red-500" : "border-gray-300"}`}
            {...register("password", { required: "Password is required" })}
          />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2 transition-colors" disabled={loading}>
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
