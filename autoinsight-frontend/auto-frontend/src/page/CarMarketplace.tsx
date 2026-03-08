import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Gauge, Settings2, ClipboardCheck, Flame, ArrowRight, 
  Search, Car, MapPin, Calendar, DollarSign, SlidersHorizontal,
  ChevronDown, RotateCcw, Sparkles, Zap, Shield, Clock,
  Heart, Trash2, BookmarkX, TrendingUp, BarChart3, Users
} from 'lucide-react';
import { MarketplaceSkeleton } from '../component/Skeleton';
import { 
  getAllVehicles, 
  getTopMakes, 
  getPopularModels, 
  getUniqueDistricts,
  getFeaturedVehicles
} from '../services/vehicleDataService';
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

// Hero carousel images
const HERO_SLIDES = [
  { src: '../images/vehicles/Toyota/toyota-1.jpg', brand: 'Toyota', tagline: 'Reliability Redefined' },
  { src: '../images/vehicles/BMW/bmw-1.jpg', brand: 'BMW', tagline: 'The Ultimate Machine' },
  { src: '../images/vehicles/Honda/honda-1.jpg', brand: 'Honda', tagline: 'Engineering Excellence' },
  { src: '../images/vehicles/Mercedes-Benz/mercedes-1.jpg', brand: 'Mercedes-Benz', tagline: 'Luxury Performance' },
  { src: '../images/vehicles/Audi/audi-1.jpg', brand: 'Audi', tagline: 'Vorsprung durch Technik' },
  { src: '../images/vehicles/Nissan/nissan-1.jpg', brand: 'Nissan', tagline: 'Innovation That Excites' },
];

