import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  Gauge, Settings2, ClipboardCheck, TrendingUp, TrendingDown, ArrowLeft,
  GitCompare, X, Check, Plus, Heart, ExternalLink, ChevronLeft, ChevronRight,
  ArrowUpDown, Eye
} from 'lucide-react';

type SortOption = 'default' | 'price-low' | 'price-high' | 'year-new' | 'year-old' | 'mileage-low' | 'mileage-high';
import { SearchResultsSkeleton } from '../component/Skeleton';
import { 
  searchVehicles, 
  getMarketStats, 
  type Vehicle,
  type VehicleFilters
} from '../services/vehicleDataService';
import { VehicleImage } from '../components/VehicleImage';
import '../styles/SearchResults.css';

interface CarResult {
  id: string;
  name: string; 
  year: number;
  price: number;
  mileage: number;
  transmission: string;
  condition: string;
  imageUrl?: string;
  priceHistory?: number[]; // Last 6 months prices
  priceChange?: number; // Percentage change
  district?: string;
  vehicleUrl?: string;
}

interface FilterState {
  brand: string;
  model: string;
  condition: string;
  priceRange: string;
  city: string;
  mileageRange: string;
  yearRange: string;
}

// Convert Vehicle to CarResult
function vehicleToCarResult(v: Vehicle): CarResult {
  // Generate synthetic price history based on current price
  const basePrice = v.price;
  const volatility = 0.03; // 3% volatility
  const priceHistory: number[] = [];
  let currentPrice = basePrice * (1 - volatility * 3);
  
  for (let i = 0; i < 6; i++) {
    priceHistory.push(Math.round(currentPrice * 100) / 100);
    currentPrice += (Math.random() - 0.3) * basePrice * volatility;
    currentPrice = Math.max(currentPrice, basePrice * 0.9);
    currentPrice = Math.min(currentPrice, basePrice * 1.1);
  }
  priceHistory[5] = basePrice; // Ensure last price is current
  
  const priceChange = Math.round(((basePrice - priceHistory[0]) / priceHistory[0]) * 100 * 10) / 10;
  
  return {
    id: v.id,
    name: `${v.make} ${v.model}`,
    year: v.year,
    price: v.price,
    mileage: v.mileage,
    transmission: 'Auto', // Dataset doesn't have transmission
    condition: v.condition,
    imageUrl: v.imageUrl,
    priceHistory,
    priceChange,
    district: v.district,
    vehicleUrl: v.vehicleUrl,
  };
}

// Convert filter state to service filters
function convertFilters(filters: FilterState): VehicleFilters {
  const serviceFilters: VehicleFilters = {};
  
  if (filters.brand !== 'All') serviceFilters.make = filters.brand;
  if (filters.model !== 'All') serviceFilters.model = filters.model;
  if (filters.city !== 'All') serviceFilters.district = filters.city;
  
  // Map condition values
  if (filters.condition !== 'All') {
    const condMap: Record<string, string> = {
      'Unregistered': 'Brand New',
      'Registered': 'Used',
      'Recondition': 'Recondition'
    };
    serviceFilters.condition = condMap[filters.condition] || filters.condition;
  }
  
  // Price range
  if (filters.priceRange !== 'All') {
    switch (filters.priceRange) {
      case 'Below10M':
        serviceFilters.maxPrice = 10;
        break;
      case '10Mto20M':
        serviceFilters.minPrice = 10;
        serviceFilters.maxPrice = 20;
        break;
      case 'Above20M':
        serviceFilters.minPrice = 20;
        break;
    }
  }
  
  // Mileage range
  if (filters.mileageRange !== 'All') {
    switch (filters.mileageRange) {
      case 'Below50k':
        serviceFilters.maxMileage = 50000;
        break;
      case '50kto100k':
        serviceFilters.minMileage = 50000;
        serviceFilters.maxMileage = 100000;
        break;
      case 'Above100k':
        serviceFilters.minMileage = 100000;
        break;
    }
  }
  
  // Year range
  if (filters.yearRange !== 'All') {
    const year = parseInt(filters.yearRange);
    if (!isNaN(year)) {
      serviceFilters.minYear = year;
      serviceFilters.maxYear = year;
    }
  }
  
  return serviceFilters;
}

// localStorage key for favorites
const FAVORITES_KEY = 'autoinsight_favorites';

