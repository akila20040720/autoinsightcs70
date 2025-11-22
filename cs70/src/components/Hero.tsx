import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface HeroProps {
  center?: boolean;
}
export default function Hero({ center }: HeroProps) {
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      // Use requestAnimationFrame for performance
      const y = window.scrollY || window.pageYOffset;
      setScrollY(y);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const parallaxStyle: React.CSSProperties = {
    transform: `translateY(${scrollY * -0.08}px)`,
  };

  return (
    <section className={`hero container${center ? " centered" : ""}`}>
      <div className="parallax-hero" data-parallax style={parallaxStyle}>
        <div className="kicker">Introducing</div>
        <motion.h1
          className="h-title glow-title"
          initial={{ y: 28, opacity: 0, scale:0.94 }}
          animate={{ y: 0, opacity: 1, scale:1 }}
          transition={{ duration: 0.9, ease: [0.25,0.9,0.25,1] }}
        >
          Driving Data Into Insights
        </motion.h1>

        <motion.p
          className="h-desc"
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.12, duration: 0.6 }}
        >
          AutoInsight is a web-based system developed to analyze and visualize
          vehicle market data in Sri Lanka. The project aims to provide
          real-time insights into vehicle pricing trends, popular models, and
          regional market activity using data collected from online platforms
          such as Riyasewana, Patpat.lk, and Ikman.lk, as well as official data
          from the Ceylon Motor Traders Association (CMTA).
        </motion.p>

        <div style={{ display: "flex", gap: 14, marginTop: 26, justifyContent: center ? 'center' : 'flex-start', flexWrap: 'wrap' }}>
          <a className="cta" href="/contact">
            Get started
          </a>
          <a
            className="button-outline"
            href="#projects"
            style={{
              color: "#cdd6e6",
              border: "1px solid rgba(255,255,255,0.04)",
              padding: "10px 14px",
              borderRadius: 10,
            }}
          >
            See projects
          </a>
        </div>

        <div className="grid" id="projects" style={{ marginTop: 34 }}>
          {/* small preview projects — r</a>eplace with your project data */}
        </div>
      </div>

      <aside className="scroll-fade" style={{ transitionDelay: ".2s" }}>
        <div className="card fx tilt" aria-hidden>
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 12,
                background: "linear-gradient(135deg,#06b6d4,#8b5cf6)",
              }}
            />
            <div>
              <div style={{ color: "#cdd6e6", fontSize: 13 }}>Featured</div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>
                Info Blynq — Template
              </div>
            </div>
          </div>

          <p style={{ color: "#c2cbe0", marginBottom: 14 }}>
            A minimal info site with cards, a projects grid and simple
            navigation. Use this template to present your project elegantly.
          </p>

          <a
            className="button-outline"
            href="/about"
            style={{ display: "inline-block" }}
          >
            Learn more
          </a>

          <div style={{ marginTop: 18, fontSize: 13, color: "#9fb0c9" }}>
            Project brief:{" "}
            <a
              href="/mnt/data/SDGP CW 1 - Design and Documentation Template and Guidelines (3).docx"
              style={{ color: "#cfeffd" }}
            >
              Open brief
            </a>
          </div>
        </div>
      </aside>
    </section>
  );
}
