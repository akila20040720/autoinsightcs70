
import { motion } from "framer-motion";
import { useInView } from "../hooks/useInView";

interface RatingProps {
  stars: number;
  review: string;
  author: string;
  role: string;
  delay?: number;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} style={{ fontSize: 18, color: star <= rating ? '#f9d97c' : 'var(--text-mute)' }}>
          ★
        </span>
      ))}
    </div>
  );
}

export default function RatingCard({ stars, review, author, role, delay = 0 }: RatingProps) {
  const { ref, inView } = useInView<HTMLDivElement>();
  
  return (
    <motion.div
      ref={ref}
      className="project scroll-fade rating-vibrant"
      style={{ padding: '30px 26px', background:'#ffffff', border:'1px solid rgba(0,0,0,0.08)', boxShadow:'0 8px 22px -6px rgba(0,0,0,0.15)' }}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
    >
      <StarRating rating={stars} />
      <p style={{ color: '#0b0c10', fontSize: 15, lineHeight: 1.7, marginBottom: 16, fontStyle: 'italic' }}>
        "{review}"
      </p>
      <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, color:'#0b0c10' }}>{author}</div>
        <div style={{ color: '#0b0c10', fontSize: 13, opacity:.75 }}>{role}</div>
      </div>
    </motion.div>
  );
}

