import { Link, NavLink } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import ActiveBakeIndicator from './ActiveBakeIndicator'; // Assuming this component exists
import { useAuth } from '../../hooks/useAuthHook'; // Updated import path
import { useSettings } from '../../context/SettingsContext';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useSettings();
  
  console.log('Navbar user:', user); // <-- Add this line

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
    <nav className="bg-surface-elevated shadow-md text-text-primary">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link to={user ? "/recipes" : "/"} className="font-bold text-xl text-primary-500">
              Sourdough
            </Link>
            <div className="hidden md:flex items-baseline space-x-4">
              <NavLink to="/recipes" className="px-3 py-2 rounded-md text-sm font-medium" activeClassName="bg-primary-50 text-primary-600">Recipes</NavLink>
              <NavLink to="/bakes" className="px-3 py-2 rounded-md text-sm font-medium" activeClassName="bg-primary-50 text-primary-600">Bakes</NavLink>
              <NavLink to="/history" className="px-3 py-2 rounded-md text-sm font-medium" activeClassName="bg-primary-50 text-primary-600">History</NavLink>
              {user?.role === 'ADMIN' && (
                <NavLink to="/admin/step-templates" className="px-3 py-2 rounded-md text-sm font-medium" activeClassName="bg-accent-50 text-accent-600">
                  Admin
                </NavLink>
              )}
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <ActiveBakeIndicator time="00:40:13" isActive={true} /> {/* Placeholder time */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-surface-subtle" // Added gap-2 for spacing
                aria-label="Profile menu"
              >
                <span className="w-8 h-8 rounded-full bg-secondary-200 text-secondary-700 flex items-center justify-center font-semibold">
                  {user?.email?.[0].toUpperCase() || 'P'}
                </span>
                {user?.role === 'ADMIN' && (
                  <span className="text-xs font-semibold text-accent-600 dark:text-accent-400 pr-1">
                    Admin
                  </span>
                )}
              </button>
              {open && (
                <div className="absolute right-0 mt-2 w-48 bg-surface-elevated border border-border-subtle rounded-md shadow-lg z-20">
                  <div className="px-4 py-2 text-sm text-text-secondary border-b border-border-subtle">{user?.email}</div>
                  <Link to="/account" className="block px-4 py-2 text-sm hover:bg-surface-subtle">Account</Link>
                  <Link to="/settings" className="block px-4 py-2 text-sm hover:bg-surface-subtle">Settings</Link>
                  <button
                    onClick={logout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
            <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-surface-subtle">
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
          <div className="md:hidden">
            <button onClick={() => setMobileMenuOpen(o => !o)} aria-label="Open main menu">
              ☰
            </button>
          </div>
        </div>
      </div>
      {mobileMenuOpen && (
        <div className="md:hidden px-2 pt-2 pb-3 space-y-1">
          {/* Mobile links: Replicate NavLink structure here for consistency, using activeClassName for v5 */}
          <NavLink to="/recipes" className="block px-3 py-2 rounded-md text-base font-medium text-text-primary hover:bg-surface-subtle" activeClassName="bg-primary-50 text-primary-600" onClick={() => setMobileMenuOpen(false)}>Recipes</NavLink>
          <NavLink to="/bakes" className="block px-3 py-2 rounded-md text-base font-medium text-text-primary hover:bg-surface-subtle" activeClassName="bg-primary-50 text-primary-600" onClick={() => setMobileMenuOpen(false)}>Bakes</NavLink>
          <NavLink to="/history" className="block px-3 py-2 rounded-md text-base font-medium text-text-primary hover:bg-surface-subtle" activeClassName="bg-primary-50 text-primary-600" onClick={() => setMobileMenuOpen(false)}>History</NavLink>
          {user?.role === 'ADMIN' && (
            <NavLink to="/admin/step-templates" className="block px-3 py-2 rounded-md text-base font-medium text-text-primary hover:bg-surface-subtle" activeClassName="bg-accent-50 text-accent-600" onClick={() => setMobileMenuOpen(false)}>
              Admin
            </NavLink>
          )}
          {/* User-specific links for mobile */}
          {user && (
            <>
              <hr className="my-2 border-border-subtle" />
              <div className="px-3 py-2 text-sm text-text-secondary">
                {user.email}
                {user.role === 'ADMIN' && (
                  <span className="ml-2 text-xs font-semibold text-accent-600 dark:text-accent-400">(Admin)</span>
                )}
              </div>
              <NavLink to="/account" className="block px-3 py-2 rounded-md text-base font-medium text-text-primary hover:bg-surface-subtle" onClick={() => setMobileMenuOpen(false)}>Account</NavLink>
              <NavLink to="/settings" className="block px-3 py-2 rounded-md text-base font-medium text-text-primary hover:bg-surface-subtle" onClick={() => setMobileMenuOpen(false)}>Settings</NavLink>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
              >
                Log out
              </button>
            </>
          )}
          <hr className="my-2 border-border-subtle" />
          <button onClick={() => { toggleDarkMode(); setMobileMenuOpen(false); }} className="w-full flex justify-between items-center px-3 py-2 rounded-md text-base font-medium text-text-primary hover:bg-surface-subtle">
            <span>Dark Mode</span>
            <span>{darkMode ? '☀️' : '🌙'}</span>
          </button>
        </div>
      )}
    </nav>
  );
}
