import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AgentDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalPackages: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    pendingCancellations: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [packagesRes, bookingsRes, cancellationsRes] = await Promise.all([
          api.get('/agent/packages'),
          api.get('/agent/bookings'),
          api.get('/agent/cancellations'),
        ]);

        const bookings = bookingsRes.data.data;
        const cancellations = cancellationsRes.data.data;

        setStats({
          totalPackages: packagesRes.data.data.length,
          pendingBookings: bookings.filter(b => b.status === 'pending').length,
          confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
          pendingCancellations: cancellations.filter(c => c.status === 'pending').length,
        });

        setRecentBookings(bookings.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statusBadge = (status) => {
    if (status === 'confirmed') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (status === 'pending')   return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    if (status === 'cancelled') return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
    return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
  };

  const displayName = user?.username
    ? user.username.charAt(0).toUpperCase() + user.username.slice(1)
    : 'Agent';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-black dark:text-white mb-2">Welcome back</h1>
          <p className="text-base text-slate-500 dark:text-slate-400 mt-1">Here's an overview of your packages and bookings.</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 animate-pulse h-28" />
            ))
          ) : (
            <>
              <StatCard
                title="My Packages"
                value={stats.totalPackages}
                accent="blue"
                icon={
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V11" />
                  </svg>
                }
              />
              <StatCard
                title="Pending Bookings"
                value={stats.pendingBookings}
                accent="yellow"
                icon={
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                }
              />
              <StatCard
                title="Confirmed Bookings"
                value={stats.confirmedBookings}
                accent="green"
                icon={
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <StatCard
                title="Pending Cancellations"
                value={stats.pendingCancellations}
                accent="red"
                icon={
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ActionCard
              to="/agent/packages"
              label="Manage Packages"
              description="Create, edit and remove your travel packages"
              icon={
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V11" />
                </svg>
              }
            />
            <ActionCard
              to="/agent/bookings"
              label="View Bookings"
              description="Review and approve incoming booking requests"
              icon={
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
            />
            <ActionCard
              to="/agent/cancellations"
              label="Cancellations"
              description="Handle customer cancellation requests"
              icon={
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </div>
        </div>

        {/* Recent Bookings */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Recent Bookings
            </h2>
            <Link to="/agent/bookings" className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
              View all
            </Link>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-6 animate-pulse space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-10 bg-slate-100 dark:bg-slate-700 rounded" />
                ))}
              </div>
            ) : recentBookings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-slate-400 dark:text-slate-500">No bookings yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                      {['Booking ID', 'Customer', 'Package', 'Travel Date', 'Travelers', 'Status'].map(h => (
                        <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {recentBookings.map(b => (
                      <tr key={b.booking_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                        <td className="py-3 px-4 font-mono text-xs text-slate-500 dark:text-slate-400">{b.booking_id}</td>
                        <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">{b.customer_name}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{b.package_name}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{b.travel_date}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{b.num_travelers}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${statusBadge(b.status)}`}>
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

const accentMap = {
  blue:   { bg: 'bg-blue-50 dark:bg-blue-900/20',   icon: 'text-blue-600 dark:text-blue-400',   border: 'border-l-blue-500' },
  yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', icon: 'text-yellow-600 dark:text-yellow-400', border: 'border-l-yellow-500' },
  green:  { bg: 'bg-green-50 dark:bg-green-900/20',  icon: 'text-green-600 dark:text-green-400',  border: 'border-l-green-500' },
  red:    { bg: 'bg-red-50 dark:bg-red-900/20',      icon: 'text-red-600 dark:text-red-400',      border: 'border-l-red-500' },
};

function StatCard({ title, value, accent, icon }) {
  const a = accentMap[accent];
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 ${a.border} shadow-sm p-5`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <div className={`p-2 rounded-lg ${a.bg}`}>
          <span className={a.icon}>{icon}</span>
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-3">{value}</p>
    </div>
  );
}

function ActionCard({ to, label, description, icon, primary }) {
  // All actions: on hover, background becomes a bit bluer for better feedback
  // Make the label (e.g., 'Manage Packages', 'View Bookings', etc.) smaller as before (text-sm font-semibold)
  return (
    <Link
      to={to}
      className={`group flex items-center gap-4 p-5 rounded-xl border shadow-sm transition-all duration-200
        bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300
        hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-400 dark:hover:border-blue-500`}
    >
      <div className="p-2.5 rounded-lg shrink-0 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</p>
        <p className="text-xs mt-0.5 truncate text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      <svg className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

export default AgentDashboard;
