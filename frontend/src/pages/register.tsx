import { useState } from "react";
import { useAuth } from '../hooks/useAuthHook';
import { useHistory } from "react-router-dom";
import { useToast } from "../context/ToastContext";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const { addToast } = useToast();
  const history = useHistory();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Registration failed");
      }
      // Auto-login after registration
      await login(email, password);
      history.replace("/recipes");
    } catch (err: unknown) {
      let msg = "Registration failed";
      if (err instanceof Error) {
        msg = err.message || msg;
      }
      setError(msg);
      addToast({ message: msg, type: "error" });
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
        <button type="submit" className="btn-primary w-full">
          Register
        </button>
      </form>
      <div className="mt-4">
        <span>Already have an account? </span>
        <a href="/login" className="text-blue-600 underline">Login</a>
      </div>
    </div>
  );
}