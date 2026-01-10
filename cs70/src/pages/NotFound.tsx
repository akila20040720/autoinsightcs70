import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/NotFound.css';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found-container">
      <div className="not-found-content">
        {/* Animated 404 Text */}
        <div className="not-found-header">
          <h1 className="error-code">
            <span className="digit">4</span>
            <span className="digit">0</span>
            <span className="digit">4</span>
          </h1>
        </div>

        {/* Main Message */}
        <div className="not-found-message">
          <h2 className="error-title">Page Not Found</h2>
          <p className="error-description">
            Sorry, the page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Decorative Elements */}
        <div className="floating-elements">
          <div className="element element-1"></div>
          <div className="element element-2"></div>
          <div className="element element-3"></div>
          <div className="element element-4"></div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/')}
          >
            <span className="btn-icon">←</span>
            Back to Home
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => navigate(-1)}
          >
            <span className="btn-icon">↶</span>
            Go Back
          </button>
        </div>

        {/* Helpful Links */}
        <div className="helpful-links">
          <p className="links-title">Quick Links:</p>
          <div className="links-grid">
            <a href="/" className="link-item">Home</a>
            <a href="/about" className="link-item">About</a>
            <a href="/features" className="link-item">Features</a>
            <a href="/contact" className="link-item">Contact</a>
          </div>
        </div>
      </div>

      {/* Background Animation */}
      <div className="background-animation">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>
    </div>
  );
};

export default NotFound;
