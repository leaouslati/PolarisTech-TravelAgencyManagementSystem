import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Layout from '../../components/Layout';
import './Browse.css';

const MOOD_OPTIONS = ['Adventure', 'Relaxation', 'Culture', 'Luxury', 'Budget'];

const Browse = () => {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [filteredPackages, setFilteredPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMoods, setSelectedMoods] = useState([]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(5000);
  const [selectedDate, setSelectedDate] = useState('');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Fetch packages on mount
  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await api.get('/packages');
      if (response.data.status === 'success') {
        setPackages(response.data.data);
        setFilteredPackages(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching packages:', err);
      setError('Failed to load packages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let result = packages;

    // Search by destination
    if (searchQuery) {
      result = result.filter(
        (pkg) =>
          pkg.destination.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pkg.destination.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pkg.package_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by mood
    if (selectedMoods.length > 0) {
      result = result.filter((pkg) =>
        selectedMoods.some((mood) => pkg.moods?.includes(mood))
      );
    }

    // Filter by price
    result = result.filter(
      (pkg) => pkg.total_price >= minPrice && pkg.total_price <= maxPrice
    );

    // Filter by date
    if (selectedDate) {
      result = result.filter((pkg) => pkg.travel_date.startsWith(selectedDate));
    }

    setFilteredPackages(result);
  }, [packages, searchQuery, selectedMoods, minPrice, maxPrice, selectedDate]);

  // Toggle mood filter
  const toggleMood = (mood) => {
    setSelectedMoods((prev) =>
      prev.includes(mood) ? prev.filter((m) => m !== mood) : [...prev, mood]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedMoods([]);
    setMinPrice(0);
    setMaxPrice(5000);
    setSelectedDate('');
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    // Filter is applied via useEffect, just close drawer
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
              <input
                type="text"
                placeholder="City or country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </form>

            {/* Mood Filter */}
            <div className="filter-section">
              <label>Mood</label>
              <div className="mood-chips">
                {MOOD_OPTIONS.map((mood) => (
                  <button
                    key={mood}
                    className={`mood-chip ${selectedMoods.includes(mood) ? 'active' : ''}`}
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
                {filteredPackages.length} package{filteredPackages.length !== 1 ? 's' : ''}
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
            ) : filteredPackages.length === 0 ? (
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
                {filteredPackages.map((pkg) => (
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
