import React, { useState } from "react";
import { login } from "./api";

type Props = { onLogin: (token: string) => void };
type LoginResponse = { token: string };

export default function Login({ onLogin }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await login(email, password);
      const data = res.data as LoginResponse;
      onLogin(data.token);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setError(axiosErr.response?.data?.error || "Login failed");
      } else {
        setError("Login failed");
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-surface-subtle p-4">
      <form 
        onSubmit={handleSubmit} 
        className="p-6 bg-surface-elevated rounded-xl shadow-card border border-border w-full max-w-sm flex flex-col gap-4"
      >
        <h2 className="text-2xl font-bold text-text-primary text-center mb-4">Login</h2>
        <div>
          <label htmlFor="email" className="form-label sr-only">Email</label>
          <input
            id="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            required
            className="form-input w-full rounded"
          />
        </div>
        <div>
          <label htmlFor="password" className="form-label sr-only">Password</label>
          <input
            id="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            required
            className="form-input w-full rounded"
          />
        </div>
        <button type="submit" className="btn-primary px-4 py-2 rounded w-full transition-colors">Login</button>
        {error && <div className="text-danger-600 text-sm text-center">{error}</div>}
      </form>
    </div>
  );
}