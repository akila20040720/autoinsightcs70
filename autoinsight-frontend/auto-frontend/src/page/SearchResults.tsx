import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpDown,
  Calendar,
  Car,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  DollarSign,
  Gauge,
  GitCompare,
  Heart,
  Info,
  MapPin,
  RotateCcw,
  Settings2,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import MultiSelectFilter from '../component/MultiSelectFilter';
import OgImage from '../component/OgImage';
import { SearchResultsSkeleton } from '../component/Skeleton';
import {
  EMPTY_FILTERS,
  type FacetsResponse,
  type MarketAnalysis,
  type Vehicle,
  type VehicleFilters,
  type VehicleSort,
  fetchFacets,
  fetchListings,
} from '../services/vehicleDataService';
import {
  clearCompareVehicles,
  getCompareVehicles,
  getFavorites,
  isCompared,
  isFavorite,
  listenToStoredVehicles,
  toggleCompareVehicle,
  toggleFavorite,
  type StoredVehicleSummary,
} from '../services/marketplaceStorage';
import '../styles/SearchResults.css';

type SortOption = 'newest' | 'price-low' | 'price-high' | 'year-new' | 'year-old' | 'mileage-low' | 'mileage-high';

interface HomeFilters {
  brand?: string;
  model?: string;
  condition?: string;
  priceRange?: string;
  city?: string;
  mileageRange?: string;
  yearRange?: string;
}

const DEFAULT_FACETS: FacetsResponse = {
  vehicleTypes: [],
  makes: [],
  models: [],
  conditions: [],
  districts: [],
};

const EMPTY_MARKET_ANALYSIS: MarketAnalysis = {
  previousMonthPriceLkr: 0,
  nextWeekPriceLkr: 0,
  avgPriceLkr: 0,
  avgMileage: 0,
  priceTrend: [],
};

const ITEMS_PER_PAGE = 24;

function formatPrice(price: number): string {
  return `${price.toFixed(2)}M`;
}

function formatLkrMillions(valueLkr: number): string {
  return `${(valueLkr / 1_000_000).toFixed(2)}M`;
}

function vehicleName(vehicle: Vehicle | StoredVehicleSummary): string {
  return `${vehicle.make} ${vehicle.model}`.trim();
}

function createMailto(vehicle: Vehicle | StoredVehicleSummary): string {
  const subject = encodeURIComponent(`Inspection request: ${vehicleName(vehicle)} (${vehicle.year})`);
  const body = encodeURIComponent(
    [
      'Hi AutoInsight team,',
      '',
      `I need a pre-purchase inspection for this vehicle: ${vehicleName(vehicle)} (${vehicle.year}).`,
      `Price: LKR ${vehicle.price.toFixed(2)}M`,
      `Mileage: ${vehicle.mileage.toLocaleString()} km`,
      vehicle.vehicleUrl ? `Listing: ${vehicle.vehicleUrl}` : '',
      '',
      'Please contact me with available inspection slots and pricing.',
    ]
      .filter(Boolean)
      .join('\n'),
  );
  return `mailto:?subject=${subject}&body=${body}`;
}

function applyPresetFilters(base: VehicleFilters, incoming?: HomeFilters | VehicleFilters): VehicleFilters {
  if (!incoming) return base;
  if (Array.isArray((incoming as VehicleFilters).make)) {
    return { ...base, ...(incoming as VehicleFilters) };
  }

  const home = incoming as HomeFilters;
  const next: VehicleFilters = { ...base };

  if (home.brand && home.brand !== 'All') next.make = [home.brand];
  if (home.model && home.model !== 'All') next.model = [home.model];
  if (home.city && home.city !== 'All') next.district = [home.city];
  if (home.condition && home.condition !== 'All') {
    const conditionMap: Record<string, Vehicle['condition']> = {
      Registered: 'Used',
      Recondition: 'Recondition',
      Unregistered: 'Brand New',
    };
    const condition = conditionMap[home.condition];
    if (condition) next.condition = [condition];
  }

  if (home.priceRange === 'Below10M') next.priceMax = 10_000_000;
  if (home.priceRange === '10Mto20M') {
    next.priceMin = 10_000_000;
    next.priceMax = 20_000_000;
  }
  if (home.priceRange === 'Above20M') next.priceMin = 20_000_000;

  if (home.mileageRange === 'Below50k') next.mileageMax = 50_000;
  if (home.mileageRange === '50kto100k') {
    next.mileageMin = 50_000;
    next.mileageMax = 100_000;
  }
  if (home.mileageRange === 'Above100k') next.mileageMin = 100_000;

  if (home.yearRange && home.yearRange !== 'All') {
    const year = Number(home.yearRange);
    if (Number.isFinite(year)) {
      next.yearMin = year;
      next.yearMax = year;
    }
  }

  return next;
}

