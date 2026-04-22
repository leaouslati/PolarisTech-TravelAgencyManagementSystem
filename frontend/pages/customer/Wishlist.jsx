import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Heart } from 'lucide-react';

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
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-slate-800 dark:text-slate-100 text-left">My Wishlist</h1>
          <p className="text-base text-slate-500 dark:text-slate-400 mt-2 text-left">Saved packages for later</p>
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
              <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">You haven't saved any packages yet.</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Browse our packages and save your favorites here.</p>
            <button
              onClick={() => navigate('/customer/browse')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Browse Packages
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map(pkg => (
              <div
                key={pkg.package_id}
                aria-label={`View ${pkg.package_name} Package, $${pkg.total_price?.toLocaleString()}`}
                className="flex bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden relative"
              >
                {/* Remove from wishlist button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromWishlist(pkg.package_id);
                  }}
                  aria-label="Remove from wishlist"
                  className="absolute top-3 right-3 p-1.5 bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 rounded-full shadow border border-slate-200 dark:border-slate-600"
                  title="Remove from wishlist"
                >
                  <Heart size={20} color="currentColor" />
                </button>

                {/* Left: Image section (as before) */}
                <div
                  onClick={() => navigate(`/customer/packages/${pkg.package_id}`)}
                  className="flex items-center justify-center w-32 h-32 bg-blue-100 dark:bg-blue-900/30 rounded-l-xl cursor-pointer"
                >
                  <span className="text-2xl font-bold text-blue-500 dark:text-slate-300">
                    {pkg.destination.city}
                  </span>
                </div>

                {/* Right: Name and cost */}
                <div
                  onClick={() => navigate(`/customer/packages/${pkg.package_id}`)}
                  className="flex flex-col justify-center flex-1 px-6 py-4 cursor-pointer"
                >
                  <h3 className="font-semibold text-xl text-slate-800 dark:text-slate-100 mb-2">
                    {pkg.package_name}
                  </h3>
                  <div className="flex items-center gap-3">
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
