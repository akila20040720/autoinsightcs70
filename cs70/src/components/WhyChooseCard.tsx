
import { motion } from "framer-motion";
import { useInView } from "../hooks/useInView";

interface WhyChooseCardProps {
  icon: string;
  title: string;
  description: string;
  delay?: number;
}

export default function WhyChooseCard({ icon, title, description, delay = 0 }: WhyChooseCardProps) {
  const { ref, inView } = useInView<HTMLDivElement>();
  
  return (
    <motion.div
      ref={ref}
      className="project scroll-fade why-vibrant"
      style={{ textAlign: 'center', padding: '34px 26px', position:'relative', overflow:'hidden' }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.08 }}
    >
      <div style={{
        fontSize: 44,
        marginBottom: 18,
        display: 'inline-flex',
        padding: '18px',
        borderRadius: '50%',
        background: 'linear-gradient(145deg,#f9d97c 0%, #3681f7 60%)',
        boxShadow: '0 10px 32px -8px rgba(249,217,124,0.6), 0 4px 18px -6px rgba(54,129,247,0.4)',
        color: '#0f172a'
      }}>{icon}</div>
      <h3 style={{ fontSize: 20, marginBottom: 12, fontWeight: 600, color:'#0b0c10' }}>{title}</h3>
      <p style={{ color: '#0b0c10', fontSize: 15, lineHeight: 1.6 }}>{description}</p>
    </motion.div>
  );
}
//implemented

