import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  BookmarkX,
  Calendar,
  Car,
  ChevronDown,
  DollarSign,
  Flame,
  Gauge,
  Heart,
  MapPin,
  RotateCcw,
  Search,
  Settings2,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import OgImage from '../component/OgImage';
import { MarketplaceSkeleton } from '../component/Skeleton';
import customBannerImage from '../images/banner.png';
import {
  EMPTY_FILTERS,
  type FacetOption,
  type FacetsResponse,
  type Vehicle,
  type VehicleFilters,
  fetchFacets,
  fetchListings,
} from '../services/vehicleDataService';
import {
  getFavorites,
  listenToStoredVehicles,
  toggleFavorite,
  type StoredVehicleSummary,
} from '../services/marketplaceStorage';
import '../styles/CarMarketplace.css';

interface HomeFilterState {
  brand: string;
  model: string;
  condition: string;
  priceRange: string;
  city: string;
  mileageRange: string;
  yearRange: string;
}

const DEFAULT_FILTERS: HomeFilterState = {
  brand: 'All',
  model: 'All',
  condition: 'All',
  priceRange: 'All',
  city: 'All',
  mileageRange: 'All',
  yearRange: 'All',
};

const DEFAULT_FACETS: FacetsResponse = {
  vehicleTypes: [],
  makes: [],
  models: [],
  conditions: [],
  districts: [],
};

function toVehicleFilters(filters: HomeFilterState): VehicleFilters {
  const next: VehicleFilters = {
    ...EMPTY_FILTERS,
    vehicleType: ['Car'],
  };

  if (filters.brand !== 'All') next.make = [filters.brand];
  if (filters.model !== 'All') next.model = [filters.model];
  if (filters.city !== 'All') next.district = [filters.city];

  if (filters.condition === 'Registered') next.condition = ['Used'];
  if (filters.condition === 'Recondition') next.condition = ['Recondition'];
  if (filters.condition === 'Unregistered') next.condition = ['Brand New'];

  if (filters.priceRange === 'Below10M') next.priceMax = 10_000_000;
  if (filters.priceRange === '10Mto20M') {
    next.priceMin = 10_000_000;
    next.priceMax = 20_000_000;
  }
  if (filters.priceRange === 'Above20M') next.priceMin = 20_000_000;

  if (filters.mileageRange === 'Below50k') next.mileageMax = 50_000;
  if (filters.mileageRange === '50kto100k') {
    next.mileageMin = 50_000;
    next.mileageMax = 100_000;
  }
  if (filters.mileageRange === 'Above100k') next.mileageMin = 100_000;

  if (filters.yearRange !== 'All') {
    const year = Number(filters.yearRange);
    if (Number.isFinite(year)) {
      next.yearMin = year;
      next.yearMax = year;
    }
  }

  return next;
}

function formatPrice(price: number): string {
  return `${price.toFixed(2)}M`;
}

function findFacetValues(options: FacetOption[], limit: number): string[] {
  return options.slice(0, limit).map((option) => option.value);
}

