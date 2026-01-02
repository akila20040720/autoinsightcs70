import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import "../styles/ModernHero.css";

interface Vehicle {
  id: number;
  name: string;
  category: string;
  gradient: string;
  price: string;
  change: string;
  image: string;
  stats: {
    listings: string;
    avgPrice: string;
    trend: string;
  };
}

const vehicles: Vehicle[] = [
  {
    id: 0,
    name: "Honda Vezel",
    category: "Best Choice",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    price: "19.5M",
    change: "+8.2%",
    image: "Vehicles/honda-vezel.jpg",
    stats: {
      listings: "2,340",
      avgPrice: "LKR 19.5M",
      trend: "Rising"
    }
  },
  {
    id: 1,
    name: "Nissan Magnite",
    category: "Budget Friendly",
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    price: "9.2M",
    change: "+12.5%",
    image: "Vehicles/magnite.jpg",
    stats: {
      listings: "1,856",
      avgPrice: "LKR 9.2M",
      trend: "Increasing"
    }
  },
  {
    id: 2,
    name: "Toyota Yaris",
    category: "Sub Compact",
    gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    price: "82M",
    change: "-24.1%",
    image: "Vehicles/yaris.jpg",
    stats: {
      listings: "892",
      avgPrice: "LKR 8.2M",
      trend: "decreasing"
    }
  },
  {
    id: 3,
    name: "Toyota Raize",
    category: "Famous Choice",
    gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    price: "13.8M",
    change: "+5.3%",
    image: "Vehicles/raize.jpg",
    stats: {
      listings: "1,234",
      avgPrice: "LKR 13.8M",
      trend: "increasing"
    }
  },

  {
    id: 3,
    name: "Toyota Premio",
    category: "Sri Lanka's Favorite",
    gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    price: "16.8M",
    change: "-15.3%",
    image: "Vehicles/premio.jpg",
    stats: {
      listings: "234",
      avgPrice: "LKR 16.8M",
      trend: "decreasing"
    }
  }
];

export default function FuturisticHero3D() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const activeVehicle = vehicles[activeIndex];

  // Auto-rotate carousel every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % vehicles.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Mouse parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="modern-hero">
      {/* Animated Gradient Mesh Background */}
      <div className="gradient-mesh">
        <motion.div 
          className="mesh-blob blob-1"
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="mesh-blob blob-2"
          animate={{
            x: [0, -80, 0],
            y: [0, 80, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="mesh-blob blob-3"
          animate={{
            x: [0, 60, 0],
            y: [0, 100, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Floating Particles */}
      <div className="particles-modern">
        {[...Array(40)].map((_, i) => (
          <motion.div
            key={i}
            className="floating-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="hero-container">
        {/* Left Content */}
        <motion.div 
          className="hero-left"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div 
            className="badge"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="badge-icon">🚀</span>
            <span>Sri Lanka's #1 Vehicle Analytics Platform</span>
          </motion.div>

          <motion.h1 
            className="main-title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            Discover Your
            <br />
            <span className="gradient-text">Perfect Vehicle</span>
            <br />
            with AI Insights
          </motion.h1>

          <motion.p 
            className="subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Real-time market analytics powered by AI. Compare prices, track trends,
            and make smarter decisions in the Sri Lankan automotive market.
          </motion.p>

          <motion.div 
            className="cta-group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <button className="btn-primary">
              <span>Start Exploring</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className="btn-secondary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/>
              </svg>
              <span>Watch Demo</span>
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div 
            className="stats-row"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <div className="stat-item">
              <div className="stat-number">15K+</div>
              <div className="stat-label">Active Listings</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">98%</div>
              <div className="stat-label">Accuracy Rate</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Live Updates</div>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Content - Vehicle Carousel */}
        <motion.div 
          className="hero-right"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
            transition: "transform 0.3s ease-out",
          }}
        >
          {/* Glass Card with Vehicle */}
          <motion.div 
            className="glass-card"
            key={activeVehicle.id}
            initial={{ opacity: 0, scale: 0.9, rotateY: 20 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Category Badge */}
            <div className="category-badge" style={{ background: activeVehicle.gradient }}>
              {activeVehicle.category}
            </div>

            {/* Vehicle Image */}
            <div className="vehicle-showcase">
              <motion.img 
                src={activeVehicle.image}
                alt={activeVehicle.name}
                className="vehicle-img"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
              
              {/* Decorative Elements */}
              <div className="decorative-ring ring-1" style={{ background: activeVehicle.gradient }}></div>
              <div className="decorative-ring ring-2" style={{ background: activeVehicle.gradient }}></div>
            </div>

            {/* Vehicle Info */}
            <div className="vehicle-details">
              <h3 className="vehicle-name">{activeVehicle.name}</h3>
              
              <div className="price-section">
                <div className="price-main">
                  <span className="currency">LKR</span>
                  <span className="amount">{activeVehicle.price}</span>
                </div>
                <div className="price-change positive">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="17 6 23 6 23 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {activeVehicle.change}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="quick-stats">
                <div className="quick-stat">
                  <div className="stat-icon">📊</div>
                  <div className="stat-info">
                    <div className="stat-value">{activeVehicle.stats.listings}</div>
                    <div className="stat-text">Listings</div>
                  </div>
                </div>
                <div className="quick-stat">
                  <div className="stat-icon">💰</div>
                  <div className="stat-info">
                    <div className="stat-value">{activeVehicle.stats.avgPrice}</div>
                    <div className="stat-text">Avg Price</div>
                  </div>
                </div>
                <div className="quick-stat">
                  <div className="stat-icon">📈</div>
                  <div className="stat-info">
                    <div className="stat-value">{activeVehicle.stats.trend}</div>
                    <div className="stat-text">Trend</div>
                  </div>
                </div>
              </div>

              <button className="view-details-btn">
                View Full Analysis
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </motion.div>

          {/* Mini Cards */}
          <div className="mini-cards">
            {vehicles
              .filter((_, idx) => idx !== activeIndex)
              .slice(0, 3)
              .map((vehicle, idx) => (
                <motion.div
                  key={vehicle.id}
                  className="mini-card"
                  onClick={() => setActiveIndex(vehicle.id)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + idx * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  style={{
                    background: `linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)`,
                  }}
                >
                  <img src={vehicle.image} alt={vehicle.name} />
                  <div className="mini-card-info">
                    <div className="mini-card-name">{vehicle.name}</div>
                    <div className="mini-card-price">LKR {vehicle.price}</div>
                  </div>
                </motion.div>
              ))}
          </div>
        </motion.div>
      </div>

      {/* Carousel Dots */}
      <div className="carousel-dots">
        {vehicles.map((vehicle, idx) => (
          <button
            key={vehicle.id}
            className={`dot ${idx === activeIndex ? 'active' : ''}`}
            onClick={() => setActiveIndex(idx)}
            style={{
              background: idx === activeIndex ? vehicle.gradient : 'rgba(255,255,255,0.3)',
            }}
          />
        ))}
      </div>

      {/* Scroll Indicator */}
      <motion.div 
        className="scroll-indicator"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="scroll-text">Scroll to explore</div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <polyline points="6 9 12 15 18 9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </motion.div>
    </div>
  );
}
