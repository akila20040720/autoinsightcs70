import React from 'react';
import { Database, Globe, RefreshCw, ShieldCheck } from 'lucide-react';
import '../styles/DataSources.css';

const DataSources: React.FC = () => {
  return (
    <div className="data-sources-page">
      <section className="data-sources-hero">
        <span className="data-sources-badge">
          <Database size={14} /> Data Transparency
        </span>
        <h1>Data Sources</h1>
        <p>
          AutoInsight market analytics are powered by vehicle listing data sourced from riyasewan.lk.
          We process and structure this data to deliver clean search, trend analysis, and comparison insights.
        </p>
      </section>

      <section className="data-sources-grid" aria-label="Data source details">
        <article className="data-card glass-panel-small">
          <div className="data-card-head">
            <Globe size={18} />
            <h2>Primary Source</h2>
          </div>
          <p>
            Source: riyasewan.lk
          </p>
          <p>
            Listing information includes vehicle make/model, year, mileage, condition, location, and listed price.
          </p>
        </article>

        <article className="data-card glass-panel-small">
          <div className="data-card-head">
            <RefreshCw size={18} />
            <h2>Update Process</h2>
          </div>
          <p>
            Data is refreshed regularly to reflect changes in active listings and market movement.
          </p>
          <p>
            Updated records are normalized for consistent filtering, sorting, and trend reporting.
          </p>
        </article>

        <article className="data-card glass-panel-small">
          <div className="data-card-head">
            <ShieldCheck size={18} />
            <h2>Quality & Validation</h2>
          </div>
          <p>
            Raw listing data goes through cleaning and validation checks before being used in analytics views.
          </p>
          <p>
            This helps reduce duplicates, improve consistency, and support reliable insights.
          </p>
        </article>
      </section>

      <section className="data-note glass-panel-small" aria-label="Usage note">
        <h3>Important Note</h3>
        <p>
          AutoInsight provides market intelligence based on publicly available listing data. Vehicle availability,
          pricing, and condition can change quickly, so always verify details directly with sellers before making decisions.
        </p>
      </section>
    </div>
  );
};

export default DataSources;
