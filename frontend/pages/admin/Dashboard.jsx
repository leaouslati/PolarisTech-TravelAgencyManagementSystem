import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  CalendarCheck,
  DollarSign,
  Package,
  BarChart2,
  Receipt,
  PackageCheck,
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

function StatCard({ title, value, accent, Icon }) {
  const map = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      iconCls: 'text-blue-600 dark:text-blue-400',
      border: 'border-l-blue-500',
    },
    yellow: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      iconCls: 'text-yellow-600 dark:text-yellow-400',
      border: 'border-l-yellow-500',
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      iconCls: 'text-green-600 dark:text-green-400',
      border: 'border-l-green-500',
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      iconCls: 'text-red-600 dark:text-red-400',
      border: 'border-l-red-500',
    },
  };

  const c = map[accent] || map.blue;

  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 ${c.border} shadow-sm p-5 flex items-center justify-between`}
    >
      <div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
          {title}
        </p>
        <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
      </div>
      <div className={`p-3 rounded-xl ${c.bg}`}>
        <Icon className={`h-5 w-5 ${c.iconCls}`} />
      </div>
    </div>
  );
}

const quickNav = [
  {
    label: 'Manage Users',
    to: '/admin/users',
    Icon: Users,
    desc: 'View, edit, and deactivate user accounts',
  },
  {
    label: 'Monitoring',
    to: '/admin/monitoring',
    Icon: BarChart2,
    desc: 'Track all bookings and packages',
  },
  {
    label: 'Reports',
    to: '/admin/reports',
    Icon: Receipt,
    desc: 'Generate revenue reports by date range',
  },
  {
    label: 'Package Updates',
    to: '/admin/package-updates',
    Icon: PackageCheck,
    desc: 'Review and approve agent update requests',
  },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBookings: 0,
    totalRevenue: 0,
    pendingUpdates: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        setError('');

        const [usersRes, bookingsRes, updatesRes, reportRes] = await Promise.all([
          api.get('/admin/users'),
          api.get('/admin/bookings'),
          api.get('/admin/package-updates'),
          api.get('/admin/reports/revenue', {
            params: {
              startDate: '2000-01-01',
              endDate: '2100-12-31',
            },
          }),
        ]);

        setStats({
          totalUsers: usersRes.data.data?.length || 0,
          totalBookings: bookingsRes.data.data?.length || 0,
          pendingUpdates: updatesRes.data.data?.length || 0,
          totalRevenue: Number(reportRes.data.data?.total_revenue || 0),
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-black dark:text-white">
            Welcome back, {user?.full_name || user?.username}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            Here's a live overview of the platform
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-4 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 h-28 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
            <StatCard title="Total Users" value={stats.totalUsers.toLocaleString()} accent="blue" Icon={Users} />
            <StatCard
              title="Total Bookings"
              value={stats.totalBookings.toLocaleString()}
              accent="yellow"
              Icon={CalendarCheck}
            />
            <StatCard
              title="Total Revenue"
              value={`$${stats.totalRevenue.toLocaleString()}`}
              accent="green"
              Icon={DollarSign}
            />
            <StatCard
              title="Pending Updates"
              value={stats.pendingUpdates.toLocaleString()}
              accent="red"
              Icon={Package}
            />
          </div>
        )}

        <div className="mb-8">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
            Quick Navigation
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickNav.map(({ label, to, Icon, desc }) => (
              <Link
                key={to}
                to={to}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 hover:bg-blue-50 dark:hover:bg-slate-700 hover:border-blue-200 dark:hover:border-slate-600 transition-all duration-200 group"
              >
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg w-fit mb-3 group-hover:bg-white dark:group-hover:bg-blue-900/20 transition-colors">
                  <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-[1.08rem] font-semibold text-slate-800 dark:text-slate-100">
                  {label}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}