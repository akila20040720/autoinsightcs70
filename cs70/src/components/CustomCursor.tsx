import React, { useEffect, useRef } from "react";

// Animated blue custom cursor with trailing smooth motion and click ripple
// Hides native cursor by adding a class to <body> and positions a custom element following pointer.
const CustomCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const target = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const current = useRef({ x: target.current.x, y: target.current.y });
  const raf = useRef<number | null>(null);

  useEffect(() => {
    document.body.classList.add("custom-cursor-enabled");

    const handleMove = (e: MouseEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
      if (!raf.current) raf.current = requestAnimationFrame(tick);
    };

    const handleDown = () => {
      if (!cursorRef.current) return;
      cursorRef.current.classList.add("active");
      // ripple
      const ripple = document.createElement("span");
      ripple.className = "cursor-ripple";
      cursorRef.current.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    };

    const handleUp = () => {
      cursorRef.current?.classList.remove("active");
    };

    const enlargeOnHover = (e: Event) => {
      const el = e.target as HTMLElement;
      if (!el) return;
      if (matchesInteractive(el)) cursorRef.current?.classList.add("hovering");
    };
    const shrinkOnLeave = () => cursorRef.current?.classList.remove("hovering");

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mousedown", handleDown);
    window.addEventListener("mouseup", handleUp);
    document.addEventListener("mouseover", enlargeOnHover);
    document.addEventListener("mouseout", shrinkOnLeave);

    return () => {
      document.body.classList.remove("custom-cursor-enabled");
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mousedown", handleDown);
      window.removeEventListener("mouseup", handleUp);
      document.removeEventListener("mouseover", enlargeOnHover);
      document.removeEventListener("mouseout", shrinkOnLeave);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  const matchesInteractive = (el: HTMLElement) => {
    return (
      el.closest(
        "a,button,.cta,input,textarea,select,[role='button'],[onclick],label"
      ) !== null
    );
  };

  const tick = () => {
    // Smooth follow (lerp) - increased speed for more responsiveness
    const speed = 0.35; // increased from 0.18 for faster response
    current.current.x += (target.current.x - current.current.x) * speed;
    current.current.y += (target.current.y - current.current.y) * speed;
    if (cursorRef.current) {
      // Use translate3d for hardware acceleration
      cursorRef.current.style.transform = `translate3d(${current.current.x}px, ${current.current.y}px, 0)`;
    }
    // Continue until close enough - tighter threshold for better tracking
    const dx = Math.abs(target.current.x - current.current.x);
    const dy = Math.abs(target.current.y - current.current.y);
    if (dx < 0.3 && dy < 0.3) {
      raf.current = null;
    } else {
      raf.current = requestAnimationFrame(tick);
    }
  };

  return <div ref={cursorRef} className="custom-cursor" />;
};

export default CustomCursor;