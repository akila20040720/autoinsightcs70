import { useEffect, useRef } from 'react';

// Adds interactive tilt effect based on pointer position.
export function useTilt(maxTilt: number = 10) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const dx = (x - cx) / cx;
      const dy = (y - cy) / cy;
      const tiltX = dy * maxTilt;
      const tiltY = -dx * maxTilt;
      el.style.transform = `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
    };
    const reset = () => { if (el) el.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg)'; };
    el.addEventListener('mousemove', handleMove);
    el.addEventListener('mouseleave', reset);
    return () => {
      el.removeEventListener('mousemove', handleMove);
      el.removeEventListener('mouseleave', reset);
    };
  }, [maxTilt]);
  return ref;
}
