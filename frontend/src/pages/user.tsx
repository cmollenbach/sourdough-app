import { useAuth } from '../hooks/useAuthHook';
import { Link } from 'react-router-dom';

export default function UserProfilePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-4 text-center">Loading user data...</div>;
  }

  if (!user) {
    return (
      <div className="p-4 text-center">
        <p className="mb-4">Please log in to view your profile.</p>
        <Link to="/login" className="text-blue-600 hover:underline">
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center text-text-primary dark:text-text-primary-dark">User Profile</h1>
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg px-8 pt-6 pb-8 mb-4">
        <div className="mb-4">
          <p className="text-gray-700 text-sm font-bold mb-1">Email:</p>
          <p className="text-gray-800 text-lg">{user.email}</p>
        </div>
        {user.role && (
          <div className="mb-6">
            <p className="text-gray-700 text-sm font-bold mb-1">Role:</p>
            <p className="text-gray-800 text-lg">{user.role}</p>
          </div>
        )}
        {/* You can add more user details here as needed */}
        <div className="mt-8 text-center">
          <Link to="/account" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors">
            Edit Account Details
          </Link>
        </div>
      </div>
    </div>
  );
}