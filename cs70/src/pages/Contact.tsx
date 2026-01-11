import { motion } from "framer-motion";
import { useState } from "react";
import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";

interface FormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  type: "inquiry" | "partnership" | "support" | "feedback";
}

interface FormErrors {
  [key: string]: string;
}

export default function Contact() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    type: "inquiry",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.subject.trim()) newErrors.subject = "Subject is required";
    if (!formData.message.trim()) newErrors.message = "Message is required";
    if (formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Simulate form submission
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      setSubmitStatus("success");
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
        type: "inquiry",
      });

      setTimeout(() => {
        setSubmitStatus("idle");
      }, 3000);
    } catch {
      setSubmitStatus("error");
      setTimeout(() => {
        setSubmitStatus("idle");
      }, 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactMethods = [
    {
      icon: Mail,
      title: "Email",
      value: "info.autoinsight@gmail.com",
      link: "mailto:info.autoinsight@gmail.com",
      desc: "Send us an email and we'll respond within 24 hours"
    },
    {
      icon: Phone,
      title: "Phone",
      value: "+94 (0) 11 234 5678",
      link: "tel:+94112345678",
      desc: "Call us during business hours (9 AM - 6 PM)"
    },
    {
      icon: MapPin,
      title: "Location",
      value: "Colombo, Sri Lanka",
      link: "#",
      desc: "Visit our office or arrange a virtual meeting"
    },
    {
      icon: MessageCircle,
      title: "Live Chat",
      value: "Available 24/7",
      link: "#",
      desc: "Chat with our support team instantly"
    }
  ];

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

  return (
    <>
      {/* Hero Section */}
      <motion.section
        className="full-section section-contact-hero"
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
        {/* Animated car SVG background */}
        <motion.div
          style={{
            position: "absolute",
            right: -100,
            top: "50%",
            transform: "translateY(-50%)",
            opacity: 0.15,
            zIndex: 0,
          }}
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <svg width="500" height="500" viewBox="0 0 500 500" fill="none">
            <g opacity="0.8">
              <ellipse cx="250" cy="350" rx="180" ry="40" fill="rgba(0, 119, 182, 0.1)" />
              <path
                d="M80 300 Q100 200 120 150 L200 100 Q250 80 300 100 L380 150 Q400 200 420 300"
                stroke="rgba(0, 119, 182, 0.4)"
                strokeWidth="2"
                fill="none"
              />
              <circle cx="150" cy="330" r="35" fill="rgba(0, 119, 182, 0.2)" />
              <circle cx="350" cy="330" r="35" fill="rgba(0, 119, 182, 0.2)" />
              <rect x="180" y="180" width="140" height="80" rx="10" fill="rgba(0, 119, 182, 0.15)" />
              <rect x="200" y="150" width="50" height="40" rx="5" fill="rgba(0, 119, 182, 0.2)" />
            </g>
          </svg>
        </motion.div>

        {/* Left car illustration */}
        <motion.div
          style={{
            position: "absolute",
            left: -80,
            bottom: 80,
            opacity: 0.12,
            zIndex: 0,
          }}
          animate={{ y: [-10, 10, -10] }}
          transition={{ duration: 5, repeat: Infinity }}
        >
          <svg width="400" height="400" viewBox="0 0 400 400" fill="none">
            <path
              d="M50 250 Q70 180 90 150 L160 120 Q200 105 240 120 L310 150 Q330 180 350 250"
              stroke="rgba(0, 150, 199, 0.3)"
              strokeWidth="2"
              fill="none"
            />
            <circle cx="120" cy="280" r="30" fill="rgba(0, 150, 199, 0.15)" />
            <circle cx="280" cy="280" r="30" fill="rgba(0, 150, 199, 0.15)" />
          </svg>
        </motion.div>

        <motion.div
          className="container"
          style={{ textAlign: "center", position: "relative", zIndex: 1 }}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "1.4px", color: "var(--primary)", textTransform: "uppercase", marginBottom: 16, opacity: 0.9 }}>
              Get In Touch
            </div>
          </motion.div>

          <motion.h1
            style={{
              fontSize: "clamp(40px, 7vw, 60px)",
              fontWeight: 800,
              marginBottom: 20,
              color: "#ffffff",
              textShadow: "0 4px 12px rgba(0, 119, 182, 0.4), 0 2px 8px rgba(0, 150, 199, 0.3)",
            }}
            variants={itemVariants}
          >
            Let's Connect
          </motion.h1>

          <motion.p
            style={{
              fontSize: 18,
              color: "#d5dae1",
              maxWidth: 600,
              margin: "0 auto 32px",
            }}
            variants={itemVariants}
          >
            Have questions about AutoInsight? We'd love to hear from you. Reach out to our team and we'll get back to you as soon as possible.
          </motion.p>
        </motion.div>
      </motion.section>

      {/* Contact Methods Section */}
      <motion.section
        className="full-section"
        style={{
          background: "linear-gradient(135deg, #ffffff 0%, #CAF0F8 50%, #ffffff 100%)",
        }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          style={{ maxWidth: 1120, margin: "0 auto", position: "relative", zIndex: 1 }}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <motion.h2
              style={{
                fontSize: 36,
                fontWeight: 700,
                marginBottom: 16,
                color: "var(--primary)",
              }}
              variants={itemVariants}
            >
              Ways to Reach Us
            </motion.h2>
            <motion.p
              style={{ color: "#3a3d43", fontSize: 18, maxWidth: 600, margin: "0 auto" }}
              variants={itemVariants}
            >
              Multiple ways to get in touch with the AutoInsight team
            </motion.p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 24,
            }}
          >
            {contactMethods.map((method, i) => (
              <motion.a
                key={i}
                href={method.link}
                style={{ textDecoration: "none" }}
                variants={itemVariants}
                whileHover={{ y: -10, scale: 1.02 }}
              >
                <div
                  style={{
                    padding: "32px 24px",
                    background: "#ffffff",
                    border: "1px solid rgba(0, 119, 182, 0.1)",
                    borderRadius: "var(--radius-md)",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.4s var(--ease)",
                    boxShadow: "0 8px 24px rgba(0, 119, 182, 0.08)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 12px 32px rgba(0, 119, 182, 0.2)";
                    e.currentTarget.style.borderColor = "rgba(0, 119, 182, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 119, 182, 0.08)";
                    e.currentTarget.style.borderColor = "rgba(0, 119, 182, 0.1)";
                  }}
                >
                  <div style={{ fontSize: 40, marginBottom: 14, display: "flex", justifyContent: "center" }}>
                    <method.icon size={40} strokeWidth={1.5} color="var(--primary)" />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: "var(--primary)" }}>
                    {method.title}
                  </h3>
                  <p style={{ fontSize: 16, fontWeight: 600, color: "#0b0c10", marginBottom: 8 }}>
                    {method.value}
                  </p>
                  <p style={{ fontSize: 14, color: "#3a3d43" }}>
                    {method.desc}
                  </p>
                </div>
              </motion.a>
            ))}
          </div>
        </motion.div>
      </motion.section>

      {/* Contact Form Section */}
      <motion.section
        className="full-section"
        style={{
          background: "linear-gradient(135deg, #ffffff 0%, #ADE8F4 50%, #90E0EF 100%)",
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
            padding: "0 24px",
          }}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <motion.h2
              style={{
                color: "var(--primary)",
                fontSize: 36,
                fontWeight: 700,
                marginBottom: 16,
              }}
              variants={itemVariants}
            >
              Send us a Message
            </motion.h2>
            <motion.p
              style={{
                color: "#3a3d43",
                fontSize: 16,
                lineHeight: 1.6,
              }}
              variants={itemVariants}
            >
              Fill out the form below and we'll get back to you within 24 hours.
            </motion.p>
          </div>

          <motion.form
            onSubmit={handleSubmit}
            variants={itemVariants}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
              <motion.div variants={itemVariants}>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 600,
                    marginBottom: 8,
                    color: "#0b0c10",
                  }}
                >
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    fontSize: 15,
                    border: errors.name ? "1px solid var(--sys-red)" : "1px solid rgba(0, 0, 0, 0.1)",
                    borderRadius: "var(--radius-md)",
                    background: "#ffffff",
                    color: "#0b0c10",
                    transition: "all 0.3s var(--ease)",
                    boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.05)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--primary)";
                    e.currentTarget.style.boxShadow = "inset 0 1px 3px rgba(0, 0, 0, 0.05), 0 0 0 3px rgba(54, 129, 247, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = errors.name ? "var(--sys-red)" : "rgba(0, 0, 0, 0.1)";
                    e.currentTarget.style.boxShadow = "inset 0 1px 3px rgba(0, 0, 0, 0.05)";
                  }}
                />
                {errors.name && (
                  <p style={{ fontSize: 13, color: "var(--sys-red)", marginTop: 6 }}>{errors.name}</p>
                )}
              </motion.div>

              <motion.div variants={itemVariants}>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 600,
                    marginBottom: 8,
                    color: "#0b0c10",
                  }}
                >
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your.email@example.com"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    fontSize: 15,
                    border: errors.email ? "1px solid var(--sys-red)" : "1px solid rgba(0, 0, 0, 0.1)",
                    borderRadius: "var(--radius-md)",
                    background: "#ffffff",
                    color: "#0b0c10",
                    transition: "all 0.3s var(--ease)",
                    boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.05)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--primary)";
                    e.currentTarget.style.boxShadow = "inset 0 1px 3px rgba(0, 0, 0, 0.05), 0 0 0 3px rgba(54, 129, 247, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = errors.email ? "var(--sys-red)" : "rgba(0, 0, 0, 0.1)";
                    e.currentTarget.style.boxShadow = "inset 0 1px 3px rgba(0, 0, 0, 0.05)";
                  }}
                />
                {errors.email && (
                  <p style={{ fontSize: 13, color: "var(--sys-red)", marginTop: 6 }}>{errors.email}</p>
                )}
              </motion.div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
              <motion.div variants={itemVariants}>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 600,
                    marginBottom: 8,
                    color: "#0b0c10",
                  }}
                >
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+94 (0) 11 234 5678"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    fontSize: 15,
                    border: "1px solid rgba(0, 0, 0, 0.1)",
                    borderRadius: "var(--radius-md)",
                    background: "#ffffff",
                    color: "#0b0c10",
                    transition: "all 0.3s var(--ease)",
                    boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.05)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--primary)";
                    e.currentTarget.style.boxShadow = "inset 0 1px 3px rgba(0, 0, 0, 0.05), 0 0 0 3px rgba(54, 129, 247, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(0, 0, 0, 0.1)";
                    e.currentTarget.style.boxShadow = "inset 0 1px 3px rgba(0, 0, 0, 0.05)";
                  }}
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 600,
                    marginBottom: 8,
                    color: "#0b0c10",
                  }}
                >
                  Inquiry Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    fontSize: 15,
                    border: "1px solid rgba(0, 0, 0, 0.1)",
                    borderRadius: "var(--radius-md)",
                    background: "#ffffff",
                    color: "#0b0c10",
                    cursor: "pointer",
                    transition: "all 0.3s var(--ease)",
                    boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.05)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--primary)";
                    e.currentTarget.style.boxShadow = "inset 0 1px 3px rgba(0, 0, 0, 0.05), 0 0 0 3px rgba(54, 129, 247, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(0, 0, 0, 0.1)";
                    e.currentTarget.style.boxShadow = "inset 0 1px 3px rgba(0, 0, 0, 0.05)";
                  }}
                >
                  <option value="inquiry">General Inquiry</option>
                  <option value="partnership">Partnership</option>
                  <option value="support">Support</option>
                  <option value="feedback">Feedback</option>
                </select>
              </motion.div>
            </div>

            <motion.div variants={itemVariants}>
              <label
                style={{
                  display: "block",
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 8,
                  color: "#0b0c10",
                }}
              >
                Subject *
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="What is this about?"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  fontSize: 15,
                  border: errors.subject ? "1px solid var(--sys-red)" : "1px solid rgba(0, 0, 0, 0.1)",
                  borderRadius: "var(--radius-md)",
                  background: "#ffffff",
                  color: "#0b0c10",
                  transition: "all 0.3s var(--ease)",
                  boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.05)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--primary)";
                  e.currentTarget.style.boxShadow = "inset 0 1px 3px rgba(0, 0, 0, 0.05), 0 0 0 3px rgba(54, 129, 247, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = errors.subject ? "var(--sys-red)" : "rgba(0, 0, 0, 0.1)";
                  e.currentTarget.style.boxShadow = "inset 0 1px 3px rgba(0, 0, 0, 0.05)";
                }}
              />
              {errors.subject && (
                <p style={{ fontSize: 13, color: "var(--sys-red)", marginTop: 6 }}>{errors.subject}</p>
              )}
            </motion.div>

            <motion.div variants={itemVariants}>
              <label
                style={{
                  display: "block",
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 8,
                  color: "#0b0c10",
                }}
              >
                Message *
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Tell us more about your inquiry..."
                rows={6}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  fontSize: 15,
                  border: errors.message ? "1px solid var(--sys-red)" : "1px solid rgba(0, 0, 0, 0.1)",
                  borderRadius: "var(--radius-md)",
                  background: "#ffffff",
                  color: "#0b0c10",
                  fontFamily: "inherit",
                  transition: "all 0.3s var(--ease)",
                  boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.05)",
                  resize: "vertical",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--primary)";
                  e.currentTarget.style.boxShadow = "inset 0 1px 3px rgba(0, 0, 0, 0.05), 0 0 0 3px rgba(54, 129, 247, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = errors.message ? "var(--sys-red)" : "rgba(0, 0, 0, 0.1)";
                  e.currentTarget.style.boxShadow = "inset 0 1px 3px rgba(0, 0, 0, 0.05)";
                }}
              />
              {errors.message && (
                <p style={{ fontSize: 13, color: "var(--sys-red)", marginTop: 6 }}>{errors.message}</p>
              )}
            </motion.div>

            <motion.div
              style={{
                display: "flex",
                gap: 12,
                marginTop: 12,
                flexWrap: "wrap",
              }}
              variants={itemVariants}
            >
              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  padding: "14px 32px",
                  fontSize: 15,
                  fontWeight: 600,
                  border: "none",
                  borderRadius: "var(--radius-pill)",
                  background: isSubmitting
                    ? "rgba(0, 119, 182, 0.5)"
                    : "linear-gradient(135deg, #023e8a 0%, #0077B6 100%)",
                  color: "#ffffff",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  boxShadow: "0 6px 18px rgba(0, 119, 182, 0.35)",
                  transition: "all 0.3s var(--ease)",
                }}
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </motion.button>

              <motion.button
                type="reset"
                onClick={() => {
                  setFormData({
                    name: "",
                    email: "",
                    phone: "",
                    subject: "",
                    message: "",
                    type: "inquiry",
                  });
                  setErrors({});
                }}
                style={{
                  padding: "14px 32px",
                  fontSize: 15,
                  fontWeight: 600,
                  border: "1px solid rgba(0, 0, 0, 0.1)",
                  borderRadius: "var(--radius-pill)",
                  background: "#ffffff",
                  color: "#0b0c10",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                  transition: "all 0.3s var(--ease)",
                }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                Clear Form
              </motion.button>
            </motion.div>

            {submitStatus === "success" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{
                  padding: "14px 16px",
                  background: "rgba(52, 199, 89, 0.1)",
                  border: "1px solid var(--sys-green)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--sys-green)",
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                ✓ Message sent successfully! We'll be in touch soon.
              </motion.div>
            )}

            {submitStatus === "error" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{
                  padding: "14px 16px",
                  background: "rgba(255, 59, 48, 0.1)",
                  border: "1px solid var(--sys-red)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--sys-red)",
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                ✕ Something went wrong. Please try again.
              </motion.div>
            )}
          </motion.form>
        </motion.div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        className="full-section"
        style={{
          background: "linear-gradient(135deg, #ffffff 0%, #CAF0F8 50%, #ffffff 100%)",
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
            Still have questions?
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
            Check out our comprehensive FAQ section or browse our documentation to find instant answers.
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
              href="/faq"
              style={{
                textDecoration: "none",
              }}
            >
              View FAQ
            </a>
            <a
              className="button-outline"
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
            >
              Back to Home
            </a>
          </motion.div>
        </motion.div>
      </motion.section>
    </>
  );
}
