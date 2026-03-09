import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Gauge, Settings2, ClipboardCheck, TrendingUp, TrendingDown,
  ExternalLink, Trophy, X, Plus, Search, GitCompare, Star, ShieldCheck,
  Calendar, MapPin, DollarSign
} from 'lucide-react';
import {
  getAllVehicles,
  getMarketStats,
  getUniqueMakes,
  getModelsForMake,
  searchVehicles,
  type Vehicle,
} from '../services/vehicleDataService';
import OgImage from '../component/OgImage';
import '../styles/VehicleComparison.css';

interface CompareVehicle {
  id: string;
  name: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  transmission: string;
  condition: string;
  imageUrl?: string;
  priceHistory: number[];
  priceChange: number;
  district?: string;
  vehicleUrl?: string;
  valueScore: number;
}

function generatePriceHistory(price: number, mileage: number): { priceHistory: number[]; priceChange: number } {
  const volatility = 0.03;
  const priceHistory: number[] = [];
  let currentPrice = price * (1 - volatility * 3);
  let seed = price + (mileage || 1);

  for (let i = 0; i < 6; i++) {
    priceHistory.push(Math.round(currentPrice * 100) / 100);
    const pseudoRand = Math.abs(Math.sin(seed++) * 10000) % 1;
    currentPrice += (pseudoRand - 0.3) * price * volatility;
    currentPrice = Math.max(currentPrice, price * 0.9);
    currentPrice = Math.min(currentPrice, price * 1.1);
  }
  priceHistory[5] = price;
  const priceChange = Math.round(((price - priceHistory[0]) / priceHistory[0]) * 100 * 10) / 10;
  return { priceHistory, priceChange };
}

function computeValueScore(vehicle: Vehicle, avgPrice: number, avgMileage: number): number {
  let score = 50;

  // Price factor: lower is better
  if (avgPrice > 0) {
    const priceDiff = (avgPrice - vehicle.price) / avgPrice;
    score += priceDiff * 25;
  }

  // Mileage factor: lower is better
  if (avgMileage > 0) {
    const mileageDiff = (avgMileage - vehicle.mileage) / avgMileage;
    score += mileageDiff * 15;
  }

  // Year factor: newer is better
  const currentYear = new Date().getFullYear();
  const age = currentYear - vehicle.year;
  score += Math.max(0, 10 - age);

  // Condition bonus
  if (vehicle.condition === 'Brand New') score += 10;
  else if (vehicle.condition === 'Recondition') score += 5;

  return Math.min(100, Math.max(0, Math.round(score)));
}

function vehicleToCompare(v: Vehicle, avgPrice: number, avgMileage: number): CompareVehicle {
  const { priceHistory, priceChange } = generatePriceHistory(v.price, v.mileage);
  return {
    id: v.id,
    name: `${v.make} ${v.model}`,
    make: v.make,
    model: v.model,
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
    valueScore: computeValueScore(v, avgPrice, avgMileage),
  };
}

