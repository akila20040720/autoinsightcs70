// src/App.tsx
import { useEffect, useState } from "react";
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import AnalyticalBaseBackground from "./components/VehicleBackground";
import Footer from "./components/Footer";
import SplashScreen from "./components/SplashScreen";
// import CookieConsent from "./components/CookieConsent"; // add back if you use it

import Home from "./pages/Home";
import About from "./pages/About";
import Features from "./pages/Features";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import CustomCursor from "./components/CustomCursor";
import ScrollToTop from "./components/ScrollToTop";

export default function App(): React.ReactElement {
  const [showSplash, setShowSplash] = useState(true);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    

    // Add overflow hidden to body when splash is showing
    if (showSplash) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [showSplash]);

  const handleSplashComplete = () => {
    // Mark splash as shown for this session
    sessionStorage.setItem('splashShown', 'true');
    
    // Hide splash screen
    setShowSplash(false);
    
    // Small delay before showing content for smooth transition
    setTimeout(() => {
      setAppReady(true);
      document.body.style.overflow = '';
    }, 100);
  };

  // Show only splash screen while loading
  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }
  return (
    
    <>
      <AnalyticalBaseBackground />
      <Navbar />
      <main style={{ paddingTop: 84, opacity: appReady ? 1 : 0,transition:'opacity 0.5s ease-in-out' }} className="page-transition">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/features" element={<Features />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />

          {/* Any unknown route -> show 404 page */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <CustomCursor />
      <ScrollToTop />
      {/* <CookieConsent /> */}
    </>
  );
}