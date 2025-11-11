import { Link, NavLink } from 'react-router-dom';
import { useState, useRef, useEffect, useMemo } from 'react'; // Added useMemo here
import ActiveBakeIndicator from './ActiveBakeIndicator'; // Assuming this component exists
import { useAuth } from '../../hooks/useAuthHook'; // Updated import path
import { useSettings } from '../../context/SettingsContext';
import { useBakeStore } from '../../store/useBakeStore';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout, isLoading } = useAuth();
  const { darkMode, toggleDarkMode } = useSettings();
  const { activeBakes } = useBakeStore();

  // Determine the bake to display in the navbar indicator
  // For now, let's pick the most recent active bake if multiple exist.
  // Or, if you have a concept of a "current focused bake" in your store, you could use that.
  const displayBake = useMemo(() => {
    if (activeBakes.length > 0) {
      // Sort by startTimestamp descending to get the most recent
      const sortedBakes = [...activeBakes].sort((a, b) => new Date(b.startTimestamp).getTime() - new Date(a.startTimestamp).getTime());
      return sortedBakes[0];
    }
    return null;
  }, [activeBakes]);


  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Show skeleton during initial auth loading
  if (isLoading) {
    return (
      <nav className="bg-surface-elevated shadow-md text-text-primary">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-surface-elevated shadow-md text-text-primary">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link to={user ? "/recipes" : "/"} className="flex items-center space-x-3">
              <img src="/favicon.svg" alt="Loafly icon" className="w-12 h-8" />
              <div className="flex flex-col leading-tight">
                <span className="font-bold text-xl text-primary-500">Loafly</span>
                <span className="text-xs text-text-secondary">Sourdough app</span>
              </div>
            </Link>
            <div className="hidden md:flex items-baseline space-x-4">
              <NavLink 
                to="/recipes" 
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  user ? '' : 'opacity-50 cursor-not-allowed pointer-events-none'
                }`}
                activeClassName="bg-primary-50 text-primary-600"
              >
                Recipes
              </NavLink>
              <NavLink 
                to="/bakes" 
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  user ? '' : 'opacity-50 cursor-not-allowed pointer-events-none'
                }`}
                activeClassName="bg-primary-50 text-primary-600"
              >
                Bakes
              </NavLink>
              <NavLink 
                to="/history" 
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  user ? '' : 'opacity-50 cursor-not-allowed pointer-events-none'
                }`}
                activeClassName="bg-primary-50 text-primary-600"
              >
                History
              </NavLink>
              {user?.role === 'ADMIN' && (
                <NavLink to="/admin/step-templates" className="px-3 py-2 rounded-md text-sm font-medium" activeClassName="bg-accent-50 text-accent-600">
                  Admin
                </NavLink>
              )}
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <ActiveBakeIndicator 
              isActive={!!displayBake && displayBake.active} 
              startTimestamp={displayBake?.startTimestamp || null} 
            />
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
                  <Link to="/test/notifications" className="block px-4 py-2 text-sm text-amber-600 hover:bg-amber-50">🔔 Test Notifications</Link>
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
            <button 
              onClick={() => setMobileMenuOpen(o => !o)} 
              aria-label="Open main menu"
              className="p-2 rounded-md hover:bg-surface-subtle"
              type="button"
            >
              <span className="text-2xl">☰</span>
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
              <NavLink to="/test/notifications" className="block px-3 py-2 rounded-md text-base font-medium text-amber-600 hover:bg-amber-50" onClick={() => setMobileMenuOpen(false)}>🔔 Test Notifications</NavLink>
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
