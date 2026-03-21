import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";

interface FAQItem {
  id: number;
  category: string;
  question: string;
  answer: string;
  icon: string;
}

export default function FAQ() {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const faqData: FAQItem[] = [
    // General
    {
      id: 1,
      category: "general",
      question: "What is AutoInsight?",
      answer: "AutoInsight is a vehicle data analytics platform designed to help users understand pricing trends, market demand, and vehicle value in the Sri Lankan automotive market. It combines real-world listing data, historical records, and machine learning insights into one easy-to-use dashboard.",
      icon: "🚗"
    },
    {
      id: 2,
      category: "general",
      question: "Who can use AutoInsight?",
      answer: "AutoInsight is built for vehicle buyers, sellers, motor dealers, analysts, students, and anyone interested in data-driven automotive insights.",
      icon: "👥"
    },
    {
      id: 3,
      category: "general",
      question: "Do I need technical knowledge to use AutoInsight?",
      answer: "No. The platform is designed for both technical and non-technical users, with simple dashboards, visual charts, and clear explanations.",
      icon: "💡"
    },
    {
      id: 4,
      category: "general",
      question: "Is AutoInsight officially connected to vehicle sellers?",
      answer: "No. AutoInsight is an independent analytics and insight platform and does not sell vehicles directly.",
      icon: "🔗"
    },
    
    // Pricing
    {
      id: 5,
      category: "pricing",
      question: "Is AutoInsight free to use?",
      answer: "Yes. AutoInsight offers free access to limited insights and dashboards. Advanced features require a registered account.",
      icon: "💰"
    },
    {
      id: 6,
      category: "pricing",
      question: "Are price predictions exact values?",
      answer: "No. Price predictions are estimates, not guaranteed prices. They reflect historical data and market trends to support decision-making.",
      icon: "📈"
    },
    {
      id: 7,
      category: "pricing",
      question: "Why might AutoInsight prices differ from market listings?",
      answer: "Prices may vary due to negotiation, vehicle condition, urgency of sale, or recent market changes not yet reflected in the data.",
      icon: "🔍"
    },
    {
      id: 8,
      category: "pricing",
      question: "Does AutoInsight charge per prediction?",
      answer: "No. Predictions are included as part of the platform features and are not charged per use.",
      icon: "💳"
    },
    
    // Features
    {
      id: 9,
      category: "features",
      question: "What features does AutoInsight offer?",
      answer: "AutoInsight includes: Market trend analytics, Vehicle price prediction, Vehicle comparison tools, Regional demand analysis, AI-powered explanations, and User reviews and ratings.",
      icon: "⚙️"
    },
    {
      id: 10,
      category: "features",
      question: "Can I compare multiple vehicles?",
      answer: "Yes. You can compare up to three vehicles at once based on price trends, specifications, and market behavior.",
      icon: "⚖️"
    },
    {
      id: 11,
      category: "features",
      question: "What is the AI Trend Explanation feature?",
      answer: "It provides human-readable explanations of charts and predictions, helping users understand why a trend or price estimate exists.",
      icon: "🤖"
    },
    {
      id: 12,
      category: "features",
      question: "Can I save my preferences?",
      answer: "Yes. Logged-in users can customize preferences such as notifications, display units, and dashboard defaults.",
      icon: "⚙️"
    },
    
    // Subscription
    {
      id: 13,
      category: "subscription",
      question: "Do I need a subscription to use AutoInsight?",
      answer: "No subscription is required for basic usage. Creating a free account unlocks additional analytics and personalization features.",
      icon: "📦"
    },
    {
      id: 14,
      category: "subscription",
      question: "Are there paid plans available?",
      answer: "Currently, AutoInsight focuses on free and academic use. Future premium plans may be introduced with advanced tools.",
      icon: "💎"
    },
    {
      id: 15,
      category: "subscription",
      question: "Can I cancel my account anytime?",
      answer: "Yes. Users can delete their account and associated data at any time.",
      icon: "🚪"
    },
    {
      id: 16,
      category: "subscription",
      question: "Will my data be retained after account deletion?",
      answer: "No. Personal data and user-generated content are removed in accordance with data minimization principles.",
      icon: "🗑️"
    },
    
    // Technical
    {
      id: 17,
      category: "technical",
      question: "How does AutoInsight generate price predictions?",
      answer: "The platform uses machine learning models trained on historical vehicle data, considering factors like model, year, mileage, engine type, and region.",
      icon: "🧠"
    },
    {
      id: 18,
      category: "technical",
      question: "Is AutoInsight using real-time data?",
      answer: "Data is updated regularly, but it may not always reflect real-time changes or last-minute market shifts.",
      icon: "⏱️"
    },
    {
      id: 19,
      category: "technical",
      question: "Is AutoInsight secure?",
      answer: "Yes. The platform uses encrypted connections (HTTPS), secure authentication, and protected data storage.",
      icon: "🔒"
    },
    {
      id: 20,
      category: "technical",
      question: "Does AutoInsight store personal seller information?",
      answer: "No. Only non-personal vehicle attributes are used. Seller names, phone numbers, or contact details are never stored.",
      icon: "🛡️"
    },
    
    // Support
    {
      id: 21,
      category: "support",
      question: "How can I get help if something isn't working?",
      answer: "You can contact support through the platform's contact section or report issues directly from your dashboard.",
      icon: "🛠️"
    },
    {
      id: 22,
      category: "support",
      question: "How can I report incorrect data or predictions?",
      answer: "Feedback can be submitted through the platform to help improve accuracy and model performance.",
      icon: "📝"
    },
    {
      id: 23,
      category: "support",
      question: "Are reviews moderated?",
      answer: "Yes. Reviews are automatically checked for spam, abuse, and inappropriate content to maintain quality and trust.",
      icon: "✅"
    },
    {
      id: 24,
      category: "support",
      question: "Does AutoInsight provide customer service advice?",
      answer: "AutoInsight provides data insights only and does not offer legal, financial, or professional advice.",
      icon: "💬"
    }
  ];

  const categories = [
    { 
      value: "all", 
      label: "All Questions", 
      icon: (
        <svg width="20" height="20" viewBox="0 0 640 640" fill="#3a3d43" xmlns="http://www.w3.org/2000/svg">
          <path d="M320 80C377.4 80 424 126.6 424 184C424 241.4 377.4 288 320 288C262.6 288 216 241.4 216 184C216 126.6 262.6 80 320 80zM96 152C135.8 152 168 184.2 168 224C168 263.8 135.8 296 96 296C56.2 296 24 263.8 24 224C24 184.2 56.2 152 96 152zM0 480C0 409.3 57.3 352 128 352C140.8 352 153.2 353.9 164.9 357.4C132 394.2 112 442.8 112 496L112 512C112 523.4 114.4 534.2 118.7 544L32 544C14.3 544 0 529.7 0 512L0 480zM521.3 544C525.6 534.2 528 523.4 528 512L528 496C528 442.8 508 394.2 475.1 357.4C486.8 353.9 499.2 352 512 352C582.7 352 640 409.3 640 480L640 512C640 529.7 625.7 544 608 544L521.3 544zM472 224C472 184.2 504.2 152 544 152C583.8 152 616 184.2 616 224C616 263.8 583.8 296 544 296C504.2 296 472 263.8 472 224zM160 496C160 407.6 231.6 336 320 336C408.4 336 480 407.6 480 496L480 512C480 529.7 465.7 544 448 544L192 544C174.3 544 160 529.7 160 512L160 496z"/>
        </svg>
      )
    },
    { 
      value: "general", 
      label: "General", 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3a3d43" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 16v-4"></path>
          <path d="M12 8h.01"></path>
        </svg>
      )
    },
    { 
      value: "pricing", 
      label: "Pricing", 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3a3d43" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"></line>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
      )
    },
    { 
      value: "features", 
      label: "Features", 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#3a3d43" stroke="none">
          <polygon points="12 2 15.09 10.26 24 10.27 17.18 16.27 20.27 24.54 12 18.54 3.73 24.54 6.82 16.27 0 10.27 8.91 10.26 12 2"></polygon>
        </svg>
      )
    },
    { 
      value: "subscription", 
      label: "Subscription", 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#3a3d43" stroke="none">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"></path>
        </svg>
      )
    },
    { 
      value: "technical", 
      label: "Technical", 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#3a3d43" stroke="none">
          <path d="M20 3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H4V5h16v14zm-8-2l-4-4h3V9h2v4h3l-4 4z"></path>
        </svg>
      )
    },
    { 
      value: "support", 
      label: "Support", 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3a3d43" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      )
    }
  ];

  const filteredFAQs = useMemo(
    () =>
      selectedCategory === "all"
        ? faqData
        : faqData.filter((item) => item.category === selectedCategory),
    [selectedCategory]
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, type: "spring" as const, stiffness: 100 },
    },
  };

  const faqItemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  return (
    <>
      {/* Hero Section */}
      <motion.section
        className="full-section section-faq-hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        style={{
          background: "linear-gradient(135deg, #023e8a 0%, #0077B6 50%, #023e8a 100%)",
          position: "relative",
          overflow: "hidden",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: "-84px",
          paddingTop: "120px",
        }}
      >
        {/* Animated background elements */}
        <motion.div
          style={{
            position: "absolute",
            right: -100,
            top: "50%",
            transform: "translateY(-50%)",
            opacity: 0.1,
            zIndex: 0,
          }}
          animate={{ y: [0, 20, 0], x: [0, 10, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
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

        <motion.div
          className="container"
          style={{ textAlign: "center", position: "relative", zIndex: 1, maxWidth: 800 }}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "1.4px", color: "var(--primary)", textTransform: "uppercase", marginBottom: 16, opacity: 0.9 }}>
              Help Center
            </div>
          </motion.div>

          <motion.h1
            style={{
              fontSize: "clamp(40px, 7vw, 60px)",
              fontWeight: 800,
              marginBottom: 20,
              color: "#ffffff",
              textShadow: "0 4px 12px rgba(54, 129, 247, 0.4), 0 2px 8px rgba(139, 92, 246, 0.3)",
            }}
            variants={itemVariants}
          >
            Frequently Asked Questions
          </motion.h1>

          <motion.p
            style={{
              fontSize: 18,
              color: "#d5dae1",
              maxWidth: 600,
              margin: "0 auto 32px",
              lineHeight: 1.6,
            }}
            variants={itemVariants}
          >
            Find answers to common questions about AutoInsight, our features, pricing, and how we can help you make better vehicle market decisions.
          </motion.p>

          <motion.div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
            variants={itemVariants}
          >
            <a
              href="#faq-content"
              style={{
                background: "linear-gradient(135deg, #023e8a 0%, #0077B6 100%)",
                color: "#ffffff",
                padding: "12px 28px",
                borderRadius: "var(--radius-pill)",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: 15,
                boxShadow: "0 6px 18px rgba(0, 119, 182, 0.35)",
                transition: "all 0.3s var(--ease)",
                display: "inline-block",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 10px 26px rgba(0, 119, 182, 0.45)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 6px 18px rgba(0, 119, 182, 0.35)";
              }}
            >
              Browse FAQ
            </a>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Category Filter Section */}
      <motion.section
        className="full-section"
        style={{
          background: "linear-gradient(135deg, #ffffff 0%, #CAF0F8 50%, #ffffff 100%)",
          padding: "60px 24px",
        }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            position: "relative",
            zIndex: 1,
          }}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <motion.h2
              style={{
                fontSize: 28,
                fontWeight: 700,
                marginBottom: 12,
                color: "var(--primary)",
              }}
              variants={itemVariants}
            >
              Browse by Category
            </motion.h2>
            <motion.p
              style={{
                color: "#3a3d43",
                fontSize: 16,
              }}
              variants={itemVariants}
            >
              Select a category to filter relevant questions
            </motion.p>
          </div>

          <motion.div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 12,
            }}
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <AnimatePresence mode="wait">
              {categories.map((cat) => (
                <motion.button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    padding: "14px 20px",
                    border: selectedCategory === cat.value ? "2px solid var(--primary)" : "1px solid rgba(0, 119, 182, 0.2)",
                    background: selectedCategory === cat.value ? "linear-gradient(135deg, rgba(0, 119, 182, 0.1), rgba(0, 150, 199, 0.08))" : "#ffffff",
                    borderRadius: "var(--radius-md)",
                    color: selectedCategory === cat.value ? "var(--primary)" : "#3a3d43",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.3s var(--ease)",
                    boxShadow: selectedCategory === cat.value ? "0 4px 12px rgba(0, 119, 182, 0.15)" : "0 2px 6px rgba(0, 0, 0, 0.05)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {typeof cat.icon === "string" ? cat.icon : cat.icon}
                  </span>
                  {cat.label}
                </motion.button>
              ))}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* FAQ Items Section */}
      <motion.section
        id="faq-content"
        className="full-section"
        style={{
          background: "linear-gradient(135deg, #ffffff 0%, #ADE8F4 50%, #90E0EF 100%)",
          padding: "80px 24px",
        }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            position: "relative",
            zIndex: 1,
          }}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div style={{ marginBottom: 48 }}>
            <motion.h2
              style={{
                fontSize: 32,
                fontWeight: 700,
                marginBottom: 12,
                color: "var(--primary)",
                textAlign: "center",
              }}
              variants={itemVariants}
            >
              {selectedCategory === "all" ? "All Questions" : categories.find(c => c.value === selectedCategory)?.label}
            </motion.h2>
            <motion.p
              style={{
                color: "#3a3d43",
                fontSize: 16,
                textAlign: "center",
              }}
              variants={itemVariants}
            >
              {filteredFAQs.length} questions found
            </motion.p>
          </div>

          <motion.div
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <AnimatePresence mode="popLayout">
              {filteredFAQs.map((faq) => (
                <motion.div
                  key={faq.id}
                  variants={faqItemVariants}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.button
                    onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                    style={{
                      width: "100%",
                      padding: "22px 28px",
                      background: "#fff",
                      border: "1.5px solid rgba(54, 129, 247, 0.13)",
                      borderRadius: "18px",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "all 0.3s var(--ease)",
                      boxShadow: "0 6px 18px rgba(54, 129, 247, 0.07)",
                      display: "flex",
                      alignItems: "center",
                      gap: 18,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = "0 12px 32px rgba(54, 129, 247, 0.13)";
                      e.currentTarget.style.borderColor = "rgba(54, 129, 247, 0.25)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = "0 6px 18px rgba(54, 129, 247, 0.07)";
                      e.currentTarget.style.borderColor = "rgba(54, 129, 247, 0.13)";
                    }}
                    whileHover={{ y: -2 }}
                  >
                    {/* Modern chevron icon for expand/collapse */}
                    <span style={{ minWidth: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3681f7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expandedId === faq.id ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s" }}>
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </span>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ color: "#0b0c10", fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: "0.01em" }}>
                        {faq.question}
                      </h3>
                    </div>
                  </motion.button>

                  <AnimatePresence initial={false}>
                    {expandedId === faq.id && (
                      <motion.div
                        key={`content-${faq.id}`}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{
                          height: {
                            duration: 0.3,
                            type: "spring",
                            stiffness: 500,
                            damping: 50,
                          },
                          opacity: { duration: 0.2 },
                        }}
                        style={{
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            padding: "20px 28px",
                            background: "linear-gradient(135deg, #f9fafb 0%, #eaf4fb 100%)",
                            borderLeft: "4px solid #3681f7",
                            marginTop: 0,
                            color: "#3a3d43",
                            fontSize: 16,
                            lineHeight: 1.7,
                            borderRadius: "0 0 16px 16px",
                          }}
                        >
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        className="full-section"
        style={{
          background: "linear-gradient(135deg, #ffffff 0%, #f7f0ff 50%, #ffffff 100%)",
          textAlign: "center",
          marginBottom: "-80px",
          paddingBottom: "160px",
        }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          style={{
            maxWidth: 800,
            margin: "0 auto",
            position: "relative",
            zIndex: 1,
            padding: "0 24px",
          }}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.h2
            style={{
              color: "var(--primary)",
              fontSize: 36,
              fontWeight: 700,
              marginBottom: 20,
            }}
            variants={itemVariants}
          >
            Still need help?
          </motion.h2>

          <motion.p
            style={{
              fontSize: 18,
              color: "#3a3d43",
              marginBottom: 32,
              lineHeight: 1.6,
            }}
            variants={itemVariants}
          >
            Can't find what you're looking for? Our support team is here to help you get the most from AutoInsight.
          </motion.p>

          <motion.div
            style={{
              display: "flex",
              gap: 16,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
            variants={itemVariants}
          >
            <a
              className="cta"
              href="/contact"
              style={{
                textDecoration: "none",
              }}
            >
              Contact Support
            </a>
            <a
              href="/"
              style={{
                padding: "12px 24px",
                borderRadius: "var(--radius-pill)",
                border: "1px solid var(--primary)",
                color: "var(--primary)",
                fontSize: 15,
                fontWeight: 600,
                textDecoration: "none",
                transition: "all 0.3s var(--ease)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(54, 129, 247, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              Back to Home
            </a>
          </motion.div>
        </motion.div>
      </motion.section>
    </>
  );
}