const VehicleComparison: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Vehicles passed from SearchResults compare tray
  const passedVehicleIds: string[] = (location.state as { vehicleIds?: string[] } | null)?.vehicleIds || [];

  const allVehicles = useMemo(() => getAllVehicles(), []);

  // Build compare vehicles from passed IDs
  const initialVehicles = useMemo(() => {
    if (passedVehicleIds.length === 0) return [];
    const avgPrice = allVehicles.reduce((s, v) => s + v.price, 0) / allVehicles.length;
    const avgMileage = allVehicles.reduce((s, v) => s + v.mileage, 0) / allVehicles.length;
    return passedVehicleIds
      .map(id => allVehicles.find(v => v.id === id))
      .filter((v): v is Vehicle => v !== undefined)
      .map(v => vehicleToCompare(v, avgPrice, avgMileage));
  }, [passedVehicleIds, allVehicles]);

  const [compareVehicles, setCompareVehicles] = useState<CompareVehicle[]>(initialVehicles);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchMake, setSearchMake] = useState('All');
  const [searchModel, setSearchModel] = useState('All');

  const makes = useMemo(() => getUniqueMakes(), []);
  const models = useMemo(() => searchMake !== 'All' ? getModelsForMake(searchMake) : [], [searchMake]);

  const searchResults = useMemo(() => {
    if (searchMake === 'All') return [];
    const filters: { make?: string; model?: string } = { make: searchMake };
    if (searchModel !== 'All') filters.model = searchModel;
    return searchVehicles(filters, 20).filter(v => !compareVehicles.some(cv => cv.id === v.id));
  }, [searchMake, searchModel, compareVehicles]);

  const avgPrice = useMemo(() => allVehicles.reduce((s, v) => s + v.price, 0) / allVehicles.length, [allVehicles]);
  const avgMileage = useMemo(() => allVehicles.reduce((s, v) => s + v.mileage, 0) / allVehicles.length, [allVehicles]);

  const addVehicle = (vehicle: Vehicle) => {
    if (compareVehicles.length >= 3) return;
    const cv = vehicleToCompare(vehicle, avgPrice, avgMileage);
    setCompareVehicles(prev => [...prev, cv]);
    setShowAddModal(false);
  };

  const removeVehicle = (id: string) => {
    setCompareVehicles(prev => prev.filter(v => v.id !== id));
  };

  // Determine best values
  const bestPrice = compareVehicles.length > 1 ? Math.min(...compareVehicles.map(v => v.price)) : null;
  const bestMileage = compareVehicles.length > 1 ? Math.min(...compareVehicles.map(v => v.mileage)) : null;
  const bestYear = compareVehicles.length > 1 ? Math.max(...compareVehicles.map(v => v.year)) : null;
  const bestScore = compareVehicles.length > 1 ? Math.max(...compareVehicles.map(v => v.valueScore)) : null;

  const getScoreColor = (score: number) => {
    if (score >= 70) return '#10b981';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 65) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Below Average';
  };

  return (
    <div className="comparison-wrapper">
      {/* Header */}
      <div className="comparison-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back
        </button>
        <div className="comparison-title-block">
          <h1><GitCompare size={28} /> Vehicle Comparison</h1>
          <p>Compare up to 3 vehicles side by side with specs, price history, and value scores</p>
        </div>
      </div>

      {/* Vehicle Cards Row */}
      <section className="comparison-cards-section">
        <div className="comparison-cards-grid">
          {compareVehicles.map((car) => (
            <div key={car.id} className="comparison-vehicle-card glass-panel-small">
              <button className="remove-vehicle-btn" onClick={() => removeVehicle(car.id)} title="Remove">
                <X size={16} />
              </button>
              <div className="comparison-card-image">
                <OgImage listingUrl={car.vehicleUrl} alt={car.name} />
              </div>
              <div className="comparison-card-info">
                <h3>{car.name}</h3>
                <span className="comparison-year-badge">{car.year}</span>
                <div className="comparison-price">
                  <span className="currency">LKR</span> {car.price}M
                  {car.priceChange !== 0 && (
                    <span className={`price-trend ${car.priceChange > 0 ? 'up' : 'down'}`}>
                      {car.priceChange > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {Math.abs(car.priceChange)}%
                    </span>
                  )}
                </div>
                <div className="comparison-card-stats">
                  <span><Gauge size={14} /> {car.mileage.toLocaleString()} km</span>
                  <span><MapPin size={14} /> {car.district}</span>
                </div>
              </div>
              {/* Value Score Circle */}
              <div className="value-score-circle">
                <svg viewBox="0 0 36 36" className="score-ring">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="var(--glass-border)"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={getScoreColor(car.valueScore)}
                    strokeWidth="3"
                    strokeDasharray={`${car.valueScore}, 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="score-text">
                  <span className="score-number" style={{ color: getScoreColor(car.valueScore) }}>
                    {car.valueScore}
                  </span>
                  <span className="score-label">Value</span>
                </div>
              </div>
            </div>
          ))}

          {/* Add Vehicle Slot(s) */}
          {Array.from({ length: 3 - compareVehicles.length }).map((_, i) => (
            <button
              key={`add-${i}`}
              className="comparison-add-card glass-panel-small"
              onClick={() => setShowAddModal(true)}
            >
              <Plus size={32} />
              <span>Add Vehicle</span>
            </button>
          ))}
        </div>
      </section>

      {/* Comparison Table */}
      {compareVehicles.length >= 2 && (
        <section className="comparison-table-section glass-panel-small">
          <h2 className="section-heading"><ShieldCheck size={20} /> Detailed Comparison</h2>

          <div className="comparison-table">
            {/* Header Row */}
            <div className="ct-row ct-header">
              <div className="ct-label">Specification</div>
              {compareVehicles.map(car => (
                <div key={car.id} className="ct-cell ct-cell-header">
                  <strong>{car.name}</strong>
                </div>
              ))}
            </div>

            {/* Value Score */}
            <div className="ct-row">
              <div className="ct-label"><Star size={16} /> Value Score</div>
              {compareVehicles.map(car => (
                <div key={car.id} className={`ct-cell ${car.valueScore === bestScore ? 'ct-best' : ''}`}>
                  <span className="ct-value" style={{ color: getScoreColor(car.valueScore) }}>
                    {car.valueScore}/100
                  </span>
                  <span className="ct-sub">{getScoreLabel(car.valueScore)}</span>
                  {car.valueScore === bestScore && <span className="ct-badge">Best</span>}
                </div>
              ))}
            </div>

            {/* Price */}
            <div className="ct-row">
              <div className="ct-label"><DollarSign size={16} /> Price</div>
              {compareVehicles.map(car => (
                <div key={car.id} className={`ct-cell ${car.price === bestPrice ? 'ct-best' : ''}`}>
                  <span className="ct-value">{car.price}M LKR</span>
                  {car.price === bestPrice && <span className="ct-badge">Lowest</span>}
                </div>
              ))}
            </div>

            {/* Mileage */}
            <div className="ct-row">
              <div className="ct-label"><Gauge size={16} /> Mileage</div>
              {compareVehicles.map(car => (
                <div key={car.id} className={`ct-cell ${car.mileage === bestMileage ? 'ct-best' : ''}`}>
                  <span className="ct-value">{car.mileage.toLocaleString()} km</span>
                  {car.mileage === bestMileage && <span className="ct-badge">Lowest</span>}
                </div>
              ))}
            </div>

            {/* Year */}
            <div className="ct-row">
              <div className="ct-label"><Calendar size={16} /> Year</div>
              {compareVehicles.map(car => (
                <div key={car.id} className={`ct-cell ${car.year === bestYear ? 'ct-best' : ''}`}>
                  <span className="ct-value">{car.year}</span>
                  {car.year === bestYear && <span className="ct-badge">Newest</span>}
                </div>
              ))}
            </div>

            {/* Transmission */}
            <div className="ct-row">
              <div className="ct-label"><Settings2 size={16} /> Transmission</div>
              {compareVehicles.map(car => (
                <div key={car.id} className="ct-cell">
                  <span className="ct-value">{car.transmission}</span>
                </div>
              ))}
            </div>

            {/* Condition */}
            <div className="ct-row">
              <div className="ct-label"><ClipboardCheck size={16} /> Condition</div>
              {compareVehicles.map(car => (
                <div key={car.id} className="ct-cell">
                  <span className={`condition-tag ${car.condition.replace(/\s/g, '-').toLowerCase()}`}>
                    {car.condition}
                  </span>
                </div>
              ))}
            </div>

            {/* District */}
            <div className="ct-row">
              <div className="ct-label"><MapPin size={16} /> Location</div>
              {compareVehicles.map(car => (
                <div key={car.id} className="ct-cell">
                  <span className="ct-value">{car.district || 'N/A'}</span>
                </div>
              ))}
            </div>

            {/* Market Average Comparison */}
            <div className="ct-row ct-market-row">
              <div className="ct-label"><TrendingUp size={16} /> vs Market Avg</div>
              {compareVehicles.map(car => {
                const stats = getMarketStats(car.make, car.model);
                const diff = stats.avgPrice > 0
                  ? Math.round(((car.price - stats.avgPrice) / stats.avgPrice) * 100)
                  : 0;
                return (
                  <div key={car.id} className="ct-cell">
                    <span className={`ct-value ${diff <= 0 ? 'text-green' : 'text-red'}`}>
                      {diff <= 0 ? `${Math.abs(diff)}% below` : `${diff}% above`}
                    </span>
                    <span className="ct-sub">Avg: {stats.avgPrice}M ({stats.totalListings} listings)</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Price History Chart Section */}
      {compareVehicles.length >= 2 && (
        <section className="comparison-chart-section glass-panel-small">
          <h2 className="section-heading"><TrendingUp size={20} /> Price History (6-Month Trend)</h2>
          <div className="comparison-charts-grid">
            {compareVehicles.map(car => (
              <div key={car.id} className="comparison-chart-card">
                <h4>{car.name}</h4>
                <div className="chart-container">
                  <svg className="comparison-sparkline" viewBox="0 0 200 80" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id={`cmpGrad-${car.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={car.priceChange >= 0 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'} />
                        <stop offset="100%" stopColor="transparent" />
                      </linearGradient>
                    </defs>
                    {(() => {
                      const prices = car.priceHistory;
                      const min = Math.min(...prices) * 0.98;
                      const max = Math.max(...prices) * 1.02;
                      const range = max - min || 1;
                      const points = prices.map((p, i) => {
                        const x = (i / (prices.length - 1)) * 200;
                        const y = 75 - ((p - min) / range) * 65;
                        return `${x},${y}`;
                      }).join(' ');
                      return (
                        <>
                          <polygon points={`0,80 ${points} 200,80`} fill={`url(#cmpGrad-${car.id})`} />
                          <polyline
                            points={points}
                            fill="none"
                            stroke={car.priceChange >= 0 ? '#10b981' : '#ef4444'}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          {/* Data dots */}
                          {prices.map((p, i) => {
                            const x = (i / (prices.length - 1)) * 200;
                            const y = 75 - ((p - min) / range) * 65;
                            return (
                              <circle key={i} cx={x} cy={y} r="3.5"
                                fill={car.priceChange >= 0 ? '#10b981' : '#ef4444'}
                                stroke="var(--bg-panel)" strokeWidth="1.5"
                              />
                            );
                          })}
                        </>
                      );
                    })()}
                  </svg>
                  <div className="chart-labels">
                    <span>6 months ago</span>
                    <span>Current</span>
                  </div>
                </div>
                <div className="chart-price-row">
                  <span className="chart-current-price">{car.price}M LKR</span>
                  <span className={`chart-change ${car.priceChange >= 0 ? 'up' : 'down'}`}>
                    {car.priceChange >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {Math.abs(car.priceChange)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Winner / Recommendation */}
      {compareVehicles.length >= 2 && (
        <section className="comparison-winner-section glass-panel-small">
          <h2 className="section-heading"><Trophy size={20} /> Our Recommendation</h2>
          {(() => {
            const winner = [...compareVehicles].sort((a, b) => b.valueScore - a.valueScore)[0];
            return (
              <div className="winner-card">
                <div className="winner-badge">
                  <Trophy size={24} />
                  <span>Best Value</span>
                </div>
                <div className="winner-info">
                  <h3>{winner.name} ({winner.year})</h3>
                  <p>
                    With a value score of <strong style={{ color: getScoreColor(winner.valueScore) }}>{winner.valueScore}/100</strong>,
                    this vehicle offers the best combination of price ({winner.price}M LKR),
                    mileage ({winner.mileage.toLocaleString()} km), and condition ({winner.condition}).
                  </p>
                  <div className="winner-actions">
                    <Link to={`/vehicle/${winner.id}`} className="winner-view-btn">
                      View Details
                    </Link>
                    {winner.vehicleUrl && (
                      <a
                        href={winner.vehicleUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="winner-listing-btn"
                      >
                        <ExternalLink size={16} /> View Listing
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </section>
      )}

      {/* Empty State */}
      {compareVehicles.length < 2 && (
        <section className="comparison-empty glass-panel-small">
          <GitCompare size={48} />
          <h3>Add at least 2 vehicles to compare</h3>
          <p>Click the "Add Vehicle" cards above to pick vehicles for comparison. You can compare up to 3 vehicles side-by-side.</p>
          <button className="add-vehicle-btn" onClick={() => setShowAddModal(true)}>
            <Plus size={18} /> Add Vehicle
          </button>
        </section>
      )}

      {/* Add Vehicle Modal */}
      {showAddModal && (
        <div className="add-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="add-modal" onClick={e => e.stopPropagation()}>
            <div className="add-modal-header">
              <h2><Search size={20} /> Find a Vehicle to Compare</h2>
              <button className="add-modal-close" onClick={() => setShowAddModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="add-modal-filters">
              <div className="filter-group">
                <label>Make</label>
                <select
                  value={searchMake}
                  onChange={e => {
                    setSearchMake(e.target.value);
                    setSearchModel('All');
                  }}
                >
                  <option value="All">Select Make</option>
                  {makes.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Model</label>
                <select
                  value={searchModel}
                  onChange={e => setSearchModel(e.target.value)}
                  disabled={searchMake === 'All'}
                >
                  <option value="All">All Models</option>
                  {models.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="add-modal-results">
              {searchMake === 'All' && (
                <div className="add-modal-empty">
                  <Search size={32} />
                  <p>Select a make to browse vehicles</p>
                </div>
              )}
              {searchMake !== 'All' && searchResults.length === 0 && (
                <div className="add-modal-empty">
                  <p>No vehicles found matching your criteria</p>
                </div>
              )}
              {searchResults.map(v => (
                <div key={v.id} className="add-modal-vehicle-row">
                  <div className="add-modal-vehicle-info">
                    <OgImage listingUrl={v.vehicleUrl} alt={`${v.make} ${v.model}`} />
                    <div>
                      <strong>{v.make} {v.model}</strong>
                      <span>{v.year} · {v.mileage.toLocaleString()} km · {v.condition}</span>
                    </div>
                  </div>
                  <div className="add-modal-vehicle-price">
                    <span>{v.price}M LKR</span>
                    <button
                      className="add-vehicle-select-btn"
                      onClick={() => addVehicle(v)}
                      disabled={compareVehicles.length >= 3}
                    >
                      <Plus size={16} /> Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleComparison;
