import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const formatDate = (d) => {
  if (!d) return '';
  const [year, month, day] = d.split('T')[0].split('-');
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
};

const Wishlist = () => {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/packages/wishlist');
      if (res.data.status === 'success') {
        setPackages(res.data.data);
      }
    } catch (err) {
      setError('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const removeFromWishlist = async (packageId) => {
    try {
      await api.delete(`/packages/wishlist/${packageId}`);
      setPackages(prev => prev.filter(pkg => pkg.package_id !== packageId));
    } catch (err) {
      // Handle error
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-screen-2xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">My Wishlist</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Saved packages for later</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {packages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">No saved packages yet</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Start exploring and save your favorite packages.</p>
            <button
              onClick={() => navigate('/customer/browse')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Browse Packages
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
            {packages.map(pkg => (
              <div
                key={pkg.package_id}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all duration-200 relative"
              >
                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromWishlist(pkg.package_id);
                  }}
                  className="absolute top-3 right-3 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Image area */}
                <div
                  onClick={() => navigate(`/customer/packages/${pkg.package_id}`)}
                  className="h-44 bg-linear-to-br from-blue-100 to-blue-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center cursor-pointer group"
                >
                  <span className="text-2xl font-bold text-blue-500 dark:text-slate-300">
                    {pkg.destination.city}
                  </span>
                  {/* Heart icon for remove */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromWishlist(pkg.package_id);
                    }}
                    className="absolute top-3 right-3 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-100 transition-opacity"
                  >
                    <svg className="h-4 w-4" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>

                <div
                  onClick={() => navigate(`/customer/packages/${pkg.package_id}`)}
                  className="p-4 cursor-pointer"
                >
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
  );
};

export default Wishlist;
