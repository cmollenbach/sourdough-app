import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useAuth } from "../hooks/useAuthHook";
import { useToast } from "../context/ToastContext";
import { useLocation, useHistory, Link } from "react-router-dom";

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
      let msg = "Login failed";
      if (err instanceof Error) {
        msg = err.message || msg;
      }
      addToast({ message: msg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
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
