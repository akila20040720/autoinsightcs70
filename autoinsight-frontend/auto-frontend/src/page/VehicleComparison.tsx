import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  Gauge,
  GitCompare,
  Info,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Trophy,
  X,
} from 'lucide-react';
import OgImage from '../component/OgImage';
import {
  EMPTY_FILTERS,
  type FacetsResponse,
  type Vehicle,
  fetchCompareVehicles,
  fetchFacets,
  fetchListings,
} from '../services/vehicleDataService';
import {
  clearCompareVehicles,
  getCompareVehicles,
  listenToStoredVehicles,
  toggleCompareVehicle,
  type StoredVehicleSummary,
} from '../services/marketplaceStorage';
import '../styles/VehicleComparison.css';

const DEFAULT_FACETS: FacetsResponse = {
  vehicleTypes: [],
  makes: [],
  models: [],
  conditions: [],
  districts: [],
};

function formatPrice(price: number): string {
  return `${price.toFixed(2)}M`;
}

function toStored(vehicle: Vehicle): StoredVehicleSummary {
  return {
    id: vehicle.id,
    vehicleType: vehicle.vehicleType,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    price: vehicle.price,
    priceLkr: vehicle.priceLkr,
    mileage: vehicle.mileage,
    district: vehicle.district,
    publishedDate: vehicle.publishedDate,
    listedAt: vehicle.listedAt,
    vehicleUrl: vehicle.vehicleUrl,
    condition: vehicle.condition,
    imageUrl: vehicle.imageUrl ?? null,
    validationStatus: vehicle.validationStatus,
    confidence: vehicle.confidence,
    matchedModelRowId: vehicle.matchedModelRowId ?? null,
  };
}

