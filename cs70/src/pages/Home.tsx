import { useEffect } from "react";
import { motion } from "framer-motion";
import FuturisticHero3D from "../components/FuturisticHero3D";
import ProjectCard from "../components/ProjectCard";
import FeatureCard from "../components/FeatureCard";
import WhyChooseCard from "../components/WhyChooseCard";
import RatingCard from "../components/RatingSystem";
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
  const projects = [
    { title: "Project Dashboard", tag: "Dashboard", desc: "Interactive analytics UI with clean layout." },
    { title: "Marketing Site", tag: "Website", desc: "Landing pages, hero sections and documentation." },
    { title: "Design System", tag: "Design", desc: "Tokens, components and motion guidelines." },
    { title: "Task Manager", tag: "App", desc: "Productivity app with clear affordances." }
  ];

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

  const ratings = [
    { stars: 5, review: "AutoInsight has transformed how I research vehicle prices. The data is always up-to-date and the interface is intuitive.", author: "Kasun Perera", role: "Car Buyer" },
    { stars: 5, review: "As a dealer, this platform helps me understand market trends better. The regional insights are particularly valuable.", author: "Nimal Fernando", role: "Vehicle Dealer" },
    { stars: 5, review: "Excellent tool for market research. The visualization features make it easy to spot trends and opportunities.", author: "Samantha Jayasuriya", role: "Market Analyst" }
  ];

  const dataSources = [
    { name: "Riyasewana", url: "https://riyasewana.com", desc: "Leading vehicle marketplace in Sri Lanka providing comprehensive listings.", icon: <img src={riyasewanaLogo} alt="Riyasewana" className="w-8 h-8 object-contain" style={{ width: 32, height: 32 }} /> },
    { name: "Patpat.lk", url: "https://patpat.lk", desc: "Popular platform for buying and selling vehicles with verified listings.", icon: <img src={patpatLogo} alt="Patpat.lk" className="w-8 h-8 object-contain" style={{ width: 32, height: 32 }} /> },
    { name: "Ikman.lk", url: "https://ikman.lk", desc: "Multi-category marketplace including extensive vehicle listings.", icon: <img src={ikmanLogo} alt="Ikman.lk" className="w-8 h-8 object-contain" style={{ width: 32, height: 32 }} /> },
    { name: "CMTA", url: "https://cmta.lk", desc: "Ceylon Motor Traders Association - Official industry data and statistics.", icon: <img src={cmtaLogo} alt="CMTA" className="w-8 h-8 object-contain" style={{ width: 32, height: 32 }} /> }
  ];

  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>(".full-section");
    if (!sections.length) {
      return;
    }

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
    <>
      <FuturisticHero3D />

      {/* How It Works Section */}
      <motion.section 
        className="full-section section-how-it-works"
      >
        <div style={{ textAlign: 'center', marginBottom: 48, position: 'relative', zIndex: 1 }}>
          <motion.h2 
            style={{ fontSize: 36, marginBottom: 16, fontWeight: 700 }}
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            How It Works
          </motion.h2>
          <motion.p 
            style={{ color: '#0b0c10', fontSize: 18, maxWidth: 600, margin: '0 auto', fontWeight: 500 }}
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
                color: '#0b0c10',
                textAlign: 'center', 
                padding: '32px 24px',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(54, 129, 247, 0.2)',
                boxShadow: '0 8px 24px rgba(54, 129, 247, 0.1)'
              }}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
            
              whileHover={{ y: -10, scale: 1.05, boxShadow: '0 12px 32px rgba(54, 129, 247, 0.2)' }}
            >
              <div 
                style={{ 
                  width: 70, 
                  height: 70, 
                  borderRadius: '50%', 
                  background: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                  fontWeight: 700,
                  color: '#0077B6',
                  margin: '0 auto 20px',
                  border: '2px solid #0077B6'
                }}
              >
                {item.step}
              </div>
              <h3 style={{ fontSize: 20, marginBottom: 12, fontWeight: 600, color: 'var(--primary)' }}>{item.title}</h3>
              <p style={{ color: "var(--sys-gray)", fontSize: 15, lineHeight: 1.6 }}>{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section 
        className="full-section section-features"
      >
        <div style={{ textAlign: 'center', marginBottom: 48, position: 'relative', zIndex: 1 }}>
          <motion.h2 
            style={{ fontSize: 36, marginBottom: 16, fontWeight: 700 }}
           
           
          >
            Everything You Need in One Place
          </motion.h2>
          <motion.p 
            style={{ color: 'var(--sys-gray)', fontSize: 18, maxWidth: 600, margin: '0 auto' }}
          
           
          >
            Comprehensive features designed to give you complete control over vehicle market analysis
          </motion.p>
        </div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, position: 'relative', zIndex: 1 }}>
          {features.map((feature) => (
            <motion.div
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
      >
        <div style={{ textAlign: 'center', marginBottom: 48, position: 'relative', zIndex: 1 }}>
          <motion.h2 
            style={{ fontSize: 36, marginBottom: 16, fontWeight: 700 }}
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Why Choose AutoInsight
          </motion.h2>
          <motion.p 
            style={{ color: 'var(--sys-gray)', fontSize: 18, maxWidth: 600, margin: '0 auto' }}
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
              whileHover={{ scale: 1.08, rotateY: 5, z: 50 }}
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

      {/* Ratings Section */}
      <motion.section 
        className="full-section section-ratings"
      >
        <motion.div 
          style={{ 
            textAlign: 'center', 
            marginBottom: 48,
            position: 'relative',
            zIndex: 1
          }}
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 style={{ fontSize: 36, marginBottom: 16, fontWeight: 700 }}>What Our Users Say</h2>
          <p style={{ color: 'var(--sys-gray)', fontSize: 18, maxWidth: 600, margin: '0 auto' }}>
            Join thousands of satisfied users who trust AutoInsight for their vehicle market research
          </p>
        </motion.div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, position: 'relative', zIndex: 1 }}>
          {ratings.map((rating, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 50, rotateX: -15 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.2, type: "spring", stiffness: 100 }}
              whileHover={{ y: -10, scale: 1.03 }}
              style={{ perspective: '1000px' }}
            >
              <RatingCard
                stars={rating.stars}
                review={rating.review}
                author={rating.author}
                role={rating.role}
                delay={0}
              />
            </motion.div>
          ))}
        </div>
        <motion.div 
          style={{ 
            textAlign: 'center', 
            marginTop: 48,
            position: 'relative',
            zIndex: 1
          }}
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4, type: "spring", stiffness: 100 }}
          whileHover={{ scale: 1.05 }}
        >
          <div style={{ fontSize: 56, fontWeight: 700, marginBottom: 12, background: 'linear-gradient(135deg, #023e8a 0%, #48CAE4 50%, #0077B6 100%)', backgroundSize: '200% 200%', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent', animation: 'gradientShift 3s ease infinite' }}>
            4.9/5
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 16 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <motion.span 
                key={star} 
                style={{ fontSize: 28, color: '#48CAE4' }}
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 + star * 0.1, type: "spring", stiffness: 200 }}
                whileHover={{ scale: 1.3, rotate: 15 }}
              >
                ★
              </motion.span>
            ))}
          </div>
          <p style={{ color: '#0b0c10', fontSize: 16, fontWeight: 500 }}>Based on 1,247 user reviews</p>
        </motion.div>
      </motion.section>

      {/* Data Sources Section */}
      <motion.section 
        className="full-section section-data-sources"
      >
        <div style={{ textAlign: 'center', marginBottom: 48, position: 'relative', zIndex: 1 }}>
          <motion.h2 
            style={{ fontSize: 36, marginBottom: 16, fontWeight: 700 }}
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Our Data Sources
          </motion.h2>
          <motion.p style={{ color: 'var(--sys-gray)', fontSize: 18, maxWidth: 600, margin: '0 auto', fontWeight: 500 }}
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
              whileHover={{ y: -8, rotate: 2 }}
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
        <motion.div 
          style={{ 
            textAlign: 'center', 
            marginTop: 48, 
            padding: '32px 24px', 
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(54, 129, 247, 0.15)',
            position: 'relative',
            zIndex: 1
          }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <p style={{ color: 'var(--sys-green)', fontSize: 14, lineHeight: 1.8, backgroundColor: 'rgba(0,0,0,0.02)', padding: '12px 16px', borderRadius: '8px', display: 'inline-block', fontWeight: 500 }}>
            AutoInsight aggregates and analyzes data from multiple trusted sources to provide comprehensive vehicle market insights. 
            All data is collected in compliance with platform terms of service and used solely for analytical purposes.
          </p>
        </motion.div>
      </motion.section>

      {/* Recent Work Section */}
      <motion.section 
        className="full-section section-recent-work"
      >
        <motion.div
          style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 style={{ fontSize: 36, marginBottom: 16, fontWeight: 700 }}>Recent Work</h2>
          <p style={{ color: 'var(--sys-gray)', fontSize: 18, marginBottom: 48, maxWidth: 600, margin: '0 auto 48px' }}>
            Explore our latest projects and features
          </p>
        </motion.div>
        <div className="grid centered" style={{ position: 'relative', zIndex: 1 }}>
          {projects.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1, type: "spring", stiffness: 100 }}
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <ProjectCard title={p.title} tag={p.tag} desc={p.desc} />
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Chatbot Button */}
      <ChatbotButton />
    </>
  );
}