import React from "react";
import { motion } from "framer-motion";
import ChatbotButton from "../components/ChatbotButton";
import {
  User,
  Settings,
  TrendingDown,
  BarChart3,
  Flame,
  Map,
  Bell,
  Scale,
  Sparkles,
  Bot,
} from "lucide-react";

interface Feature {
  title: string;
  desc: string;
  icon: React.ReactNode;
}

const features: Feature[] = [
  { icon: <User className="w-8 h-8" />, title: "Profile Management", desc: "Easily manage your personalized settings, saved searches, and communication preferences." },
  { icon: <Settings className="w-8 h-8" />, title: "Interactive Filtering Dashboard", desc: "Control data views based on brand, model, year, mileage, transmission, and fuel type." },
  { icon: <TrendingDown className="w-8 h-8" />, title: "Price-Mileage Scatter", desc: "Visualize the correlation between vehicle price and mileage to identify market outliers." },
  { icon: <BarChart3 className="w-8 h-8" />, title: "Historical Price Trends", desc: "Analyze the long-term historical price movements of specific vehicle models." },
  { icon: <Flame className="w-8 h-8" />, title: "Trending Models", desc: "See which vehicles are performing the best based on weekly and monthly search and sales activity." },
  { icon: <Map className="w-8 h-8" />, title: "Geographic Market View", desc: "Geographic heatmaps showing supply and demand across different provinces." },
  { icon: <Bell className="w-8 h-8" />, title: "Custom Price Watch", desc: "Set up instant alerts for vehicles that match your criteria and drop below your target price." },
  { icon: <Scale className="w-8 h-8" />, title: "Side-by-Side Comparison", desc: "Side-by-side comparison of vehicle specifications and market value." },
  { icon: <Sparkles className="w-8 h-8" />, title: "AI Price Prediction", desc: "Utilize an advanced model to forecast the future price of any used vehicle." },
  { icon: <Bot className="w-8 h-8" />, title: "AI Market Assistant", desc: "Chat with an intelligent bot to discuss emerging trends and market insights." }
];

export default function Features() {
  return (
    <div className="features-wrapper">
      
      {/* SECTION 1: Dark Theme Intro */}
      <motion.section 
        className="features-hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="features-hero-content">
          <motion.h1 
            className="features-hero-title"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Let's Dive into Features
          </motion.h1>
          <motion.p 
            className="features-hero-subtitle"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Explore the powerful tools designed to give you the market advantage.
          </motion.p>
          <motion.button 
            className="features-hero-button"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            whileHover={{ scale: 1.05, boxShadow: "0 8px 30px rgba(0, 119, 182, 0.5)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              const featuresSection = document.querySelector('.features-white-section');
              featuresSection?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Browse Features 
          </motion.button>
        </div>
      </motion.section>

      {/* SECTION 2: White Theme Grid */}
      <motion.section 
        className="features-white-section"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="features-container">
          <div className="features-grid">
            {features.map((f, i) => (
              <motion.div 
                key={i} 
                className="feature-card"
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 0.5, 
                  delay: i * 0.1,
                  type: "spring",
                  stiffness: 100 
                }}
                whileHover={{ 
                  y: -10, 
                  scale: 1.05,
                  boxShadow: "0 12px 32px rgba(0, 119, 182, 0.2)",
                  transition: { duration: 0.3 }
                }}
              >
                <motion.div 
                  className="feature-icon-wrapper"
                  whileHover={{ rotate: 360, scale: 1.2 }}
                  transition={{ duration: 0.6 }}
                >
                  {f.icon}
                </motion.div>
                <h2 className="feature-title">{f.title}</h2>
                <p className="feature-desc">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Chatbot Button */}
      <ChatbotButton />
    </div>
  );
}