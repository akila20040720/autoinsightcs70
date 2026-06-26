import { motion } from "framer-motion";
import { useInView } from "../hooks/useInView";
import type React from "react";

interface DataSourceProps {
  name: string;
  url: string;
  description: string;
  delay?: number;
  icon?: React.ReactNode;
}

export default function DataSourceCard({ name, url, description, delay = 0, icon }: DataSourceProps) {
  const { ref, inView } = useInView<HTMLAnchorElement>();
  
  return (
    <motion.a
      ref={ref}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="project scroll-fade data-source-vibrant"
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
      whileHover={{ scale: 1.05, y: -12 }}
      style={{ 
        textDecoration: 'none',
        display: 'flex',
        flexDirection: 'column',
        padding: '32px 24px',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(145deg, #0a0a0a 0%, #1a1a1a 100%)',
        border: '1px solid rgba(54, 129, 247, 0.15)',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)',
        transition: 'all 0.3s ease',
        backdropFilter: 'blur(10px)',
        height: '100%',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 12px 48px rgba(54, 129, 247, 0.25)';
        e.currentTarget.style.borderColor = 'rgba(54, 129, 247, 0.5)';
        e.currentTarget.style.background = 'linear-gradient(145deg, #0d0d0d 0%, #1a1a2e 100%)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.6)';
        e.currentTarget.style.borderColor = 'rgba(54, 129, 247, 0.15)';
        e.currentTarget.style.background = 'linear-gradient(145deg, #0a0a0a 0%, #1a1a1a 100%)';
      }}
    >
      {/* Top accent line - Blue gradient */}
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, #3681f7 0%, #5b9cf7 50%, #3681f7 100%)',
          opacity: 0,
          borderRadius: '3px'
        }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />

      {/* Glow effect on hover */}
      <motion.div
        style={{
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle, rgba(54, 129, 247, 0.03) 0%, transparent 70%)',
          pointerEvents: 'none',
          opacity: 0
        }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />

      {/* Icon Container */}
      <motion.div
        style={{
          fontSize: 32,
          marginBottom: 20,
          display: 'inline-flex',
          padding: '16px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(54, 129, 247, 0.15) 0%, rgba(54, 129, 247, 0.05) 100%)',
          border: '1px solid rgba(54, 129, 247, 0.1)',
          width: 'fit-content',
          position: 'relative'
        }}
        whileHover={{ scale: 1.15, rotate: 5 }}
        transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
      >
        {icon || "🔗"}
      </motion.div>

      {/* Title - White */}
      <h3 style={{ 
        fontSize: 18, 
        marginBottom: 10, 
        fontWeight: 700, 
        color: '#ffffff',
        letterSpacing: '-0.3px'
      }}>
        {name}
      </h3>

      {/* Description - Light gray/white */}
      <p style={{ 
        color: '#c8c8c8', 
        fontSize: 14, 
        lineHeight: 1.7,
        marginBottom: 16,
        flexGrow: 1
      }}>
        {description}
      </p>

      {/* Visit Link - Blue accent */}
      <motion.div 
        style={{ 
          color: '#3681f7', 
          fontSize: 13, 
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginTop: 'auto'
        }}
        whileHover={{ gap: 10 }}
        transition={{ duration: 0.2 }}
      >
        Visit source 
        <motion.span 
          style={{ color: '#3681f7' }}
          whileHover={{ x: 4 }}
          transition={{ duration: 0.2 }}
        >
          →
        </motion.span>
      </motion.div>

      {/* Bottom gradient accent - Blue glow */}
      <motion.div
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: '150px',
          height: '150px',
          background: 'radial-gradient(circle, rgba(54, 129, 247, 0.12) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
          filter: 'blur(40px)'
        }}
      />

      {/* Additional subtle blue accent ring */}
      <motion.div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '200px',
          height: '200px',
          border: '1px solid rgba(54, 129, 247, 0.03)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }}
      />
    </motion.a>
  );
}