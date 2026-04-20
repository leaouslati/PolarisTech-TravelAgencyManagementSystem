import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const MOOD_OPTIONS = ['Adventure', 'Relaxation', 'Cultural', 'Family', 'Romantic'];

const formatDate = (d) => {
  if (!d) return '';
  const [year, month, day] = d.split('T')[0].split('-');
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
};

const SkeletonCard = () => (
  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-pulse flex flex-col">
    <div className="h-44 bg-slate-200 dark:bg-slate-700 shrink-0" />
    <div className="p-4 flex flex-col flex-1 space-y-3">
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
      <div className="flex gap-2">
        <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
        <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
      </div>
      <div className="flex justify-between pt-2 mt-auto border-t border-slate-100 dark:border-slate-700">
        <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
    </div>
  </div>
);

const FilterPanel = ({
  searchInput, onSearchInput, onSearch,
  minPrice, onMinPrice,
  maxPrice, onMaxPrice,
  selectedDate, onDate, onClear,
}) => (
  <div className="space-y-6">
    {/* Destination */}
    <form onSubmit={onSearch} className="space-y-2">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        Destination
      </label>
      <input
        type="text"
        placeholder="City or country..."
        value={searchInput}
        onChange={e => onSearchInput(e.target.value)}
        className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
      />
      <button
        type="submit"
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Search
      </button>
    </form>

    {/* Min Budget */}
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        Min Budget:{' '}
        <span className="text-blue-600 dark:text-blue-400 font-semibold">
          ${minPrice.toLocaleString()}
        </span>
      </label>
      <input
        type="range" min={0} max={5000} step={100} value={minPrice}
        onChange={e => onMinPrice(Number(e.target.value))}
        className="w-full accent-blue-600"
      />
      <div className="flex justify-between text-xs text-slate-400">
        <span>$0</span><span>$5,000</span>
      </div>
    </div>

    {/* Max Budget */}
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        Max Budget:{' '}
        <span className="text-blue-600 dark:text-blue-400 font-semibold">
          ${maxPrice.toLocaleString()}
        </span>
      </label>
      <input
        type="range" min={0} max={5000} step={100} value={maxPrice}
        onChange={e => onMaxPrice(Number(e.target.value))}
        className="w-full accent-blue-600"
      />
      <div className="flex justify-between text-xs text-slate-400">
        <span>$0</span><span>$5,000</span>
      </div>
    </div>

    {/* Travel Date */}
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        Travel Date
      </label>
      <input
        type="date"
        value={selectedDate}
        onChange={e => onDate(e.target.value)}
        className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
      />
    </div>

    {/* Clear Filters */}
    <button
      type="button"
      onClick={onClear}
      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
    >
      Clear Filters
    </button>
  </div>
);

const Browse = () => {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchInput, setSearchInput] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(5000);
  const [selectedDate, setSelectedDate] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchPackages = useCallback(async (params) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/packages', { params });
      if (res.data.status === 'success') setPackages(res.data.data);
    } catch {
      setError('Failed to load packages. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPackages({
      destination: destination || undefined,
      mood: selectedMood || undefined,
      minPrice: minPrice || undefined,
      maxPrice,
      date: selectedDate || undefined,
    });
  }, [destination, selectedMood, minPrice, maxPrice, selectedDate, fetchPackages]);

  const handleSearch = (e) => {
    e.preventDefault();
    setDestination(searchInput);
    setDrawerOpen(false);
  };

  const clearFilters = () => {
    setSearchInput('');
    setDestination('');
    setSelectedMood('');
    setMinPrice(0);
    setMaxPrice(5000);
    setSelectedDate('');
    setDrawerOpen(false);
  };

  const filterProps = {
    searchInput,
    onSearchInput: setSearchInput,
    onSearch: handleSearch,
    minPrice,
    onMinPrice: setMinPrice,
    maxPrice,
    onMaxPrice: setMaxPrice,
    selectedDate,
    onDate: setSelectedDate,
    onClear: clearFilters,
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-screen-2xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Explore Travel Packages</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Find your perfect getaway</p>
        </div>

        {/* Trip Mood Selector row */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {MOOD_OPTIONS.map(mood => (
            <button
              key={mood}
              onClick={() => setSelectedMood(prev => prev === mood ? '' : mood)}
              aria-pressed={selectedMood === mood}
              className={`px-5 py-2 rounded-full text-sm font-medium border transition-colors duration-200
                ${selectedMood === mood
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400'}`}
            >
              {mood}
            </button>
          ))}
        </div>

        <div className="flex gap-8 items-start">

          {/* Sidebar — desktop only */}
          <aside className="hidden lg:block w-72 shrink-0 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 sticky top-20">
            <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-5">
              Filters
            </h2>
            <FilterPanel {...filterProps} />
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">

            {/* Mobile toolbar */}
            <div className="flex items-center justify-between mb-4 lg:hidden">
              <button
                onClick={() => setDrawerOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                </svg>
                Filters
              </button>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {packages.length} package{packages.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-lg flex items-center justify-between">
                <span>{error}</span>
                <button
                  onClick={() => fetchPackages({ destination: destination || undefined, mood: selectedMood || undefined, minPrice: minPrice || undefined, maxPrice, date: selectedDate || undefined })}
                  className="text-xs font-medium underline ml-4 whitespace-nowrap"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Loading skeleton */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : packages.length === 0 ? (

              /* Empty state */
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <svg className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">No packages found</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Try adjusting your filters to find more options.</p>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
              </div>

            ) : (

              /* Package grid — flex flex-col on each card ensures equal height structure */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {packages.map(pkg => (
                  <div
                    key={pkg.package_id}
                    onClick={() => navigate(`/customer/packages/${pkg.package_id}`)}
                    aria-label={`View ${pkg.package_name} Package, $${pkg.total_price}, ${pkg.duration} days`}
                    className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-md transition-all duration-200 flex flex-col"
                  >
                    {/* Image area — fixed height, never shrinks */}
                    <div className="h-44 bg-linear-to-br from-blue-100 to-blue-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center shrink-0">
                      <span className="text-2xl font-bold text-blue-500 dark:text-slate-300">
                        {pkg.destination.city}
                      </span>
                    </div>

                    {/* Content — grows to fill remaining card height */}
                    <div className="p-4 flex flex-col flex-1">
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
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                        {pkg.destination.city}, {pkg.destination.country}
                      </p>

                      {/* Middle section grows — moods + date pushed to just above separator */}
                      <div className="flex-1 flex flex-col justify-end gap-2">
                        {pkg.moods?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
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
                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {formatDate(pkg.travel_date)}
                          </span>
                          <span className="text-slate-300 dark:text-slate-600">·</span>
                          <span>{pkg.duration} days</span>
                        </div>
                      </div>

                      {/* Separator + price — always at the bottom of every card */}
                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-700">
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

      {/* Mobile filter drawer */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setDrawerOpen(false)} />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            className="fixed bottom-0 left-0 right-0 h-3/4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 z-50 p-6 overflow-y-auto shadow-xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Filters
              </h2>
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Close filters"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <FilterPanel {...filterProps} />
          </div>
        </>
      )}
    </div>
  );
};

export default Browse;
