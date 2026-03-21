import React from 'react';
import { Link } from 'react-router-dom';
import {
  Car,
  Search,
  SlidersHorizontal,
  Heart,
  GitCompare,
  ClipboardCheck,
  Moon,
  Sun,
  Mail,
} from 'lucide-react';
import '../styles/Guides.css';

const Guides: React.FC = () => {
  return (
    <div className="guides-page">
      <section className="guides-hero">
        <span className="guides-badge">AutoInsight User Guide</span>
        <h1>Complete Website Guide</h1>
        <p>
          Follow this page to learn every major feature in AutoInsight: searching vehicles, filtering results,
          saving favorites, comparing cars, reading price insights, and requesting inspections.
        </p>
      </section>

      <section className="guides-section">
        <h2>
          <Car size={18} /> 1. Start from Home
        </h2>
        <ol>
          <li>Open the Home page to access quick vehicle filters and featured listings.</li>
          <li>Select your preferred Make, Model, Mileage, Price, Condition, Year, and City.</li>
          <li>Use <strong>More filters</strong> to open advanced filters and narrow your search.</li>
          <li>Click <strong>Search</strong> to move to the full results page.</li>
        </ol>
      </section>

      <section className="guides-section">
        <h2>
          <Search size={18} /> 2. Search Results Page
        </h2>
        <ol>
          <li>Use filter chips and multi-select filter panels to refine your results.</li>
          <li>Choose sort options such as newest, lowest price, highest price, and mileage order.</li>
          <li>Review average market price, average mileage, and trend metrics at the top.</li>
          <li>Switch pages using pagination controls to browse all matching vehicles.</li>
        </ol>
      </section>

      <section className="guides-section">
        <h2>
          <SlidersHorizontal size={18} /> 3. Filters (How to Use Correctly)
        </h2>
        <ul>
          <li>Pick <strong>Make</strong> first, then choose <strong>Model</strong> for best results.</li>
          <li>Use range filters for <strong>Price</strong>, <strong>Mileage</strong>, and <strong>Year</strong>.</li>
          <li>Use condition filters to target <strong>Used</strong>, <strong>Recondition</strong>, or <strong>Brand New</strong>.</li>
          <li>Use <strong>Clear all</strong> when you want to restart with fresh criteria.</li>
        </ul>
      </section>

      <section className="guides-section">
        <h2>
          <Heart size={18} /> 4. Favorites & Saved Vehicles
        </h2>
        <ol>
          <li>Click the heart icon on any listing card to save it as a favorite.</li>
          <li>Saved vehicles stay available while you browse and compare options.</li>
          <li>Click the same heart icon again to remove a vehicle from favorites.</li>
        </ol>
      </section>

      <section className="guides-section">
        <h2>
          <GitCompare size={18} /> 5. Compare Vehicles
        </h2>
        <ol>
          <li>Use compare actions on listing cards to add vehicles to your comparison list.</li>
          <li>Open the Compare page from the top navigation.</li>
          <li>Review side-by-side values for year, mileage, price, and listing details.</li>
          <li>Remove items from compare when needed and add better candidates.</li>
        </ol>
      </section>

      <section className="guides-section">
        <h2>
          <ClipboardCheck size={18} /> 6. Vehicle Details & Inspection Request
        </h2>
        <ol>
          <li>Click <strong>View details</strong> on any listing to open the full vehicle page.</li>
          <li>Read market comparison insights and trend indicators on that page.</li>
          <li>Use the inspection request action to prepare an email request quickly.</li>
          <li>Confirm vehicle data and contact details before placing the request.</li>
        </ol>
      </section>

      <section className="guides-section">
        <h2>
          <Sun size={18} /> <Moon size={18} /> 7. Theme Switching (Dark / Light)
        </h2>
        <ol>
          <li>Click the theme toggle button in the top navigation bar.</li>
          <li>Your selected mode is saved automatically for your next visit.</li>
          <li>All pages, cards, and footer styles update with the selected theme.</li>
        </ol>
      </section>

      <section className="guides-section">
        <h2>
          <Mail size={18} /> 8. Contact, Help & Quick Access
        </h2>
        <ul>
          <li>Use the floating chat button in the footer to open contact quickly.</li>
          <li>Use the arrow button to scroll back to the top of the page.</li>
          <li>Visit footer links like FAQ, Data Sources, and Legal for more information.</li>
        </ul>
      </section>

      <section className="guides-cta">
        <h3>Ready to start?</h3>
        <p>Go to search and begin filtering vehicles in seconds.</p>
        <Link to="/results" className="guides-cta-link">
          Start Searching
        </Link>
      </section>
    </div>
  );
};

export default Guides;