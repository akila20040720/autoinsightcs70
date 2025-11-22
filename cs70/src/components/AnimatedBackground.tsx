import { useEffect, useRef, useCallback } from 'react';

/* 
 * AnimatedBackground - Analytical network visualization with connected data nodes.
 * Modern futuristic design inspired by analytical dashboards.
 */
interface DataNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  connections: number[];
  pulsePhase: number;
}

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number>(0);
  const nodesRef = useRef<DataNode[]>([]);
  const scaleRef = useRef<number>(1);
  const animateRef = useRef<() => void>(() => {});
  const connectionDistance = 180;

  // Memoized resize handler
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const { innerWidth: width, innerHeight: height } = window;
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    scaleRef.current = scale;
    
    canvas.width = width * scale;
    canvas.height = height * scale;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
    }
  }, []);

  // Initialize data nodes
  const initNodes = useCallback((w: number, h: number) => {
    const nodeCount = Math.min(35, Math.floor(Math.sqrt(w * h) / 80));
    nodesRef.current = Array.from({ length: nodeCount }, () => ({
      x: (Math.random() * 0.8 + 0.1) * w,
      y: (Math.random() * 0.8 + 0.1) * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      radius: Math.random() * 3 + 2,
      connections: [],
      pulsePhase: Math.random() * Math.PI * 2,
    }));

    // Pre-calculate connections for nearby nodes
    nodesRef.current.forEach((node, i) => {
      node.connections = [];
      nodesRef.current.forEach((other, j) => {
        if (i !== j) {
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectionDistance) {
            node.connections.push(j);
          }
        }
      });
    });
  }, []);

  // Animation loop
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const scale = scaleRef.current;
    const w = canvas.width / scale;
    const h = canvas.height / scale;
    const nodes = nodesRef.current;
    
    frameRef.current++;
    ctx.clearRect(0, 0, w, h);

    // Update node positions
    nodes.forEach((node) => {
      node.x += node.vx;
      node.y += node.vy;
      node.pulsePhase += 0.02;

      // Bounce off edges
      if (node.x < node.radius || node.x > w - node.radius) {
        node.vx *= -0.8;
        node.x = Math.max(node.radius, Math.min(w - node.radius, node.x));
      }
      if (node.y < node.radius || node.y > h - node.radius) {
        node.vy *= -0.8;
        node.y = Math.max(node.radius, Math.min(h - node.radius, node.y));
      }

      // Recalculate connections dynamically
      node.connections = [];
      nodes.forEach((other, j) => {
        if (node !== other) {
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectionDistance) {
            node.connections.push(j);
          }
        }
      });
    });

    // Draw connections
    ctx.strokeStyle = 'rgba(52, 211, 235, 0.15)';
    ctx.lineWidth = 1;
    nodes.forEach((node, i) => {
      node.connections.forEach((j) => {
        const other = nodes[j];
        if (other && i < j) {
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const opacity = Math.max(0, 1 - dist / connectionDistance) * 0.3;
          
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(other.x, other.y);
          ctx.strokeStyle = `rgba(52, 211, 235, ${opacity})`;
          ctx.stroke();
        }
      });
    });

    // Draw data flow along connections
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
    ctx.lineWidth = 2;
    nodes.forEach((node, i) => {
      node.connections.forEach((j) => {
        const other = nodes[j];
        if (other && i < j && frameRef.current % 120 < 60) {
          const progress = (frameRef.current % 120) / 60;
          const dx = other.x - node.x;
          const dy = other.y - node.y;
          const flowX = node.x + dx * progress;
          const flowY = node.y + dy * progress;
          
          ctx.beginPath();
          ctx.arc(flowX, flowY, 2, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(59, 130, 246, 0.6)';
          ctx.fill();
        }
      });
    });

    // Draw nodes
    nodes.forEach((node) => {
      const pulse = 1 + Math.sin(node.pulsePhase) * 0.3;
      const currentRadius = node.radius * pulse;

      // Outer glow
      const gradient = ctx.createRadialGradient(
        node.x, node.y, 0,
        node.x, node.y, currentRadius * 3
      );
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
      gradient.addColorStop(0.5, 'rgba(52, 211, 235, 0.2)');
      gradient.addColorStop(1, 'rgba(52, 211, 235, 0)');
      
      ctx.beginPath();
      ctx.arc(node.x, node.y, currentRadius * 3, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Node core
      ctx.beginPath();
      ctx.arc(node.x, node.y, currentRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(147, 197, 253, 0.9)';
      ctx.fill();

      // Inner highlight
      ctx.beginPath();
      ctx.arc(node.x - currentRadius * 0.3, node.y - currentRadius * 0.3, currentRadius * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fill();
    });

    frameRef.current = requestAnimationFrame(animateRef.current);
  }, []);

  // Store animate function in ref inside useEffect

  useEffect(() => {
    // Store animate function in ref
    animateRef.current = animate;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initial setup
    handleResize();
    const scale = scaleRef.current;
    const w = canvas.width / scale;
    const h = canvas.height / scale;
    
    initNodes(w, h);
    frameRef.current = requestAnimationFrame(animateRef.current);

    // Event listeners
    window.addEventListener('resize', handleResize);
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(frameRef.current);
      } else {
        frameRef.current = requestAnimationFrame(animateRef.current);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cancelAnimationFrame(frameRef.current);
    };
  }, [handleResize, initNodes, animate]);

  return (
    <div className="analytical-background">
      <canvas 
        ref={canvasRef} 
        style={{ 
          display: 'block',
          width: '100%', 
          height: '100%' 
        }} 
      />
    </div>
  );
}