import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

type PublicTemplate = {
  id: string;
  name: string;
  description: string;
  // add other fields as needed
};

export default function LandingPage() {
  const [templates, setTemplates] = useState<PublicTemplate[]>([]);

  useEffect(() => {
    fetch("/api/templates/public")
      .then(res => res.json())
      .then(setTemplates);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Welcome to Sourdough App</h1>
      <p className="mb-6">Build, share, and track your sourdough recipes.</p>
      <div className="mb-6">
        <Link to="/login" className="mr-4 text-blue-600 underline">Login</Link>
        <Link to="/register" className="text-blue-600 underline">Register</Link>
      </div>
      <h2 className="text-xl font-semibold mb-2">Featured Templates</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map(t => (
          <div key={t.id} className="border rounded p-4 bg-white shadow">
            <h3 className="font-bold">{t.name}</h3>
            <p>{t.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}