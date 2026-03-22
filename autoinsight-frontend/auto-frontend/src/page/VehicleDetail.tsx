import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ClipboardCheck,
  ExternalLink,
  Gauge,
  Heart,
  MapPin,
  Settings2,
  Share2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import OgImage from '../component/OgImage';
import {
  type Vehicle,
  EMPTY_FILTERS,
  fetchListingById,
  fetchListings,
} from '../services/vehicleDataService';
import {
  getFavorites,
  isFavorite,
  listenToStoredVehicles,
  toggleFavorite,
} from '../services/marketplaceStorage';
import '../styles/VehicleDetail.css';

function formatPrice(price: number): string {
  return `${price.toFixed(2)}M`;
}

const VehicleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [similarVehicles, setSimilarVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [favorites, setFavorites] = useState(() => getFavorites());

  useEffect(() => {
    return listenToStoredVehicles(() => {
      setFavorites(getFavorites());
    });
  }, []);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);

    fetchListingById(decodeURIComponent(id))
      .then((item) => {
        if (!active) return;
        setVehicle(item);
        return fetchListings(
          {
            ...EMPTY_FILTERS,
            make: item.make ? [item.make] : [],
            priceMin: Math.max(item.priceLkr - 3_000_000, 0),
            priceMax: item.priceLkr + 3_000_000,
          },
          { sort: 'newest', page: 1, limit: 4 },
        );
      })
      .then((payload) => {
        if (!active || !payload) return;
        setSimilarVehicles(payload.items.filter((item) => item.id !== decodeURIComponent(id)).slice(0, 4));
      })
      .catch(() => {
        if (!active) return;
        setVehicle(null);
        setSimilarVehicles([]);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const favoriteActive = useMemo(() => (vehicle ? isFavorite(vehicle.id) : false), [vehicle, favorites]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  if (loading) {
    return <div className="vehicle-detail-wrapper" />;
  }

  if (!vehicle) {
    return (
      <div className="vehicle-detail-wrapper">
        <div className="not-found">
          <h2>Vehicle Not Found</h2>
          <p>The vehicle you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <button className="btn-back" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const marketAnalysis = vehicle.marketAnalysis;
  const trendPoints = marketAnalysis?.priceTrend ?? [];
  const trendValues = trendPoints.map((point) => point.valueLkr);
  const minTrendValue = trendValues.length > 0 ? Math.min(...trendValues) : 0;
  const maxTrendValue = trendValues.length > 0 ? Math.max(...trendValues) : 0;

  const trendPolyline =
    trendPoints.length > 1
      ? trendPoints
          .map((point, index) => {
            const x = (index / (trendPoints.length - 1)) * 100;
            const y =
              maxTrendValue === minTrendValue
                ? 18
                : 36 - ((point.valueLkr - minTrendValue) / (maxTrendValue - minTrendValue)) * 36;
            return `${x},${y}`;
          })
          .join(' ')
      : '';

  const avgPriceLkr = marketAnalysis?.avgPriceLkr ?? 0;
  const avgPriceMillion = avgPriceLkr > 0 ? avgPriceLkr / 1_000_000 : null;
  const previousMonthPriceMillion = (marketAnalysis?.previousMonthPriceLkr ?? 0) > 0 ? (marketAnalysis?.previousMonthPriceLkr ?? 0) / 1_000_000 : null;
  const nextWeekPriceMillion = (marketAnalysis?.nextWeekPriceLkr ?? 0) > 0 ? (marketAnalysis?.nextWeekPriceLkr ?? 0) / 1_000_000 : null;
  const marketDiffPercent = avgPriceLkr > 0 ? ((vehicle.priceLkr - avgPriceLkr) / avgPriceLkr) * 100 : null;

  return (
    <div className="vehicle-detail-wrapper">
      <div className="detail-header">
        <button className="btn-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
          Back to Results
        </button>

        <div className="header-actions">
          <button className={`action-btn ${favoriteActive ? 'active' : ''}`} onClick={() => toggleFavorite(vehicle)}>
            <Heart size={18} fill={favoriteActive ? 'currentColor' : 'none'} />
            {favoriteActive ? 'Saved' : 'Save'}
          </button>
          <button className="action-btn" onClick={handleShare}>
            <Share2 size={18} />
            {copied ? 'Copied!' : 'Share'}
          </button>
        </div>
      </div>

      <div className="detail-content">
        <div className="detail-gallery">
          <div className="main-image">
            <OgImage listingUrl={vehicle.vehicleUrl} fallbackSrc={vehicle.imageUrl ?? undefined} alt={`${vehicle.make} ${vehicle.model}`} />
            <span className="condition-badge">{vehicle.condition}</span>
          </div>
        </div>

        <div className="detail-info">
          <div className="info-header">
            <div>
              <h1 className="vehicle-title">
                {vehicle.make} {vehicle.model}
              </h1>
              <span className="vehicle-year">{vehicle.year}</span>
            </div>
            <div className="price-section">
              <span className="currency">LKR</span>
              <span className="price">{formatPrice(vehicle.price)}</span>
              <span className={`price-change ${vehicle.validationStatus === 'validated' ? 'up' : 'down'}`}>
                {vehicle.validationStatus === 'validated' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {Math.round(vehicle.confidence * 100)}%
              </span>
            </div>
          </div>

          <div className="specs-grid">
            <div className="spec-item">
              <Gauge size={20} />
              <div className="spec-text">
                <span className="spec-value">{vehicle.mileage.toLocaleString()} km</span>
                <span className="spec-label">Mileage</span>
              </div>
            </div>
            <div className="spec-item">
              <Settings2 size={20} />
              <div className="spec-text">
                <span className="spec-value">{vehicle.vehicleType}</span>
                <span className="spec-label">Vehicle Type</span>
              </div>
            </div>
            <div className="spec-item">
              <ClipboardCheck size={20} />
              <div className="spec-text">
                <span className="spec-value">{vehicle.validationStatus}</span>
                <span className="spec-label">Validation</span>
              </div>
            </div>
            <div className="spec-item">
              <MapPin size={20} />
              <div className="spec-text">
                <span className="spec-value">{vehicle.district || 'N/A'}</span>
                <span className="spec-label">Location</span>
              </div>
            </div>
          </div>

          <div className="detail-description glass-panel-small">
            <h3>Listing Overview</h3>
            {marketAnalysis ? (
              <>
                <p>
                  Market view for similar {vehicle.make} {vehicle.model} listings in your selected range.
                </p>
                <div className="market-grid">
                  <div className="market-item">
                    <span className="market-label">Market Avg Price</span>
                    <span className="market-value">{avgPriceMillion ? formatPrice(avgPriceMillion) : 'N/A'}</span>
                    {marketDiffPercent !== null && (
                      <span className={`market-diff ${marketDiffPercent <= 0 ? 'below' : 'above'}`}>
                        {Math.abs(marketDiffPercent).toFixed(1)}% {marketDiffPercent <= 0 ? 'below' : 'above'} average
                      </span>
                    )}
                  </div>
                  <div className="market-item">
                    <span className="market-label">Expected Next Week</span>
                    <span className="market-value">{nextWeekPriceMillion ? formatPrice(nextWeekPriceMillion) : 'N/A'}</span>
                    {previousMonthPriceMillion && nextWeekPriceMillion && (
                      <span className={`market-diff ${nextWeekPriceMillion <= previousMonthPriceMillion ? 'below' : 'above'}`}>
                        {nextWeekPriceMillion <= previousMonthPriceMillion ? 'Cooling trend' : 'Rising trend'}
                      </span>
                    )}
                  </div>
                </div>

                {trendPolyline && (
                  <div className="price-history-section">
                    <div className="price-chart" aria-label="Price trend">
                      <svg viewBox="0 0 100 40" preserveAspectRatio="none" role="img" aria-hidden="true">
                        <polyline
                          points={trendPolyline}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div className="price-range">
                      <span>{trendPoints[0]?.label ?? 'Start'}</span>
                      <span>{trendPoints[trendPoints.length - 1]?.label ?? 'Now'}</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p>Market insight is not available for this listing yet.</p>
            )}
            <a href={vehicle.vehicleUrl} target="_blank" rel="noopener noreferrer" className="primary-link">
              <ExternalLink size={16} />
              Open original listing
            </a>
          </div>
        </div>
      </div>

      {similarVehicles.length > 0 && (
        <section className="similar-section">
          <h3>Similar Vehicles</h3>
          <div className="similar-grid">
            {similarVehicles.map((item) => (
              <div key={item.id} className="similar-card glass-panel-small" onClick={() => navigate(`/vehicle/${encodeURIComponent(item.id)}`)} role="presentation">
                <OgImage listingUrl={item.vehicleUrl} fallbackSrc={item.imageUrl ?? undefined} alt={`${item.make} ${item.model}`} />
                <div className="similar-info">
                  <h4>
                    {item.year} {item.make} {item.model}
                  </h4>
                  <p>{formatPrice(item.price)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default VehicleDetail;
