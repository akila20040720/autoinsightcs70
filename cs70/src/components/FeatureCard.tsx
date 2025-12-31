
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
      whileHover={{ scale: 1.08, y: -10, rotateZ: 1 }}
      style={{ 
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer'
      }}
    >
      <motion.div
        style={{
          fontSize: 46,
          marginBottom: 18,
          display: 'inline-flex',
          padding: '18px',
          borderRadius: '18px',
          background: 'linear-gradient( #023e8a 0%, #0077B6 50%, #48CAE4 100%)',
          boxShadow: '0 8px 28px -6px rgba(0,119,182,0.45), 0 4px 14px -4px rgba(0, 150, 199, 0.4)',
          color: '#fff',
          position: 'relative'
        }}
        whileHover={{ rotate: 360, scale: 1.12 }}
        transition={{ duration: 0.7 }}
      >{icon}</motion.div>
      <h3 style={{ fontSize: 18, marginBottom: 12, fontWeight: 600, color: '#0b0c10' }}>{title}</h3>
      <p style={{ color: '#0b0c10', fontSize: 14, lineHeight: 1.6 }}>{description}</p>
    </motion.div>
  );
}

