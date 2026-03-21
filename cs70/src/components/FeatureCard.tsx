
import { motion } from "framer-motion";
import { useInView } from "../hooks/useInView";
import type React from "react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: number;
}

export default function FeatureCard({ icon, title, description, delay = 0 }: FeatureCardProps) {
  const { ref, inView } = useInView<HTMLDivElement>();
  
  return (
    <motion.div
      ref={ref}
      className={`project scroll-fade feature-vibrant ${inView ? 'in-view' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
      whileHover={{ scale: 1.05, y: -12 }}
      style={{ 
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        padding: '32px 24px',
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
        border: '1px solid rgba(54, 129, 247, 0.1)',
        borderRadius: '16px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
        transition: 'all 0.3s ease',
        backdropFilter: 'blur(10px)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(54, 129, 247, 0.15)';
        e.currentTarget.style.borderColor = 'rgba(54, 129, 247, 0.3)';
        e.currentTarget.style.background = 'linear-gradient(135deg, #ffffff 0%, #f0f4ff 100%)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.06)';
        e.currentTarget.style.borderColor = 'rgba(54, 129, 247, 0.1)';
        e.currentTarget.style.background = 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)';
      }}
    >
      {/* Top accent line */}
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, #3681f7 0%, #8b5cf6 100%)',
          opacity: 0,
          borderRadius: '3px'
        }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />

      {/* Icon Container */}
      <motion.div
        style={{
          fontSize: 48,
          marginBottom: 20,
          display: 'inline-flex',
          padding: '16px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(54, 129, 247, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
          width: 'fit-content',
          position: 'relative'
        }}
        whileHover={{ scale: 1.15, rotate: 5 }}
        transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
      >
        {icon}
      </motion.div>

      {/* Title */}
      <h3 style={{ 
        fontSize: 18, 
        marginBottom: 12, 
        fontWeight: 700, 
        color: '#0b0c10',
        letterSpacing: '-0.3px'
      }}>
        {title}
      </h3>

      {/* Description */}
      <p style={{ 
        color: '#3a3d43', 
        fontSize: 14, 
        lineHeight: 1.7,
        flexGrow: 1
      }}>
        {description}
      </p>

      {/* Bottom gradient accent */}
      <motion.div
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: '120px',
          height: '120px',
          background: 'radial-gradient(circle, rgba(54, 129, 247, 0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
          filter: 'blur(30px)'
        }}
      />
    </motion.div>
  );
}

