import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Gauge, Settings2, ClipboardCheck, Flame, ArrowRight, 
  Search, Car, MapPin, Calendar, DollarSign, SlidersHorizontal,
  ChevronDown, RotateCcw, Sparkles, Zap, Shield, Clock,
  Heart, Trash2, BookmarkX
} from 'lucide-react';
import { MarketplaceSkeleton } from '../component/Skeleton';
import { 
  getAllVehicles, 
  getTopMakes, 
  getPopularModels, 
  getUniqueDistricts,
  getFeaturedVehicles
} from '../services/vehicleDataService';
import { VehicleImage } from '../components/VehicleImage';
import '../styles/CarMarketplace.css';

interface Car {
  id: string;
  brand: string;
  model: string;
  price: number;
  mileage: number;
  transmission: string;
  condition: string;
  imageUrl: string;
  vehicleUrl?: string;
  tag: string;
  tagColor: string;
  trend: string;
}

// Get top makes from real data
const TOP_MAKES = getTopMakes(15); 
const BRANDS = TOP_MAKES.map(m => m.make);

// Cache for models per brand
const MODELS_CACHE: { [key: string]: string[] } = {};
const getModelsForBrand = (brand: string): string[] => {
  if (brand === 'All') return [];
  if (!MODELS_CACHE[brand]) {
    MODELS_CACHE[brand] = getPopularModels(brand, 20).map(m => m.model);
  }
  return MODELS_CACHE[brand];
};

// Get top districts from real data
const ALL_DISTRICTS = getUniqueDistricts();
const CITIES = ALL_DISTRICTS.slice(0, 25); // Top 25 cities

const YEARS = Array.from({ length: 30 }, (_, i) => (new Date().getFullYear() - i).toString());

// Use real data for saved vehicles lookup
const FAVORITES_KEY = 'autoinsight_favorites';

// Get total listing count from real data
const TOTAL_LISTINGS = getAllVehicles().length;

const DEFAULT_FILTERS = {
  brand: 'All', model: 'All', condition: 'All', priceRange: 'All', city: 'All', mileageRange: 'All', yearRange: 'All'
};

