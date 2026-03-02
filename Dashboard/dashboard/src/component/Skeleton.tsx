import React from 'react';
import '../styles/Skeleton.css';

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
}

/** A single shimmer block */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  borderRadius = '8px',
  className = '',
}) => (
  <div
    className={`skeleton-shimmer ${className}`}
    style={{ width, height, borderRadius }}
  />
);

/** Skeleton for a car card (image + title + price + stats + button) */
export const CarCardSkeleton: React.FC = () => (
  <div className="glass-card skeleton-card">
    <Skeleton height="200px" borderRadius="12px" />
    <div className="card-content">
      <Skeleton width="65%" height="1.3rem" />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem' }}>
        <Skeleton width="40%" height="1.6rem" />
        <Skeleton width="20%" height="1.4rem" borderRadius="8px" />
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
        <Skeleton height="3.2rem" borderRadius="12px" />
        <Skeleton height="3.2rem" borderRadius="12px" />
        <Skeleton height="3.2rem" borderRadius="12px" />
      </div>
      <Skeleton height="2.8rem" borderRadius="10px" className="skeleton-mt" />
    </div>
  </div>
);

/** Skeleton for the stat cards on the search results page */
export const StatCardSkeleton: React.FC = () => (
  <div className="stat-card glass-panel-small skeleton-card">
    <Skeleton width="50%" height="0.85rem" />
    <Skeleton width="70%" height="1.8rem" className="skeleton-mt" />
  </div>
);

/** Skeleton for the graph panel */
export const GraphSkeleton: React.FC = () => (
  <div className="graph-card glass-panel-small skeleton-card">
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <Skeleton width="45%" height="1.1rem" />
      <Skeleton width="20%" height="1.4rem" borderRadius="8px" />
    </div>
    <Skeleton height="180px" borderRadius="12px" className="skeleton-mt-lg" />
    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem' }}>
      <Skeleton width="12%" height="0.8rem" />
      <Skeleton width="12%" height="0.8rem" />
      <Skeleton width="12%" height="0.8rem" />
      <Skeleton width="12%" height="0.8rem" />
    </div>
  </div>
);

/** Skeleton for the predictions sidebar */
export const PredictionsSkeleton: React.FC = () => (
  <div className="predictions-card glass-panel-small skeleton-card">
    <Skeleton width="55%" height="1.1rem" />
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.25rem' }}>
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} height="3rem" borderRadius="10px" />
      ))}
    </div>
  </div>
);

/** Full page skeleton for CarMarketplace */
export const MarketplaceSkeleton: React.FC = () => (
  <div className="marketplace-wrapper">
    <div className="page-header">
      <div className="filter-intro">
        <Skeleton width="55%" height="2rem" />
        <Skeleton width="75%" height="1rem" className="skeleton-mt-sm" />
      </div>
    </div>

    <section className="glass-panel filter-section skeleton-card">
      <div className="filter-form-grid">
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <div style={{ flex: 1 }}>
            <Skeleton width="30%" height="0.85rem" />
            <Skeleton height="2.6rem" borderRadius="10px" className="skeleton-mt-sm" />
          </div>
          <div style={{ flex: 1 }}>
            <Skeleton width="30%" height="0.85rem" />
            <Skeleton height="2.6rem" borderRadius="10px" className="skeleton-mt-sm" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ flex: 1 }}>
              <Skeleton width="35%" height="0.85rem" />
              <Skeleton height="2.6rem" borderRadius="10px" className="skeleton-mt-sm" />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
          <Skeleton width="160px" height="3rem" borderRadius="10px" />
        </div>
      </div>
    </section>

    <section className="inventory-section">
      <Skeleton width="45%" height="1.6rem" />
      <div className="car-showcase-grid" style={{ marginTop: '1.5rem' }}>
        {[1, 2, 3].map(i => <CarCardSkeleton key={i} />)}
      </div>
    </section>
  </div>
);

/** Full page skeleton for SearchResults */
export const SearchResultsSkeleton: React.FC = () => (
  <div className="results-wrapper">
    <div className="results-header">
      <Skeleton width="55%" height="1.8rem" />
      <Skeleton width="70%" height="1rem" className="skeleton-mt-sm" />
    </div>

    <section className="analytics-dashboard">
      <div className="analytics-main">
        <div className="stats-overview-flex">
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <GraphSkeleton />
      </div>
      <div className="analytics-sidebar">
        <PredictionsSkeleton />
      </div>
    </section>

    <section className="listings-section">
      <Skeleton width="40%" height="1.4rem" />
      <div className="flex-results-grid" style={{ marginTop: '1.5rem' }}>
        {[1, 2, 3].map(i => <CarCardSkeleton key={i} />)}
      </div>
    </section>
  </div>
);