function toHomeFilters(filters: VehicleFilters): HomeFilters {
  let priceRange = 'All';
  if (filters.priceMin === 10_000_000 && filters.priceMax === 20_000_000) priceRange = '10Mto20M';
  else if (filters.priceMax === 10_000_000) priceRange = 'Below10M';
  else if (filters.priceMin === 20_000_000) priceRange = 'Above20M';

  let mileageRange = 'All';
  if (filters.mileageMax === 50_000) mileageRange = 'Below50k';
  else if (filters.mileageMin === 50_000 && filters.mileageMax === 100_000) mileageRange = '50kto100k';
  else if (filters.mileageMin === 100_000) mileageRange = 'Above100k';

  let condition = 'All';
  if (filters.condition[0] === 'Used') condition = 'Registered';
  if (filters.condition[0] === 'Recondition') condition = 'Recondition';
  if (filters.condition[0] === 'Brand New') condition = 'Unregistered';

  return {
    brand: filters.make[0] ?? 'All',
    model: filters.model[0] ?? 'All',
    condition,
    priceRange,
    city: filters.district[0] ?? 'All',
    mileageRange,
    yearRange:
      filters.yearMin && filters.yearMax && filters.yearMin === filters.yearMax ? String(filters.yearMin) : 'All',
  };
}

function sortOptionToApi(sort: SortOption): { sort: VehicleSort; direction: 'asc' | 'desc' } {
  switch (sort) {
    case 'price-low':
      return { sort: 'price', direction: 'asc' };
    case 'price-high':
      return { sort: 'price', direction: 'desc' };
    case 'year-old':
      return { sort: 'year', direction: 'asc' };
    case 'year-new':
      return { sort: 'year', direction: 'desc' };
    case 'mileage-low':
      return { sort: 'mileage', direction: 'asc' };
    case 'mileage-high':
      return { sort: 'mileage', direction: 'desc' };
    default:
      return { sort: 'newest', direction: 'desc' };
  }
}

