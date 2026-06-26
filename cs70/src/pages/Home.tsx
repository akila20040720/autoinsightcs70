import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import FuturisticHero3D from "../components/FuturisticHero3D";
import FeatureCard from "../components/FeatureCard";
import WhyChooseCard from "../components/WhyChooseCard";
import DataSourceCard from "../components/DataSourceCard";
import ChatbotButton from "../components/ChatbotButton";

import {
  TrendingUp,
  Search,
  BarChart3,
  Globe,
  DollarSign,
  Smartphone,
  CheckCircle2,
  Zap,
  Shield,
  Lightbulb,
} from "lucide-react";

import riyasewanaLogo from "../assets/logos/riyasewana.png";
import patpatLogo from "../assets/logos/patpat.png";
import ikmanLogo from "../assets/logos/ikman.png";
import cmtaLogo from "../assets/logos/cmta.png";

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Parallax and color blend transforms
  const heroOpacity = useTransform(smoothProgress, [0, 0.15], [1, 0.3]);
  const heroScale = useTransform(smoothProgress, [0, 0.15], [1, 0.95]);
  const heroY = useTransform(smoothProgress, [0, 0.15], [0, -50]);

  const section1Opacity = useTransform(smoothProgress, [0.1, 0.25], [0, 1]);
  const section1Y = useTransform(smoothProgress, [0.1, 0.25], [100, 0]);

  const section2Opacity = useTransform(smoothProgress, [0.25, 0.45], [0, 1]);
  const section2Y = useTransform(smoothProgress, [0.25, 0.45], [100, 0]);

  const section3Opacity = useTransform(smoothProgress, [0.45, 0.65], [0, 1]);
  const section3Y = useTransform(smoothProgress, [0.45, 0.65], [100, 0]);

  const section4Opacity = useTransform(smoothProgress, [0.65, 0.85], [0, 1]);
  const section4Y = useTransform(smoothProgress, [0.65, 0.85], [100, 0]);

  // Background color blending
  const bgColor = useTransform(
    smoothProgress,
    [0, 0.2, 0.4, 0.6, 0.8, 1],
    [
      "rgba(10, 10, 20, 1)",
      "rgba(20, 10, 30, 1)",
      "rgba(10, 20, 40, 1)",
      "rgba(30, 10, 35, 1)",
      "rgba(15, 25, 45, 1)",
      "rgba(10, 10, 20, 1)"
    ]
  );

  const gradientOverlay = useTransform(
    smoothProgress,
    [0, 0.3, 0.6, 1],
    [
      "radial-gradient(circle at 20% 50%, rgba(54, 129, 247, 0.15) 0%, transparent 50%)",
      "radial-gradient(circle at 80% 30%, rgba(247, 54, 129, 0.12) 0%, transparent 50%)",
      "radial-gradient(circle at 50% 70%, rgba(54, 247, 129, 0.10) 0%, transparent 50%)",
      "radial-gradient(circle at 30% 80%, rgba(129, 54, 247, 0.12) 0%, transparent 50%)"
    ]
  );

  const howItWorks = [
    { step: "1", title: "Data Collection", desc: "Automated collection from multiple vehicle market platforms in real-time." },
    { step: "2", title: "Data Processing", desc: "Advanced algorithms analyze and clean the collected vehicle data." },
    { step: "3", title: "Visualization", desc: "Interactive dashboards and charts to explore market trends." },
    { step: "4", title: "Insights", desc: "Get actionable insights on pricing, trends, and market activity." }
  ];

  const features = [
    { icon: <BarChart3 size={48} strokeWidth={1.5} color="#3681f7" />, title: "Real-Time Analytics", desc: "Monitor vehicle market trends and pricing in real-time with live data updates." },
    { icon: <Search size={48} strokeWidth={1.5} color="#3681f7" />, title: "Advanced Search", desc: "Find vehicles by make, model, price range, location, and more with powerful filters." },
    { icon: <TrendingUp size={48} strokeWidth={1.5} color="#3681f7" />, title: "Trend Analysis", desc: "Visualize market trends, price fluctuations, and popular models over time." },
    { icon: <Globe size={48} strokeWidth={1.5} color="#3681f7" />, title: "Regional Insights", desc: "Explore vehicle market activity across different regions in Sri Lanka." },
    { icon: <DollarSign size={48} strokeWidth={1.5} color="#3681f7" />, title: "Price Comparison", desc: "Compare prices across different platforms and sellers to make informed decisions." },
    { icon: <Smartphone size={48} strokeWidth={1.5} color="#3681f7" />, title: "Mobile Friendly", desc: "Access all features on any device with our responsive, mobile-optimized interface." }
  ];

  const whyChoose = [
    { icon: <CheckCircle2 size={48} strokeWidth={1.5} color="#3681f7" />, title: "Accurate Data", desc: "Verified data from trusted sources including CMTA and major marketplaces." },
    { icon: <Zap size={48} strokeWidth={1.5} color="#3681f7" />, title: "Fast Updates", desc: "Real-time data synchronization ensures you always have the latest information." },
    { icon: <Shield size={48} strokeWidth={1.5} color="#3681f7" />, title: "Secure & Reliable", desc: "Enterprise-grade security with 99.9% uptime guarantee." },
    { icon: <Lightbulb size={48} strokeWidth={1.5} color="#3681f7" />, title: "Smart Insights", desc: "AI-powered analytics provide deeper understanding of market dynamics." }
  ];

  const dataSources = [
    { name: "Riyasewana", url: "https://riyasewana.com", desc: "Leading vehicle marketplace in Sri Lanka providing comprehensive listings.", icon: <img src={riyasewanaLogo} alt="Riyasewana" className="w-8 h-8 object-contain" style={{ width: 32, height: 32 }} /> },
    { name: "Patpat.lk", url: "https://patpat.lk", desc: "Popular platform for buying and selling vehicles with verified listings.", icon: <img src={patpatLogo} alt="Patpat.lk" className="w-8 h-8 object-contain" style={{ width: 32, height: 32 }} /> },
    { name: "Ikman.lk", url: "https://ikman.lk", desc: "Multi-category marketplace including extensive vehicle listings.", icon: <img src={ikmanLogo} alt="Ikman.lk" className="w-8 h-8 object-contain" style={{ width: 32, height: 32 }} /> },
    { name: "CMTA", url: "https://cmta.lk", desc: "Ceylon Motor Traders Association - Official industry data and statistics.", icon: <img src={cmtaLogo} alt="CMTA" className="w-8 h-8 object-contain" style={{ width: 32, height: 32 }} /> }
  ];

  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>(".full-section");
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("section-in-view");
          } else {
            entry.target.classList.remove("section-in-view");
          }
        });
      },
      { threshold: 0.35 }
    );

    sections.forEach((section, index) => {
      if (!section.getAttribute("data-scroll-direction")) {
        section.setAttribute("data-scroll-direction", index % 2 === 0 ? "left" : "right");
      }
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Dynamic Background */}
      <motion.div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: bgColor,
          zIndex: 0,
          transition: 'background-color 0.3s ease'
        }}
      />
      
      <motion.div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: gradientOverlay,
          zIndex: 1,
          pointerEvents: 'none'
        }}
      />

      {/* Scroll Progress Indicator */}
      <motion.div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, #3681f7, #7c3aed, #3681f7)',
          transformOrigin: '0% 50%',
          scaleX: smoothProgress,
          zIndex: 1000,
          boxShadow: '0 0 20px rgba(54, 129, 247, 0.5)'
        }}
      />

      {/* Hero Section with Parallax */}
      <motion.div
        style={{
          opacity: heroOpacity,
          scale: heroScale,
          y: heroY,
          position: 'relative',
          zIndex: 2
        }}
      >
        <FuturisticHero3D />
      </motion.div>

      {/* How It Works Section */}
      <motion.section 
        className="full-section section-how-it-works"
        style={{
          opacity: section1Opacity,
          y: section1Y,
          position: 'relative',
          zIndex: 2,
          padding: '80px 24px',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, rgba(10, 10, 20, 0.8) 0%, rgba(20, 10, 30, 0.6) 100%)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 48, position: 'relative', zIndex: 1 }}>
          <motion.h2 
            style={{ 
              fontSize: 48, 
              marginBottom: 16, 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #3681f7, #7c3aed)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            How It Works
          </motion.h2>
          <motion.p 
            style={{ 
              color: 'rgba(255, 255, 255, 0.8)', 
              fontSize: 18, 
              maxWidth: 600, 
              margin: '0 auto', 
              fontWeight: 400 
            }}
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Get insights into the vehicle market in just four simple steps
          </motion.p>
        </div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, position: 'relative', zIndex: 1 }}>
          {howItWorks.map((item, i) => (
            <motion.div
              key={i}
              className="project"
              style={{ 
                color: '#ffffff',
                textAlign: 'center', 
                padding: '32px 24px',
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.3s ease'
              }}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ 
                y: -10, 
                scale: 1.05, 
                boxShadow: '0 12px 40px rgba(54, 129, 247, 0.3)',
                borderColor: 'rgba(54, 129, 247, 0.3)'
              }}
            >
              <div 
                style={{ 
                  width: 70, 
                  height: 70, 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, rgba(54, 129, 247, 0.2), rgba(124, 58, 237, 0.2))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                  fontWeight: 700,
                  color: '#3681f7',
                  margin: '0 auto 20px',
                  border: '2px solid rgba(54, 129, 247, 0.3)',
                  transition: 'all 0.3s ease'
                }}
              >
                {item.step}
              </div>
              <h3 style={{ fontSize: 20, marginBottom: 12, fontWeight: 600, color: '#ffffff' }}>{item.title}</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 15, lineHeight: 1.6 }}>{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section 
        className="full-section section-features"
        style={{
          opacity: section2Opacity,
          y: section2Y,
          position: 'relative',
          zIndex: 2,
          padding: '80px 24px',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, rgba(20, 10, 30, 0.6) 0%, rgba(10, 20, 40, 0.8) 100%)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 48, position: 'relative', zIndex: 1 }}>
          <motion.h2 
            style={{ 
              fontSize: 48, 
              marginBottom: 16, 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #7c3aed, #3681f7)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Everything You Need in One Place
          </motion.h2>
          <motion.p 
            style={{ 
              color: 'rgba(255, 255, 255, 0.8)', 
              fontSize: 18, 
              maxWidth: 600, 
              margin: '0 auto' 
            }}
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Comprehensive features designed to give you complete control over vehicle market analysis
          </motion.p>
        </div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, position: 'relative', zIndex: 1 }}>
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50, rotateX: -15 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              whileHover={{ 
                y: -10,
                scale: 1.03,
                transition: { duration: 0.2 }
              }}
            >
              <FeatureCard
                icon={feature.icon}
                title={feature.title}
                description={feature.desc}
              />
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Why Choose Section */}
      <motion.section 
        className="full-section section-why-choose"
        style={{
          opacity: section3Opacity,
          y: section3Y,
          position: 'relative',
          zIndex: 2,
          padding: '80px 24px',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, rgba(10, 20, 40, 0.8) 0%, rgba(30, 10, 35, 0.6) 100%)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 48, position: 'relative', zIndex: 1 }}>
          <motion.h2 
            style={{ 
              fontSize: 48, 
              marginBottom: 16, 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #3681f7, #06b6d4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Why Choose AutoInsight
          </motion.h2>
          <motion.p 
            style={{ 
              color: 'rgba(255, 255, 255, 0.8)', 
              fontSize: 18, 
              maxWidth: 600, 
              margin: '0 auto' 
            }}
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Trusted by thousands of users for accurate, real-time vehicle market insights
          </motion.p>
        </div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24, position: 'relative', zIndex: 1 }}>
          {whyChoose.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
              whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15, type: "spring", stiffness: 100 }}
              whileHover={{ 
                scale: 1.08, 
                rotateY: 5, 
                z: 50,
                transition: { duration: 0.2 }
              }}
              style={{ perspective: '1000px' }}
            >
              <WhyChooseCard
                icon={item.icon}
                title={item.title}
                description={item.desc}
                delay={0}
              />
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Data Sources Section */}
      <motion.section 
        className="full-section section-data-sources"
        style={{
          opacity: section4Opacity,
          y: section4Y,
          position: 'relative',
          zIndex: 2,
          padding: '80px 24px',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, rgba(30, 10, 35, 0.6) 0%, rgba(15, 25, 45, 0.8) 100%)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 48, position: 'relative', zIndex: 1 }}>
          <motion.h2 
            style={{ 
              fontSize: 48, 
              marginBottom: 16, 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #06b6d4, #3681f7)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Our Data Sources
          </motion.h2>
          <motion.p 
            style={{ 
              color: 'rgba(255, 255, 255, 0.8)', 
              fontSize: 18, 
              maxWidth: 600, 
              margin: '0 auto',
              fontWeight: 400 
            }}
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            We credit and acknowledge our trusted data partners who make AutoInsight possible
          </motion.p>
        </div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24, position: 'relative', zIndex: 1 }}>
          {dataSources.map((source, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: (i % 2 === 0 ? -1 : 1) * 50, y: 50 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15, type: "spring", stiffness: 80 }}
              whileHover={{ 
                y: -8, 
                rotate: 2,
                transition: { duration: 0.2 }
              }}
            >
              <DataSourceCard
                name={source.name}
                url={source.url}
                description={source.desc}
                delay={0}
                icon={source.icon}
              />
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Chatbot Button */}
      <ChatbotButton />

      {/* Custom CSS for smooth scrolling and animations */}
      <style>{`
        html {
          scroll-behavior: smooth;
        }
        
        body {
          margin: 0;
          padding: 0;
          background: #0a0a14;
          color: #ffffff;
          overflow-x: hidden;
        }

        .full-section {
          position: relative;
          z-index: 2;
          will-change: transform, opacity;
        }

        .full-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 50% 50%, rgba(54, 129, 247, 0.03) 0%, transparent 70%);
          pointer-events: none;
        }

        .grid {
          display: grid;
          max-width: 1200px;
          margin: 0 auto;
          gap: 24px;
        }

        /* Scrollbar styling */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }

        ::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #3681f7, #7c3aed);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #4a8ff7, #8a4aed);
        }

        /* Smooth transitions */
        .project, .feature-card, .why-choose-card, .data-source-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Glow effects */
        .section-how-it-works .project:hover {
          box-shadow: 0 0 40px rgba(54, 129, 247, 0.15);
        }

        /* Floating particles effect */
        .full-section::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: radial-gradient(2px 2px at 20px 30px, rgba(255, 255, 255, 0.1), transparent),
                            radial-gradient(2px 2px at 40px 70px, rgba(255, 255, 255, 0.08), transparent),
                            radial-gradient(2px 2px at 50px 160px, rgba(255, 255, 255, 0.1), transparent),
                            radial-gradient(2px 2px at 90px 40px, rgba(255, 255, 255, 0.08), transparent);
          background-size: 200px 200px;
          pointer-events: none;
          opacity: 0.5;
        }

        @media (max-width: 768px) {
          .full-section {
            padding: 60px 16px !important;
          }
          
          .grid {
            gap: 16px;
          }
          
          .section-how-it-works h2,
          .section-features h2,
          .section-why-choose h2,
          .section-data-sources h2 {
            font-size: 32px !important;
          }
        }
      `}</style>
    </div>
  );
}