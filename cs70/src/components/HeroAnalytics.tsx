import { useEffect, useRef } from "react";

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export default function HeroAnalytics() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    type Node = { x: number; y: number; vx: number; vy: number; r: number };
    type Packet = { x: number; y: number; vx: number; vy: number; life: number; ttl: number };
    let nodes: Node[] = [];
    let packets: Packet[] = [];

    const resize = () => {
      const parent = canvas.parentElement as HTMLElement;
      const rect = parent.getBoundingClientRect();
      width = Math.max(320, Math.floor(rect.width));
      height = Math.max(240, Math.floor(rect.height));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const area = width * height;
      const target = clamp(Math.floor(area / 22000), 24, 48);
      nodes = Array.from({ length: target }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        r: Math.random() * 1.2 + 0.6,
      }));
      packets = [];
    };

    const spawnPacket = () => {
      if (!nodes.length) return;
      const a = nodes[(Math.random() * nodes.length) | 0];
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.6 + Math.random() * 0.8;
      packets.push({
        x: a.x,
        y: a.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        ttl: 2400 + Math.random() * 2400,
      });
      if (packets.length > 28) packets.shift();
    };

    let last = performance.now();
    const tick = (now: number) => {
      const dt = clamp((now - last), 0, 34);
      last = now;
      ctx.clearRect(0, 0, width, height);

      // Move nodes
      for (const n of nodes) {
        n.x += n.vx * dt;
        n.y += n.vy * dt;
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;
      }

      // Connections
      const maxDist = 140;
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < maxDist * maxDist) {
            const alpha = 0.18 * (1 - Math.sqrt(d2) / maxDist);
            ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Nodes
      for (const n of nodes) {
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Spawn packets occasionally
      if (Math.random() < 0.06) spawnPacket();

      // Move/Render packets
      for (let i = packets.length - 1; i >= 0; i--) {
        const p = packets[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life += dt * 16;
        if (p.x < -20 || p.x > width + 20 || p.y < -20 || p.y > height + 20 || p.life > p.ttl) {
          packets.splice(i, 1);
          continue;
        }
        const t = (Math.sin((now + i * 123) * 0.003) + 1) * 0.5; // soft twinkle
        ctx.fillStyle = `rgba(255,255,255,${(0.18 + 0.22 * t).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.6 + 0.6 * t, 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    const onVisibility = () => {
      if (document.hidden) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      } else {
        last = performance.now();
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    resize();
    last = performance.now();
    rafRef.current = requestAnimationFrame(tick);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}
    />
  );
}
