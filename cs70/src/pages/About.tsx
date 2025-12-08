import { motion } from "framer-motion";

interface TeamMember {
  name: string;
  role: string;
  desc: string;
  id: string;
  linkedin: string;
  email: string;
}

interface Milestone {
  year: string;
  title: string;
  desc: string;
}

interface Value {
  icon: string;
  title: string;
  desc: string;
}

export default function About() {
  const teamMembers: TeamMember[] = [
  { 
    name: "Akila Wijerama", 
    role: "Team Leader", 
    desc: "Leads the team with strategic vision and ensures smooth project execution.",
    id: "20241303",
    linkedin: "https://linkedin.com/in/akila-wijerama",
    email: "mailto:akila.20241303@iit.ac.lk",
  },
  { 
    name: "Dulan Nimnaka", 
    role: "Backend Developer", 
    desc: "Handles server-side logic, database design, and API integrations.",
    id: "20240503",
    linkedin: "https://linkedin.com/in/dulan-nimnaka",
    email: "mailto:dulan.20240503@iit.ac.lk"
  },
  { 
    name: "Shaveen Peiris", 
    role: "Frontend Developer", 
    desc: "Builds interactive and user-friendly web interfaces for the platform.",
    id: "20240515",
    linkedin: "https://linkedin.com/in/shaveen-peiris",
    email: "mailto:shaveen.20240515@iit.ac.lk"
  },
  { 
    name: "Sanidu Samrasinghe", 
    role: "Data Analyst", 
    desc: "Analyzes datasets to provide actionable insights and support decision-making.",
    id: "20240641",
    linkedin: "https://linkedin.com/in/sanidu-samrasinghe",
    email: "mailto:sanidu.20240641@iit.ac.lk"
  },
  { 
    name: "Sanara Perera", 
    role: "ML Engineer", 
    desc: "Develops machine learning models to predict fair vehicle prices and trends.",
    id: "20240773",
    linkedin: "https://linkedin.com/in/sanara-perera",
    email: "mailto:sanara.20240773@iit.ac.lk"
  },
  { 
    name: "Hasandi Peiris", 
    role: "UI/UX Designer", 
    desc: "Designs visually appealing and user-centric interfaces for the AutoInsight platform.",
    id: "20240642",
    linkedin: "https://linkedin.com/in/hasandi-peiris",
    email: "mailto:hasandi.20240642@iit.ac.lk"
  }
];

  const milestones: Milestone[] = [
    { year: "2024", title: "Project Inception", desc: "Identified market gap and began research" },
    { year: "2024", title: "Data Collection", desc: "Established partnerships with major platforms" },
    { year: "2024", title: "ML Development", desc: "Built price prediction algorithms" },
    { year: "2025", title: "Platform Launch", desc: "Released AutoInsight to the public" }
  ];

  const values: Value[] = [
    { icon: "🎯", title: "Accuracy", desc: "Delivering precise, data-driven insights you can trust" },
    { icon: "🔍", title: "Transparency", desc: "Making vehicle market data accessible to everyone" },
    { icon: "💡", title: "Innovation", desc: "Leveraging AI and ML to revolutionize market analysis" },
    { icon: "🤝", title: "Integrity", desc: "Ethical data collection and user privacy protection" }
  ];


  return (
    <>
      {/* Hero Section */}
      <motion.section 
        className="full-section"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        style={{ 
          background: "transparent",
          position: 'relative',
          overflow: 'hidden',
          minHeight: '100vh',
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: "-84px",
          paddingTop: "120px",
        }}
      >
        {/* Background Video */}
        <video
          aria-hidden="true"
          className="about-bg-video"
          src="/video.mp4"
          playsInline
          autoPlay
          muted
          loop
          preload="metadata"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: -1,
            filter: 'brightness(0.65) saturate(1.05)',
            transform: 'translateZ(0)',
            pointerEvents: 'none'
          }}
        />

        {/* Subtle overlay to ensure text readability over video */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.25) 20%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.25) 100%)',
            zIndex: 0
          }}
        />
        
        <motion.div
          style={{
           position: "absolute",
           right: -100,
           top: "50%",
           transform: "translateY(-50%)",
           opacity: 0.1,
           zIndex: 0,
          }}
          animate={{ y: [0, 20]}}
          transition={{ 
            duration: 6, 
            repeat: Infinity, 
            repeatType:"mirror",
            ease: "easeInOut"
          }}
        >
          <svg width="500" height="500" viewBox="0 0 500 500" fill="none">
            <circle cx="250" cy="250" r="180" fill="rgba(54, 129, 247, 0.1)" />
            <circle cx="250" cy="250" r="120" fill="rgba(139, 92, 246, 0.08)" />
            <path d="M250 100 Q350 250 250 400 Q150 250 250 100" stroke="rgba(54, 129, 247, 0.2)" strokeWidth="2" fill="none" />
          </svg>
        </motion.div>
        
        <motion.div
        style={{
          position: "absolute",
          left: -50,
          bottom: 100,
          opacity: 0.08,
          zIndex: 0,
        }}
        animate={{ y: [-10, 10, -10], rotate: [0, 5, 0] }}
        transition={{ duration: 8, repeat: Infinity }}
      >
        <svg width="400" height="400" viewBox="0 0 400 400" fill="none">
           <rect x="50" y="50" width="300" height="300" fill="rgba(249, 217, 124, 0.1)" rx="20" />
           <rect x="100" y="100" width="200" height="200" fill="rgba(139, 92, 246, 0.08)" rx="10" />
        </svg>
      </motion.div>



        <div style={{ textAlign: 'center', marginBottom: 48, position: 'relative', zIndex: 1, maxWidth: 1120, margin: '0 auto', padding: '0 32px' }}>
          <motion.h1 
          className="h-title"
          initial={{ y: 28, opacity: 0, scale:0.94 }}
          animate={{ y: 0, opacity: 1, scale:1 }}
          transition={{ duration: 0.9, ease: [0.25,0.9,0.25,1] }}
          style={{
            color: '#ffffff',
            textShadow: '0 2px 12px rgba(0,0,0,0.4), 0 4px 24px rgba(0,0,0,0.3)'
          }}
          >
            About AutoInsight
          </motion.h1>
          <motion.p 
          className="h-desc"
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.12, duration: 0.6 }}
          style={{
            color: 'rgba(255,255,255,0.9)',
            textShadow: '0 1px 4px rgba(0,0,0,0.3)'
          }}
          >
            Empowering the vehicle market of Sri Lanka through intelligent analytics, real-time insights, and AI-driven predictions.
          </motion.p>

          <motion.div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: 24,
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <a
              href="#"
              style={{
                background: "linear-gradient(135deg, #3681f7 0%, #8b5cf6 100%)",
                color: "#ffffff",
                padding: "12px 28px",
                borderRadius: "var(--radius-pill)",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: 15,
                boxShadow: "0 6px 18px rgba(54, 129, 247, 0.35)",
                transition: "all 0.3s var(--ease)",
                display: "inline-block",
              }}
              onMouseEnter={(e) => {
               e.currentTarget.style.transform = "translateY(-2px)";
               e.currentTarget.style.boxShadow = "0 10px 26px rgba(54, 129, 247, 0.45)";
              }}
              onMouseLeave={(e) => {
               e.currentTarget.style.transform = "translateY(0)";
               e.currentTarget.style.boxShadow = "0 6px 18px rgba(54, 129, 247, 0.35)";
              }}
            >
              Learn More
           </a>
          </motion.div>
        </div>
    </motion.section>
      



      {/* Mission & Vision Section */}
      <motion.section 
        className="full-section section-features"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <div style={{ maxWidth: 1120, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 40 }}>
            <motion.div
              className="project"
              style={{ 
                padding: 40,
                color: '#0b0c10',
                textAlign: 'justify'
              }}
              initial={{ opacity: 0, x: -50, y: 50 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, type: "spring", stiffness: 80 }}
              whileHover={{ y: -8, scale: 1.02 }}
            >
              <div style={{ fontSize: 48, marginBottom: 20 }}>🎯</div>
              <h2 style={{ fontSize: 28, marginBottom: 16, fontWeight: 700, color: 'var(--primary)' }}>Our Mission</h2>
              <p style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--sys-gray)' }}>
                 Transform the vehicle market of Sri Lanka by eliminating information gaps and delivering transparent, 
                 verifiable, data-driven intelligence that empowers buyers, sellers, and industry stakeholders to make confident, accurate, and forward-thinking decisions.
              </p>
            </motion.div>

            <motion.div
              className="project"
              style={{ 
                padding: 40,
                color: '#0b0c10',
                textAlign: 'left'
              }}
              initial={{ opacity: 0, x: 50, y: 50 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, type: "spring", stiffness: 80 }}
              whileHover={{ y: -8, scale: 1.02 }}
            >
              <div style={{ fontSize: 48, marginBottom: 20 }}>🔮</div>
              <h2 style={{ fontSize: 28, marginBottom: 16, fontWeight: 700, color: '#8b5cf6' }}>Our Vision</h2>
              <p style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--sys-gray)' }}>
                To become Sri Lanka's most trusted vehicle market intelligence platform, setting the standard for transparency and precision while fostering a fair and efficient automotive ecosystem for all.
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Story Section */}
      <motion.section 
        className="full-section section-why-choose"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 48, position: 'relative', zIndex: 1 }}>
          <motion.h2 
            style={{ fontSize: 36, marginBottom: 16, fontWeight: 700 }}
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Our Story
          </motion.h2>
        </div>
        <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <motion.div
            className="project"
            style={{ 
              padding: 40,
              color: '#0b0c10',
              textAlign: 'justify'
            }}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, type: "spring", stiffness: 100 }}
            whileHover={{ y: -8 }}
          >
            <p style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--sys-gray)', marginBottom: 20 }}>
              AutoInsight was born out of a single, clear observation: the vehicle market in Sri Lanka 
              lacked a unified platform, central platform that provided reliable market intelligence. 
              The buyers could not determine the fair prices of a vehicle, sellers could not benchmark their listings, 
              and everyone had to work in a fragmented landscape of scattered information.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--sys-gray)', marginBottom: 20 }}>
              As a team of students from the Informatics Institute of Technology in collaboration with 
              the University of Westminster, we identified this gap and set out to develop a solution. 
              Through extensive research, data collection from platforms like Riyasewana, Ikman.lk, 
              and official CMTA records, we built a robust and comprehensive analytics system.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--sys-gray)' }}>
              Today, AutoInsight leverages machine learning, real-time data aggregation, 
              and intuitive  visualizations to grant the unprecedented market transparency 
              that Sri Lanka truly deserves. Our platform embodies months of dedicated development, 
              countless data points analyzed, and a commitment to making vehicle market information accessible to everyone.
            </p>
          </motion.div>
        </div>
        <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <motion.div
            className="project"
            style={{ 
              padding: 40,
              color: '#0b0c10',
              textAlign: 'center',
              marginTop: 20,
              backgroundColor:'white',
              boxShadow:'#eaea75ff',
               
            }}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, type: "spring", stiffness: 100 }}
            whileHover={{ y: -8 }}
          >
            <h2 style={{ fontSize: 28, marginBottom: 16, fontWeight: 700, color: '#eaea75ff' ,textAlign: 'center'}}>About</h2>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--sys-gray)', marginBottom: 20 }}>
              AutoInsight uses real-time scraped data, statistical analysis, and machine learning to reveal accurate market trends in Sri Lanka. 
              From fair-price predictions to model comparisons and mileage analysis, the system offers powerful tools for both everyday users and industry professionals. 
              Click “Learn More” to discover the full process behind our data collection, analysis, and dashboard design.
            </p>
            </motion.div>
          </div>
      </motion.section>

      {/* Core Values */}
      <motion.section 
        className="full-section section-ratings"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 48, position: 'relative', zIndex: 1 }}>
          <motion.h2 
            style={{ fontSize: 36, marginBottom: 16, fontWeight: 700 }}
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Our Core Values
          </motion.h2>
          <motion.p 
            style={{ color: 'var(--sys-gray)', fontSize: 18, maxWidth: 600, margin: '0 auto' }}
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            The principles That Guide Everything We Do
          </motion.p>
        </div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24, position: 'relative', zIndex: 1, maxWidth: 1120, margin: '0 auto' }}>
          {values.map((value, i) => (
            <motion.div
              key={i}
              className="project"
              style={{ 
                padding: 32,
                color: '#0b0c10',
                textAlign: 'center'
              }}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1, type: "spring", stiffness: 100 }}
              whileHover={{ y: -10, scale: 1.05 }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>{value.icon}</div>
              <h3 style={{ fontSize: 20, marginBottom: 12, fontWeight: 600, color: 'var(--primary)' }}>
                {value.title}
              </h3>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--sys-gray)' }}>
                {value.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Team Section */}
      <motion.section 
        className="full-section section-data-sources"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 48, position: 'relative', zIndex: 1 }}>
          <motion.h2 
            style={{ fontSize: 36, marginBottom: 16, fontWeight: 700 }}
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Meet Our Team
          </motion.h2>
          <motion.p 
            style={{ color: 'var(--sys-gray)', fontSize: 18, maxWidth: 700, margin: '0 auto', fontWeight: 500 }}
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            The dedicated students behind AutoInsight, working under the guidance of IIT and University of Westminster
          </motion.p>
        </div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32, position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto' }}>
          {teamMembers.map((member, i) => (
            <motion.div
              key={i}
              className="project"
              style={{ 
                padding: 0,
                color: '#0b0c10',
                textAlign: 'center',
                overflow: 'hidden'
              }}
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1, type: "spring", stiffness: 80 }}
              whileHover={{ y: -12, boxShadow: '0 20px 40px rgba(54, 129, 247, 0.2)' }}
            >
              {/* Image Container */}
              <div style={{ 
                width: '100%',
                height: 220,
                background: 'linear-gradient(135deg, #3681f7 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative'
              }}>
                {/* Placeholder - Replace with actual image */}
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 64,
                  fontWeight: 700,
                  color: 'rgba(255, 255, 255, 0.3)',
                  background: 'linear-gradient(135deg, rgba(54, 129, 247, 0.8), rgba(139, 92, 246, 0.8))'
                }}>
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                {/* 
                <img 
                  src={`/images/team/${member.name.toLowerCase().replace(' ','-')}.jpg`}
                  alt={member.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                */}
              </div>
            {/* Content */}
              <div style={{ padding: 16, textAlign: 'center' }}>
                <h3 style={{ 
                  fontSize: 22, 
                  marginBottom: 8, 
                  fontWeight: 700, 
                  color: '#0b0c10',
                  letterSpacing: '-0.5px'
                }}>
                  {member.name}
                </h3>
                <p style={{ 
                  fontSize: 15, 
                  color: 'var(--primary)', 
                  marginBottom: 12, 
                  fontWeight: 600 
                }}>
                  {member.role}
                </p>
                <p style={{
                  fontSize:14,
                  color:'var(--sys-gray)',
                  marginBottom: 8,
                }}>
                  {member.desc}
                </p>
                <p style={{ 
                  fontSize: 13, 
                  color: 'var(--sys-gray)',
                  marginBottom: 16 
                }}>
                  IIT ID: {member.id}
                </p>

                {/* Social Icons */}
                <div style={{ 
                  display: 'flex', 
                  gap: 12,
                  paddingTop: 12,
                  borderTop: '1px solid rgba(0, 0, 0, 0.08)'
                }}>
                  <motion.a
                  href={member.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: 36,
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                    background: 'rgba(54, 129, 247, 0.1)',
                    color: 'var(--primary)',
                    textDecoration: 'none',
                    fontSize: 18
                  }}
                  whileHover={{ background: 'var(--primary)', color: '#fff', scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  in
                </motion.a>
                <motion.a
                  href={member.email}
                  style={{
                    width: 36,
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                    background: 'rgba(54, 129, 247, 0.1)',
                    color: 'var(--primary)',
                    textDecoration: 'none',
                    fontSize: 18
                  }}
                  whileHover={{ background: 'var(--primary)', color: '#fff', scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  @
                </motion.a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>     
      <motion.section 
        className="full-section section-recent-work"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 48, position: 'relative', zIndex: 1 }}>
          <motion.h2 
            style={{ fontSize: 36, marginBottom: 16, fontWeight: 700 }}
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Our Journey
          </motion.h2>
          <motion.p 
            style={{ color: 'var(--sys-gray)', fontSize: 18, maxWidth: 600, margin: '0 auto' }}
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Key milestones in our development process
          </motion.p>
        </div>
        <div className="grid centered" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, position: 'relative', zIndex: 1, maxWidth: 1120, margin: '0 auto' }}>
          {milestones.map((milestone, i) => (
            <motion.div
              key={i}
              className="project"
              style={{ 
                padding: 28,
                color: '#0b0c10',
                textAlign: 'center'
              }}
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1, type: "spring", stiffness: 100 }}
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <div style={{ 
                fontSize: 24, 
                fontWeight: 700, 
                color: 'var(--primary)', 
                marginBottom: 12 
              }}>
                {milestone.year}
              </div>
              <h3 style={{ fontSize: 18, marginBottom: 8, fontWeight: 600, color: '#0b0c10' }}>
                {milestone.title}
              </h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--sys-gray)' }}>
                {milestone.desc}
              </p>
            </motion.div>
          ))}
        </div>
      

      </motion.section>
    
      <motion.section 
        className="full-section section-how-it-works"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32, position: 'relative', zIndex: 1 }}>
          <motion.h2 
            style={{ fontSize: 36, marginBottom: 16, fontWeight: 700 }}
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Acknowledgments
          </motion.h2>
        </div>
        <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <motion.div
            className="project"
            style={{ 
              padding: 40,
              color: '#0b0c10',
              textAlign: 'center'
            }}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, type: "spring", stiffness: 100 }}
            whileHover={{ y: -8 }}
          >
            <p style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--sys-gray)', marginBottom: 20 }}>
              We extend our sincere gratitude to <strong style={{ color: '#0b0c10' }}>Mr. Banuka Athuraliya</strong>, our module leader, and <strong style={{ color: '#0b0c10' }}>Mr. Ahtshayan Udayasanthiran</strong>, our project supervisor, for their invaluable 
              guidance and support throughout this journey.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--sys-gray)', marginBottom: 20 }}>
              Special thanks to our industry partners: <strong style={{ color: '#0b0c10' }}>Mr. Rohan Casiechetty</strong> (General Manager, CMTA), 
              <strong style={{ color: '#0b0c10' }}> Mr. Kusal Arthanayake</strong> (Founder & CEO, Riyasewana), and <strong style={{ color: '#0b0c10' }}>Mr. Shaif Mohamed</strong> 
              (CEO, Ikman) for providing crucial datasets and industry insights.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--sys-gray)' }}>
              We also thank the <strong style={{ color: '#0b0c10' }}>Informatics Institute of Technology</strong> and the <strong style={{ color: '#0b0c10' }}>University of Westminster</strong> for providing the academic framework and resources that made this project possible.
            </p>
          </motion.div>
        </div>
      </motion.section>
    </>
  );
}