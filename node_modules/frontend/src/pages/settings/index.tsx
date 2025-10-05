import { Link } from 'react-router-dom';

export default function SettingsPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <ul className="list-disc pl-6">
        <li>
          <Link to="/settings/ingredients" className="text-blue-600 hover:underline">
            Ingredients Management
          </Link>
        </li>
        <li>
          <Link to="/settings/entity-requests" className="text-blue-600 hover:underline">
            Entity Requests (Admin)
          </Link>
        </li>
      </ul>
    </div>
  );
}