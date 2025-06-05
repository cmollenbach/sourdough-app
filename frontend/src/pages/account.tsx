import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function AccountPage() {
  const { user, login } = useAuth();
  const { addToast } = useToast();
  const [username, setUsername] = useState(user || "");

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    login(username);
    addToast("Profile updated!", "success");
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Account</h1>
      <form onSubmit={handleSave} className="flex flex-col gap-2">
        <label>
          Username:
          <input
            className="border rounded px-2 py-1 ml-2"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
        </label>
        <button type="submit" className="bg-blue-600 text-white rounded px-4 py-2 mt-2">
          Save
        </button>
      </form>
    </div>
  );
}