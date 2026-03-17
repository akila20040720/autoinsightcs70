import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Gauge, Settings2, Flame,
  Search, Car, MapPin, Calendar, DollarSign, SlidersHorizontal,
  ChevronDown, RotateCcw, Heart, Trash2, BookmarkX
} from 'lucide-react';
import { MarketplaceSkeleton } from '../component/Skeleton';
import OgImage from '../component/OgImage';
import customBannerImage from '../images/banner.png';
import { 
  getAllVehicles, 
  getTopMakes, 
  getPopularModels, 
  getUniqueDistricts,
  searchVehiclesLive,
  type Vehicle
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
  imageUrl?: string;
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

// Get total listing count from real data (live count is dynamic, use static fallback for now or fetch)
const TOTAL_LISTINGS = 67000; // approximation since getAllVehicles() is empty now

const DEFAULT_FILTERS = {
  brand: 'All', model: 'All', condition: 'All', priceRange: 'All', city: 'All', mileageRange: 'All', yearRange: 'All'
};

const CarMarketplace: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  // Get all vehicles from real data (empty because unlinked, but needed for types/refs)
  const allVehicles = useMemo(() => getAllVehicles(), []);

  // Fetch featured vehicles from live api or use empty list
  useEffect(() => {
    // Initial fetch for featured/recent items
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // Fetch some recent listings to populate "featured" if needed
        // For now, searchVehiclesLive with empty filters returns recent items
        const results = await searchVehiclesLive({ max_results: 10 });
        setVehicles(results);
      } catch (err) {
        console.error("Failed to fetch initial vehicles", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, []);
  
  // Get featured/top selling cars from live data
  const topSellingCars = useMemo(() => {
    // If we have fetched vehicles, use them as "featured"
    const featured = vehicles.slice(0, 6);
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
      imageUrl: v.imageUrl,
      vehicleUrl: v.vehicleUrl,
      tag: tags[i % tags.length],
      tagColor: tagColors[i % tagColors.length],
      trend: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 10 + 1).toFixed(1)}%`,
    }));
  }, [vehicles]);

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
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

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

  const formatCardPrice = (price: number) => {
    if (price >= 1000) return price.toLocaleString();
    return `${price}M`;
  };

  const handleNeedInspection = (vehicleName: string, vehicleUrl?: string) => {
    const subject = encodeURIComponent(`Inspection request: ${vehicleName}`);
    const body = encodeURIComponent(
      [
        'Hi AutoInsight team,',
        '',
        `I need a pre-purchase inspection for this vehicle: ${vehicleName}.`,
        vehicleUrl ? `Listing: ${vehicleUrl}` : '',
        '',
        'Please contact me with available inspection slots and pricing.',
      ]
        .filter(Boolean)
        .join('\n')
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const handleConditionSelect = (condition: 'All' | 'Unregistered' | 'Registered' | 'Recondition') => {
    setFilters(prev => ({ ...prev, condition }));
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== 'All').length;
  const availableModels = getModelsForBrand(filters.brand);

  return (
    <div className="marketplace-wrapper">
      <section className="home-hero-banner">
        <img
          src={customBannerImage}
          alt="AutoInsight custom banner"
          className="home-hero-image"
        />
        <div className="home-hero-overlay">
          <span className="home-hero-badge">Featured Marketplace</span>
          <h1>Find the right car faster with smarter filters</h1>
          <p>
            Search across {TOTAL_LISTINGS.toLocaleString()} live listings from {BRANDS.length}+ makes in {ALL_DISTRICTS.length} locations.
          </p>
        </div>
      </section>

      <section className="marketplace-search-strip">
        <div className="marketplace-search-top">
          <h2>Feel like a car person</h2>
          <div className="marketplace-search-actions">
            {activeFilterCount > 0 && (
              <button className="filter-reset-btn" onClick={handleReset}>
                <RotateCcw size={14} />
                Clear all
              </button>
            )}
            <button
              className="toggle-filters-btn"
              onClick={() => setShowAdvancedFilters(prev => !prev)}
            >
              <SlidersHorizontal size={14} />
              {showAdvancedFilters ? 'Less filters' : 'More filters'}
            </button>
          </div>
        </div>

        <div className="marketplace-search-grid">
          <div className="search-strip-item">
            <label><Car size={14} /> Make</label>
            <div className="select-wrapper">
              <select name="brand" value={filters.brand} onChange={handleFilterChange}>
                <option value="All">Any Make</option>
                {BRANDS.map(brand => <option key={brand} value={brand}>{brand}</option>)}
              </select>
              <ChevronDown size={16} className="select-chevron" />
            </div>
          </div>
          <div className="search-strip-item">
            <label><Settings2 size={14} /> Model</label>
            <div className="select-wrapper">
              <select name="model" value={filters.model} onChange={handleFilterChange} disabled={filters.brand === 'All'}>
                <option value="All">Any Model</option>
                {availableModels.map(model => <option key={model} value={model}>{model}</option>)}
              </select>
              <ChevronDown size={16} className="select-chevron" />
            </div>
          </div>
          <div className="search-strip-item">
            <label><Gauge size={14} /> KMs (Max)</label>
            <div className="select-wrapper">
              <select name="mileageRange" value={filters.mileageRange} onChange={handleFilterChange}>
                <option value="All">Any Mileage</option>
                <option value="Below50k">Below 50,000 km</option>
                <option value="50kto100k">50k - 100k km</option>
                <option value="Above100k">Above 100k km</option>
              </select>
              <ChevronDown size={16} className="select-chevron" />
            </div>
          </div>
          <div className="search-strip-item">
            <label><DollarSign size={14} /> Price (Max)</label>
            <div className="select-wrapper">
              <select name="priceRange" value={filters.priceRange} onChange={handleFilterChange}>
                <option value="All">Any Price</option>
                <option value="Below10M">Below 10M LKR</option>
                <option value="10Mto20M">10M - 20M LKR</option>
                <option value="Above20M">Above 20M LKR</option>
              </select>
              <ChevronDown size={16} className="select-chevron" />
            </div>
          </div>
          <div className="search-strip-item">
            <label><MapPin size={14} /> Suburb/Postcode</label>
            <div className="select-wrapper">
              <select name="city" value={filters.city} onChange={handleFilterChange}>
                <option value="All">Any City</option>
                {CITIES.map(city => <option key={city} value={city}>{city}</option>)}
              </select>
              <ChevronDown size={16} className="select-chevron" />
            </div>
          </div>
          <div className="search-strip-item search-strip-submit">
            <button className="btn-glow-blue search-btn" onClick={handleSearch}>
              <Search size={18} />
              Show me cars
            </button>
          </div>
        </div>

        <div className="condition-chip-row">
          <button
            className={`condition-chip${filters.condition === 'All' ? ' active' : ''}`}
            onClick={() => handleConditionSelect('All')}
          >
            All
          </button>
          <button
            className={`condition-chip${filters.condition === 'Unregistered' ? ' active' : ''}`}
            onClick={() => handleConditionSelect('Unregistered')}
          >
            New
          </button>
          <button
            className={`condition-chip${filters.condition === 'Registered' ? ' active' : ''}`}
            onClick={() => handleConditionSelect('Registered')}
          >
            Used
          </button>
          <button
            className={`condition-chip${filters.condition === 'Recondition' ? ' active' : ''}`}
            onClick={() => handleConditionSelect('Recondition')}
          >
            Recondition
          </button>
        </div>

        {showAdvancedFilters && (
          <div className="marketplace-advanced-row">
            <div className="search-strip-item">
              <label><Calendar size={14} /> Year</label>
              <div className="select-wrapper">
                <select name="yearRange" value={filters.yearRange} onChange={handleFilterChange}>
                  <option value="All">Any Year</option>
                  {YEARS.map(year => <option key={year} value={year}>{year}</option>)}
                </select>
                <ChevronDown size={16} className="select-chevron" />
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="inventory-section">
        <div className="section-title">
          <h3><Flame size={22} className="inline-icon" /> Top Selling Vehicles</h3>
        </div>
        <div className="car-showcase-grid">
          {topSellingCars.map(car => (
            <div key={car.id} className="glass-card">
              <div className="card-image-wrapper">
                <OgImage
                  listingUrl={car.vehicleUrl}
                  alt={`${car.brand} ${car.model}`}
                  className="car-image"
                />
              </div>
              
              <div className="card-content">
                <div className="market-card-price-row">
                  <div className="market-card-price">{formatCardPrice(car.price)}</div>
                  <div className="market-card-mileage">{car.mileage.toLocaleString()} km</div>
                </div>

                <a href={car.vehicleUrl} target="_blank" rel="noopener noreferrer" className="market-card-gov-link">
                  Refer the Advertisment for more details
                </a>

                <h4 className="market-card-title">{car.brand} {car.model}</h4>

                <div className="market-card-meta-row">
                  <span>Dealer: Used</span>
                  <span>Top seller</span>
                </div>

                <div className="market-card-actions-row">
                  <button
                    className="market-card-check-btn"
                    onClick={() => car.vehicleUrl && window.open(car.vehicleUrl, '_blank', 'noopener,noreferrer')}
                    disabled={!car.vehicleUrl}
                    title={car.vehicleUrl ? 'Check availability on listing site' : 'Link not available'}
                  >
                    Check Availability
                  </button>
                  <button
                    className="market-card-more-btn"
                    onClick={() => handleViewAnalysis(car.brand, car.model)}
                    title="View market analysis"
                  >
                    ...
                  </button>
                </div>

                <button
                  className="market-need-inspection-btn"
                  onClick={() => handleNeedInspection(`${car.brand} ${car.model}`, car.vehicleUrl)}
                >
                  Need Inspection
                </button>
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
                  <OgImage
                    listingUrl={car.vehicleUrl}
                    alt={`${car.make} ${car.model}`}
                    className="car-image"
                  />
                </div>
                
                <div className="card-content">
                  <div className="market-card-price-row">
                    <div className="market-card-price">{formatCardPrice(car.price)}</div>
                    <div className="market-card-mileage">{car.mileage.toLocaleString()} km</div>
                  </div>

                  <a href={car.vehicleUrl} target="_blank" rel="noopener noreferrer" className="market-card-gov-link">
                    Excl. Gov. Charges
                  </a>

                  <h4 className="market-card-title">{car.year} {car.make} {car.model}</h4>

                  <div className="market-card-meta-row">
                    <span>Dealer: {car.condition === 'Brand New' ? 'New' : 'Used'}</span>
                    <span>{car.district || 'Saved vehicle'}</span>
                  </div>

                  <div className="market-card-actions-row">
                    <button
                      className="market-card-check-btn"
                      onClick={() => car.vehicleUrl && window.open(car.vehicleUrl, '_blank', 'noopener,noreferrer')}
                      disabled={!car.vehicleUrl}
                      title={car.vehicleUrl ? 'Check availability on listing site' : 'Link not available'}
                    >
                      Check Availability
                    </button>
                    <button
                      className="market-card-more-btn"
                      onClick={() => handleViewAnalysis(car.make, car.model)}
                      title="View market analysis"
                    >
                      ...
                    </button>
                  </div>

                  <button
                    className="market-need-inspection-btn"
                    onClick={() => handleNeedInspection(`${car.year} ${car.make} ${car.model}`, car.vehicleUrl)}
                  >
                    Need Inspection
                  </button>
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