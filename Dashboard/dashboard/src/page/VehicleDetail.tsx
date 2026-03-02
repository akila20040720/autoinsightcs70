import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Gauge, Settings2, ClipboardCheck, MapPin,
  Heart, ExternalLink, Share2, TrendingUp, TrendingDown
} from 'lucide-react';
import { 
  getAllVehicles, 
  searchVehicles,
  getMarketStats
} from '../services/vehicleDataService';
import { VehicleImage } from '../components/VehicleImage';
import '../styles/VehicleDetail.css';

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

const FAVORITES_KEY = 'autoinsight_favorites';

const VehicleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  
  // Favorites with localStorage persistence
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

  const toggleFavorite = () => {
    if (!id) return;
    setFavorites(prev => {
      if (prev.includes(id)) {
        return prev.filter(fid => fid !== id);
      }
      return [...prev, id];
    });
  };

  const isFavorite = id ? favorites.includes(id) : false;

  // Get car from location state or fetch from service
  const car = useMemo<CarResult | null>(() => {
    // Try to get from navigation state first
    const stateCar = (location.state as { car?: CarResult } | null)?.car;
    if (stateCar && stateCar.id === id) {
      return stateCar;
    }

    // Otherwise, find from all vehicles
    const vehicles = getAllVehicles();
    const vehicle = vehicles.find(v => v.id === id);
    if (!vehicle) return null;

    // Convert to CarResult format
    const basePrice = vehicle.price;
    const volatility = 0.03;
    const priceHistory: number[] = [];
    let currentPrice = basePrice * (1 - volatility * 3);
    
    for (let i = 0; i < 6; i++) {
      priceHistory.push(Math.round(currentPrice * 100) / 100);
      currentPrice += (Math.random() - 0.3) * basePrice * volatility;
      currentPrice = Math.max(currentPrice, basePrice * 0.9);
      currentPrice = Math.min(currentPrice, basePrice * 1.1);
    }
    priceHistory[5] = basePrice;
    
    const priceChange = Math.round(((basePrice - priceHistory[0]) / priceHistory[0]) * 100 * 10) / 10;

    return {
      id: vehicle.id,
      name: `${vehicle.make} ${vehicle.model}`,
      year: vehicle.year,
      price: vehicle.price,
      mileage: vehicle.mileage,
      transmission: 'Auto',
      condition: vehicle.condition,
      imageUrl: vehicle.imageUrl,
      priceHistory,
      priceChange,
      district: vehicle.district,
      vehicleUrl: vehicle.vehicleUrl,
    };
  }, [id, location.state]);

  // Get market stats for this vehicle's make
  const marketStats = useMemo(() => {
    if (!car) return null;
    const make = car.name.split(' ')[0];
    return getMarketStats(make);
  }, [car]);

  // Get similar vehicles
  const similarVehicles = useMemo<CarResult[]>(() => {
    if (!car) return [];
    const make = car.name.split(' ')[0];
    const similar = searchVehicles({
      minPrice: car.price * 0.7,
      maxPrice: car.price * 1.3,
    }, 20)
      .filter(v => v.id !== id && v.make !== make)
      .slice(0, 4);
    
    return similar.map(v => ({
      id: v.id,
      name: `${v.make} ${v.model}`,
      year: v.year,
      price: v.price,
      mileage: v.mileage,
      transmission: 'Auto',
      condition: v.condition,
      imageUrl: v.imageUrl,
      district: v.district,
      vehicleUrl: v.vehicleUrl,
    }));
  }, [car, id]);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!car) {
    return (
      <div className="vehicle-detail-wrapper">
        <div className="not-found">
          <h2>Vehicle Not Found</h2>
          <p>The vehicle you're looking for doesn't exist or has been removed.</p>
          <button className="btn-back" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="vehicle-detail-wrapper">
      {/* Header */}
      <div className="detail-header">
        <button className="btn-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
          Back to Results
        </button>
        
        <div className="header-actions">
          <button 
            className={`action-btn ${isFavorite ? 'active' : ''}`}
            onClick={toggleFavorite}
          >
            <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
            {isFavorite ? 'Saved' : 'Save'}
          </button>
          <button className="action-btn" onClick={handleShare}>
            <Share2 size={18} />
            {copied ? 'Copied!' : 'Share'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="detail-content">
        {/* Left - Image & Gallery */}
        <div className="detail-gallery">
          <div className="main-image">
            <VehicleImage 
              vehicleUrl={car.vehicleUrl} 
              alt={car.name}
              fallbackImage="https://images.unsplash.com/photo-1621007947382-bb3c3994e3fd?auto=format&fit=crop&w=600&q=80"
            />
            <span className="condition-badge">{car.condition}</span>
          </div>
        </div>

        {/* Right - Info */}
        <div className="detail-info">
          <div className="info-header">
            <div>
              <h1 className="vehicle-title">{car.name}</h1>
              <span className="vehicle-year">{car.year}</span>
            </div>
            <div className="price-section">
              <span className="currency">LKR</span>
              <span className="price">{car.price}M</span>
              {car.priceChange !== undefined && car.priceChange !== 0 && (
                <span className={`price-change ${car.priceChange > 0 ? 'up' : 'down'}`}>
                  {car.priceChange > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {Math.abs(car.priceChange)}%
                </span>
              )}
            </div>
          </div>

          {/* Key Specs */}
          <div className="specs-grid">
            <div className="spec-item">
              <Gauge size={20} />
              <div className="spec-text">
                <span className="spec-value">{car.mileage.toLocaleString()} km</span>
                <span className="spec-label">Mileage</span>
              </div>
            </div>
            <div className="spec-item">
              <Settings2 size={20} />
              <div className="spec-text">
                <span className="spec-value">{car.transmission}</span>
                <span className="spec-label">Transmission</span>
              </div>
            </div>
            <div className="spec-item">
              <ClipboardCheck size={20} />
              <div className="spec-text">
                <span className="spec-value">{car.condition}</span>
                <span className="spec-label">Condition</span>
              </div>
            </div>
            <div className="spec-item">
              <MapPin size={20} />
              <div className="spec-text">
                <span className="spec-value">{car.district || 'N/A'}</span>
                <span className="spec-label">Location</span>
              </div>
            </div>
          </div>

          {/* Price History */}
          {car.priceHistory && car.priceHistory.length > 0 && (
            <div className="price-history-section glass-panel">
              <h3>Price History (6 Months)</h3>
              <div className="price-chart">
                <svg viewBox="0 0 300 80" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={car.priceChange && car.priceChange >= 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'} />
                      <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                  </defs>
                  {(() => {
                    const prices = car.priceHistory!;
                    const min = Math.min(...prices) * 0.95;
                    const max = Math.max(...prices) * 1.05;
                    const range = max - min || 1;
                    const points = prices.map((p, i) => {
                      const x = (i / (prices.length - 1)) * 300;
                      const y = 70 - ((p - min) / range) * 60;
                      return `${x},${y}`;
                    }).join(' ');
                    return (
                      <>
                        <polygon points={`0,80 ${points} 300,80`} fill="url(#chartGrad)" />
                        <polyline
                          points={points}
                          fill="none"
                          stroke={car.priceChange && car.priceChange >= 0 ? '#10b981' : '#ef4444'}
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </>
                    );
                  })()}
                </svg>
              </div>
              <div className="price-range">
                <span>6 months ago: LKR {car.priceHistory[0]}M</span>
                <span>Today: LKR {car.priceHistory[5]}M</span>
              </div>
            </div>
          )}

          {/* Market Comparison */}
          {marketStats && marketStats.totalListings > 0 && (
            <div className="market-stats glass-panel">
              <h3>Market Comparison</h3>
              <div className="market-grid">
                <div className="market-item">
                  <span className="market-label">Average Price</span>
                  <span className="market-value">LKR {marketStats.avgPrice}M</span>
                  <span className={`market-diff ${car.price < marketStats.avgPrice ? 'below' : 'above'}`}>
                    {car.price < marketStats.avgPrice ? 'Below' : 'Above'} market avg
                  </span>
                </div>
                <div className="market-item">
                  <span className="market-label">Total Listings</span>
                  <span className="market-value">{marketStats.totalListings}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="detail-actions">
            <button
              className="btn-primary"
              onClick={() => car.vehicleUrl && window.open(car.vehicleUrl, '_blank', 'noopener,noreferrer')}
              disabled={!car.vehicleUrl}
            >
              <ExternalLink size={18} />
              Contact Seller on Riyasewana
            </button>
          </div>
        </div>
      </div>

      {/* Similar Vehicles */}
      {similarVehicles.length > 0 && (
        <section className="similar-section">
          <h2>Similar Vehicles</h2>
          <div className="similar-grid">
            {similarVehicles.map(v => (
              <Link 
                key={v.id} 
                to={`/vehicle/${v.id}`}
                state={{ car: v }}
                className="similar-card glass-card"
              >
                <VehicleImage 
                  vehicleUrl={v.vehicleUrl} 
                  alt={v.name} 
                  className="similar-image"
                  showLoadingState={false}
                  fallbackImage="https://images.unsplash.com/photo-1621007947382-bb3c3994e3fd?auto=format&fit=crop&w=600&q=80"
                />
                <div className="similar-info">
                  <h4>{v.name}</h4>
                  <span className="similar-year">{v.year}</span>
                  <div className="similar-price">
                    <span className="currency">LKR</span> {v.price}M
                  </div>
                  <div className="similar-stats">
                    <span>{v.mileage.toLocaleString()} km</span>
                    <span>{v.condition}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default VehicleDetail;
