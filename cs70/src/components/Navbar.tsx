import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

// Accessible three-dot mobile menu (ellipsis) that reveals navigation when tapped.
// Hides the standard nav links below a breakpoint and provides an animated panel.
// Panel closes on outside click or Escape key.

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!open) return;
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function handleResize() {
      if (window.innerWidth > 780 && open) {
        setOpen(false); // auto-hide menu when switching to desktop view
      }
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    window.addEventListener("resize", handleResize);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
      window.removeEventListener("resize", handleResize);
    };
  }, [open]);

  return (
    <header className="navbar">
      <div className="inner">
        <div className="brand">AutoInsight</div>
        <nav className="nav-links" aria-label="Top Navigation">
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/services">Services</Link>
          <Link to="/faq">FAQ</Link>
          <Link to="/contact" className="cta">Contact</Link>
        </nav>
        <button
          type="button"
          className="menu-toggle"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-haspopup="true"
          onClick={() => setOpen(o => !o)}
        >
          <span aria-hidden="true" className="dots">⋯</span>
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              ref={panelRef}
              className="mobile-nav-panel"
              role="dialog"
              aria-label="Mobile navigation"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.25, ease: [0.25,0.9,0.25,1] }}
            >
              <ul className="mobile-nav-list">
                <li><Link to="/" onClick={() => setOpen(false)}>Home</Link></li>
                <li><Link to="/about" onClick={() => setOpen(false)}>About</Link></li>
                <li><Link to="/services" onClick={() => setOpen(false)}>Services</Link></li>
                <li><Link to="/faq" onClick={() => setOpen(false)}>FAQ</Link></li>
                <li><Link to="/contact" onClick={() => setOpen(false)}>Contact</Link></li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
