import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Progress animation - 2 seconds duration
    const duration = 2000; // 2 seconds
    const interval = 50;
    const increment = (interval / duration) * 100;

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(progressTimer);
          setTimeout(() => {
            setIsExiting(true);
            setTimeout(onComplete, 400);
          }, 300);
          return 100;
        }
        return next;
      });
    }, interval);

    return () => {
      clearInterval(progressTimer);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: '#000000',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          {/* Logo */}
          <motion.img
            src="/assets/AutoInsightBlack.png"
            alt="AutoInsight Logo"
            initial={{ scale: 1.0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: 0.6,
              ease: [0.43, 0.13, 0.23, 0.96],
            }}
            style={{
              width: '400px',
              height: '400px',
              objectFit: 'contain',
              marginBottom: '50px',
              filter: 'brightness(1)',
            }}
          />

          {/* Loading Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '240px',
            }}
          >
            {/* Progress Bar Container */}
            <div
              style={{
                width: '100%',
                height: '2px',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '1px',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {/* Progress Fill */}
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{
                  duration: 0.1,
                  ease: 'linear',
                }}
                style={{
                  height: '100%',
                  backgroundColor: '#ffffff',
                  borderRadius: '1px',
                  position: 'relative',
                }}
              >
                {/* Shimmer Effect */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                    animation: 'shimmer 1.5s infinite',
                  }}
                />
              </motion.div>
            </div>

            {/* Percentage Text */}
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 0.5 }}
              style={{
                marginTop: '12px',
                fontSize: '12px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontWeight: '300',
                color: 'rgba(255, 255, 255, 0.4)',
                letterSpacing: '0.5px',
              }}
            >
              {Math.round(progress)}%
            </motion.span>
          </motion.div>

          {/* Brand Name at Bottom */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ delay: 0.6 }}
            style={{
              position: 'absolute',
              bottom: '50px',
              fontSize: '13px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontWeight: '300',
              color: 'rgba(255, 255, 255, 0.25)',
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}
          >
            AutoInsight
          </motion.div>

          {/* Shimmer Animation */}
          <style>
            {`
              @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
              }
            `}
          </style>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;