const CarMarketplace: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const savedFilters = (location.state as { filters?: HomeFilterState } | null)?.filters;

  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<HomeFilterState>(savedFilters ?? DEFAULT_FILTERS);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [featuredVehicles, setFeaturedVehicles] = useState<Vehicle[]>([]);
  const [facets, setFacets] = useState<FacetsResponse>(DEFAULT_FACETS);
  const [modelOptions, setModelOptions] = useState<string[]>([]);
  const [totalListings, setTotalListings] = useState(0);
  const [favorites, setFavorites] = useState<StoredVehicleSummary[]>(() => getFavorites());

  useEffect(() => {
    return listenToStoredVehicles(() => {
      setFavorites(getFavorites());
    });
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);

    Promise.all([
      fetchFacets({ ...EMPTY_FILTERS, vehicleType: ['Car'] }),
      fetchListings({ ...EMPTY_FILTERS, vehicleType: ['Car'] }, { sort: 'newest', page: 1, limit: 6 }),
    ])
      .then(([facetPayload, listingsPayload]) => {
        if (!active) return;
        setFacets(facetPayload);
        setFeaturedVehicles(listingsPayload.items);
        setTotalListings(listingsPayload.meta.total);
      })
      .catch(() => {
        if (!active) return;
        setFacets(DEFAULT_FACETS);
        setFeaturedVehicles([]);
        setTotalListings(0);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const brands = useMemo(() => findFacetValues(facets.makes, 15), [facets.makes]);
  const cities = useMemo(() => findFacetValues(facets.districts, 25), [facets.districts]);
  const years = useMemo(() => Array.from({ length: 30 }, (_, index) => String(new Date().getFullYear() - index)), []);
  useEffect(() => {
    if (filters.brand === 'All') {
      setModelOptions([]);
      return;
    }

    let active = true;
    fetchFacets({ ...EMPTY_FILTERS, vehicleType: ['Car'], make: [filters.brand] })
      .then((payload) => {
        if (!active) return;
        setModelOptions(payload.models.map((option) => option.value).slice(0, 20));
      })
      .catch(() => {
        if (!active) return;
        setModelOptions([]);
      });

    return () => {
      active = false;
    };
  }, [filters.brand]);

  const savedVehicles = favorites;

  const handleFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFilters((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'brand') next.model = 'All';
      return next;
    });
  };

  const handleSearch = () => {
    navigate('/results', { state: { filters: toVehicleFilters(filters) } });
  };

  const handleViewAnalysis = (brand: string, model: string) => {
    const nextFilters = { ...filters, brand, model };
    navigate('/results', { state: { filters: toVehicleFilters(nextFilters) } });
  };

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const handleNeedInspection = (vehicle: Vehicle | StoredVehicleSummary) => {
    const subject = encodeURIComponent(`Inspection request: ${vehicle.make} ${vehicle.model}`);
    const body = encodeURIComponent(
      [
        'Hi AutoInsight team,',
        '',
        `I need a pre-purchase inspection for this vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model}.`,
        vehicle.vehicleUrl ? `Listing: ${vehicle.vehicleUrl}` : '',
        '',
        'Please contact me with available inspection slots and pricing.',
      ]
        .filter(Boolean)
        .join('\n'),
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const activeFilterCount = Object.values(filters).filter((value) => value !== 'All').length;

  if (loading) return <MarketplaceSkeleton />;

  return (
    <div className="marketplace-wrapper">
      <section className="home-hero-banner">
        <img src={customBannerImage} alt="AutoInsight custom banner" className="home-hero-image" />
        <div className="home-hero-overlay">
          <span className="home-hero-badge">Featured Marketplace</span>
          <h1>Find the right car faster with smarter filters</h1>
          <p>
            Search across {totalListings.toLocaleString()} live listings from {brands.length}+ makes in {cities.length} locations.
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
            <button className="toggle-filters-btn" onClick={() => setShowAdvancedFilters((value) => !value)}>
              <SlidersHorizontal size={14} />
              {showAdvancedFilters ? 'Less filters' : 'More filters'}
            </button>
          </div>
        </div>

        <div className="marketplace-search-grid">
          <div className="search-strip-item">
            <label>
              <Car size={14} /> Make
            </label>
            <div className="select-wrapper">
              <select name="brand" value={filters.brand} onChange={handleFilterChange}>
                <option value="All">Any Make</option>
                {brands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="select-chevron" />
            </div>
          </div>

          <div className="search-strip-item">
            <label>
              <Settings2 size={14} /> Model
            </label>
            <div className="select-wrapper">
              <select name="model" value={filters.model} onChange={handleFilterChange} disabled={filters.brand === 'All'}>
                <option value="All">Any Model</option>
                {modelOptions.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="select-chevron" />
            </div>
          </div>

          <div className="search-strip-item">
            <label>
              <Gauge size={14} /> KMs (Max)
            </label>
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
            <label>
              <DollarSign size={14} /> Price (Max)
            </label>
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
            <label>
              <MapPin size={14} /> District
            </label>
            <div className="select-wrapper">
              <select name="city" value={filters.city} onChange={handleFilterChange}>
                <option value="All">Any City</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
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
          {['All', 'Unregistered', 'Registered', 'Recondition'].map((condition) => (
            <button
              key={condition}
              className={`condition-chip${filters.condition === condition ? ' active' : ''}`}
              onClick={() => setFilters((prev) => ({ ...prev, condition }))}
            >
              {condition === 'Unregistered' ? 'New' : condition === 'Registered' ? 'Used' : condition}
            </button>
          ))}
        </div>

        {showAdvancedFilters && (
          <div className="marketplace-advanced-row">
            <div className="search-strip-item">
              <label>
                <Calendar size={14} /> Year
              </label>
              <div className="select-wrapper">
                <select name="yearRange" value={filters.yearRange} onChange={handleFilterChange}>
                  <option value="All">Any Year</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="select-chevron" />
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="inventory-section">
        <div className="section-title">
          <h3>
            <Flame size={22} className="inline-icon" /> Latest Marketplace Listings
          </h3>
        </div>
        <div className="car-showcase-grid">
          {featuredVehicles.map((vehicle) => (
            <div key={vehicle.id} className="glass-card">
              <div className="card-image-wrapper">
                <OgImage listingUrl={vehicle.vehicleUrl} fallbackSrc={vehicle.imageUrl ?? undefined} alt={`${vehicle.make} ${vehicle.model}`} className="car-image" />
              </div>

              <div className="card-content">
                <div className="market-card-price-row">
                  <div className="market-card-price">{formatPrice(vehicle.price)}</div>
                  <div className="market-card-mileage">{vehicle.mileage.toLocaleString()} km</div>
                </div>

                <a href={vehicle.vehicleUrl} target="_blank" rel="noopener noreferrer" className="market-card-gov-link">
                  View original listing
                </a>

                <h4 className="market-card-title">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </h4>

                <div className="market-card-meta-row">
                  <span>{vehicle.condition}</span>
                  <span>{vehicle.district || 'Sri Lanka'}</span>
                </div>

                <div className="market-card-actions-row">
                  <button className="market-card-check-btn" onClick={() => navigate(`/vehicle/${encodeURIComponent(vehicle.id)}`)}>
                    View Details
                  </button>
                  <button className="market-card-more-btn" onClick={() => handleViewAnalysis(vehicle.make, vehicle.model)} title="View market analysis">
                    ...
                  </button>
                </div>

                <button className="market-need-inspection-btn" onClick={() => handleNeedInspection(vehicle)}>
                  Need Inspection
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="inventory-section saved-section">
        <div className="section-title">
          <h3>
            <Heart size={22} className="inline-icon heart-icon" /> Saved Vehicles ({savedVehicles.length})
          </h3>
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
            {savedVehicles.map((vehicle) => (
              <div key={vehicle.id} className="glass-card saved-card">
                <button className="remove-saved-btn" onClick={() => toggleFavorite(vehicle)} title="Remove from saved">
                  <Trash2 size={16} />
                </button>

                <div className="card-image-wrapper">
                  <OgImage listingUrl={vehicle.vehicleUrl} fallbackSrc={vehicle.imageUrl ?? undefined} alt={`${vehicle.make} ${vehicle.model}`} className="car-image" />
                </div>

                <div className="card-content">
                  <div className="market-card-price-row">
                    <div className="market-card-price">{formatPrice(vehicle.price)}</div>
                    <div className="market-card-mileage">{vehicle.mileage.toLocaleString()} km</div>
                  </div>

                  <a href={vehicle.vehicleUrl} target="_blank" rel="noopener noreferrer" className="market-card-gov-link">
                    View original listing
                  </a>

                  <h4 className="market-card-title">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </h4>

                  <div className="market-card-meta-row">
                    <span>{vehicle.condition}</span>
                    <span>{vehicle.district || 'Saved vehicle'}</span>
                  </div>

                  <div className="market-card-actions-row">
                    <button className="market-card-check-btn" onClick={() => navigate(`/vehicle/${encodeURIComponent(vehicle.id)}`)}>
                      View Details
                    </button>
                    <button className="market-card-more-btn" onClick={() => handleViewAnalysis(vehicle.make, vehicle.model)} title="View market analysis">
                      ...
                    </button>
                  </div>

                  <button className="market-need-inspection-btn" onClick={() => handleNeedInspection(vehicle)}>
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
