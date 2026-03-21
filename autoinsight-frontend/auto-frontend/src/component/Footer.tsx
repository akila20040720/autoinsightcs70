import React from 'react';
import { Instagram, Facebook, Linkedin, ArrowUp, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../styles/Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="main-footer">
      <div className="footer-container">
        <div className="footer-brand">
          <h2 className="footer-logo-text">AutoInsight</h2>
          <p>Vehicle market analytics for Sri Lanka<br/>— pricing, trends & actionable insights.</p>
          <div className="social-icons">
            <a href="https://www.instagram.com/info.autoinsight/" target="_blank" rel="noreferrer" className="icon-circle"><Instagram size={18} /></a>
            <a href="https://www.facebook.com/share/1JJQdCpJ6F/" target="_blank" rel="noreferrer" className="icon-circle"><Facebook size={18} /></a>
            <a href="https://www.linkedin.com/company/infoautoinsight/" target="_blank" rel="noreferrer" className="icon-circle"><Linkedin size={18} /></a>
          </div>
          <a href="mailto:info.autoinsight@gmail.com" className="footer-email">info.autoinsight@gmail.com</a>
        </div>

        <div className="footer-links-grid">
          <div className="footer-column">
            <h4>PRODUCT</h4>
            <ul>
              <li><Link to="/features">Features</Link></li>
              <li><Link to="/api">API</Link></li>
              <li><Link to="/guides">Guides</Link></li>
            </ul>
          </div>
          <div className="footer-column">
            <h4>RESOURCES</h4>
            <ul>
              <li><Link to="/data-sources">Data Sources</Link></li>
              <li><Link to="/faq">FAQ</Link></li>
              <li><Link to="/status">Status</Link></li>
            </ul>
          </div>
          <div className="footer-column">
            <h4>COMPANY</h4>
            <ul>
              <li><Link to="/about">About</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><Link to="/legal">Legal</Link></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p className="footer-copyright">© {new Date().getFullYear()} AutoInsight. All rights reserved.</p>

        <div className="footer-bottom-links">
          <Link to="/terms">Terms</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/cookies">Cookies</Link>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="floating-buttons">
        <button className="float-btn up-btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><ArrowUp size={20} /></button>
        <button className="float-btn chat-btn" onClick={() => window.location.href = '/contact'}><MessageCircle size={20} /></button>
      </div>
    </footer>
  );
};

export default Footer;