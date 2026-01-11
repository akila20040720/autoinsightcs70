
import { motion } from "framer-motion";
import { useInView } from "../hooks/useInView";
import { useTilt } from "../hooks/useTilt";

export default function ProjectCard({ title, tag, desc }: { title: string; tag: string; desc: string; }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const tiltRef = useTilt(12);
  return (
    <motion.article
      ref={(node) => { (ref as any).current = node; (tiltRef as any).current = node; }}
      className={`project tilt scroll-fade project-vibrant ${inView ? 'in-view' : ''}`}
      whileHover={{ scale: 1.05, y: -12 }}
      transition={{ type: "spring", stiffness: 300 }}
      role="article"
      style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '32px 24px',
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
        border: '1px solid rgba(54, 129, 247, 0.1)',
        borderRadius: '16px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        cursor: 'pointer'
      }}
      onMouseEnter={(e: any) => {
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(54, 129, 247, 0.15)';
        e.currentTarget.style.borderColor = 'rgba(54, 129, 247, 0.3)';
        e.currentTarget.style.background = 'linear-gradient(135deg, #ffffff 0%, #f0f4ff 100%)';
      }}
      onMouseLeave={(e: any) => {
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

      {/* Tag */}
      <div 
        className="tag" 
        style={{ 
          letterSpacing: '.6px', 
          fontWeight: 600,
          display: 'inline-block',
          padding: '6px 14px',
          background: 'linear-gradient(135deg, rgba(54, 129, 247, 0.1) 0%, rgba(139, 92, 246, 0.08) 100%)',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#3681f7',
          marginBottom: '16px',
          width: 'fit-content',
          textTransform: 'uppercase'
        }}
      >
        {tag}
      </div>

      {/* Title */}
      <h3 style={{ 
        fontSize: 18, 
        marginBottom: 10,
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
        {desc}
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
    </motion.article>
  );
}
