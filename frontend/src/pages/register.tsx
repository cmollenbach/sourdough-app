import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useHistory } from "react-router-dom";
import { useToast } from "../context/ToastContext";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const { addToast } = useToast();
  const history = useHistory();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      if (err instanceof Error) {
        addToast(err.message || "Registration failed", "error");
      } else {
        addToast("Registration failed", "error");
      }
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Register</h1>
      <form className="flex flex-col gap-2 w-64" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          className="border rounded px-2 py-1"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="border rounded px-2 py-1"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="bg-blue-600 text-white rounded px-4 py-2">
          Register
        </button>
      </form>
    </div>
  );
}