const CarMarketplace: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  // Get all vehicles from real data
  const allVehicles = useMemo(() => getAllVehicles(), []);
  
  // Get featured/top selling cars from real data
  const topSellingCars = useMemo(() => {
    const featured = getFeaturedVehicles(6);
    const tags = ['Popular', 'Budget Friendly', 'Great Value', 'Hot Deal', 'Best Seller', 'Trending'];
    const tagColors = ['#3b82f6', '#f472b6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];
    
    return featured.map((v, i) => ({
      id: v.id,
      brand: v.make,
      model: v.model,
      price: v.price,
      mileage: v.mileage,
      transmission: 'Auto',
      condition: v.condition,
      imageUrl: v.imageUrl || 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fd?auto=format&fit=crop&w=600&q=80',
      vehicleUrl: v.vehicleUrl,
      tag: tags[i % tags.length],
      tagColor: tagColors[i % tagColors.length],
      trend: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 10 + 1).toFixed(1)}%`,
    }));
  }, []);

  // Favorites with localStorage persistence
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Get saved vehicles from IDs using real data
  const savedVehicles = useMemo(() => {
    return allVehicles.filter(car => favorites.includes(car.id));
  }, [allVehicles, favorites]);

  const removeFavorite = (carId: string) => {
    setFavorites(prev => prev.filter(id => id !== carId));
  };

  // Persist favorites to localStorage
  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  // Restore filters from navigation state (e.g. when coming back from SearchResults)
  const savedFilters = (location.state as { filters?: typeof DEFAULT_FILTERS } | null)?.filters;
  const [filters, setFilters] = useState(savedFilters ?? DEFAULT_FILTERS);

  useEffect(() => {
    // Simulate data fetch — replace with real API call
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <MarketplaceSkeleton />;

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => {
      const newFilters = { ...prev, [name]: value };
      if (name === 'brand') newFilters.model = 'All'; 
      return newFilters;
    });
  };

  const handleSearch = () => {
    navigate('/results', { state: { filters } }); 
  };

  const handleViewAnalysis = (brand: string, model: string) => {
    navigate('/results', { state: { filters: { ...filters, brand, model } } });
  };

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== 'All').length;
  const availableModels = getModelsForBrand(filters.brand);

  return (
    <div className="marketplace-wrapper">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="hero-gradient-orb hero-orb-1"></div>
          <div className="hero-gradient-orb hero-orb-2"></div>
        </div>
        <div className="hero-content">
          <div className="hero-badge">
            <Zap size={14} />
            <span>AI Powered Car Discovery</span>
          </div>
          <h1 className="hero-title">
            Find Your Next Car<br />
            <span className="hero-highlight">In 60 Seconds</span>
          </h1>
          <p className="hero-subtitle">
            Skip the hassle. Our smart search analyzes thousands of listings to match you 
            with the perfect vehicle fast, transparent, and stress free.
          </p>
          <div className="hero-cta-group">
            <button className="hero-cta-primary" onClick={handleSearch}>
              <Search size={18} />
              Start Searching Now
            </button>
            <button className="hero-cta-secondary" onClick={() => document.querySelector('.filter-section')?.scrollIntoView({ behavior: 'smooth' })}>
              <SlidersHorizontal size={16} />
              Use Filters
            </button>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-icon">
                <Car size={18} />
              </div>
              <div className="hero-stat-info">
                <span className="hero-stat-value">{TOTAL_LISTINGS.toLocaleString()}+</span>
                <span className="hero-stat-label">Active Listings</span>
              </div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-icon">
                <Shield size={18} />
              </div>
              <div className="hero-stat-info">
                <span className="hero-stat-value">{BRANDS.length}+</span>
                <span className="hero-stat-label">Car Brands</span>
              </div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-icon">
                <MapPin size={18} />
              </div>
              <div className="hero-stat-info">
                <span className="hero-stat-value">{ALL_DISTRICTS.length}+</span>
                <span className="hero-stat-label">Districts</span>
              </div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-icon">
                <Clock size={18} />
              </div>
              <div className="hero-stat-info">
                <span className="hero-stat-value">~60s</span>
                <span className="hero-stat-label">Avg. Search Time</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="page-header">
        <div className="filter-intro">
          <div className="filter-intro-badge">
            <Sparkles size={14} />
            <span>AI Powered Search</span>
          </div>
          <h2>Find Your <span className="gradient-text">Perfect Vehicle</span></h2>
          <p>Use our detailed filters to search across thousands of listings in real-time.</p>
        </div>
      </div>

      <section className="glass-panel filter-section">
        <div className="filter-section-header">
          <div className="filter-section-title">
            <SlidersHorizontal size={18} />
            <h3>Search Filters</h3>
            {activeFilterCount > 0 && (
              <span className="filter-count-badge">{activeFilterCount}</span>
            )}
          </div>
          {activeFilterCount > 0 && (
            <button className="filter-reset-btn" onClick={handleReset}>
              <RotateCcw size={14} />
              Clear All
            </button>
          )}
        </div>

        <div className="filter-form-grid">
          {/* Primary Filters */}
          <div className="filter-group">
            <span className="filter-group-label">Primary</span>
            <div className="filter-row">
              <div className="filter-item mandatory">
                <label><Car size={14} /> Make <span className="required">*</span></label>
                <div className="select-wrapper">
                  <select name="brand" value={filters.brand} onChange={handleFilterChange}>
                    <option value="All">Any Make</option>
                    {BRANDS.map(brand => <option key={brand} value={brand}>{brand}</option>)}
                  </select>
                  <ChevronDown size={16} className="select-chevron" />
                </div>
              </div>
              <div className="filter-item mandatory">
                <label><Car size={14} /> Model <span className="required">*</span></label>
                <div className="select-wrapper">
                  <select name="model" value={filters.model} onChange={handleFilterChange} disabled={filters.brand === 'All'}>
                    <option value="All">Any Model</option>
                    {availableModels.map(model => <option key={model} value={model}>{model}</option>)}
                  </select>
                  <ChevronDown size={16} className="select-chevron" />
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Filters */}
          <div className="filter-group">
            <span className="filter-group-label">Details</span>
            <div className="filter-row three-col">
              <div className="filter-item">
                <label><ClipboardCheck size={14} /> Condition</label>
                <div className="select-wrapper">
                  <select name="condition" value={filters.condition} onChange={handleFilterChange}>
                    <option value="All">Any</option>
                    <option value="Unregistered">Brand New</option>
                    <option value="Registered">Used</option>
                    <option value="Recondition">Reconditioned</option>
                  </select>
                  <ChevronDown size={16} className="select-chevron" />
                </div>
              </div>
              <div className="filter-item">
                <label><DollarSign size={14} /> Price Range</label>
                <div className="select-wrapper">
                  <select name="priceRange" value={filters.priceRange} onChange={handleFilterChange}>
                    <option value="All">Any Price</option>
                    <option value="Below10M">Below 10M LKR</option>
                    <option value="10Mto20M">10M – 20M LKR</option>
                    <option value="Above20M">Above 20M LKR</option>
                  </select>
                  <ChevronDown size={16} className="select-chevron" />
                </div>
              </div>
              <div className="filter-item">
                <label><MapPin size={14} /> City</label>
                <div className="select-wrapper">
                  <select name="city" value={filters.city} onChange={handleFilterChange}>
                    <option value="All">Any City</option>
                    {CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                  </select>
                  <ChevronDown size={16} className="select-chevron" />
                </div>
              </div>
            </div>
          </div>

          {/* Additional Filters */}
          <div className="filter-group">
            <span className="filter-group-label">More Options</span>
            <div className="filter-row">
              <div className="filter-item">
                <label><Gauge size={14} /> Mileage</label>
                <div className="select-wrapper">
                  <select name="mileageRange" value={filters.mileageRange} onChange={handleFilterChange}>
                    <option value="All">Any Mileage</option>
                    <option value="Below50k">Below 50,000 km</option>
                    <option value="50kto100k">50k – 100k km</option>
                    <option value="Above100k">Above 100k km</option>
                  </select>
                  <ChevronDown size={16} className="select-chevron" />
                </div>
              </div>
              <div className="filter-item">
                <label><Calendar size={14} /> Year Range</label>
                <div className="select-wrapper">
                  <select name="yearRange" value={filters.yearRange} onChange={handleFilterChange}>
                    <option value="All">Any Year</option>
                    {YEARS.map(year => <option key={year} value={year}>{year}</option>)}
                  </select>
                  <ChevronDown size={16} className="select-chevron" />
                </div>
              </div>
            </div>
          </div>

          <div className="filter-actions">
            <button className="btn-glow-blue search-btn" onClick={handleSearch}>
              <Search size={18} />
              Search Vehicles
            </button>
          </div>
        </div>
      </section>

      <section className="inventory-section">
        <div className="section-title">
          <h3><Flame size={22} className="inline-icon" /> Top Selling Vehicles</h3>
        </div>
        <div className="car-showcase-grid">
          {topSellingCars.map(car => (
            <div key={car.id} className="glass-card">
              <div className="card-image-wrapper">
                <span className="floating-tag" style={{ backgroundColor: car.tagColor }}>{car.tag}</span>
                <VehicleImage 
                  vehicleUrl={car.vehicleUrl} 
                  alt={`${car.brand} ${car.model}`} 
                  className="car-image"
                  fallbackImage="https://images.unsplash.com/photo-1621007947382-bb3c3994e3fd?auto=format&fit=crop&w=600&q=80"
                />
              </div>
              
              <div className="card-content">
                <h4 className="car-title">{car.brand} {car.model}</h4>
                
                <div className="price-row">
                  <div className="price-display">
                    <span className="currency">LKR</span> {car.price}M
                  </div>
                  <div className={`trend-pill ${car.trend.startsWith('+') ? 'positive' : 'negative'}`}>
                    {car.trend.startsWith('+') ? '↗' : '↘'} {car.trend}
                  </div>
                </div>
                
                <div className="stats-row">
                  <div className="stat-box">
                    <span className="stat-icon"><Gauge size={16} /></span>
                    <div className="stat-text">
                      <strong>{car.mileage.toLocaleString()}</strong>
                      <span>km</span>
                    </div>
                  </div>
                  <div className="stat-box">
                    <span className="stat-icon"><Settings2 size={16} /></span>
                    <div className="stat-text">
                      <strong>{car.transmission}</strong>
                      <span>Trans</span>
                    </div>
                  </div>
                  <div className="stat-box">
                    <span className="stat-icon"><ClipboardCheck size={16} /></span>
                    <div className="stat-text">
                      <strong>{car.condition}</strong>
                      <span>Status</span>
                    </div>
                  </div>
                </div>
                
                <button className="btn-glass-purple" onClick={() => handleViewAnalysis(car.brand, car.model)}>View Full Analysis <ArrowRight size={14} className="inline-icon" /></button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Saved Vehicles Section */}
      <section className="inventory-section saved-section">
        <div className="section-title">
          <h3><Heart size={22} className="inline-icon heart-icon" /> Saved Vehicles ({savedVehicles.length})</h3>
        </div>
        
        {savedVehicles.length === 0 ? (
          <div className="empty-saved-state">
            <div className="empty-saved-icon">
              <BookmarkX size={48} />
            </div>
            <h4>No saved vehicles yet</h4>
            <p>Browse search results and tap the heart icon to save cars you're interested in.</p>
            <button className="btn-glass-purple" onClick={handleSearch}>
              <Search size={16} />
              Start Searching
            </button>
          </div>
        ) : (
          <div className="car-showcase-grid saved-grid">
            {savedVehicles.map(car => (
              <div key={car.id} className="glass-card saved-card">
                <button 
                  className="remove-saved-btn" 
                  onClick={() => removeFavorite(car.id)}
                  title="Remove from saved"
                >
                  <Trash2 size={16} />
                </button>
                
                <div className="card-image-wrapper">
                  <span className="floating-tag saved-tag">
                    <Heart size={12} fill="currentColor" /> Saved
                  </span>
                  <VehicleImage 
                    vehicleUrl={car.vehicleUrl} 
                    alt={`${car.make} ${car.model}`} 
                    className="car-image"
                    fallbackImage="https://images.unsplash.com/photo-1621007947382-bb3c3994e3fd?auto=format&fit=crop&w=600&q=80"
                  />
                </div>
                
                <div className="card-content">
                  <div className="flex-row-between">
                    <h4 className="car-title">{car.make} {car.model}</h4>
                    <span className="year-badge">{car.year}</span>
                  </div>
                  
                  <div className="price-display">
                    <span className="currency">LKR</span> {car.price}M
                  </div>
                  
                  <div className="stats-row">
                    <div className="stat-box">
                      <span className="stat-icon"><Gauge size={16} /></span>
                      <div className="stat-text">
                        <strong>{car.mileage.toLocaleString()}</strong>
                        <span>km</span>
                      </div>
                    </div>
                    <div className="stat-box">
                      <span className="stat-icon"><Settings2 size={16} /></span>
                      <div className="stat-text">
                        <strong>Auto</strong>
                        <span>Trans</span>
                      </div>
                    </div>
                    <div className="stat-box">
                      <span className="stat-icon"><ClipboardCheck size={16} /></span>
                      <div className="stat-text">
                        <strong>{car.condition}</strong>
                        <span>Status</span>
                      </div>
                    </div>
                  </div>
                  
                  <a href={car.vehicleUrl} target="_blank" rel="noopener noreferrer" className="btn-glass-purple">
                    View Listing <ArrowRight size={14} className="inline-icon" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default CarMarketplace;