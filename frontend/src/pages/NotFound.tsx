import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuthHook";

export default function NotFound() {
  const { user } = useAuth();
  
  return (
    <div className="p-8 text-center">
      <h1 className="text-3xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="mb-4">Sorry, the page you are looking for does not exist.</p>
      <div className="flex gap-4 justify-center">
        {user ? (
          <>
            <Link to="/recipes" className="text-blue-600 hover:underline">
              Go to Recipes
            </Link>
            <Link to="/bakes" className="text-blue-600 hover:underline">
              Go to Bakes
            </Link>
          </>
        ) : (
          <Link to="/" className="text-blue-600 hover:underline">
            Go to Home
          </Link>
        )}
      </div>
    </div>
  );
}