const SearchResults: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const incomingFilters = (location.state as { filters?: HomeFilters | VehicleFilters } | null)?.filters;

  const [filters, setFilters] = useState<VehicleFilters>(() => applyPresetFilters(EMPTY_FILTERS, incomingFilters));
  const [facets, setFacets] = useState<FacetsResponse>(DEFAULT_FACETS);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [avgPrice, setAvgPrice] = useState(0);
  const [avgMileage, setAvgMileage] = useState(0);
  const [marketAnalysis, setMarketAnalysis] = useState<MarketAnalysis>(EMPTY_MARKET_ANALYSIS);
  const [favorites, setFavorites] = useState<StoredVehicleSummary[]>(() => getFavorites());
  const [compareVehicles, setCompareVehicles] = useState<StoredVehicleSummary[]>(() => getCompareVehicles());

  useEffect(() => {
    return listenToStoredVehicles(() => {
      setFavorites(getFavorites());
      setCompareVehicles(getCompareVehicles());
    });
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortBy]);

  useEffect(() => {
    let active = true;
    fetchFacets(filters)
      .then((payload) => {
        if (!active) return;
        setFacets(payload);
      })
      .catch(() => {
        if (!active) return;
        setFacets(DEFAULT_FACETS);
      });

    return () => {
      active = false;
    };
  }, [filters]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(null);

    const apiSort = sortOptionToApi(sortBy);
    fetchListings(filters, {
      sort: apiSort.sort,
      direction: apiSort.direction,
      page: currentPage,
      limit: ITEMS_PER_PAGE,
    })
      .then((payload) => {
        if (!active) return;
        setVehicles(payload.items);
        setTotal(payload.meta.total);
        setAvgPrice(payload.stats.avgPriceMillion);
        setAvgMileage(payload.stats.avgMileage);
        setMarketAnalysis(payload.stats.marketAnalysis);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setLoadError(error instanceof Error ? error.message : 'Failed to load marketplace listings.');
        setVehicles([]);
        setTotal(0);
        setAvgPrice(0);
        setAvgMileage(0);
        setMarketAnalysis(EMPTY_MARKET_ANALYSIS);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [filters, currentPage, sortBy]);

  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
  const searchQuery = useMemo(() => {
    if (filters.make.length > 0 && filters.model.length > 0) {
      return `${filters.make.join(', ')} ${filters.model.join(', ')}`;
    }
    if (filters.make.length > 0) return filters.make.join(', ');
    return 'All Vehicles';
  }, [filters.make, filters.model]);

  const filterChips = useMemo(() => {
    const chips: string[] = [];
    chips.push(...filters.vehicleType);
    chips.push(...filters.make);
    chips.push(...filters.model);
    chips.push(...filters.condition);
    chips.push(...filters.district);
    if (filters.priceMin || filters.priceMax) {
      chips.push(`Price ${filters.priceMin ? `${Math.round(filters.priceMin / 1_000_000)}M` : '0'}-${filters.priceMax ? `${Math.round(filters.priceMax / 1_000_000)}M` : 'max'}`);
    }
    if (filters.mileageMin || filters.mileageMax) {
      chips.push(`Mileage ${filters.mileageMin ? filters.mileageMin.toLocaleString() : '0'}-${filters.mileageMax ? filters.mileageMax.toLocaleString() : 'max'} km`);
    }
    if (filters.yearMin || filters.yearMax) {
      chips.push(`Year ${filters.yearMin ?? 'min'}-${filters.yearMax ?? 'max'}`);
    }
    return chips;
  }, [filters]);

  const favoriteIds = useMemo(() => new Set(favorites.map((item) => item.id)), [favorites]);
  const compareIds = useMemo(() => new Set(compareVehicles.map((item) => item.id)), [compareVehicles]);
  const chartData = useMemo(() => {
    const points = marketAnalysis.priceTrend.filter((point) => point.valueLkr > 0);
    if (points.length === 0) {
      return null;
    }
    const values = points.map((point) => point.valueLkr);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(max - min, 1);
    const width = 500;
    const height = 180;
    const mapped = points.map((point, index) => ({
      ...point,
      x: points.length === 1 ? width / 2 : (index / (points.length - 1)) * width,
      y: height - ((point.valueLkr - min) / range) * height,
    }));

    return {
      points: mapped,
      polyline: mapped.map((point) => `${point.x},${point.y}`).join(' '),
      area: `0,${height} ${mapped.map((point) => `${point.x},${point.y}`).join(' ')} ${width},${height}`,
      min,
      max,
      height,
      width,
    };
  }, [marketAnalysis]);

  const toggleArrayFilter = (key: keyof VehicleFilters, value: string) => {
    setFilters((prev) => {
      const current = new Set((prev[key] as string[]).map((item) => item.toLowerCase()));
      const nextValues = [...(prev[key] as string[])];
      if (current.has(value.toLowerCase())) {
        return {
          ...prev,
          [key]: nextValues.filter((item) => item.toLowerCase() !== value.toLowerCase()),
        };
      }
      if (key === 'make') {
        return {
          ...prev,
          make: [...nextValues, value],
          model: [],
        };
      }
      return {
        ...prev,
        [key]: [...nextValues, value],
      };
    });
  };

  const updateRange = (key: keyof VehicleFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value ? Number(value) : undefined,
    }));
  };

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
  };

  if (loading && vehicles.length === 0) {
    return <SearchResultsSkeleton />;
  }

  return (
    <div className="results-wrapper">
      <div className="results-header">
        <button className="back-btn" onClick={() => navigate('/', { state: { filters: toHomeFilters(filters) } })}>
          <ArrowLeft size={18} />
          Back to Search
        </button>
        <h2>
          Market Analysis for <span className="gradient-text">{searchQuery}</span>
        </h2>
        <p>Server-side filtering, pagination, and validation-backed listings for large marketplace datasets.</p>
        {filterChips.length > 0 && (
          <div className="filter-chips">
            {filterChips.map((chip) => (
              <span key={chip} className="filter-chip">
                {chip}
              </span>
            ))}
          </div>
        )}
      </div>

      <section className="analytics-dashboard">
        <div className="analytics-main">
          <div className="stats-overview-flex">
            <div className="stat-card glass-panel-small">
              <span className="stat-label">Average Price</span>
              <h3 className="stat-value">
                {formatLkrMillions(marketAnalysis.avgPriceLkr || Math.round(avgPrice * 1_000_000))}<span className="currency"> LKR</span>
              </h3>
            </div>
            <div className="stat-card glass-panel-small">
              <span className="stat-label">Average Mileage</span>
              <h3 className="stat-value">
                {(marketAnalysis.avgMileage || avgMileage).toLocaleString()}<span className="unit"> km</span>
              </h3>
            </div>
          </div>

          <div className="graph-card glass-panel-small">
            <div className="graph-header">
              <h4>{searchQuery} price trend</h4>
              <span
                className={`trend-badge ${
                  marketAnalysis.nextWeekPriceLkr >= marketAnalysis.previousMonthPriceLkr ? 'positive' : 'negative'
                }`}
              >
                {marketAnalysis.nextWeekPriceLkr >= marketAnalysis.previousMonthPriceLkr ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {marketAnalysis.nextWeekPriceLkr >= marketAnalysis.previousMonthPriceLkr ? ' Next week up' : ' Next week down'}
              </span>
            </div>
            {chartData ? (
              <div className="svg-graph-container" style={{ paddingLeft: '20px' }}>
                <svg viewBox="-20 0 540 210" className="price-chart" style={{ overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="fillGradReal" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="rgba(59, 130, 246, 0.25)" />
                      <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
                    </linearGradient>
                  </defs>
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const value = chartData.max - (chartData.max - chartData.min) * ratio;
                    return (
                      <g key={ratio}>
                        <line x1="0" y1={chartData.height * ratio} x2={chartData.width} y2={chartData.height * ratio} stroke="var(--glass-border)" strokeDasharray="4 4" />
                        <text x="-10" y={chartData.height * ratio + 4} fontSize="10" fill="var(--text-muted)" textAnchor="end">
                          {(value / 1_000_000).toFixed(1)}
                        </text>
                      </g>
                    );
                  })}
                  <polygon points={chartData.area} fill="url(#fillGradReal)" />
                  <polyline points={chartData.polyline} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  {chartData.points.map((point) => (
                    <circle key={point.label} cx={point.x} cy={point.y} r="4.5" fill={point.predicted ? '#f59e0b' : '#3b82f6'} />
                  ))}
                </svg>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {chartData.points.map((point) => (
                    <span key={point.label}>{point.label}</span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="market-summary-copy">
                <p>
                  {total.toLocaleString()} validated and normalized listings match the active filter set. Price-trend data will appear
                  when the selected vehicles map cleanly to workbook rows.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="analytics-sidebar">
          <div className="predictions-card glass-panel-small" style={marketAnalysis.available === false ? { position: 'relative' } : {}}>
            <h4>Market Analysis</h4>
            <div className="prediction-list" style={marketAnalysis.available === false ? { opacity: 0.5, pointerEvents: 'none', filter: 'blur(4px)' } : {}}>
              <div className="pred-item">
                <span className="pred-time">Previous Month Price</span>
                <span className="pred-price">{formatLkrMillions(marketAnalysis.previousMonthPriceLkr)}</span>
              </div>
              <div className="pred-item">
                <span className="pred-time">Next Week Price</span>
                <span className="pred-price">{formatLkrMillions(marketAnalysis.nextWeekPriceLkr)}</span>
              </div>
              <div className="pred-item">
                <span className="pred-time">AVG. Price</span>
                <span className="pred-price">{formatLkrMillions(marketAnalysis.avgPriceLkr || Math.round(avgPrice * 1_000_000))}</span>
              </div>
              <div className="pred-item">
                <span className="pred-time">AVG. Milleage</span>
                <span className="pred-price">{(marketAnalysis.avgMileage || avgMileage).toLocaleString()} km</span>
              </div>
              <div className="divider"></div>
              <div className="pred-item">
                <span className="pred-time">Listings</span>
                <span className="pred-price">{total.toLocaleString()}</span>
              </div>
            </div>
            {marketAnalysis.available === false && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                padding: '1rem',
                borderRadius: '0.5rem',
                backdropFilter: 'blur(10px)',
                color: '#fff',
                fontSize: '0.875rem',
                zIndex: 10,
              }}>
                <p style={{ margin: '0.5rem 0' }}>{marketAnalysis.reason || 'Not sufficient data to analyze'}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="results-content-layout">
        <aside className="results-filters-sidebar glass-panel-small">
          <div className="results-filters-header">
            <h3>
              <SlidersHorizontal size={16} /> Filters
            </h3>
            <button className="results-clear-btn" onClick={resetFilters}>
              <RotateCcw size={14} />
              Clear
            </button>
          </div>

          <MultiSelectFilter
            label="Vehicle Type"
            icon={Car}
            options={facets.vehicleTypes}
            selected={filters.vehicleType}
            onToggle={(value) => toggleArrayFilter('vehicleType', value)}
          />

          <MultiSelectFilter
            label="Make"
            icon={Car}
            options={facets.makes}
            selected={filters.make}
            onToggle={(value) => toggleArrayFilter('make', value)}
          />

          <MultiSelectFilter
            label="Model"
            icon={Settings2}
            options={facets.models}
            selected={filters.model}
            emptyLabel={filters.make.length > 0 ? 'No models match the selected makes' : 'Pick a make to narrow models'}
            onToggle={(value) => toggleArrayFilter('model', value)}
          />

          <MultiSelectFilter
            label="Condition"
            icon={ClipboardCheck}
            options={facets.conditions}
            selected={filters.condition}
            onToggle={(value) => toggleArrayFilter('condition', value)}
          />

          <MultiSelectFilter
            label="District"
            icon={MapPin}
            options={facets.districts}
            selected={filters.district}
            onToggle={(value) => toggleArrayFilter('district', value)}
          />

          <div className="results-filter-group">
            <label>
              <DollarSign size={14} /> Price Range
            </label>
            <div className="range-input-grid">
              <input
                type="number"
                placeholder="Min LKR"
                value={filters.priceMin ?? ''}
                onChange={(event) => updateRange('priceMin', event.target.value)}
              />
              <input
                type="number"
                placeholder="Max LKR"
                value={filters.priceMax ?? ''}
                onChange={(event) => updateRange('priceMax', event.target.value)}
              />
            </div>
          </div>

          <div className="results-filter-group">
            <label>
              <Gauge size={14} /> Mileage Range
            </label>
            <div className="range-input-grid">
              <input
                type="number"
                placeholder="Min km"
                value={filters.mileageMin ?? ''}
                onChange={(event) => updateRange('mileageMin', event.target.value)}
              />
              <input
                type="number"
                placeholder="Max km"
                value={filters.mileageMax ?? ''}
                onChange={(event) => updateRange('mileageMax', event.target.value)}
              />
            </div>
          </div>

          <div className="results-filter-group">
            <label>
              <Calendar size={14} /> Year Range
            </label>
            <div className="range-input-grid">
              <input
                type="number"
                placeholder="From"
                value={filters.yearMin ?? ''}
                onChange={(event) => updateRange('yearMin', event.target.value)}
              />
              <input
                type="number"
                placeholder="To"
                value={filters.yearMax ?? ''}
                onChange={(event) => updateRange('yearMax', event.target.value)}
              />
            </div>
          </div>
        </aside>

        <section className="listings-section results-listings-main">
          <div className="listings-header">
            <h3 className="section-title">Available Listings ({total.toLocaleString()})</h3>
            <div className="sort-container">
              <ArrowUpDown size={16} className="sort-icon" />
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortOption)} className="sort-select">
                <option value="newest">Newest</option>
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
                <strong>Marketplace API Error</strong>
                <p>{loadError}</p>
              </div>
            </div>
          )}

          <div className="compare-feature-tip glass-panel-small">
            <div className="tip-icon-wrapper">
              <Info size={18} />
            </div>
            <div className="tip-content">
              <strong>Compare Vehicles</strong>
              <p>Use the compare button on any card to keep up to 3 vehicles synced across pages and reloads.</p>
            </div>
          </div>

          <div className="flex-results-grid">
            {vehicles.map((vehicle) => {
              const favoriteActive = favoriteIds.has(vehicle.id) || isFavorite(vehicle.id);
              const compareActive = compareIds.has(vehicle.id) || isCompared(vehicle.id);

              return (
                <div key={vehicle.id} className={`glass-card flex-card ${compareActive ? 'compare-selected' : ''}`}>
                  <button
                    className={`favorite-btn ${favoriteActive ? 'active' : ''}`}
                    onClick={() => toggleFavorite(vehicle)}
                    title={favoriteActive ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Heart size={18} fill={favoriteActive ? 'currentColor' : 'none'} />
                  </button>

                  <div className="card-image-wrapper" onClick={() => navigate(`/vehicle/${encodeURIComponent(vehicle.id)}`)} role="presentation">
                    <OgImage listingUrl={vehicle.vehicleUrl} fallbackSrc={vehicle.imageUrl ?? undefined} alt={vehicleName(vehicle)} className="car-image" />
                  </div>

                  <div className="card-content">
                    <div className="price-mileage-row">
                      <div className="result-price">{formatPrice(vehicle.price)}</div>
                      <div className="result-mileage">{vehicle.mileage.toLocaleString()} km</div>
                    </div>

                    <a href={vehicle.vehicleUrl} target="_blank" rel="noopener noreferrer" className="result-gov-link">
                      View original listing
                    </a>

                    <h4 className="result-card-title" onClick={() => navigate(`/vehicle/${encodeURIComponent(vehicle.id)}`)} role="presentation">
                      {vehicle.year} {vehicleName(vehicle)}
                    </h4>

                    <div className="result-meta-row">
                      <span>{vehicle.condition}</span>
                      <span>{vehicle.district || 'Location pending'}</span>
                    </div>

                    <div className="result-meta-row validation-row">
                      <span>Validation: {vehicle.validationStatus}</span>
                      <span>{Math.round(vehicle.confidence * 100)}%</span>
                    </div>

                    <div className="result-card-actions-row">
                      <button className="result-check-btn" onClick={() => navigate(`/vehicle/${encodeURIComponent(vehicle.id)}`)}>
                        View Details
                      </button>
                      <button
                        className={`result-more-btn ${compareActive ? 'active' : ''}`}
                        onClick={() => toggleCompareVehicle(vehicle)}
                        disabled={!compareActive && compareVehicles.length >= 3}
                        title={compareActive ? 'Remove from compare' : compareVehicles.length >= 3 ? 'Max 3 cars' : 'Add to compare'}
                      >
                        <GitCompare size={14} />
                      </button>
                    </div>

                    <button className="need-inspection-btn" onClick={() => { window.location.href = createMailto(vehicle); }}>
                      Need Inspection
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="pagination-container">
              <button className="pagination-btn" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1}>
                <ChevronLeft size={18} />
                Previous
              </button>

              <div className="pagination-pages">
                {Array.from({ length: totalPages }, (_, index) => index + 1)
                  .filter((page) => Math.abs(page - currentPage) <= 2 || page === 1 || page === totalPages)
                  .map((page, index, pages) => (
                    <React.Fragment key={page}>
                      {index > 0 && pages[index - 1] !== page - 1 ? <span className="pagination-ellipsis">...</span> : null}
                      <button className={`pagination-page ${page === currentPage ? 'active' : ''}`} onClick={() => setCurrentPage(page)}>
                        {page}
                      </button>
                    </React.Fragment>
                  ))}
              </div>

              <button className="pagination-btn" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages}>
                Next
                <ChevronRight size={18} />
              </button>
            </div>
          )}

          <div className="pagination-info">
            Showing {total === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, total)} of{' '}
            {total.toLocaleString()} vehicles
          </div>
        </section>
      </div>

      <div className={`compare-tray ${compareVehicles.length > 0 ? 'visible' : ''}`}>
        <div className="compare-tray-content">
          <div className="compare-tray-left">
            <GitCompare size={18} />
            <span className="compare-tray-title">Compare</span>
            <span className="compare-count">{compareVehicles.length}/3</span>
          </div>

          <div className="compare-tray-cars">
            {compareVehicles.map((vehicle) => (
              <div key={vehicle.id} className="compare-tray-car">
                <OgImage listingUrl={vehicle.vehicleUrl} fallbackSrc={vehicle.imageUrl ?? undefined} alt={vehicleName(vehicle)} />
                <span className="compare-tray-car-name">{vehicleName(vehicle)}</span>
                <button className="compare-tray-remove" onClick={() => toggleCompareVehicle(vehicle)}>
                  remove
                </button>
              </div>
            ))}
          </div>

          <div className="compare-tray-actions">
            <button className="compare-clear-btn" onClick={clearCompareVehicles}>
              Clear
            </button>
            <button className="compare-now-btn" onClick={() => navigate('/compare')} disabled={compareVehicles.length < 2}>
              Compare now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
