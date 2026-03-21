import React from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  ChartLine,
  GitCompare,
  Heart,
  ShieldCheck,
  MapPin,
  Moon,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import '../styles/Features.css';

const topHighlights = [
  {
    icon: Search,
    title: 'Powerful Search',
    description:
      'Search listings quickly with focused controls for make, model, year, and key details.',
  },
  {
    icon: ChartLine,
    title: 'Market Insights',
    description:
      'Track pricing direction and listing quality to make confident vehicle decisions.',
  },
  {
    icon: GitCompare,
    title: 'Smart Comparison',
    description:
      'Compare options side-by-side to choose the right vehicle faster and more accurately.',
  },
];

const featureCards = [
  {
    icon: SlidersHorizontal,
    title: 'Advanced Filters',
    description:
      'Filter by price, mileage, year, city, and condition to narrow down ideal results.',
  },
  {
    icon: Heart,
    title: 'Saved Favorites',
    description:
      'Save vehicles you like and keep your shortlist organized while browsing.',
  },
  {
    icon: ShieldCheck,
    title: 'Inspection Ready',
    description:
      'Move from listing review to inspection planning with clear, practical details.',
  },
  {
    icon: MapPin,
    title: 'Location Aware',
    description:
      'View regional listing context to find vehicles in the places that matter to you.',
  },
];

const workflowItems = [
  'Search and filter listings quickly',
  'Shortlist favorites and compare options',
  'Review market signals before deciding',
  'Proceed to contact and inspection steps',
];

const Features: React.FC = () => {
  return (
    <div className="features-page">
      <section className="features-hero">
        <span className="features-badge">AutoInsight Features</span>
        <h1>Built for smarter vehicle buying decisions</h1>
        <p>
          Discover a complete platform designed to help you search, analyze, compare, and choose
          vehicles with speed and confidence.
        </p>
        <div className="features-hero-actions">
          <Link to="/results" className="features-btn-primary">
            Explore Listings <ArrowRight size={16} />
          </Link>
          <Link to="/guides" className="features-btn-secondary">
            View Guide
          </Link>
        </div>
      </section>

      <section className="features-highlights" aria-label="Feature highlights">
        {topHighlights.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.title} className="feature-highlight-box">
              <span className="feature-highlight-icon" aria-hidden="true">
                <Icon size={18} />
              </span>
              <h2>{item.title}</h2>
              <p>{item.description}</p>
            </article>
          );
        })}
      </section>

      <section className="features-main-grid" aria-label="Core features and workflow">
        <div className="features-left-column">
          {featureCards.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="feature-box">
                <div className="feature-icon-wrap" aria-hidden="true">
                  <Icon size={18} />
                </div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            );
          })}
        </div>

        <aside className="features-workflow-card">
          <div className="features-workflow-head">
            <Moon size={18} />
            <h3>Theme-Matched Professional Experience</h3>
          </div>
          <p>
            Every section is optimized for both light and dark mode, giving you a premium and
            consistent experience across the entire platform.
          </p>

          <div className="features-workflow-list">
            {workflowItems.map((item) => (
              <div key={item} className="workflow-row">
                <CheckCircle2 size={16} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="features-cta">
        <div>
          <h3>Ready to find your next vehicle?</h3>
          <p>Start with live listings and discover the value of data-driven buying.</p>
        </div>
        <Link to="/results" className="features-cta-link">
          Start Now
        </Link>
      </section>
    </div>
  );
};

export default Features;
