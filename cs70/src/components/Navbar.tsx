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
  const isAboutPage = location.pathname === "/about";

  return (
    <header
      className={`navbar ${isAboutPage ? "" : "navbar-animated"} ${scrolled ? "scrolled" : ""}`}
      style={{
        position: "fixed",
        inset: "0 0 auto 0",
        height: "88px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 60,
        background: "transparent",
        borderBottom: (scrolled && !isAboutPage) ? "1px solid rgba(0,0,0,0.06)" : "1px solid transparent",
        transition: "border-color 0.35s cubic-bezier(0.25, 0.9, 0.25, 1)",
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
            minWidth: "fit-content",
            padding: "0",
          }}
        >
          <img 
            src="/assets/AutoInsightLogo.png" 
            alt="AutoInsight Logo" 
            className="navbar-logo"
            style={{ height: "64px", width: "auto" }}
          />
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
                  color: scrolled
                    ? (isActive(item.path) ? "#023e8a" : "#0b0c10")
                    : (isActive(item.path) ? "#ffffff" : "rgba(255,255,255,0.92)"),
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
                      background: scrolled
                        ? "linear-gradient(135deg, #023e8a 0%, #0077B6 100%)"
                        : "linear-gradient(135deg, #CAF0F8 0%, #90E0EF 100%)",
                      borderRadius: "2px",
                      boxShadow: scrolled ? "0 4px 12px rgba(0, 119, 182, 0.25)" : "0 4px 12px rgba(255,255,255,0.35)",
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
              background: scrolled
                ? "linear-gradient(135deg, #023e8a 0%, #0077B6 100%)"
                : "rgba(202,240,248,0.92)",
              color: scrolled ? "#ffffff" : "#03045e",
              padding: "10px 24px",
              borderRadius: "24px",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "14px",
              boxShadow: scrolled ? "0 6px 18px rgba(0, 119, 182, 0.35)" : "0 6px 18px rgba(255,255,255,0.25)",
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
              ? "rgba(255,255,255,0.75)"
              : "rgba(202,240,248,0.18)",
            border: scrolled
              ? "1px solid rgba(0,0,0,0.08)"
              : "1px solid rgba(144,224,239,0.35)",
            color: scrolled ? "#023e8a" : "#CAF0F8",
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
                top: "88px",
                left: "24px",
                right: "24px",
                background: scrolled
                  ? "rgba(255,255,255,0.96)"
                  : "rgba(32,36,48,0.85)",
                backdropFilter: "blur(20px) saturate(160%)",
                WebkitBackdropFilter: "blur(20px) saturate(160%)",
                border: scrolled
                  ? "1px solid rgba(0,0,0,0.08)"
                  : "1px solid rgba(144,224,239,0.25)",
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
                        color: scrolled
                          ? (isActive(item.path) ? "#023e8a" : "#0b0c10")
                          : (isActive(item.path) ? "#CAF0F8" : "rgba(202,240,248,0.92)"),
                        textDecoration: "none",
                        fontSize: "15px",
                        fontWeight: 500,
                        transition: "all 0.3s ease",
                        position: "relative",
                        background: isActive(item.path)
                          ? scrolled
                            ? "rgba(0, 119, 182, 0.12)"
                            : "rgba(144,224,239,0.15)"
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
                  style={{ marginTop: "8px", borderTop: scrolled ? "1px solid rgba(0, 119, 182, 0.15)" : "1px solid rgba(0, 150, 199, 0.1)", paddingTop: "8px" }}
                >
                  <Link
                    to="/contact"
                    onClick={() => setOpen(false)}
                    style={{
                      display: "block",
                      padding: "12px 16px",
                      borderRadius: "12px",
                      background: scrolled
                        ? "linear-gradient(135deg, #023e8a 0%, #0077B6 100%)"
                        : "rgba(202,240,248,0.9)",
                      color: scrolled ? "#ffffff" : "#03045e",
                      textDecoration: "none",
                      fontSize: "15px",
                      fontWeight: 600,
                      textAlign: "center",
                      boxShadow: scrolled ? "0 6px 18px rgba(54, 129, 247, 0.3)" : "0 6px 18px rgba(255,255,255,0.25)",
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

