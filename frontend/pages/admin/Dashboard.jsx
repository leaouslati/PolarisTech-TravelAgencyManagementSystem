import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, CalendarCheck, DollarSign, Package, BarChart2, Receipt, PackageCheck } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const statusColors = {
  pending:   'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
};

function StatCard({ title, value, accent, Icon }) {
  const map = {
    blue:   { bg: 'bg-blue-50 dark:bg-blue-900/20',   iconCls: 'text-blue-600 dark:text-blue-400',   border: 'border-l-blue-500' },
    yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', iconCls: 'text-yellow-600 dark:text-yellow-400', border: 'border-l-yellow-500' },
    green:  { bg: 'bg-green-50 dark:bg-green-900/20',  iconCls: 'text-green-600 dark:text-green-400',  border: 'border-l-green-500' },
    red:    { bg: 'bg-red-50 dark:bg-red-900/20',      iconCls: 'text-red-600 dark:text-red-400',      border: 'border-l-red-500' },
  };
  const c = map[accent] || map.blue;
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 ${c.border} shadow-sm p-5 flex items-center justify-between`}>
      <div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">{title}</p>
        <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
      </div>
      <div className={`p-3 rounded-xl ${c.bg}`}>
        <Icon className={`h-5 w-5 ${c.iconCls}`} />
      </div>
    </div>
  );
}

const quickNav = [
  { label: 'Manage Users', to: '/admin/users', Icon: Users, desc: 'View, edit, and deactivate user accounts' },
  { label: 'Monitoring', to: '/admin/monitoring', Icon: BarChart2, desc: 'Track all bookings and packages' },
  { label: 'Reports', to: '/admin/reports', Icon: Receipt, desc: 'Generate revenue reports by date range' },
  { label: 'Package Updates', to: '/admin/package-updates', Icon: PackageCheck, desc: 'Review and approve agent update requests' },
];

const TH = 'text-xs font-semibold text-slate-800 dark:text-white uppercase tracking-wide py-3 px-4 text-left';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/stats')
      .then(res => setStats(res.data.data))
      .catch(() => setError('Failed to load dashboard statistics'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-8">

        {/* Hero Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-black dark:text-white">
            Welcome back, {user?.full_name || user?.username}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">Here's a live overview of the platform</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-4 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Stat Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 h-28 animate-pulse" />
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
            <StatCard title="Total Users"      value={stats.total_users.toLocaleString()}             accent="blue"   Icon={Users} />
            <StatCard title="Total Bookings"   value={stats.total_bookings.toLocaleString()}           accent="yellow" Icon={CalendarCheck} />
            <StatCard title="Total Revenue"    value={`$${stats.total_revenue.toLocaleString()}`}      accent="green"  Icon={DollarSign} />
            <StatCard title="Pending Updates"  value={stats.pending_package_updates.toLocaleString()}  accent="red"    Icon={Package} />
          </div>
        ) : null}

        {/* Quick Nav */}
        <div className="mb-8">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Quick Navigation</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickNav.map(({ label, to, Icon, desc }) => (
              <Link
                key={to}
                to={to}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5
                           hover:bg-blue-50 dark:hover:bg-slate-700 hover:border-blue-200 dark:hover:border-slate-600
                           transition-all duration-200 group"
              >
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg w-fit mb-3 group-hover:bg-white dark:group-hover:bg-blue-900/20 transition-colors">
                  <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-[1.08rem] font-semibold text-slate-800 dark:text-slate-100">{label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{desc}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Bookings */}
        {stats?.recent_bookings?.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Recent Bookings</p>
              <Link to="/admin/monitoring" className="text-base text-blue-600 dark:text-blue-400 hover:underline font-bold">View all</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-blue-50 dark:bg-blue-900/40">
                    <th className={TH}>Booking ID</th>
                    <th className={TH}>Customer</th>
                    <th className={TH}>Package</th>
                    <th className={TH}>Destination</th>
                    <th className={TH}>Travel Date</th>
                    <th className={TH}>Status</th>
                    <th className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide py-3 px-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {stats.recent_bookings.map(b => (
                    <tr key={b.booking_id} className="transition-colors hover:bg-blue-50/40 dark:hover:bg-blue-900/10">
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">{b.booking_id}</td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-200">{b.customer_name}</td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-200">{b.package_name}</td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{b.destination}</td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{b.travel_date}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${statusColors[b.status] || 'bg-slate-100 text-slate-700'}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-100 text-right">${Number(b.total_price).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