// Animated counter hook
function useAnimatedCount(target: number, duration = 2000, ready = true) {
  const [count, setCount] = useState(0);
  const started = useRef(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ready) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration, ready]);

  return { count, ref };
}

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

  // Hero carousel auto-rotation
  const [heroSlide, setHeroSlide] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setHeroSlide(prev => (prev + 1) % HERO_SLIDES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Animated stat counters — pass !loading so they start after skeleton is gone
  const listingsCounter = useAnimatedCount(TOTAL_LISTINGS, 2000, !loading);
  const brandsCounter = useAnimatedCount(BRANDS.length, 2000, !loading);
  const districtsCounter = useAnimatedCount(ALL_DISTRICTS.length, 2000, !loading);

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
        {/* Animated background particles */}
        <div className="hero-particles">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`hero-particle hero-particle-${i + 1}`} />
          ))}
        </div>

        <div className="hero-left">
          <motion.div
            className="hero-badge"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Sparkles size={13} />
            <span>AI-Powered Vehicle Intelligence</span>
          </motion.div>

          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            Find Your Perfect
            <span className="hero-title-gradient"> Car </span>
            with Confidence.
          </motion.h1>

          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Browse real listings from {BRANDS.length}+ brands across {ALL_DISTRICTS.length} districts.
            Compare prices, spot trends, and drive away with the best deal.
          </motion.p>

          <motion.div
            className="hero-quick-search"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="hero-search-fields">
              <div className="hero-search-select">
                <Car size={15} />
                <select name="brand" value={filters.brand} onChange={handleFilterChange}>
                  <option value="All">Any Make</option>
                  {BRANDS.map(brand => <option key={brand} value={brand}>{brand}</option>)}
                </select>
              </div>
              <div className="hero-search-select">
                <Settings2 size={15} />
                <select name="model" value={filters.model} onChange={handleFilterChange} disabled={filters.brand === 'All'}>
                  <option value="All">Any Model</option>
                  {availableModels.map(model => <option key={model} value={model}>{model}</option>)}
                </select>
              </div>
              <button className="hero-search-btn" onClick={handleSearch}>
                <Search size={18} />
                Search
              </button>
            </div>
            <button
              className="hero-filters-link"
              onClick={() => document.querySelector('.filter-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <SlidersHorizontal size={14} />
              Advanced filters
            </button>
          </motion.div>

          {/* Stats counters row */}
          <motion.div
            className="hero-stats-row"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55 }}
          >
            <div className="hero-stat" ref={listingsCounter.ref}>
              <BarChart3 size={18} />
              <div className="hero-stat-content">
                <span className="hero-stat-number">{listingsCounter.count.toLocaleString()}+</span>
                <span className="hero-stat-label">Vehicles</span>
              </div>
            </div>
            <div className="hero-stat" ref={brandsCounter.ref}>
              <Car size={18} />
              <div className="hero-stat-content">
                <span className="hero-stat-number">{brandsCounter.count}+</span>
                <span className="hero-stat-label">Brands</span>
              </div>
            </div>
            <div className="hero-stat" ref={districtsCounter.ref}>
              <MapPin size={18} />
              <div className="hero-stat-content">
                <span className="hero-stat-number">{districtsCounter.count}</span>
                <span className="hero-stat-label">Locations</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="hero-trust-row"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <div className="hero-trust-item">
              <Shield size={15} />
              <span>Verified data</span>
            </div>
            <div className="hero-trust-item">
              <TrendingUp size={15} />
              <span>Live market trends</span>
            </div>
            <div className="hero-trust-item">
              <Clock size={15} />
              <span>Updated daily</span>
            </div>
          </motion.div>
        </div>

        <motion.div
          className="hero-right"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          {/* Main carousel image */}
          <div className="hero-carousel">
            <AnimatePresence mode="wait">
              <motion.div
                key={heroSlide}
                className="hero-carousel-slide"
                initial={{ opacity: 0, scale: 1.06 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.6 }}
              >
                <img
                  src={new URL(HERO_SLIDES[heroSlide].src, import.meta.url).href}
                  alt={HERO_SLIDES[heroSlide].brand}
                />
                <div className="hero-carousel-overlay">
                  <span className="hero-carousel-brand">{HERO_SLIDES[heroSlide].brand}</span>
                  <span className="hero-carousel-tagline">{HERO_SLIDES[heroSlide].tagline}</span>
                </div>
              </motion.div>
            </AnimatePresence>
            {/* Slide indicators */}
            <div className="hero-carousel-dots">
              {HERO_SLIDES.map((_, i) => (
                <button
                  key={i}
                  className={`hero-carousel-dot${i === heroSlide ? ' active' : ''}`}
                  onClick={() => setHeroSlide(i)}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Bottom image row */}
          <div className="hero-thumb-row">
            {[
              { src: '../images/vehicles/Toyota/toyota-2.jpg', brand: 'Toyota' },
              { src: '../images/vehicles/Honda/honda-2.jpg', brand: 'Honda' },
              { src: '../images/vehicles/Suzuki/suzuki-1.jpg', brand: 'Suzuki' },
              { src: '../images/vehicles/Nissan/nissan-2.jpg', brand: 'Nissan' },
            ].map((thumb) => (
              <div key={thumb.brand} className="hero-thumb-card">
                <img src={new URL(thumb.src, import.meta.url).href} alt={thumb.brand} />
                <span className="hero-thumb-label">{thumb.brand}</span>
              </div>
            ))}
          </div>

          {/* Brand ticker */}
          <div className="hero-brands-ticker">
            <div className="hero-brands-track">
              {['Toyota', 'Honda', 'BMW', 'Nissan', 'Suzuki', 'Hyundai', 'Mercedes-Benz', 'Audi', 'Toyota', 'Honda', 'BMW', 'Nissan'].map((b, i) => (
                <span key={`${b}-${i}`} className="hero-brand-chip">{b}</span>
              ))}
            </div>
          </div>
        </motion.div>
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
                <img src={car.imageUrl} alt={`${car.brand} ${car.model}`} className="car-image" />
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
                  <img src={car.imageUrl} alt={`${car.make} ${car.model}`} className="car-image" />
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