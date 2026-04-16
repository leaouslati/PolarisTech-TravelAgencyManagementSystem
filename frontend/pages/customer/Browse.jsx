import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Layout from '../../components/Layout';
import './Browse.css';

const MOOD_OPTIONS = ['Adventure', 'Relaxation', 'Cultural', 'Family', 'Romantic'];

const Browse = () => {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(5000);
  const [selectedDate, setSelectedDate] = useState('');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Fetch packages on mount and when filters change
  useEffect(() => {
    fetchPackages();
  }, [selectedMood, minPrice, maxPrice, selectedDate]);

  const fetchPackages = async (overrideParams = {}) => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        destination: searchQuery || undefined,
        mood: selectedMood || undefined,
        minPrice,
        maxPrice,
        date: selectedDate || undefined,
        ...overrideParams,
      };

      const response = await api.get('/packages', { params });
      if (response.data.status === 'success') {
        setPackages(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching packages:', err);
      setError('Failed to load packages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle mood filter
  const toggleMood = (mood) => {
    setSelectedMood((prev) => (prev === mood ? '' : mood));
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedMood('');
    setMinPrice(0);
    setMaxPrice(5000);
    setSelectedDate('');
    fetchPackages({
      destination: undefined,
      mood: undefined,
      minPrice: 0,
      maxPrice: 5000,
      date: undefined,
    });
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    fetchPackages();
    setShowFilterDrawer(false);
  };

  // Skeleton loader
  const SkeletonCard = () => (
    <div className="package-card skeleton">
      <div className="skeleton-image"></div>
      <div className="skeleton-content">
        <div className="skeleton-title"></div>
        <div className="skeleton-text"></div>
        <div className="skeleton-text" style={{ width: '60%' }}></div>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="browse-container">
        {/* Header */}
        <div className="browse-header">
          <h1>Explore Travel Packages</h1>
          <p>Find your perfect getaway</p>
        </div>

        <div className="browse-content">
          {/* Sidebar Filters (Desktop) */}
          <aside className={`filters-sidebar ${showFilterDrawer ? 'open' : ''}`}>
            <div className="filters-header">
              <h3>Filters</h3>
              <button
                className="close-drawer"
                onClick={() => setShowFilterDrawer(false)}
              >
                ✕
              </button>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="filter-section">
              <label>Destination</label>
              <div className="search-row">
                <input
                  type="text"
                  placeholder="City or country..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                <button type="submit" className="search-button">
                  Search
                </button>
              </div>
            </form>

            {/* Mood Filter */}
            <div className="filter-section">
              <label>Mood</label>
              <div className="mood-chips">
                {MOOD_OPTIONS.map((mood) => (
                  <button
                    key={mood}
                    className={`mood-chip ${selectedMood === mood ? 'active' : ''}`}
                    onClick={() => toggleMood(mood)}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div className="filter-section">
              <label>Budget: ${minPrice} - ${maxPrice}</label>
              <input
                type="range"
                min="0"
                max="5000"
                value={minPrice}
                onChange={(e) => setMinPrice(Number(e.target.value))}
                className="price-slider"
              />
              <input
                type="range"
                min="0"
                max="5000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="price-slider"
              />
            </div>

            {/* Date Filter */}
            <div className="filter-section">
              <label>Travel Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="date-input"
              />
            </div>

            {/* Clear Filters */}
            <button className="clear-filters-btn" onClick={clearFilters}>
              Clear All Filters
            </button>
          </aside>

          {/* Main Content */}
          <main className="packages-section">
            {/* Mobile Filters Toggle */}
            <div className="mobile-filters-header">
              <button
                className="filters-toggle"
                onClick={() => setShowFilterDrawer(true)}
              >
                ⚙️ Filters
              </button>
              <span className="result-count">
                {packages.length} package{packages.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Error State */}
            {error && (
              <div className="error-message">
                <p>{error}</p>
                <button onClick={fetchPackages}>Try Again</button>
              </div>
            )}

            {/* Loading State */}
            {loading ? (
              <div className="packages-grid">
                {[...Array(6)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : packages.length === 0 ? (
              /* Empty State */
              <div className="empty-state">
                <div className="empty-icon">📦</div>
                <h2>No packages found</h2>
                <p>Try adjusting your filters to find more options</p>
                <button className="clear-filters-btn" onClick={clearFilters}>
                  Clear Filters
                </button>
              </div>
            ) : (
              /* Packages Grid */
              <div className="packages-grid">
                {packages.map((pkg) => (
                  <div
                    key={pkg.package_id}
                    className="package-card"
                    onClick={() => navigate(`/customer/packages/${pkg.package_id}`)}
                  >
                    <div className="package-image">
                      <div className="image-placeholder">
                        {pkg.destination.city}
                      </div>
                      <span className="available-badge">
                        {pkg.available_slots} slots
                      </span>
                    </div>
                    <div className="package-info">
                      <h3>{pkg.package_name}</h3>
                      <p className="destination">
                        📍 {pkg.destination.city}, {pkg.destination.country}
                      </p>
                      <div className="moods-list">
                        {pkg.moods?.map((mood) => (
                          <span key={mood} className="mood-tag">
                            {mood}
                          </span>
                        ))}
                      </div>
                      <div className="package-details">
                        <span className="duration">⏱️ {pkg.duration} days</span>
                        <span className="price">${pkg.total_price}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </Layout>
  );
};

export default Browse;
