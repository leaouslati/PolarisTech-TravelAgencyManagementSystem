import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const PackageDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  useEffect(() => {
    const fetchPackage = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/packages/${id}`);
        if (res.data.status === 'success') {
          setPkg(res.data.data);
        } else {
          setError('Package not found');
        }
      } catch (err) {
        setError('Failed to load package');
      } finally {
        setLoading(false);
      }
    };

    const checkWishlist = async () => {
      if (!user) return;
      try {
        const res = await api.get('/packages/wishlist');
        if (res.data.status === 'success') {
          const inWishlist = res.data.data.some(p => p.package_id === parseInt(id));
          setIsInWishlist(inWishlist);
        }
      } catch (err) {
        // Ignore error for wishlist check
      }
    };

    fetchPackage();
    checkWishlist();
  }, [id, user]);

  const toggleWishlist = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setWishlistLoading(true);
    try {
      if (isInWishlist) {
        await api.delete(`/packages/wishlist/${id}`);
        setIsInWishlist(false);
      } else {
        await api.post('/packages/wishlist', { package_id: parseInt(id) });
        setIsInWishlist(true);
      }
    } catch (err) {
      // Handle error
    } finally {
      setWishlistLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !pkg) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Package Not Found</h1>
          <p className="text-slate-600 dark:text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-2">{pkg.package_name}</h1>
          <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
            <span>{pkg.destination.city}, {pkg.destination.country}</span>
            <span>•</span>
            <span>{formatDate(pkg.travel_date)} - {formatDate(pkg.return_date)}</span>
            <span>•</span>
            <span>{pkg.duration} days</span>
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="text-2xl font-semibold text-blue-600 dark:text-blue-400">${pkg.total_price.toLocaleString()}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {pkg.available_slots} slots available
            </div>
          </div>
          {/* Mood tags */}
          <div className="flex gap-2 mt-4">
            {pkg.moods.map(mood => (
              <span key={mood} className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full">
                {mood}
              </span>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-3">About This Package</h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{pkg.description}</p>
        </div>

        {/* Itinerary */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-3">Itinerary & Tours</h2>
          <div className="space-y-3">
            {pkg.tours.map((tour, idx) => (
              <details key={idx} className="group">
                <summary className="cursor-pointer flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/40 rounded-lg">
                  <span className="font-medium text-slate-800 dark:text-slate-100">{tour.tour_name}</span>
                  <svg className="h-5 w-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="mt-2 p-3 text-slate-600 dark:text-slate-400">
                  <p className="mb-2"><strong>Duration:</strong> {tour.duration} hours</p>
                  <p><strong>Included:</strong> {tour.included_services}</p>
                  <p className="mt-2 text-blue-600 dark:text-blue-400 font-medium">${tour.price}</p>
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Hotels & Flights */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-3">Hotels</h2>
            <div className="space-y-3">
              {pkg.hotels.map((hotel, idx) => (
                <div key={idx} className="border-b-2 border-slate-300 dark:border-slate-600 pb-3 last:border-0">
                  <h3 className="font-medium text-slate-800 dark:text-slate-100">{hotel.hotel_name}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Room: {hotel.room_types}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Rating: {hotel.rating}/5</p>
                  <p className="text-blue-600 dark:text-blue-400 font-medium">${hotel.price_per_night}/night</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-3">Flights</h2>
            <div className="space-y-3">
              {pkg.flights.map((flight, idx) => (
                <div key={idx} className="border-b-2 border-slate-300 dark:border-slate-600 pb-3 last:border-0">
                  <h3 className="font-medium text-slate-800 dark:text-slate-100">{flight.airline_name}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {flight.departure_location} → {flight.arrival_location}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {new Date(flight.departure_time).toLocaleString()} - {new Date(flight.arrival_time).toLocaleString()}
                  </p>
                  <p className="text-blue-600 dark:text-blue-400 font-medium">${flight.price}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Add-ons */}
        {pkg.add_ons && pkg.add_ons.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-0 mb-6 overflow-hidden">
            <div className="bg-blue-50 dark:bg-blue-900/40 px-6 py-3 rounded-t-xl">
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-wide m-0">Available Add-ons</h2>
            </div>
            <div className="space-y-2 px-6 py-4">
              {pkg.add_ons.map((addon) => (
                <div key={addon.addon_id} className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/40 rounded-lg">
                  <span className="text-slate-800 dark:text-slate-100">{addon.name}</span>
                  <span className="ml-auto text-blue-600 dark:text-blue-400 font-medium">${addon.price}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={toggleWishlist}
            disabled={wishlistLoading}
            aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              isInWishlist
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100'
            }`}
          >
            <svg className="h-5 w-5" fill={isInWishlist ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
          </button>
          <button
            onClick={() => navigate(`/customer/book/${id}`)}
            disabled={pkg.available_slots === 0}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
              pkg.available_slots === 0
                ? 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {pkg.available_slots === 0 ? 'Fully Booked' : 'Book Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PackageDetail;
