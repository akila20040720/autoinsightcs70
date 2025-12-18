import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import HeroAnalytics from "./HeroAnalytics";

interface HeroProps {
  center?: boolean;
}

const proofBadges = ["A", "B", "C", "D"];

export default function Hero({ center }: HeroProps) {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || window.pageYOffset;
      setScrollY(y);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const parallaxStyle: React.CSSProperties = {
    transform: `translateY(${scrollY * -0.05}px)`,
  };

  return (
    <section className={`hero hero-landing landing-gradient-animated${center ? " centered" : ""}`}>
      <div className="hero-backdrop" aria-hidden />
      <HeroAnalytics />

      <div className="hero-content" style={parallaxStyle}>
        <motion.div
          className="hero-pill"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <span className="hero-pill-dot" />
          #1 Vehicle Analytic Platform in Sri Lanka
        </motion.div>

        <motion.h1
          className="hero-title"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.75, delay: 0.1 }}
        >
          Unlock Deeper <br /> Insights <br /> Drive Unmatched{" "}
          <span className="hero-highlight">Performance</span>
        </motion.h1>

        <motion.p
          className="hero-subtitle"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.75, delay: 0.2 }}
        >
          AutoInsight is a web-based system developed to analyze and visualize vehicle market data in Sri Lanka. The project aims to provide real-time insights into vehicle pricing trends, popular models, and regional market activity using data collected from online platforms such as Riyasewana, Patpat.lk, and Ikman.lk, as well as official data from the Ceylon Motor Traders Association (CMTA).
        </motion.p>

        <motion.div
          className="hero-actions"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.75, delay: 0.3 }}
        >
          <a className="hero-btn hero-btn-primary" href="https://autoinsight-bay.vercel.app/Login">
            Get Started Now
            <span className="hero-btn-icon">→</span>
          </a>
          <a className="hero-btn hero-btn-secondary" href="https://autoinsight-bay.vercel.app/Login">
            <span className="hero-play-icon" aria-hidden>
              ►
            </span>
            Watch Demo
          </a>
        </motion.div>

        <motion.div
          className="hero-proof"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.75, delay: 0.4 }}
        >
          <div className="hero-users">
            {proofBadges.map((badge) => (
              <span key={badge} className="hero-user-badge">
                {badge}
              </span>
            ))}
          </div>
          <div className="hero-metrics">
            <div className="hero-metric">
              <span className="hero-metric-label">Trusted by</span>
              <span className="hero-metric-value">100+ users</span>
            </div>
            <div className="hero-rating">
              <span className="hero-stars">★★★★★</span>
              <span className="hero-rating-value">4.9/5 rating</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="hero-scroll-hint"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          Scroll to explore
          <span className="hero-scroll-dot" />
        </motion.div>
      </div>
    </section>
  );
}
