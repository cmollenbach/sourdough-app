import { useState } from "react";
import { useAuth } from '../hooks/useAuthHook';
import { useHistory, Link } from "react-router-dom"; // Import Link
import { useToast } from "../context/ToastContext";
import { apiPost } from "../utils/api"; // Import the shared API utility

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false); // Add loading state
  const { login } = useAuth();
  const { addToast } = useToast();
  const history = useHistory();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true); // Set loading to true
    try {
      // Use apiPost for the registration request
      await apiPost("/auth/register", { email, password });

      addToast({ message: "Registration successful! Logging you in...", type: "success" });

      // Auto-login after registration
      await login(email, password);
      history.replace("/recipes");
    } catch (err: unknown) {
      let msg = "Registration failed";
      if (err instanceof Error) {
        // Use the error message from apiPost or login, or fallback
        msg = err.message || "An unexpected error occurred during registration.";
      }
      setError(msg);
      addToast({ message: msg, type: "error" });
    } finally {
      setLoading(false); // Set loading to false
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Register</h1>
      <form className="flex flex-col gap-3 w-64" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          className="form-input w-full"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="form-input w-full"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
      <div className="mt-4">
        <span>Already have an account? </span>
        <Link to="/login" className="text-blue-600 underline">Login</Link>
      </div>
    </div>
  );
}