import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, Menu, X } from 'lucide-react';
import '../styles/Navbar.css';
import logo from '../images/AutoInsightLogo.png'; 

interface NavbarProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

const NAV_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'Search', path: '/results' },
  { label: 'About', path: '/about' },
  { label: 'Contact', path: '/contact' },
];

const Navbar: React.FC<NavbarProps> = ({ darkMode, setDarkMode }) => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="main-header glass-header">
      <div className="header-content">
        
        <Link to="/" className="logo-section">
          <img src={logo} alt="AutoInsight Logo" className="app-logo" />
        </Link>

        {/* Desktop Navigation */}
        <nav className={`nav-links ${mobileOpen ? 'nav-open' : ''}`}>
          {NAV_LINKS.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${location.pathname === link.path ? 'nav-active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="nav-right">
          {/* Theme Toggle */}
          <button
            className="theme-toggle-btn"
            onClick={() => setDarkMode(!darkMode)}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Mobile Hamburger */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

      </div>
    </header>
  );
};

export default Navbar;