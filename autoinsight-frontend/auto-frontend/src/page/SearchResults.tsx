import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Gauge, Settings2, ClipboardCheck, TrendingUp, TrendingDown, ArrowLeft,
  GitCompare, X, Plus, Heart, ChevronLeft, ChevronRight,
  ArrowUpDown, Info, Car, DollarSign, MapPin, Calendar, SlidersHorizontal,
  RotateCcw, ChevronDown
} from 'lucide-react';

type SortOption = 'default' | 'price-low' | 'price-high' | 'year-new' | 'year-old' | 'mileage-low' | 'mileage-high';
import { SearchResultsSkeleton } from '../component/Skeleton';
import OgImage from '../component/OgImage';
import { 
  searchVehiclesLive,
  getTopMakes,
  getPopularModels,
  getUniqueDistricts,
  type Vehicle,
  type LiveSearchApiFilters
} from '../services/vehicleDataService';
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
  priceHistory?: number[]; 
  priceChange?: number; 
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

const DEFAULT_FILTERS: FilterState = {
  brand: 'All',
  model: 'All',
  condition: 'All',
  priceRange: 'All',
  city: 'All',
  mileageRange: 'All',
  yearRange: 'All',
};

const FILTER_MAKES = getTopMakes(20).map((entry) => entry.make);
const FILTER_CITIES = getUniqueDistricts().slice(0, 40);
const FILTER_YEARS = Array.from({ length: 30 }, (_, i) => String(new Date().getFullYear() - i));

function vehicleToCarResult(v: Vehicle): CarResult {
  const basePrice = v.price;
  const volatility = 0.03; 
  const priceHistory: number[] = [];
  let currentPrice = basePrice * (1 - volatility * 3);
  
  // Use a stable seed based on the car's properties so the chart doesn't change on refresh
  let seed = v.price + (v.mileage || 1);
  
  for (let i = 0; i < 6; i++) {
    priceHistory.push(Math.round(currentPrice * 100) / 100);
    // Deterministic random number
    const pseudoRand = Math.abs(Math.sin(seed++) * 10000) % 1;
    currentPrice += (pseudoRand - 0.3) * basePrice * volatility;
    currentPrice = Math.max(currentPrice, basePrice * 0.9);
    currentPrice = Math.min(currentPrice, basePrice * 1.1);
  }
  priceHistory[5] = basePrice; 
  
  const priceChange = Math.round(((basePrice - priceHistory[0]) / priceHistory[0]) * 100 * 10) / 10;
  
  return {
    id: v.id,
    name: `${v.make} ${v.model}`,
    year: v.year,
    price: v.price,
    mileage: v.mileage,
    transmission: 'Auto', 
    condition: v.condition,
    imageUrl: v.imageUrl,
    priceHistory,
    priceChange,
    district: v.district,
    vehicleUrl: v.vehicleUrl,
  };
}

