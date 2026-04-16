import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const AgentDashboard = () => {
  const [stats, setStats] = useState({
    totalPackages: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [packagesRes, bookingsRes] = await Promise.all([
          axios.get('/api/agent/packages'),
          axios.get('/api/agent/bookings')
        ]);

        const bookings = bookingsRes.data;

        setStats({
          totalPackages: packagesRes.data.length,
          pendingBookings: bookings.filter(b => b.status === 'pending').length,
          confirmedBookings: bookings.filter(b => b.status === 'confirmed').length
        });

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Agent Dashboard
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Overview of your packages and bookings
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {loading ? (
          // Skeletons
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 animate-pulse">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-2" />
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
            </div>
          ))
        ) : (
          <>
            <StatCard title="My Packages" value={stats.totalPackages} />
            <StatCard title="Pending Bookings" value={stats.pendingBookings} />
            <StatCard title="Confirmed Bookings" value={stats.confirmedBookings} />
            <StatCard title="Pending Cancellations" value={0} />
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 flex flex-wrap gap-4">
        <Link
          to="/agent/packages"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
        >
          Manage Packages
        </Link>

        <Link
          to="/agent/bookings"
          className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg border border-slate-200 transition-colors duration-200
          dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700"
        >
          View Bookings
        </Link>

        <Link
          to="/agent/cancellations"
          className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg border border-slate-200 transition-colors duration-200
          dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700"
        >
          Cancellations
        </Link>
      </div>

    </div>
  );
};

function StatCard({ title, value }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        {title}
      </p>
      <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">
        {value}
      </p>
    </div>
  );
}

export default AgentDashboard;