const VehicleComparison: React.FC = () => {
  const navigate = useNavigate();
  const [compareVehicles, setCompareVehicles] = useState<StoredVehicleSummary[]>(() => getCompareVehicles());
  const [hydratedVehicles, setHydratedVehicles] = useState<StoredVehicleSummary[]>(() => getCompareVehicles());
  const [showAddModal, setShowAddModal] = useState(false);
  const [facets, setFacets] = useState<FacetsResponse>(DEFAULT_FACETS);
  const [searchMake, setSearchMake] = useState('All');
  const [searchModel, setSearchModel] = useState('All');
  const [searchResults, setSearchResults] = useState<Vehicle[]>([]);

  useEffect(() => {
    return listenToStoredVehicles(() => {
      setCompareVehicles(getCompareVehicles());
    });
  }, []);

  useEffect(() => {
    if (compareVehicles.length < 2) {
      setHydratedVehicles(compareVehicles);
      return;
    }
    let active = true;
    fetchCompareVehicles(compareVehicles.map((vehicle) => vehicle.id))
      .then((vehicles) => {
        if (!active) return;
        setHydratedVehicles(vehicles.map(toStored));
      })
      .catch(() => {
        if (!active) return;
        setHydratedVehicles(compareVehicles);
      });

    return () => {
      active = false;
    };
  }, [compareVehicles]);

  useEffect(() => {
    fetchFacets({ ...EMPTY_FILTERS, vehicleType: ['Car'] })
      .then((payload) => {
        setFacets(payload);
      })
      .catch(() => {
        setFacets(DEFAULT_FACETS);
      });
  }, []);

  useEffect(() => {
    if (!showAddModal || searchMake === 'All') {
      setSearchResults([]);
      return;
    }

    let active = true;

    // Fetch facets with the selected make to get only models for that make
    fetchFacets({ ...EMPTY_FILTERS, vehicleType: ['Car'], make: [searchMake] })
      .then((facetsPayload) => {
        if (!active) return;
        // Update facets to reflect only models for the selected make
        setFacets(facetsPayload);
      })
      .catch(() => {
        if (!active) return;
      });

    fetchListings(
      {
        ...EMPTY_FILTERS,
        vehicleType: ['Car'],
        make: [searchMake],
        model: searchModel !== 'All' ? [searchModel] : [],
      },
      { sort: 'newest', page: 1, limit: 12 },
    )
      .then((payload) => {
        if (!active) return;
        setSearchResults(payload.items.filter((vehicle) => !compareVehicles.some((item) => item.id === vehicle.id)));
      })
      .catch(() => {
        if (!active) return;
        setSearchResults([]);
      });

    return () => {
      active = false;
    };
  }, [showAddModal, searchMake, searchModel, compareVehicles]);

  const models = useMemo(
    () =>
      searchMake === 'All'
        ? []
        : facets.models.filter((option) => option.value && option.count > 0).map((option) => option.value).slice(0, 25),
    [facets.models, searchMake],
  );

  const bestPrice = hydratedVehicles.length > 1 ? Math.min(...hydratedVehicles.map((vehicle) => vehicle.price)) : null;
  const bestMileage = hydratedVehicles.length > 1 ? Math.min(...hydratedVehicles.map((vehicle) => vehicle.mileage)) : null;
  const bestYear = hydratedVehicles.length > 1 ? Math.max(...hydratedVehicles.map((vehicle) => vehicle.year)) : null;
  const bestConfidence = hydratedVehicles.length > 1 ? Math.max(...hydratedVehicles.map((vehicle) => vehicle.confidence)) : null;

  return (
    <div className="comparison-wrapper">
      <div className="comparison-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back
        </button>
        <div className="comparison-title-block">
          <h1>
            <GitCompare size={28} /> Vehicle Comparison
          </h1>
          <p>Compare up to 3 marketplace listings side by side with live prices, mileage, validation confidence, and direct links.</p>
        </div>
      </div>

      <section className="comparison-cards-section">
        <div className="comparison-cards-grid">
          {hydratedVehicles.map((vehicle) => (
            <div key={vehicle.id} className="comparison-vehicle-card glass-panel-small">
              <div className="comparison-card-image">
                <OgImage listingUrl={vehicle.vehicleUrl} fallbackSrc={vehicle.imageUrl ?? undefined} alt={`${vehicle.make} ${vehicle.model}`} />
              </div>
              <div className="comparison-card-info">
                <h3>
                  {vehicle.make} {vehicle.model}
                </h3>
                <span className="comparison-year-badge">{vehicle.year}</span>
                <div className="comparison-price">
                  <span className="currency">LKR</span> {formatPrice(vehicle.price)}
                </div>
                <div className="comparison-card-stats">
                  <span>
                    <Gauge size={14} /> {vehicle.mileage.toLocaleString()} km
                  </span>
                  <span>
                    <MapPin size={14} /> {vehicle.district}
                  </span>
                </div>
                <div className="comparison-card-details">
                  <div className="detail-item">
                    <span className="detail-label">Condition</span>
                    <span className="detail-value condition-badge">{vehicle.condition}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Validation</span>
                    <span className="detail-value">{vehicle.validationStatus}</span>
                  </div>
                </div>
              </div>
              <div className="value-score-circle">
                <div className="score-text">
                  <span className="score-number">{Math.round(vehicle.confidence * 100)}</span>
                  <span className="score-label">Confidence</span>
                </div>
              </div>
            </div>
          ))}

          {Array.from({ length: Math.max(0, 3 - hydratedVehicles.length) }).map((_, index) => (
            <button key={`add-${index}`} className="comparison-add-card glass-panel-small" onClick={() => setShowAddModal(true)}>
              <Plus size={32} />
              <span>Add Vehicle</span>
            </button>
          ))}
        </div>
      </section>

      {hydratedVehicles.length >= 2 ? (
        <>
          <section className="comparison-table-section glass-panel-small">
            <h2 className="section-heading">
              <ShieldCheck size={20} /> Detailed Comparison
            </h2>

            <div className="comparison-table">
              <div className="comparison-row comparison-header-row">
                <div className="comparison-label">Metric</div>
                {hydratedVehicles.map((vehicle) => (
                  <div key={vehicle.id} className="comparison-cell">
                    {vehicle.make} {vehicle.model}
                  </div>
                ))}
              </div>

              <div className="comparison-row">
                <div className="comparison-label">Price</div>
                {hydratedVehicles.map((vehicle) => (
                  <div key={vehicle.id} className={`comparison-cell ${bestPrice === vehicle.price ? 'best-value' : ''}`}>
                    {formatPrice(vehicle.price)}
                  </div>
                ))}
              </div>

              <div className="comparison-row">
                <div className="comparison-label">Mileage</div>
                {hydratedVehicles.map((vehicle) => (
                  <div key={vehicle.id} className={`comparison-cell ${bestMileage === vehicle.mileage ? 'best-value' : ''}`}>
                    {vehicle.mileage.toLocaleString()} km
                  </div>
                ))}
              </div>

              <div className="comparison-row">
                <div className="comparison-label">Year</div>
                {hydratedVehicles.map((vehicle) => (
                  <div key={vehicle.id} className={`comparison-cell ${bestYear === vehicle.year ? 'best-value' : ''}`}>
                    <Calendar size={14} /> {vehicle.year}
                  </div>
                ))}
              </div>

              <div className="comparison-row">
                <div className="comparison-label">Condition</div>
                {hydratedVehicles.map((vehicle) => (
                  <div key={vehicle.id} className="comparison-cell">
                    {vehicle.condition}
                  </div>
                ))}
              </div>

              <div className="comparison-row">
                <div className="comparison-label">Validation</div>
                {hydratedVehicles.map((vehicle) => (
                  <div key={vehicle.id} className={`comparison-cell ${bestConfidence === vehicle.confidence ? 'best-value' : ''}`}>
                    {vehicle.validationStatus} ({Math.round(vehicle.confidence * 100)}%)
                  </div>
                ))}
              </div>

              <div className="comparison-row">
                <div className="comparison-label">Location</div>
                {hydratedVehicles.map((vehicle) => (
                  <div key={vehicle.id} className="comparison-cell">
                    {vehicle.district || 'N/A'}
                  </div>
                ))}
              </div>

              <div className="comparison-row">
                <div className="comparison-label">Listed</div>
                {hydratedVehicles.map((vehicle) => (
                  <div key={vehicle.id} className="comparison-cell">
                    {new Date(vehicle.publishedDate).toLocaleDateString()}
                  </div>
                ))}
              </div>

              <div className="comparison-row">
                <div className="comparison-label">Match Status</div>
                {hydratedVehicles.map((vehicle) => (
                  <div key={vehicle.id} className="comparison-cell">
                    <span className={`status-badge status-${vehicle.validationStatus}`}>{vehicle.validationStatus}</span>
                  </div>
                ))}
              </div>

              <div className="comparison-row">
                <div className="comparison-label">Source</div>
                {hydratedVehicles.map((vehicle) => (
                  <div key={vehicle.id} className="comparison-cell">
                    <a href={vehicle.vehicleUrl} target="_blank" rel="noopener noreferrer" className="comparison-link">
                      <ExternalLink size={14} /> Open listing
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="winner-section glass-panel-small">
            <h2>
              <Trophy size={20} /> Quick Take
            </h2>
            <p>
              Lower price and mileage are highlighted, while validation confidence surfaces the strongest workbook match. Use the
              source links for final seller-side verification before making a decision.
            </p>
          </section>
        </>
      ) : (
        <section className="comparison-empty-state glass-panel-small">
          <h3>Add at least 2 vehicles to compare</h3>
          <p>Use the compare buttons from search results or add more vehicles below.</p>
        </section>
      )}

      {showAddModal && (
        <div className="compare-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="compare-modal" onClick={(event) => event.stopPropagation()}>
            <div className="compare-modal-header">
              <div className="compare-modal-title-group">
                <h2>Add Vehicles</h2>
                <div className="compare-modal-info">
                  <Info size={16} />
                  <p>Use the compare button on any card to keep up to 3 vehicles synced across pages and reloads.</p>
                </div>
              </div>
              <button className="compare-modal-close" onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="compare-modal-content">
              <div className="comparison-search-controls">
                <div className="select-wrapper">
                  <select value={searchMake} onChange={(event) => { setSearchMake(event.target.value); setSearchModel('All'); }}>
                    <option value="All">Choose a make</option>
                    {facets.makes.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.value}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="select-wrapper">
                  <select value={searchModel} onChange={(event) => setSearchModel(event.target.value)} disabled={searchMake === 'All'}>
                    <option value="All">Any model</option>
                    {models.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="comparison-search-list">
                {searchResults.map((vehicle) => (
                  <button
                    type="button"
                    key={vehicle.id}
                    className="comparison-search-result"
                    onClick={() => {
                      toggleCompareVehicle(vehicle);
                      setShowAddModal(false);
                    }}
                    disabled={hydratedVehicles.length >= 3}
                  >
                    <Search size={16} />
                    <span>
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {hydratedVehicles.length > 0 && (
        <div className="compare-tray-actions" style={{ justifyContent: 'center', marginTop: '1.5rem' }}>
          <button className="compare-clear-btn" onClick={clearCompareVehicles}>
            Clear compare list
          </button>
        </div>
      )}
    </div>
  );
};

export default VehicleComparison;