function convertFilters(filters: FilterState): LiveSearchApiFilters {
  const serviceFilters: LiveSearchApiFilters = {
    vehicle_type: 'cars',
  };
  
  if (filters.brand !== 'All') serviceFilters.make = filters.brand;
  if (filters.model !== 'All') serviceFilters.model = filters.model;
  if (filters.city !== 'All') serviceFilters.district = filters.city;
  
  if (filters.condition !== 'All') {
    const condMap: Record<string, string> = {
      'Unregistered': 'Brand New',
      'Registered': 'Used',
      'Recondition': 'Recondition'
    };
    serviceFilters.condition = condMap[filters.condition] || filters.condition;
  }
  
  if (filters.priceRange !== 'All') {
    switch (filters.priceRange) {
      case 'Below10M':
        serviceFilters.max_price_lkr = 10_000_000;
        break;
      case '10Mto20M':
        serviceFilters.min_price_lkr = 10_000_000;
        serviceFilters.max_price_lkr = 20_000_000;
        break;
      case 'Above20M':
        serviceFilters.min_price_lkr = 20_000_000;
        break;
    }
  }
  
  if (filters.mileageRange !== 'All') {
    switch (filters.mileageRange) {
      case 'Below50k':
        serviceFilters.max_mileage = 50000;
        break;
      case '50kto100k':
        serviceFilters.min_mileage = 50000;
        serviceFilters.max_mileage = 100000;
        break;
      case 'Above100k':
        serviceFilters.min_mileage = 100000;
        break;
    }
  }
  
  if (filters.yearRange !== 'All') {
    const year = parseInt(filters.yearRange);
    if (!isNaN(year)) {
      serviceFilters.year = String(year);
    }
  }
  
  return serviceFilters;
}

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
  const [liveVehicles, setLiveVehicles] = useState<Vehicle[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

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

  const formatCardPrice = (price: number) => {
    if (price >= 1000) return price.toLocaleString();
    return `${price}M`;
  };

  const handleNeedInspection = (car: CarResult) => {
    const subject = encodeURIComponent(`Inspection request: ${car.name} (${car.year})`);
    const body = encodeURIComponent(
      [
        'Hi AutoInsight team,',
        '',
        `I need a pre-purchase inspection for this vehicle: ${car.name} (${car.year}).`,
        `Price: LKR ${car.price}M`,
        `Mileage: ${car.mileage.toLocaleString()} km`,
        car.vehicleUrl ? `Listing: ${car.vehicleUrl}` : '',
        '',
        'Please contact me with available inspection slots and pricing.',
      ]
        .filter(Boolean)
        .join('\n')
    );

    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const toggleCompare = (car: CarResult) => {
    setCompareList(prev => {
      const exists = prev.find(c => c.id === car.id);
      if (exists) {
        return prev.filter(c => c.id !== car.id);
      }
      if (prev.length >= 3) return prev; 
      return [...prev, car];
    });
  };

  const isInCompare = (carId: string) => compareList.some(c => c.id === carId);
  const clearCompare = () => setCompareList([]);

  const incomingFilters = (location.state as { filters?: FilterState } | null)?.filters;
  const [activeFilters, setActiveFilters] = useState<FilterState>(incomingFilters ?? DEFAULT_FILTERS);

  useEffect(() => {
    if (incomingFilters) {
      setActiveFilters(incomingFilters);
    }
  }, [incomingFilters]);

  const brand = activeFilters.brand;
  const model = activeFilters.model;

  const availableModels = useMemo(
    () => (brand === 'All' ? [] : getPopularModels(brand, 30).map(entry => entry.model)),
    [brand]
  );

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setActiveFilters(prev => {
      const next = { ...prev, [name]: value } as FilterState;
      if (name === 'brand') {
        next.model = 'All';
      }
      return next;
    });
  };

  const resetFilters = () => {
    setActiveFilters(DEFAULT_FILTERS);
  };

  const searchQuery = useMemo(() => {
    if (brand !== 'All' && model !== 'All') return `${brand} ${model}`;
    if (brand !== 'All') return brand;
    return 'All Vehicles';
  }, [brand, model]);

  const stats = useMemo(() => {
    if (liveVehicles.length === 0) {
      return {
        avgPrice: 0,
        avgMileage: 0,
        totalListings: 0,
        trend: 'down' as const,
        lastWeek: '0.00',
        lastMonth: '0.00',
        nextWeek: '0.00',
        nextMonth: '0.00',
      };
    }

    const prices = liveVehicles.map(v => v.price);
    const mileages = liveVehicles.map(v => v.mileage);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const avgMileage = mileages.reduce((a, b) => a + b, 0) / mileages.length;

    const marketStats = {
      avgPrice,
      avgMileage,
      totalListings: liveVehicles.length,
    };
    const trend = marketStats.avgPrice > 0 ? 'up' : 'down';
    return {
      avgPrice: Math.round(marketStats.avgPrice * 100) / 100,
      avgMileage: Math.round(marketStats.avgMileage),
      totalListings: marketStats.totalListings,
      trend,
      lastWeek: (marketStats.avgPrice * 0.98).toFixed(2),
      lastMonth: (marketStats.avgPrice * 0.95).toFixed(2),
      nextWeek: (marketStats.avgPrice * 1.02).toFixed(2),
      nextMonth: (marketStats.avgPrice * 1.04).toFixed(2),
    };
  }, [liveVehicles]);

  // Generate the coordinates and points deterministically for 2025-2026
  const chartData = useMemo(() => {
    const history = [];
    let currentPrice = stats.avgPrice * 0.9; 
    
    // Stable seed based on the average price
    let seed = stats.avgPrice || 1;
    
    // Generate 40 spiky historical points to represent the shorter 2025-2026 span
    for (let i = 0; i < 40; i++) {
      history.push(currentPrice);
      // Deterministic pseudo-random number between 0 and 1
      const pseudoRand = Math.abs(Math.sin(seed++) * 10000) % 1;
      currentPrice += (pseudoRand - 0.45) * stats.avgPrice * 0.08; 
    }
    history[39] = parseFloat(stats.lastWeek); 

    const nextWeekPrice = parseFloat(stats.nextWeek);
    const nextMonthPrice = parseFloat(stats.nextMonth);

    const allPrices = [...history, nextWeekPrice, nextMonthPrice];
    const minPrice = Math.min(...allPrices) * 0.92;
    const maxPrice = Math.max(...allPrices) * 1.08;
    const range = (maxPrice - minPrice) || 1;

    // SVG coordinate mapping
    const svgWidth = 500;
    const svgHeight = 180;
    const xHistorySpace = 360; 
    const xPredSpace = svgWidth - xHistorySpace;

    const historyPoints = history.map((price, i) => {
      const x = (i / 39) * xHistorySpace; 
      const y = svgHeight - ((price - minPrice) / range) * svgHeight;
      return { x, y, price };
    });

    const nextWeekX = xHistorySpace + xPredSpace * 0.4;
    const nextWeekY = svgHeight - ((nextWeekPrice - minPrice) / range) * svgHeight;

    const nextMonthX = xHistorySpace + xPredSpace * 0.9;
    const nextMonthY = svgHeight - ((nextMonthPrice - minPrice) / range) * svgHeight;

    return {
      historyPoints,
      minPrice,
      maxPrice,
      nextWeekPoint: { x: nextWeekX, y: nextWeekY, price: nextWeekPrice },
      nextMonthPoint: { x: nextMonthX, y: nextMonthY, price: nextMonthPrice },
      lastHistPoint: historyPoints[39]
    };
  }, [stats]);

  const allResults = useMemo<CarResult[]>(() => {
    return liveVehicles.map(vehicleToCarResult);
  }, [liveVehicles]);

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

  const totalPages = Math.ceil(sortedResults.length / ITEMS_PER_PAGE);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilters, sortBy]);

  const results = useMemo<CarResult[]>(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return sortedResults.slice(startIndex, endIndex);
  }, [sortedResults, currentPage]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const similarVehicles = useMemo<CarResult[]>(() => {
    if (allResults.length <= 1) return [];
    const firstResult = allResults[0];
    return allResults
      .filter(v => v.id !== firstResult.id)
      .filter(v => Math.abs(v.price - firstResult.price) <= 2)
      .slice(0, 3);
  }, [allResults]);

  const filterChips = useMemo(() => {
    const chips: string[] = [];
    if (activeFilters.condition !== 'All') chips.push(activeFilters.condition);
    if (activeFilters.priceRange !== 'All') chips.push(activeFilters.priceRange.replace(/([A-Z])/g, ' $1').trim());
    if (activeFilters.city !== 'All') chips.push(activeFilters.city);
    if (activeFilters.mileageRange !== 'All') chips.push(activeFilters.mileageRange.replace(/([A-Z])/g, ' $1').trim());
    if (activeFilters.yearRange !== 'All') chips.push(activeFilters.yearRange);
    return chips;
  }, [activeFilters]);

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    let active = true;

    const apiFilters = convertFilters(activeFilters);
    searchVehiclesLive({ ...apiFilters, max_results: 250 })
      .then((vehicles) => {
        if (!active) return;
        setLiveVehicles(vehicles);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setLiveVehicles([]);
        setLoadError(err instanceof Error ? err.message : 'Failed to fetch live listings.');
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [activeFilters]);

  if (loading) return <SearchResultsSkeleton />;

  return (
    <div className="results-wrapper">
      <div className="results-header">
        <button className="back-btn" onClick={() => navigate('/', { state: { filters: activeFilters } })}>
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
              <h4>{searchQuery} Price Trend (2025 – 2026)</h4>
              <span className={`trend-badge ${stats.trend === 'up' ? 'positive' : 'negative'}`}>
                {stats.trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {stats.trend === 'up' ? ' Increasing' : ' Decreasing'}
              </span>
            </div>
            
            <div className="svg-graph-container" style={{ paddingLeft: '20px' }}>
              <svg viewBox="-20 0 520 200" className="price-chart" style={{ overflow: 'visible' }}>
                <defs>
                  <linearGradient id="fillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(59, 130, 246, 0.25)" />
                    <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
                  </linearGradient>
                </defs>

                {/* Y-Axis Grid & Labels */}
                {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
                  const yVal = chartData.maxPrice - (chartData.maxPrice - chartData.minPrice) * ratio;
                  return (
                    <g key={ratio}>
                      <line x1="0" y1={180 * ratio} x2="500" y2={180 * ratio} stroke="var(--glass-border)" strokeDasharray="4 4" />
                      <text x="-10" y={180 * ratio + 4} fontSize="10" fill="var(--text-muted)" textAnchor="end">
                        {yVal.toFixed(1)}
                      </text>
                    </g>
                  );
                })}

                {/* Filled Area under historical line */}
                <polygon
                  points={`0,180 ${chartData.historyPoints.map(p => `${p.x},${p.y}`).join(' ')} ${chartData.lastHistPoint.x},180`}
                  fill="url(#fillGrad)"
                />

                {/* Main Historical Spiky Line */}
                <polyline
                  points={chartData.historyPoints.map(p => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Prediction Dotted Lines */}
                <line
                  x1={chartData.lastHistPoint.x} y1={chartData.lastHistPoint.y}
                  x2={chartData.nextWeekPoint.x} y2={chartData.nextWeekPoint.y}
                  stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4"
                />
                <line
                  x1={chartData.nextWeekPoint.x} y1={chartData.nextWeekPoint.y}
                  x2={chartData.nextMonthPoint.x} y2={chartData.nextMonthPoint.y}
                  stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4"
                />

                {/* Prediction Nodes */}
                <circle cx={chartData.nextWeekPoint.x} cy={chartData.nextWeekPoint.y} r="5" fill="#f59e0b" />
                <circle cx={chartData.nextMonthPoint.x} cy={chartData.nextMonthPoint.y} r="5" fill="#ef4444" />
              </svg>

              {/* X-Axis Labels for 2025 - 2026 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>
                <span>2025-11-15</span>
                <span style={{ marginLeft: '-40px' }}>2026-01-01</span>
                <span style={{ marginLeft: '-40px' }}>2026-02-01</span>
                <span>2026-03-01</span>
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
                <span className="pred-time" style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                  <span style={{display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b'}}></span>
                  Next Week
                </span>
                <span className="pred-price">{stats.nextWeek}M</span>
              </div>
              <div className="pred-item highlight">
                <span className="pred-time" style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                  <span style={{display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444'}}></span>
                  Next Month
                </span>
                <span className="pred-price">{stats.nextMonth}M</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="results-content-layout">
        <aside className="results-filters-sidebar glass-panel-small">
          <div className="results-filters-header">
            <h3><SlidersHorizontal size={16} /> Filters</h3>
            <button className="results-clear-btn" onClick={resetFilters}>
              <RotateCcw size={14} />
              Clear
            </button>
          </div>

          <div className="results-filter-group">
            <label><Car size={14} /> Make</label>
            <div className="results-select-wrap">
              <select name="brand" value={activeFilters.brand} onChange={handleFilterChange}>
                <option value="All">Any Make</option>
                {FILTER_MAKES.map(make => <option key={make} value={make}>{make}</option>)}
              </select>
              <ChevronDown size={14} className="results-select-chevron" />
            </div>
          </div>

          <div className="results-filter-group">
            <label><Settings2 size={14} /> Model</label>
            <div className="results-select-wrap">
              <select name="model" value={activeFilters.model} onChange={handleFilterChange} disabled={activeFilters.brand === 'All'}>
                <option value="All">Any Model</option>
                {availableModels.map(modelName => <option key={modelName} value={modelName}>{modelName}</option>)}
              </select>
              <ChevronDown size={14} className="results-select-chevron" />
            </div>
          </div>

          <div className="results-filter-group">
            <label><ClipboardCheck size={14} /> Condition</label>
            <div className="results-select-wrap">
              <select name="condition" value={activeFilters.condition} onChange={handleFilterChange}>
                <option value="All">Any</option>
                <option value="Unregistered">Brand New</option>
                <option value="Registered">Used</option>
                <option value="Recondition">Reconditioned</option>
              </select>
              <ChevronDown size={14} className="results-select-chevron" />
            </div>
          </div>

          <div className="results-filter-group">
            <label><DollarSign size={14} /> Price Range</label>
            <div className="results-select-wrap">
              <select name="priceRange" value={activeFilters.priceRange} onChange={handleFilterChange}>
                <option value="All">Any Price</option>
                <option value="Below10M">Below 10M LKR</option>
                <option value="10Mto20M">10M - 20M LKR</option>
                <option value="Above20M">Above 20M LKR</option>
              </select>
              <ChevronDown size={14} className="results-select-chevron" />
            </div>
          </div>

          <div className="results-filter-group">
            <label><Gauge size={14} /> Mileage</label>
            <div className="results-select-wrap">
              <select name="mileageRange" value={activeFilters.mileageRange} onChange={handleFilterChange}>
                <option value="All">Any Mileage</option>
                <option value="Below50k">Below 50,000 km</option>
                <option value="50kto100k">50k - 100k km</option>
                <option value="Above100k">Above 100k km</option>
              </select>
              <ChevronDown size={14} className="results-select-chevron" />
            </div>
          </div>

          <div className="results-filter-group">
            <label><MapPin size={14} /> City</label>
            <div className="results-select-wrap">
              <select name="city" value={activeFilters.city} onChange={handleFilterChange}>
                <option value="All">Any City</option>
                {FILTER_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
              </select>
              <ChevronDown size={14} className="results-select-chevron" />
            </div>
          </div>

          <div className="results-filter-group">
            <label><Calendar size={14} /> Year</label>
            <div className="results-select-wrap">
              <select name="yearRange" value={activeFilters.yearRange} onChange={handleFilterChange}>
                <option value="All">Any Year</option>
                {FILTER_YEARS.map(year => <option key={year} value={year}>{year}</option>)}
              </select>
              <ChevronDown size={14} className="results-select-chevron" />
            </div>
          </div>
        </aside>

        <section className="listings-section results-listings-main">
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

          {loadError && (
            <div className="compare-feature-tip glass-panel-small" style={{ marginBottom: '1rem' }}>
              <div className="tip-content">
                <strong>Live Scraping Error</strong>
                <p>{loadError}</p>
              </div>
            </div>
          )}

        {/* COMPARE FEATURE TIP MESSAGE */}
          <div className="compare-feature-tip glass-panel-small">
            <div className="tip-icon-wrapper">
              <Info size={18} />
            </div>
            <div className="tip-content">
              <strong>Compare Vehicles</strong>
              <p>Click the <kbd><Plus size={12} className="inline-icon" /></kbd> icon on any vehicle card to compare up to 3 models side-by-side.</p>
            </div>
          </div>
        
          <div className="flex-results-grid">
          {results.map(car => (
            <div key={car.id} className={`glass-card flex-card ${isInCompare(car.id) ? 'compare-selected' : ''}`}>
              <button 
                className={`favorite-btn ${isFavorite(car.id) ? 'active' : ''}`}
                onClick={() => toggleFavorite(car.id)}
                title={isFavorite(car.id) ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart size={18} fill={isFavorite(car.id) ? 'currentColor' : 'none'} />
              </button>
              
              <div className="card-image-wrapper">
                <OgImage
                  listingUrl={car.vehicleUrl}
                  alt={car.name}
                  className="car-image"
                />
              </div>
              <div className="card-content">
                <div className="price-mileage-row">
                  <div className="result-price">{formatCardPrice(car.price)}</div>
                  <div className="result-mileage">{car.mileage.toLocaleString()} km</div>
                </div>

                <a
                  href={car.vehicleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="result-gov-link"
                >
                  Excl. Gov. Charges
                </a>

                <h4 className="result-card-title">{car.year} {car.name}</h4>

                <div className="result-meta-row">
                  <span>Dealer: {car.condition === 'Unregistered' ? 'New' : 'Used'}</span>
                  <span>{car.district || 'Location pending'}</span>
                </div>

                <div className="result-card-actions-row">
                  <button 
                    className="result-check-btn"
                    onClick={() => car.vehicleUrl && window.open(car.vehicleUrl, '_blank', 'noopener,noreferrer')}
                    disabled={!car.vehicleUrl}
                    title={car.vehicleUrl ? 'Check availability on listing site' : 'Link not available'}
                  >
                    Check Availability
                  </button>
                  <button
                    className={`result-more-btn ${isInCompare(car.id) ? 'active' : ''}`}
                    onClick={() => toggleCompare(car)}
                    disabled={!isInCompare(car.id) && compareList.length >= 3}
                    title={isInCompare(car.id) ? 'Remove from compare' : compareList.length >= 3 ? 'Max 3 cars' : 'Add to compare'}
                    aria-label={isInCompare(car.id) ? 'Remove from compare' : 'Add to compare'}
                  >
                    {isInCompare(car.id) ? <X size={18} /> : <Plus size={18} />}
                  </button>
                </div>
                <button
                  className="need-inspection-btn"
                  onClick={() => handleNeedInspection(car)}
                >
                  Need Inspection
                </button>
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
      </div>

      {/* Similar Choices Section */}
      <section className="listings-section similar-section">
        <div className="section-header-row">
          <h3 className="section-title">Similar Vehicles to Consider</h3>
        </div>
        
        <div className="flex-results-grid">
          {similarVehicles.map(car => (
            <div key={car.id} className="glass-card flex-card">
              <button 
                className={`favorite-btn ${isFavorite(car.id) ? 'active' : ''}`}
                onClick={() => toggleFavorite(car.id)}
                title={isFavorite(car.id) ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart size={18} fill={isFavorite(car.id) ? 'currentColor' : 'none'} />
              </button>

              <div className="card-image-wrapper">
                <OgImage
                  listingUrl={car.vehicleUrl}
                  alt={car.name}
                  className="car-image"
                />
              </div>

              <div className="card-content">
                <div className="price-mileage-row">
                  <div className="result-price">{formatCardPrice(car.price)}</div>
                  <div className="result-mileage">{car.mileage.toLocaleString()} km</div>
                </div>

                <a
                  href={car.vehicleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="result-gov-link"
                >
                  Excl. Gov. Charges
                </a>

                <h4 className="result-card-title">{car.year} {car.name}</h4>

                <div className="result-meta-row">
                  <span>Dealer: {car.condition === 'Unregistered' ? 'New' : 'Used'}</span>
                  <span>{car.district || 'Location pending'}</span>
                </div>

                <div className="result-card-actions-row">
                  <button 
                    className="result-check-btn"
                    onClick={() => car.vehicleUrl && window.open(car.vehicleUrl, '_blank', 'noopener,noreferrer')}
                    disabled={!car.vehicleUrl}
                    title={car.vehicleUrl ? 'Check availability on listing site' : 'Link not available'}
                  >
                    Check Availability
                  </button>
                  <button
                    className={`result-more-btn ${isInCompare(car.id) ? 'active' : ''}`}
                    onClick={() => toggleCompare(car)}
                    disabled={!isInCompare(car.id) && compareList.length >= 3}
                    title={isInCompare(car.id) ? 'Remove from compare' : compareList.length >= 3 ? 'Max 3 cars' : 'Add to compare'}
                    aria-label={isInCompare(car.id) ? 'Remove from compare' : 'Add to compare'}
                  >
                    {isInCompare(car.id) ? <X size={18} /> : <Plus size={18} />}
                  </button>
                </div>

                <button 
                  className="need-inspection-btn"
                  onClick={() => handleNeedInspection(car)}
                >
                  Need Inspection
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
                <OgImage
                  listingUrl={car.vehicleUrl}
                  alt={car.name}
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
              onClick={() => navigate('/compare', { state: { vehicleIds: compareList.map(c => c.id) } })}
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
                    <OgImage
                      listingUrl={car.vehicleUrl}
                      alt={car.name}
                      className="compare-car-image"
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