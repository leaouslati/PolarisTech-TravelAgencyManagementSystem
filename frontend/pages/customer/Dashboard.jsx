
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Search, CalendarCheck, Heart } from 'lucide-react';

const formatDate = (d) => {
  if (!d) return '';
  const [year, month, day] = d.split('T')[0].split('-');
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
};

const navCards = [
  {
    title: 'Browse Packages',
    description: 'Explore all available travel packages',
    icon: Search,
    path: '/customer/browse',
  },
  {
    title: 'My Bookings',
    description: 'View and manage your bookings',
    icon: CalendarCheck,
    path: '/customer/bookings',
  },
  {
    title: 'My Wishlist',
    description: 'Saved packages for later',
    icon: Heart,
    path: '/customer/wishlist',
  },
];


export default function CustomerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const res = await api.get(`/packages/recommendations/${user.user_id}`);
        if (res.data.status === 'success') {
          setRecommendations(res.data.data.slice(0, 4));
        }
      } catch (err) {
        setError('Failed to load recommendations');
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendations();
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-8">
        {/* Hero Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-black dark:text-white">
            Welcome back, {user?.full_name || 'Customer'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">Ready to plan your next adventure?</p>
        </div>

        {/* Quick Navigation */}
        <div className="mb-8">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Quick Navigation</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
     {navCards.map(({ title, description, icon: Icon, path }) => (
  <div
    key={path}
    onClick={() => navigate(path)}
    className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5
               hover:bg-blue-50 dark:hover:bg-slate-700 hover:border-blue-200 dark:hover:border-slate-600
               transition-all duration-200 group cursor-pointer"
  >
    <div className="mb-3 w-fit p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40">
      <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
    </div>

    <p className="text-[1.08rem] font-semibold text-slate-800 dark:text-slate-100">
      {title}
    </p>
    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
      {description}
    </p>
  </div>
))}
          </div>
        </div>



        {/* Recommendations */}
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
            Recommended for You
          </p>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-pulse">
                  <div className="h-44 bg-slate-200 dark:bg-slate-700" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                    <div className="flex gap-2">
                      <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
                      <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                      <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-slate-600 dark:text-slate-400 mb-4">No recommendations available yet.</p>
              <button
                onClick={() => navigate('/customer/browse')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Browse Packages
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
              {recommendations.map(pkg => (
                <div
                  key={pkg.package_id}
                  onClick={() => navigate(`/customer/packages/${pkg.package_id}`)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigate(`/customer/packages/${pkg.package_id}`)}
                  role="button"
                  tabIndex={0}
                  aria-label={`View ${pkg.package_name} Package, $${pkg.total_price?.toLocaleString()}, ${pkg.duration} days`}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-md transition-all duration-200"
                >
                  {/* Image area */}
                  <div className="h-44 bg-linear-to-br from-blue-100 to-blue-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
                    <span className="text-2xl font-bold text-blue-500 dark:text-slate-300">
                      {pkg.destination.city}
                    </span>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-slate-800 dark:text-slate-100">
                        {pkg.package_name}
                      </h3>
                      <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${
                        pkg.available_slots > 5
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                          : pkg.available_slots > 0
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400'
                            : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
                      }`}>
                        {pkg.available_slots} slots
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                      {pkg.destination.city}, {pkg.destination.country}
                    </p>

                    {pkg.moods?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {pkg.moods.map(mood => (
                          <span
                            key={mood}
                            className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-800"
                          >
                            {mood}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Date + duration row */}
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-3">
                      <span className="flex items-center gap-1">
                        <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(pkg.travel_date)}
                      </span>
                      <span className="text-slate-300 dark:text-slate-600">·</span>
                      <span>{pkg.duration} days</span>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
                      <span className="text-xs text-slate-400 dark:text-slate-500">per person</span>
                      <span className="text-base font-bold text-blue-600 dark:text-blue-400">
                        ${pkg.total_price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
