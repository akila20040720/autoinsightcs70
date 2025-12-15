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
      style={{ 
        textDecoration: 'none',
        display: 'block',
        padding: '26px',
        transition: 'all 0.3s ease',
        color: '#0b0c10'
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
      whileHover={{ scale: 1.05, y: -8 }}
    >
      <div style={{
        fontSize: 30,
        marginBottom: 14,
        display: 'inline-flex',
        padding: '14px',
        borderRadius: '14px',
        background: 'linear-gradient(135deg,#e9ecf5,#dde7ff,#f2f6ff)',
        color: '#0b0c10',
        boxShadow: '0 6px 18px -4px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.08)'
      }}>{icon || "🔗"}</div>
      <h3 style={{ fontSize: 18, marginBottom: 8, fontWeight: 600, color: '#0b0c10' }}>
        {name}
      </h3>
      <p style={{ color: '#0b0c10', fontSize: 14, lineHeight: 1.6, marginBottom: 12, fontWeight: 500 }}>
        {description}
      </p>
      <div style={{ 
        color: '#0b0c10', 
        fontSize: 13, 
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: 6
      }}>
        Visit source <span style={{ color: '#0b0c10' }}>→</span>
      </div>
    </motion.a>
  );
}

