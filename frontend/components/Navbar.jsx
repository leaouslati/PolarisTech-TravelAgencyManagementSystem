import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  const getLinks = () => {
    if (!user) return [];
    if (user.role === 'Customer') return [
      { label: 'Dashboard', to: '/customer/dashboard' },
      { label: 'Browse', to: '/customer/browse' },
      { label: 'My Bookings', to: '/customer/bookings' },
      { label: 'Wishlist', to: '/customer/wishlist' },
      { label: 'Profile', to: '/customer/profile' }
    ];
    if (user.role === 'TravelAgent') return [
      { label: 'Dashboard', to: '/agent/dashboard' },
      { label: 'Packages', to: '/agent/packages' },
      { label: 'Bookings', to: '/agent/bookings' },
      { label: 'Cancellations', to: '/agent/cancellations' }
    ];
    if (user.role === 'Administrator') return [
      { label: 'Dashboard', to: '/admin/dashboard' },
      { label: 'Users', to: '/admin/users' },
      { label: 'Monitoring', to: '/admin/monitoring' },
      { label: 'Reports', to: '/admin/reports' },
      { label: 'Package Updates', to: '/admin/package-updates' }
    ];
    return [];
  };

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
      <Link to="/" className="text-xl font-bold text-blue-600 dark:text-blue-400">
        PolarisTech
      </Link>

      {/* Desktop links */}
      <div className="hidden md:flex items-center gap-6">
        {getLinks().map(link => (
          <Link key={link.to} to={link.to}
            className="text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition">
            {link.label}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-4">
        {user && <NotificationBell />}

        {/* Dark mode toggle */}
        <button onClick={() => setDark(!dark)}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          aria-label="Toggle dark mode">
          {dark ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1zm6.364 2.636a1 1 0 0 1 0 1.414l-.707.707a1 1 0 1 1-1.414-1.414l.707-.707a1 1 0 0 1 1.414 0zM21 11a1 1 0 1 1 0 2h-1a1 1 0 1 1 0-2h1zM12 18a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1zm-6.364-1.636a1 1 0 0 1 1.414 0l.707.707a1 1 0 1 1-1.414 1.414l-.707-.707a1 1 0 0 1 0-1.414zM4 11a1 1 0 1 1 0 2H3a1 1 0 1 1 0-2h1zm2.343-5.657a1 1 0 0 1 1.414 1.414l-.707.707A1 1 0 0 1 5.636 6.05l.707-.707zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/>
            </svg>
          )}
        </button>

        {user && (
          <button onClick={logout}
            className="text-sm text-red-500 hover:text-red-700 dark:hover:text-red-400 transition">
            Logout
          </button>
        )}

        {/* Mobile hamburger */}
        <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          <svg className="h-5 w-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex flex-col px-6 py-4 gap-4 md:hidden">
          {getLinks().map(link => (
            <Link key={link.to} to={link.to}
              onClick={() => setMenuOpen(false)}
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600">
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;