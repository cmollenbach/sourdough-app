import { Link } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import ActiveBakeIndicator from './ActiveBakeIndicator';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useSettings();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className={`bg-surface-elevated shadow ${darkMode ? "dark bg-surface text-white" : ""}`}>
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-4">
          <Link to="/" className="font-bold text-xl">SourdoughApp</Link>
          <div className="hidden md:flex items-center gap-4">
            <Link to="/recipes/1">Recipes</Link>
            <Link to="/bakes">Bakes</Link>
            <Link to="/history">History</Link>
            {/* Active Bake indicator */}
            <ActiveBakeIndicator time="00:40:13" isActive={true} />
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2">
          {/* Profile dropdown */}
          <div className="ml-4 relative" ref={dropdownRef}>
            <button
              className="flex items-center gap-1 px-2 py-1 rounded hover:bg-secondary-50"
              onClick={() => setOpen((v) => !v)}
              aria-haspopup="true"
              aria-expanded={open}
              aria-label="Profile menu"
            >
              <span className="rounded-full bg-gray-300 w-6 h-6 flex items-center justify-center">👤</span>
              <span>{user || "Profile"}</span>
              <span>▼</span>
            </button>
            {open && (
              <div className="absolute right-0 mt-2 w-40 bg-surface-elevated border rounded shadow-card z-10">
                <Link to="/account" className="block px-4 py-2 hover:bg-secondary-50">Account</Link>
                <Link to="/settings" className="block px-4 py-2 hover:bg-secondary-50">Settings</Link>
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-secondary-50"
                  onClick={logout}
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
        {/* Dark mode toggle */}
        <button
          className="ml-4 px-2 py-1 rounded border"
          onClick={toggleDarkMode}
          aria-label="Toggle dark mode"
        >
          {darkMode ? "🌙 Dark" : "☀️ Light"}
        </button>
        {/* Hamburger for mobile */}
        <button
          className="md:hidden flex items-center px-2 py-1"
          onClick={() => setMobileMenuOpen((v) => !v)}
          aria-label="Open navigation menu"
        >
          <span className="text-2xl">☰</span>
        </button>
      </div>
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pb-2">
          <div className="flex flex-col gap-2">
            <Link to="/recipes/1" onClick={() => setMobileMenuOpen(false)}>Recipes</Link>
            <Link to="/bakes" onClick={() => setMobileMenuOpen(false)}>Bakes</Link>
            <Link to="/history" onClick={() => setMobileMenuOpen(false)}>History</Link>
            <ActiveBakeIndicator time="00:40:13" isActive={true} />
            {/* Profile dropdown for mobile */}
            <div className="relative" ref={dropdownRef}>
              <button
                className="flex items-center gap-1 px-2 py-1 rounded hover:bg-secondary-50"
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="true"
                aria-expanded={open}
                aria-label="Profile menu"
              >
                <span className="rounded-full bg-gray-300 w-6 h-6 flex items-center justify-center">👤</span>
                <span>{user || "Profile"}</span>
                <span>▼</span>
              </button>
              {open && (
                <div className="absolute right-0 mt-2 w-40 bg-surface-elevated border rounded shadow-card z-10">
                  <Link to="/account" className="block px-4 py-2 hover:bg-secondary-50">Account</Link>
                  <Link to="/settings" className="block px-4 py-2 hover:bg-secondary-50">Settings</Link>
                  <button
                    className="block w-full text-left px-4 py-2 hover:bg-secondary-50"
                    onClick={logout}
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
