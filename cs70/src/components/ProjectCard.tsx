
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
      whileHover={{ scale: 1.04 }}
      transition={{ type: "spring", stiffness: 300 }}
      role="article"
    >
      <div className="tag" style={{ letterSpacing:'.6px', fontWeight:600 }}>{tag}</div>
      <h3 style={{ fontSize: 18, marginBottom: 8 }}>{title}</h3>
      <p style={{ color: '#0b0c10', fontSize: 14 }}>{desc}</p>
    </motion.article>
  );
}
