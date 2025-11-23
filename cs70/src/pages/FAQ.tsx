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
    {
      id: 1,
      category: "general",
      question: "What is AutoInsight?",
      answer: "AutoInsight is a comprehensive vehicle market analytics platform designed specifically for Sri Lanka. We provide real-time pricing data, market trends, pricing forecasts, and actionable insights to help buyers, sellers, and dealers make informed decisions in the vehicle market.",
      icon: "🚗"
    },
    {
      id: 2,
      category: "general",
      question: "How does AutoInsight collect vehicle data?",
      answer: "We collect vehicle data from multiple sources including online classified platforms, dealer networks, auction reports, and market surveys. Our advanced algorithms then analyze this data to identify patterns, trends, and pricing benchmarks across different vehicle categories and conditions.",
      icon: "📊"
    },
    {
      id: 3,
      category: "general",
      question: "Is AutoInsight available for both new and used vehicles?",
      answer: "Yes, AutoInsight covers both new and used vehicle markets in Sri Lanka. Our platform provides comprehensive insights for all vehicle types including cars, SUVs, vans, motorcycles, and commercial vehicles.",
      icon: "🔄"
    }
  ];

  const categories = [
    { value: "all", label: "All Questions", icon: "📚" },
    { value: "general", label: "General", icon: "❓" },
    { value: "pricing", label: "Pricing", icon: "💰" },
    { value: "features", label: "Features", icon: "⭐" },
    { value: "subscription", label: "Subscription", icon: "👑" },
    { value: "technical", label: "Technical", icon: "🔧" },
    { value: "support", label: "Support", icon: "🤝" }
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
          background: "transparent",
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
              Browse FAQ
            </a>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Category Filter Section */}
      <motion.section
        className="full-section"
        style={{
          background: "linear-gradient(135deg, #ffffff 0%, #f5f0ff 50%, #ffffff 100%)",
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
                    border: selectedCategory === cat.value ? "2px solid var(--primary)" : "1px solid rgba(54, 129, 247, 0.2)",
                    background: selectedCategory === cat.value ? "linear-gradient(135deg, rgba(54, 129, 247, 0.1), rgba(139, 92, 246, 0.08))" : "#ffffff",
                    borderRadius: "var(--radius-md)",
                    color: selectedCategory === cat.value ? "var(--primary)" : "#3a3d43",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.3s var(--ease)",
                    boxShadow: selectedCategory === cat.value ? "0 4px 12px rgba(54, 129, 247, 0.15)" : "0 2px 6px rgba(0, 0, 0, 0.05)",
                  }}
                >
                  <span style={{ marginRight: 6 }}>{cat.icon}</span>
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
          background: "linear-gradient(135deg, #ffffff 0%, #f0f9ff 50%, #fef3f0 100%)",
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
                      padding: "20px 24px",
                      background: "#ffffff",
                      border: "1px solid rgba(54, 129, 247, 0.1)",
                      borderRadius: "var(--radius-md)",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "all 0.3s var(--ease)",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = "0 8px 24px rgba(54, 129, 247, 0.15)";
                      e.currentTarget.style.borderColor = "rgba(54, 129, 247, 0.3)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.05)";
                      e.currentTarget.style.borderColor = "rgba(54, 129, 247, 0.1)";
                    }}
                    whileHover={{ y: -2 }}
                  >
                    <div style={{ fontSize: 24, minWidth: 32 }}>{faq.icon}</div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ color: "#0b0c10", fontSize: 16, fontWeight: 600, margin: 0 }}>
                        {faq.question}
                      </h3>
                    </div>
                    <motion.div
                      style={{
                        fontSize: 20,
                        color: "var(--primary)",
                        minWidth: 24,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      animate={{ rotate: expandedId === faq.id ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      ▼
                    </motion.div>
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
                            padding: "20px 24px",
                            background: "linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)",
                            borderLeft: "4px solid var(--primary)",
                            marginTop: 0,
                            color: "#3a3d43",
                            fontSize: 15,
                            lineHeight: 1.7,
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
