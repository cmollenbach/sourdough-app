import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLocation, useHistory } from "react-router-dom";
import { useToast } from "../context/ToastContext";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const { login } = useAuth();
  const { addToast } = useToast();
  const location = useLocation();
  const history = useHistory();

  const from: string = (location.state as { from?: { pathname: string } })?.from?.pathname || "/recipes";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (email && password) {
      login(email, password)
        .then(() => {
          history.replace(from); // Use history.replace or history.push
        })
        .catch(() => addToast("Login failed", "error"));
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <form className="flex flex-col gap-2 w-64" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          className="border rounded px-2 py-1"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="border rounded px-2 py-1"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button type="submit" className="bg-blue-600 text-white rounded px-4 py-2">
          Login
        </button>
      </form>
    </div>
  );
}