import { useAuth } from '../../hooks/useAuthHook';

export default function UserSettingsPage() {
  const { user } = useAuth();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">User Settings</h1>
      <div>
        <strong>Username:</strong> {user ? user.email : "No user"}
      </div>
      {user ? (
        <div>
          <strong>Email:</strong> {user.email}
        </div>
      ) : (
        <div>No user data available.</div>
      )}
      {/* Add user preferences and settings here */}
    </div>
  );
}