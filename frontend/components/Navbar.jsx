import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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
    <nav className="bg-white dark:bg-[#1a2332] border-b border-gray-200 dark:border-[#2d3a53] px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
      <Link to="/" className="text-xl font-bold tracking-tight text-blue-600 dark:text-blue-400" replace>
        PolarisTech
      </Link>

      {/* Desktop links */}
      <div className="hidden md:flex items-center gap-6">
        {getLinks().map(link => {
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm px-1 pb-0.5 font-semibold transition relative
                ${isActive
                  ? 'text-blue-600 dark:text-blue-400 after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-0.5 after:bg-blue-600 dark:after:bg-blue-400 after:rounded-full after:content-[""]'
                  : 'text-gray-700 dark:text-blue-200'}`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-4">
        {user && <NotificationBell iconClass="h-5 w-5" />}

        {/* Dark mode toggle */}
        <button
          onClick={() => setDark(!dark)}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#232e47] transition"
          aria-label="Toggle dark mode"
        >
          {dark ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1zm6.364 2.636a1 1 0 0 1 0 1.414l-.707.707a1 1 0 1 1-1.414-1.414l.707-.707a1 1 0 0 1 1.414 0zM21 11a1 1 0 1 1 0 2h-1a1 1 0 1 1 0-2h1zM12 18a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1zm-6.364-1.636a1 1 0 0 1 1.414 0l.707.707a1 1 0 1 1-1.414 1.414l-.707-.707a1 1 0 0 1 0-1.414zM4 11a1 1 0 1 1 0 2H3a1 1 0 1 1 0-2h1zm2.343-5.657a1 1 0 0 1 1.414 1.414l-.707.707A1 1 0 0 1 5.636 6.05l.707-.707zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700 dark:text-blue-200" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/>
            </svg>
          )}
        </button>

        {/* Desktop Logout as text */}
        {user && (
          <span
            onClick={logout}
            className="hidden md:inline cursor-pointer text-sm font-semibold text-red-500 ml-4 select-none hover:underline"
            tabIndex={0}
            role="button"
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') logout(); }}
          >
            Logout
          </span>
        )}

        {/* Mobile hamburger */}
        <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          <svg className="h-6 w-6 text-gray-700 dark:text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white dark:bg-[#1a2332] border-b border-gray-200 dark:border-[#2d3a53] flex flex-col px-6 py-4 gap-3 md:hidden shadow-lg">
          {getLinks().map(link => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`text-base px-1 py-2 font-semibold transition relative
                  ${isActive
                    ? 'text-blue-600 dark:text-blue-400 after:absolute after:left-0 after:right-0 after:bottom-0 after:h-0.5 after:bg-blue-600 dark:after:bg-blue-400 after:rounded-full after:content-["""]'
                    : 'text-gray-700 dark:text-blue-200'}`}
              >
                {link.label}
              </Link>
            );
          })}
          {user && (
            <button
              onClick={() => { setMenuOpen(false); logout(); }}
              className="mt-2 text-base font-semibold text-red-500 bg-red-50 dark:bg-[#232e47] rounded-lg py-2 transition border border-red-200 dark:border-[#2d3a53] hover:bg-red-100 dark:hover:bg-[#232e47]/80 focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              Logout
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;