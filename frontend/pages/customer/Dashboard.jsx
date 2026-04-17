import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const formatDate = (d) => {
  if (!d) return '';
  const [year, month, day] = d.split('T')[0].split('-');
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
};

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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
          setRecommendations(res.data.data.slice(0, 4)); // Up to 4
        }
      } catch (err) {
        setError('Failed to load recommendations');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [user]);

  const navCards = [
    {
      title: 'Browse Packages',
      description: 'Explore all available travel packages',
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      path: '/customer/browse',
    },
    {
      title: 'My Bookings',
      description: 'View and manage your bookings',
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      path: '/customer/bookings',
    },
    {
      title: 'My Wishlist',
      description: 'Saved packages for later',
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      path: '/customer/wishlist',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-screen-2xl mx-auto px-6 py-10">
        {/* Welcome */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            Welcome back, {user?.full_name || 'Customer'}!
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Ready to plan your next adventure?
          </p>
        </div>

        {/* Quick Navigation */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {navCards.map((card, idx) => (
            <div
              key={idx}
              onClick={() => navigate(card.path)}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 cursor-pointer hover:-translate-y-1 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg">
                  {card.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">
                    {card.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {card.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recommendations */}
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">
            Recommended for You
          </h2>

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
              <p className="text-slate-600 dark:text-slate-400">No recommendations available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
              {recommendations.map(pkg => (
                <div
                  key={pkg.package_id}
                  onClick={() => navigate(`/customer/packages/${pkg.package_id}`)}
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
};

export default CustomerDashboard;
