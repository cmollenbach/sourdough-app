import { Link } from 'react-router-dom';

const settingsLinks: Array<{ to: string; title: string; description: string }> = [
  {
    to: "/settings/ingredients",
    title: "Ingredients Management",
    description: "Manage ingredient libraries, hydration targets, and categories.",
  },
  {
    to: "/settings/entity-requests",
    title: "Entity Requests (Admin)",
    description: "Review and approve community submissions for shared entities.",
  },
  {
    to: "/settings/user",
    title: "User Preferences",
    description: "Update your profile, notifications, and display preferences.",
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-text-primary">Settings</h1>
        <p className="text-text-secondary">
          Configure Loafly for your baking workflow and manage collaboration tools.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        {settingsLinks.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="group block rounded-2xl border border-border bg-surface-elevated p-5 shadow-soft transition-colors hover:border-primary-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
          >
            <h2 className="text-lg font-semibold text-text-primary">{item.title}</h2>
            <p className="mt-2 text-sm text-text-secondary transition-colors group-hover:text-text-primary">
              {item.description}
            </p>
            <span className="mt-4 inline-flex items-center text-sm font-semibold text-primary-600 transition-colors group-hover:text-primary-500">
              Manage
              <span aria-hidden="true" className="ml-1">
                →
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}