import { useAuth } from "../../context/AuthContext";

export default function UserSettingsPage() {
  const { user } = useAuth();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">User Settings</h1>
      <div>
        <strong>Username:</strong> {user}
      </div>
      {/* Add user preferences and settings here */}
    </div>
  );
}