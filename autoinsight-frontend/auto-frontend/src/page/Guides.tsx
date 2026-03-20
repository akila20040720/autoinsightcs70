import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Guides.css';

const Guides: React.FC = () => {
  return (
    <div className="guides-page">
      <section className="guides-hero">
        <span className="guides-badge">AutoInsight User Guide</span>
        <h1>Complete website guide</h1>
        <p>
          This guide explains every main part of AutoInsight: searching, filtering, reading analytics,
          opening vehicle details, comparing cars, saving favorites, and contacting support.
        </p>
      </section>

      <section className="guides-section">
        <h2>1) Start at Home</h2>
        <ul>
          <li>Open the home page to see featured listings and the main search area.</li>
          <li>Use <strong>Make</strong>, <strong>Model</strong>, and <strong>Location</strong> filters first for best results.</li>
          <li>Click <strong>More filters</strong> to reveal advanced options.</li>
          <li>Press <strong>Search</strong> to open the full results page.</li>
        </ul>
      </section>

      <section className="guides-section">
        <h2>2) Use filters correctly</h2>
        <ul>
          <li><strong>Condition:</strong> narrow by Used, Recondition, or Brand New listing type.</li>
          <li><strong>Price Range:</strong> set a minimum and maximum budget to avoid irrelevant cars.</li>
          <li><strong>Mileage Range:</strong> use this to control wear and long-term maintenance risk.</li>
          <li><strong>Year:</strong> select model year if you want newer or older vehicles only.</li>
          <li>Use <strong>Clear all</strong> to reset quickly and start over.</li>
        </ul>
      </section>

      <section className="guides-section">
        <h2>3) Read search results</h2>
        <ul>
          <li>Each result card shows key details like price, year, mileage, and location.</li>
          <li>Use sorting controls on the results page to see cheapest, newest, or most relevant first.</li>
          <li>Click <strong>View Details</strong> to open full analytics for one vehicle.</li>
          <li>Use the compare action on cards to add vehicles to the compare tray.</li>
        </ul>
      </section>

      <section className="guides-section">
        <h2>4) Understand vehicle detail analytics</h2>
        <ul>
          <li>Review market positioning to see if the listing price is below, near, or above market.</li>
          <li>Check price trend indicators to understand value direction.</li>
          <li>Read model-specific context before deciding to contact the seller.</li>
          <li>Use the action buttons to compare or save that vehicle.</li>
        </ul>
      </section>

      <section className="guides-section">
        <h2>5) Compare multiple vehicles</h2>
        <ul>
          <li>Go to the comparison page from a compare action on listing cards.</li>
          <li>Add at least two vehicles to unlock side-by-side comparison.</li>
          <li>Use the comparison table to check price, mileage, year, and market insight together.</li>
          <li>Remove a vehicle anytime if you want a cleaner comparison set.</li>
        </ul>
      </section>

      <section className="guides-section">
        <h2>6) Save favorites and revisit</h2>
        <ul>
          <li>Use the favorite icon on listing cards or detail pages to save vehicles.</li>
          <li>Saved vehicles are stored locally in your browser for quick access later.</li>
          <li>Favorites help you short-list options before making the final decision.</li>
        </ul>
      </section>

      <section className="guides-section">
        <h2>7) Contact and inspection flow</h2>
        <ul>
          <li>Use <strong>Contact Seller</strong> from listing actions when ready to proceed.</li>
          <li>Use <strong>Need Inspection</strong> to request pre-purchase checks before final payment.</li>
          <li>For platform questions, open the footer <strong>Contact</strong> page or email support.</li>
        </ul>
      </section>

      <section className="guides-section">
        <h2>8) Best-practice checklist</h2>
        <ul>
          <li>Start broad, then narrow with filters gradually.</li>
          <li>Never decide by price only; compare mileage, year, and market position.</li>
          <li>Always compare at least two to three similar vehicles before contacting a seller.</li>
          <li>Request an inspection for high-value purchases.</li>
        </ul>
      </section>

      <section className="guides-cta">
        <h3>Ready to use AutoInsight?</h3>
        <p>Go back to the marketplace and apply these steps with live listings.</p>
        <Link to="/" className="guides-home-btn">
          Open Marketplace
        </Link>
      </section>
    </div>
  );
};

export default Guides;