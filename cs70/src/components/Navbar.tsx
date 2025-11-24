import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const location = useLocation();

  // Track scroll position
  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 10);
    }
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!open) return;
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function handleResize() {
      if (window.innerWidth > 768 && open) {
        setOpen(false);
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

  const navItems = [
    { label: "Home", path: "/" },
    { label: "About", path: "/about" },
    { label: "Features", path: "/features" },
    { label: "FAQ", path: "/faq" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header
      className={`navbar ${scrolled ? "scrolled" : ""}`}
      style={{
        position: "fixed",
        inset: "0 0 auto 0",
        height: "72px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 60,
        backdropFilter: "blur(12px) saturate(160%)",
        WebkitBackdropFilter: "blur(12px) saturate(160%)",
        background: scrolled
          ? "rgba(15, 17, 21, 0.85)"
          : "rgba(255, 255, 255, 0.7)",
        borderBottom: scrolled
          ? "1px solid rgba(54, 129, 247, 0.15)"
          : "1px solid rgba(0, 0, 0, 0.08)",
        transition: "all 0.3s cubic-bezier(0.25, 0.9, 0.25, 1)",
      }}
    >
      <div
        style={{
          maxWidth: "1120px",
          width: "100%",
          padding: "0 24px",
          display: "flex",
          gap: "24px",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
        }}
      >
        {/* Logo */}
        <Link
          to="/"
          style={{
            fontWeight: 700,
            fontSize: "18px",
            letterSpacing: "-0.5px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
            transition: "all 0.3s ease",
            background: "linear-gradient(135deg, #3681f7 0%, #8b5cf6 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            minWidth: "fit-content",
            color: "transparent",
          }}
        >
          AutoInsight
        </Link>

        {/* Desktop Navigation */}
        <nav
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
            fontSize: "15px",
            fontWeight: 500,
          }}
          aria-label="Top Navigation"
          className="desktop-nav"
        >
          {navItems.map((item) => (
            <div key={item.path} style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <Link
                to={item.path}
                style={{
                  position: "relative",
                  color: isActive(item.path)
                    ? "#3681f7"
                    : scrolled
                      ? "#d5dae1"
                      : "#3a3d43",
                  textDecoration: "none",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  transition: "all 0.3s cubic-bezier(0.25, 0.9, 0.25, 1)",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {item.label}
              </Link>
              <AnimatePresence mode="wait">
                {isActive(item.path) && (
                  <motion.div
                    key={`indicator-${item.path}`}
                    style={{
                      position: "absolute",
                      bottom: "2px",
                      left: "16px",
                      right: "16px",
                      height: "3px",
                      background: "linear-gradient(135deg, #3681f7 0%, #8b5cf6 100%)",
                      borderRadius: "2px",
                      boxShadow: "0 4px 12px rgba(54, 129, 247, 0.4)",
                    }}
                    initial={{ opacity: 0, scaleX: 0.8 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    exit={{ opacity: 0, scaleX: 0.8 }}
                    transition={{
                      type: "spring" as const,
                      stiffness: 300,
                      damping: 25,
                    }}
                  />
                )}
              </AnimatePresence>
            </div>
          ))}

          {/* Contact CTA Button */}
          <Link
            to="/contact"
            style={{
              background: "linear-gradient(135deg, #3681f7 0%, #8b5cf6 100%)",
              color: "#ffffff",
              padding: "10px 24px",
              borderRadius: "24px",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "14px",
              boxShadow: "0 6px 18px rgba(54, 129, 247, 0.35)",
              transition: "all 0.3s cubic-bezier(0.25, 0.9, 0.25, 1)",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              marginLeft: "8px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            Contact →
          </Link>
        </nav>

        {/* Mobile Menu Toggle */}
        <button
          ref={buttonRef}
          type="button"
          className="mobile-menu-toggle"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-haspopup="true"
          onClick={() => setOpen((o) => !o)}
          style={{
            background: scrolled
              ? "rgba(54, 129, 247, 0.15)"
              : "rgba(54, 129, 247, 0.08)",
            border: scrolled
              ? "1px solid rgba(54, 129, 247, 0.3)"
              : "1px solid rgba(54, 129, 247, 0.2)",
            color: scrolled ? "#ffffff" : "#0b0c10",
            width: "44px",
            height: "44px",
            borderRadius: "12px",
            fontSize: "20px",
            transition: "all 0.3s cubic-bezier(0.25, 0.9, 0.25, 1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <motion.span
            animate={{ rotate: open ? 90 : 0 }}
            transition={{ duration: 0.3, type: "spring" as const, stiffness: 400, damping: 25 }}
            style={{ display: "flex", alignItems: "center" }}
          >
            {open ? "✕" : "☰"}
          </motion.span>
        </button>

        {/* Mobile Navigation Panel */}
        <AnimatePresence>
          {open && (
            <motion.div
              ref={panelRef}
              className="mobile-nav-panel"
              role="dialog"
              aria-label="Mobile navigation"
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{
                duration: 0.3,
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
              style={{
                position: "absolute",
                top: "72px",
                left: "24px",
                right: "24px",
                background: scrolled
                  ? "rgba(26, 29, 46, 0.95)"
                  : "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(20px) saturate(160%)",
                WebkitBackdropFilter: "blur(20px) saturate(160%)",
                border: scrolled
                  ? "1px solid rgba(54, 129, 247, 0.2)"
                  : "1px solid rgba(54, 129, 247, 0.15)",
                borderRadius: "16px",
                padding: "20px",
                boxShadow: "0 20px 50px rgba(0, 0, 0, 0.15)",
                zIndex: 90,
              }}
            >
              <ul
                style={{
                  listStyle: "none",
                  margin: 0,
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                {navItems.map((item, i) => (
                  <motion.li
                    key={item.path}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      to={item.path}
                      onClick={() => setOpen(false)}
                      style={{
                        display: "block",
                        padding: "12px 16px",
                        borderRadius: "12px",
                        color: isActive(item.path)
                          ? "#3681f7"
                          : scrolled
                            ? "#d5dae1"
                            : "#3a3d43",
                        textDecoration: "none",
                        fontSize: "15px",
                        fontWeight: 500,
                        transition: "all 0.3s ease",
                        position: "relative",
                        background: isActive(item.path)
                          ? scrolled
                            ? "rgba(54, 129, 247, 0.15)"
                            : "rgba(54, 129, 247, 0.08)"
                          : "transparent",
                      }}
                    >
                      {item.label}
                    </Link>
                  </motion.li>
                ))}

                {/* Mobile Contact CTA */}
                <motion.li
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: navItems.length * 0.05 }}
                  style={{ marginTop: "8px", borderTop: scrolled ? "1px solid rgba(54, 129, 247, 0.15)" : "1px solid rgba(54, 129, 247, 0.1)", paddingTop: "8px" }}
                >
                  <Link
                    to="/contact"
                    onClick={() => setOpen(false)}
                    style={{
                      display: "block",
                      padding: "12px 16px",
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, #3681f7 0%, #8b5cf6 100%)",
                      color: "#ffffff",
                      textDecoration: "none",
                      fontSize: "15px",
                      fontWeight: 600,
                      textAlign: "center",
                      boxShadow: "0 6px 18px rgba(54, 129, 247, 0.3)",
                      transition: "all 0.3s ease",
                    }}
                  >
                    Contact Support
                  </Link>
                </motion.li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