const ITEMS_PER_PAGE = 50;

const SearchResults: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [compareList, setCompareList] = useState<CarResult[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>('default');
  
  // Favorites with localStorage persistence
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persist favorites to localStorage
  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (carId: string) => {
    setFavorites(prev => {
      if (prev.includes(carId)) {
        return prev.filter(id => id !== carId);
      }
      return [...prev, carId];
    });
  };

  const isFavorite = (carId: string) => favorites.includes(carId);

  const toggleCompare = (car: CarResult) => {
    setCompareList(prev => {
      const exists = prev.find(c => c.id === car.id);
      if (exists) {
        return prev.filter(c => c.id !== car.id);
      }
      if (prev.length >= 3) return prev; // Max 3
      return [...prev, car];
    });
  };

  const isInCompare = (carId: string) => compareList.some(c => c.id === carId);
  const clearCompare = () => setCompareList([]);

  // Extract filters from navigation state
  const filters = (location.state as { filters?: FilterState } | null)?.filters;
  const brand = filters?.brand ?? 'All';
  const model = filters?.model ?? 'All';

  const searchQuery = useMemo(() => {
    if (brand !== 'All' && model !== 'All') return `${brand} ${model}`;
    if (brand !== 'All') return brand;
    return 'All Vehicles';
  }, [brand, model]);

  // Get market stats from real data
  const stats = useMemo(() => {
    const marketStats = getMarketStats(brand, model !== 'All' ? model : undefined);
    const trend = marketStats.avgPrice > 0 ? 'up' : 'down';
    return {
      avgPrice: marketStats.avgPrice,
      avgMileage: marketStats.avgMileage,
      totalListings: marketStats.totalListings,
      trend,
      lastWeek: marketStats.avgPrice * 0.98,
      lastMonth: marketStats.avgPrice * 0.95,
      nextWeek: marketStats.avgPrice * 1.02,
      nextMonth: marketStats.avgPrice * 1.04,
    };
  }, [brand, model]);

  // Get all results from real data using service (no limit)
  const allResults = useMemo<CarResult[]>(() => {
    const serviceFilters = filters ? convertFilters(filters) : {};
    const vehicles = searchVehicles(serviceFilters); // Get all matching vehicles
    return vehicles.map(vehicleToCarResult);
  }, [filters]);

  // Sort results based on selected option
  const sortedResults = useMemo<CarResult[]>(() => {
    const sorted = [...allResults];
    switch (sortBy) {
      case 'price-low':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price-high':
        return sorted.sort((a, b) => b.price - a.price);
      case 'year-new':
        return sorted.sort((a, b) => b.year - a.year);
      case 'year-old':
        return sorted.sort((a, b) => a.year - b.year);
      case 'mileage-low':
        return sorted.sort((a, b) => a.mileage - b.mileage);
      case 'mileage-high':
        return sorted.sort((a, b) => b.mileage - a.mileage);
      default:
        return sorted;
    }
  }, [allResults, sortBy]);

  // Pagination calculations
  const totalPages = Math.ceil(sortedResults.length / ITEMS_PER_PAGE);
  
  // Reset to page 1 when filters or sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortBy]);

  // Get paginated results for current page
  const results = useMemo<CarResult[]>(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return sortedResults.slice(startIndex, endIndex);
  }, [sortedResults, currentPage]);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // Get similar vehicles (different brands in similar price range)
  const similarVehicles = useMemo<CarResult[]>(() => {
    if (results.length === 0) return [];
    const firstResult = results[0];
    // Get vehicles from different makes
    const similar = searchVehicles({ 
      minPrice: firstResult.price * 0.7,
      maxPrice: firstResult.price * 1.3,
    }, 20)
      .filter(v => v.make !== brand)
      .slice(0, 3);
    return similar.map(vehicleToCarResult);
  }, [results, brand]);

  // Active filter summary chips
  const filterChips = useMemo(() => {
    if (!filters) return [];
    const chips: string[] = [];
    if (filters.condition !== 'All') chips.push(filters.condition);
    if (filters.priceRange !== 'All') chips.push(filters.priceRange.replace(/([A-Z])/g, ' $1').trim());
    if (filters.city !== 'All') chips.push(filters.city);
    if (filters.mileageRange !== 'All') chips.push(filters.mileageRange.replace(/([A-Z])/g, ' $1').trim());
    if (filters.yearRange !== 'All') chips.push(filters.yearRange);
    return chips;
  }, [filters]);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, [brand, model]);

  if (loading) return <SearchResultsSkeleton />;

  return (
    <div className="results-wrapper">
      
      <div className="results-header">
        <button className="back-btn" onClick={() => navigate('/', { state: { filters } })}>
          <ArrowLeft size={18} />
          Back to Search
        </button>
        <h2>Market Analysis for <span className="gradient-text">{searchQuery}</span></h2>
        <p>Based on your selected filters and real-time market data.</p>
        {filterChips.length > 0 && (
          <div className="filter-chips">
            {filterChips.map(chip => (
              <span key={chip} className="filter-chip">{chip}</span>
            ))}
          </div>
        )}
      </div>

      <section className="analytics-dashboard">
        <div className="analytics-main">
          <div className="stats-overview-flex">
            <div className="stat-card">
              <span className="stat-label">Average Price</span>
              <h3 className="stat-value">{stats.avgPrice}M <span className="currency">LKR</span></h3>
            </div>
            <div className="stat-card">
              <span className="stat-label">Average Mileage</span>
              <h3 className="stat-value">{stats.avgMileage.toLocaleString()} <span className="unit">km</span></h3>
            </div>
          </div>

          <div className="graph-card">
            <div className="graph-header">
              <h4>Price Trend (2000 – 2026)</h4>
              <span className={`trend-badge ${stats.trend === 'up' ? 'positive' : 'negative'}`}>
                {stats.trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {stats.trend === 'up' ? ' Increasing' : ' Decreasing'}
              </span>
            </div>
            <div className="svg-graph-container">
              <svg viewBox="0 0 500 200" className="price-chart">
                <defs>
                  <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                  <linearGradient id="fillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(59, 130, 246, 0.2)" />
                    <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
                  </linearGradient>
                </defs>
                <line x1="0" y1="50" x2="500" y2="50" className="grid-line" />
                <line x1="0" y1="100" x2="500" y2="100" className="grid-line" />
                <line x1="0" y1="150" x2="500" y2="150" className="grid-line" />
                {stats.trend === 'up' ? (
                  <>
                    <path d="M 0 180 C 150 170, 250 100, 500 40 L 500 200 L 0 200 Z" fill="url(#fillGrad)" />
                    <path d="M 0 180 C 150 170, 250 100, 500 40" fill="none" stroke="url(#lineGrad)" strokeWidth="4" className="chart-line" />
                  </>
                ) : (
                  <>
                    <path d="M 0 60 C 100 70, 300 120, 500 160 L 500 200 L 0 200 Z" fill="url(#fillGrad)" />
                    <path d="M 0 60 C 100 70, 300 120, 500 160" fill="none" stroke="url(#lineGrad)" strokeWidth="4" className="chart-line" />
                  </>
                )}
              </svg>
              <div className="graph-labels">
                <span>2000</span>
                <span>2010</span>
                <span>2020</span>
                <span>2026</span>
              </div>
            </div>
          </div>
        </div>

        <div className="analytics-sidebar">
          <div className="predictions-card">
            <h4>Market Predictions</h4>
            <div className="prediction-list">
              <div className="pred-item">
                <span className="pred-time">Last Week</span>
                <span className="pred-price">{stats.lastWeek}M</span>
              </div>
              <div className="pred-item">
                <span className="pred-time">Last Month</span>
                <span className="pred-price">{stats.lastMonth}M</span>
              </div>
              <div className="divider"></div>
              <div className="pred-item highlight">
                <span className="pred-time">Next Week</span>
                <span className="pred-price">{stats.nextWeek}M</span>
              </div>
              <div className="pred-item highlight">
                <span className="pred-time">Next Month</span>
                <span className="pred-price">{stats.nextMonth}M</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Exact Matches */}
      <section className="listings-section">
        <div className="listings-header">
          <h3 className="section-title">Available Listings ({sortedResults.length})</h3>
          
          <div className="sort-container">
            <ArrowUpDown size={16} className="sort-icon" />
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="sort-select"
            >
              <option value="default">Relevance</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="year-new">Year: Newest First</option>
              <option value="year-old">Year: Oldest First</option>
              <option value="mileage-low">Mileage: Lowest</option>
              <option value="mileage-high">Mileage: Highest</option>
            </select>
          </div>
        </div>
        
        <div className="flex-results-grid">
          {results.map(car => (
            <div key={car.id} className={`glass-card flex-card ${isInCompare(car.id) ? 'compare-selected' : ''}`}>
              {/* Compare checkbox */}
              {/* Compare checkbox */}
              <button 
                className={`compare-checkbox ${isInCompare(car.id) ? 'checked' : ''}`}
                onClick={() => toggleCompare(car)}
                disabled={!isInCompare(car.id) && compareList.length >= 3}
                title={isInCompare(car.id) ? 'Remove from compare' : compareList.length >= 3 ? 'Max 3 cars' : 'Add to compare'}
              >
                {isInCompare(car.id) ? <Check size={14} /> : <Plus size={14} />}
              </button>
              
              {/* Favorite heart button */}
              <button 
                className={`favorite-btn ${isFavorite(car.id) ? 'active' : ''}`}
                onClick={() => toggleFavorite(car.id)}
                title={isFavorite(car.id) ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart size={18} fill={isFavorite(car.id) ? 'currentColor' : 'none'} />
              </button>
              
              <div className="card-image-wrapper">
                <VehicleImage 
                  vehicleUrl={car.vehicleUrl} 
                  alt={car.name} 
                  className="car-image"
                  lazy
                  fallbackImage="https://images.unsplash.com/photo-1621007947382-bb3c3994e3fd?auto=format&fit=crop&w=600&q=80"
                />
              </div>
              <div className="card-content">
                <div className="flex-row-between">
                  <h4 className="car-title">{car.name}</h4>
                  <span className="year-badge">{car.year}</span>
                </div>
                
                <div className="price-display">
                  <span className="currency">LKR</span> {car.price}M
                  {car.priceChange !== undefined && car.priceChange !== 0 && (
                    <span className={`price-change-badge ${car.priceChange > 0 ? 'up' : 'down'}`}>
                      {car.priceChange > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {Math.abs(car.priceChange)}%
                    </span>
                  )}
                </div>
                
                {/* Price History Sparkline */}
                {car.priceHistory && car.priceHistory.length > 0 && (
                  <div className="price-history-container">
                    <span className="price-history-label">6-month trend</span>
                    <div className="sparkline-wrapper">
                      <svg className="sparkline" viewBox="0 0 100 30" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id={`sparkGrad-${car.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={car.priceChange && car.priceChange >= 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'} />
                            <stop offset="100%" stopColor="transparent" />
                          </linearGradient>
                        </defs>
                        {(() => {
                          const prices = car.priceHistory!;
                          const min = Math.min(...prices) * 0.98;
                          const max = Math.max(...prices) * 1.02;
                          const range = max - min || 1;
                          const points = prices.map((p, i) => {
                            const x = (i / (prices.length - 1)) * 100;
                            const y = 30 - ((p - min) / range) * 28;
                            return `${x},${y}`;
                          }).join(' ');
                          return (
                            <>
                              <polygon points={`0,30 ${points} 100,30`} fill={`url(#sparkGrad-${car.id})`} />
                              <polyline 
                                points={points} 
                                fill="none" 
                                stroke={car.priceChange && car.priceChange >= 0 ? '#10b981' : '#ef4444'} 
                                strokeWidth="2" 
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </>
                          );
                        })()}
                      </svg>
                    </div>
                  </div>
                )}
                
                <div className="stats-row">
                  <div className="stat-box">
                    <span className="stat-icon"><Gauge size={16} /></span>
                    <div className="stat-text"><strong>{car.mileage.toLocaleString()}</strong><span>km</span></div>
                  </div>
                  <div className="stat-box">
                    <span className="stat-icon"><Settings2 size={16} /></span>
                    <div className="stat-text"><strong>{car.transmission}</strong><span>Trans</span></div>
                  </div>
                  <div className="stat-box">
                    <span className="stat-icon"><ClipboardCheck size={16} /></span>
                    <div className="stat-text"><strong>{car.condition}</strong><span>Status</span></div>
                  </div>
                </div>
                <div className="card-actions">
                  <Link 
                    to={`/vehicle/${car.id}`}
                    state={{ car }}
                    className="btn-view-details"
                  >
                    <Eye size={16} />
                    <span>View Details</span>
                  </Link>
                  <button 
                    className="btn-glass-purple contact-seller-btn"
                    onClick={() => car.vehicleUrl && window.open(car.vehicleUrl, '_blank', 'noopener,noreferrer')}
                    disabled={!car.vehicleUrl}
                    title={car.vehicleUrl ? 'View on Riyasewana.com' : 'Link not available'}
                  >
                    <ExternalLink size={16} />
                    <span>Contact Seller</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="pagination-container">
            <button 
              className="pagination-btn"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={18} />
              Previous
            </button>
            
            <div className="pagination-pages">
              {/* First page */}
              {currentPage > 3 && (
                <>
                  <button 
                    className="pagination-page"
                    onClick={() => setCurrentPage(1)}
                  >
                    1
                  </button>
                  {currentPage > 4 && <span className="pagination-ellipsis">...</span>}
                </>
              )}
              
              {/* Page numbers around current */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => Math.abs(page - currentPage) <= 2)
                .map(page => (
                  <button
                    key={page}
                    className={`pagination-page ${page === currentPage ? 'active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
              
              {/* Last page */}
              {currentPage < totalPages - 2 && (
                <>
                  {currentPage < totalPages - 3 && <span className="pagination-ellipsis">...</span>}
                  <button 
                    className="pagination-page"
                    onClick={() => setCurrentPage(totalPages)}
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>
            
            <button 
              className="pagination-btn"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight size={18} />
            </button>
          </div>
        )}
        
        <div className="pagination-info">
          Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, sortedResults.length)} of {sortedResults.length} vehicles
        </div>
      </section>

      {/* Similar Choices Section */}
      <section className="listings-section similar-section">
        <div className="section-header-row">
          <h3 className="section-title">Similar Vehicles to Consider</h3>
        </div>
        
        <div className="flex-results-grid">
          {similarVehicles.map(car => (
            <div key={car.id} className="glass-card flex-card">
              <div className="card-content">
                <div className="flex-row-between">
                  <h4 className="car-title">{car.name}</h4>
                  <span className="year-badge">{car.year}</span>
                </div>
                
                <div className="price-display">
                  <span className="currency">LKR</span> {car.price}M
                </div>
                
                <div className="stats-row">
                  <div className="stat-box">
                    <span className="stat-icon"><Gauge size={16} /></span>
                    <div className="stat-text"><strong>{car.mileage.toLocaleString()}</strong><span>km</span></div>
                  </div>
                  <div className="stat-box">
                    <span className="stat-icon"><Settings2 size={16} /></span>
                    <div className="stat-text"><strong>{car.transmission}</strong><span>Trans</span></div>
                  </div>
                  <div className="stat-box">
                    <span className="stat-icon"><ClipboardCheck size={16} /></span>
                    <div className="stat-text"><strong>{car.condition}</strong><span>Status</span></div>
                  </div>
                </div>
                <button 
                  className="btn-glass-purple contact-seller-btn"
                  onClick={() => car.vehicleUrl && window.open(car.vehicleUrl, '_blank', 'noopener,noreferrer')}
                  disabled={!car.vehicleUrl}
                  title={car.vehicleUrl ? 'View on Riyasewana.com' : 'Link not available'}
                >
                  <ExternalLink size={14} style={{ marginRight: '0.4rem' }} />
                  View Listing
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Apple-style Compare Tray */}
      <div className={`compare-tray ${compareList.length > 0 ? 'visible' : ''}`}>
        <div className="compare-tray-content">
          <div className="compare-tray-left">
            <GitCompare size={20} />
            <span className="compare-tray-title">Compare</span>
            <span className="compare-count">{compareList.length}/3</span>
          </div>
          
          <div className="compare-tray-cars">
            {compareList.map(car => (
              <div key={car.id} className="compare-tray-car">
                <VehicleImage 
                  vehicleUrl={car.vehicleUrl} 
                  alt={car.name}
                  lazy
                  showLoadingState={false}
                  fallbackImage="https://images.unsplash.com/photo-1621007947382-bb3c3994e3fd?auto=format&fit=crop&w=600&q=80"
                />
                <span className="compare-tray-car-name">{car.name}</span>
                <button className="compare-tray-remove" onClick={() => toggleCompare(car)}>
                  <X size={14} />
                </button>
              </div>
            ))}
            {/* Empty slots */}
            {Array.from({ length: 3 - compareList.length }).map((_, i) => (
              <div key={`empty-${i}`} className="compare-tray-car empty">
                <Plus size={18} />
              </div>
            ))}
          </div>
          
          <div className="compare-tray-actions">
            <button className="compare-clear-btn" onClick={clearCompare}>
              Clear
            </button>
            <button 
              className="compare-now-btn" 
              onClick={() => setShowCompareModal(true)}
              disabled={compareList.length < 2}
            >
              Compare Now
            </button>
          </div>
        </div>
      </div>

      {/* Apple-style Compare Modal */}
      {showCompareModal && (
        <div className="compare-modal-overlay" onClick={() => setShowCompareModal(false)}>
          <div className="compare-modal" onClick={e => e.stopPropagation()}>
            <div className="compare-modal-header">
              <h2>Compare Vehicles</h2>
              <button className="compare-modal-close" onClick={() => setShowCompareModal(false)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="compare-modal-content">
              {/* Car Headers */}
              <div className="compare-row compare-header-row">
                <div className="compare-label"></div>
                {compareList.map(car => (
                  <div key={car.id} className="compare-cell compare-car-header">
                    <VehicleImage 
                      vehicleUrl={car.vehicleUrl} 
                      alt={car.name} 
                      className="compare-car-image"
                      lazy
                      showLoadingState={false}
                      fallbackImage="https://images.unsplash.com/photo-1621007947382-bb3c3994e3fd?auto=format&fit=crop&w=600&q=80"
                    />
                    <h3>{car.name}</h3>
                    <span className="compare-year">{car.year}</span>
                  </div>
                ))}
              </div>

              {/* Price Row */}
              <div className="compare-row">
                <div className="compare-label">Price</div>
                {compareList.map(car => {
                  const prices = compareList.map(c => c.price);
                  const minPrice = Math.min(...prices);
                  const isLowest = car.price === minPrice && compareList.length > 1;
                  return (
                    <div key={car.id} className={`compare-cell ${isLowest ? 'best-value' : ''}`}>
                      <span className="compare-value">{car.price}M LKR</span>
                      {isLowest && <span className="best-badge">Lowest</span>}
                    </div>
                  );
                })}
              </div>

              {/* Mileage Row */}
              <div className="compare-row">
                <div className="compare-label">Mileage</div>
                {compareList.map(car => {
                  const mileages = compareList.map(c => c.mileage);
                  const minMileage = Math.min(...mileages);
                  const isLowest = car.mileage === minMileage && compareList.length > 1;
                  return (
                    <div key={car.id} className={`compare-cell ${isLowest ? 'best-value' : ''}`}>
                      <span className="compare-value">{car.mileage.toLocaleString()} km</span>
                      {isLowest && <span className="best-badge">Lowest</span>}
                    </div>
                  );
                })}
              </div>

              {/* Year Row */}
              <div className="compare-row">
                <div className="compare-label">Year</div>
                {compareList.map(car => {
                  const years = compareList.map(c => c.year);
                  const maxYear = Math.max(...years);
                  const isNewest = car.year === maxYear && compareList.length > 1;
                  return (
                    <div key={car.id} className={`compare-cell ${isNewest ? 'best-value' : ''}`}>
                      <span className="compare-value">{car.year}</span>
                      {isNewest && <span className="best-badge">Newest</span>}
                    </div>
                  );
                })}
              </div>

              {/* Transmission Row */}
              <div className="compare-row">
                <div className="compare-label">Transmission</div>
                {compareList.map(car => (
                  <div key={car.id} className="compare-cell">
                    <span className="compare-value">{car.transmission}</span>
                  </div>
                ))}
              </div>

              {/* Condition Row */}
              <div className="compare-row">
                <div className="compare-label">Condition</div>
                {compareList.map(car => (
                  <div key={car.id} className="compare-cell">
                    <span className="compare-value">{car.condition}</span>
                  </div>
                ))}
              </div>

              {/* CTA Row */}
              <div className="compare-row compare-cta-row">
                <div className="compare-label"></div>
                {compareList.map(car => (
                  <div key={car.id} className="compare-cell">
                    <button className="compare-contact-btn">Contact Seller</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SearchResults;