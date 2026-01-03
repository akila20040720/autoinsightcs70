import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';


interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [loadingText, setLoadingText] = useState('Initializing');

  useEffect(() => {
    // Loading text animation
    const texts = ['Initializing', 'Loading Data', 'Preparing Analytics', 'Almost Ready'];
    let textIndex = 0;
    
    const textInterval = setInterval(() => {
      textIndex = (textIndex + 1) % texts.length;
      setLoadingText(texts[textIndex]);
    }, 750);

    // Progress animation
    const duration = 3000; // 3 seconds
    const interval = 50;
    const increment = (interval / duration) * 100;

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(progressTimer);
          clearInterval(textInterval);
          setTimeout(() => {
            setIsExiting(true);
            setTimeout(onComplete, 800);
          }, 500);
          return 100;
        }
        return next;
      });
    }, interval);

    return () => {
      clearInterval(progressTimer);
      clearInterval(textInterval);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          className="splash-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] }}
        >
          {/* Animated Background Pattern */}
          <div className="splash-bg-pattern" />

          {/* Aurora Blobs */}
          <div className="splash-aurora splash-aurora-1" />
          <div className="splash-aurora splash-aurora-2" />
          <div className="splash-aurora splash-aurora-3" />

          {/* Floating Particles */}
          <div className="splash-particles">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="splash-particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 4}s`,
                  animationDuration: `${4 + Math.random() * 4}s`,
                }}
              />
            ))}
          </div>

          {/* Content Container */}
          <div className="splash-content">
            {/* Logo Animation */}
            <motion.div
              className="splash-logo-container"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: 0.8,
                ease: [0.43, 0.13, 0.23, 0.96],
              }}
            >
              {/* Pulsing Rings */}
              <div className="splash-pulse-ring splash-pulse-ring-1" />
              <div className="splash-pulse-ring splash-pulse-ring-2" />
              <div className="splash-pulse-ring splash-pulse-ring-3" />

              {/* Logo Circle */}
              <div className="splash-logo-circle">
                <div className="splash-logo-inner">
                  
                  {/* AutoInsight logo */}
                  <img
                    src="/assets/AutoInsightLogo.png"
                    alt ="AutoInsight Logo"
                    className="splash-logo-image"
                    style={{ 
                        width: '64px',      
                        height: '64px',     
                        objectFit: 'contain',
                        position: 'relative',
                        zIndex: 10,
                        filter: 'drop-shadow(0 4px 12px rgba(255, 255, 255, 0.5))drop-shadow(0 0 20px rgba(255, 255, 255, 0.3)) brightness(1.2) contrast(1.1)'

                                 
                     }}
                  />
                
  
                  
                  
                  {/* Orbiting Dots */}
                  <div className="splash-orbit-dot splash-orbit-dot-1" />
                  <div className="splash-orbit-dot splash-orbit-dot-2" />
                  <div className="splash-orbit-dot splash-orbit-dot-3" />
                </div>
              </div>
            </motion.div>

            {/* Brand Name */}
            <motion.div
              className="splash-brand"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                duration: 0.8,
                delay: 0.3,
                ease: [0.43, 0.13, 0.23, 0.96],
              }}
            >
              <h1 className="splash-title">
                <span className="splash-title-text">AutoInsight</span>
              </h1>
              <motion.p
                className="splash-subtitle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                Vehicle Market Intelligence Platform
              </motion.p>
            </motion.div>

            {/* Progress Bar */}
            <motion.div
              className="splash-progress-wrapper"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.5,
              }}
            >
              {/* Progress Container */}
              <div className="splash-progress-container">
                {/* Progress Fill */}
                <motion.div
                  className="splash-progress-fill"
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{
                    duration: 0.1,
                    ease: 'linear',
                  }}
                >
                  {/* Shimmer Effect */}
                  <div className="splash-progress-shimmer" />
                </motion.div>
              </div>

              {/* Loading Text */}
              <motion.div className="splash-loading-info">
                <motion.span
                  key={loadingText}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.3 }}
                  className="splash-loading-text"
                >
                  {loadingText}
                </motion.span>
                <span className="splash-progress-percent">{Math.round(progress)}%</span>
              </motion.div>
            </motion.div>

            {/* Loading Dots */}
            <motion.div
              className="splash-loading-dots"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="splash-dot"
                  style={{
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </motion.div>

            {/* Feature Pills */}
            <motion.div
              className="splash-features"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
            >
              <div className="splash-feature-pill">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
                Real-time Analytics
              </div>
              <div className="splash-feature-pill">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
                AI Powered
              </div>
              <div className="splash-feature-pill">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                Secure Platform
              </div>
            </motion.div>
          </div>

          {/* Bottom Tagline */}
          <motion.div
            className="splash-tagline"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 1 }}
          >
            <div className="splash-tagline-divider" />
            <span>Powered by Advanced Analytics & Machine Learning</span>
            <div className="splash-tagline-divider" />
          </motion.div>

          {/* Decorative Corner Elements */}
          <div className="splash-corner splash-corner-tl" />
          <div className="splash-corner splash-corner-tr" />
          <div className="splash-corner splash-corner-bl" />
          <div className="splash-corner splash-corner-br" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;