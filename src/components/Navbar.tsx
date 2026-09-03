import { Link, NavLink, useNavigate } from 'react-router-dom';
import { HeartHandshake, Menu, X, LogIn, LogOut, LayoutDashboard, Search, Sun, Moon } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/needs', label: 'School Needs' },
  { to: '/survey', label: 'Survey Report' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { isAdmin, user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  const desktopAction = isAdmin ? (
    <Link
      to="/admin"
      className="ml-2 flex items-center gap-1.5 rounded-lg bg-cta-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-cta-600 hover:shadow-md"
    >
      <LayoutDashboard className="h-4 w-4" />
      Dashboard
    </Link>
  ) : user ? (
    <div className="ml-2 flex items-center gap-2">
      <Link
        to="/track"
        className="flex items-center gap-1.5 rounded-lg border border-navy-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-700"
      >
        <Search className="h-4 w-4" />
        Track Donation
      </Link>
      <button
        onClick={handleSignOut}
        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-navy-100 transition-colors hover:bg-navy-700 hover:text-white"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>
    </div>
  ) : (
    <Link
      to="/signin"
      className="ml-2 flex items-center gap-1.5 rounded-lg bg-cta-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-cta-600 hover:shadow-md"
    >
      <LogIn className="h-4 w-4" />
      Sign In
    </Link>
  );

  const mobileAction = isAdmin ? (
    <Link
      to="/admin"
      onClick={() => setOpen(false)}
      className="flex items-center gap-1.5 rounded-lg bg-cta-500 px-4 py-3 text-base font-semibold text-white"
    >
      <LayoutDashboard className="h-4 w-4" />
      Dashboard
    </Link>
  ) : user ? (
    <div className="space-y-1">
      <Link
        to="/track"
        onClick={() => setOpen(false)}
        className="flex items-center gap-1.5 rounded-lg border border-navy-600 px-4 py-3 text-base font-semibold text-white"
      >
        <Search className="h-4 w-4" />
        Track Donation
      </Link>
      <button
        onClick={() => { setOpen(false); handleSignOut(); }}
        className="flex w-full items-center gap-1.5 rounded-lg px-4 py-3 text-base font-medium text-navy-100 hover:bg-navy-700"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>
    </div>
  ) : (
    <Link
      to="/signin"
      onClick={() => setOpen(false)}
      className="flex items-center gap-1.5 rounded-lg bg-cta-500 px-4 py-3 text-base font-semibold text-white"
    >
      <LogIn className="h-4 w-4" />
      Sign In
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 bg-navy-800 text-white shadow-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold tracking-tight">
            <HeartHandshake className="h-7 w-7 text-cta-400" />
            <span>SchoolCare<span className="text-cta-400"> Connect</span></span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    isActive ? 'bg-navy-700 text-white' : 'text-navy-100 hover:bg-navy-700/60 hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            {desktopAction}
            <button
              onClick={toggleTheme}
              className="ml-1 rounded-lg p-2 text-white transition-colors hover:bg-navy-700"
              aria-label="Toggle dark mode"
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>
          </nav>

          <button
            className="rounded-lg p-2 text-white hover:bg-navy-700 md:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-navy-700 bg-navy-800 md:hidden">
          <div className="space-y-1 px-4 py-3">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `block rounded-lg px-4 py-3 text-base font-medium transition-colors ${
                    isActive ? 'bg-navy-700 text-white' : 'text-navy-100 hover:bg-navy-700/60'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            {mobileAction}
            <button
              onClick={toggleTheme}
              className="mt-2 flex items-center justify-center gap-1.5 rounded-lg border border-navy-600 px-4 py-3 text-base font-semibold text-white"
            >
              {theme === 'light' ? <><Moon className="h-5 w-5" /> Dark Mode</> : <><Sun className="h-5 w-5" /> Light Mode</>}
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}
