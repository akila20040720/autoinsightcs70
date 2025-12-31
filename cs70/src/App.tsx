// src/App.tsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import AnalyticalBaseBackground from "./components/VehicleBackground";
import Footer from "./components/Footer";
// import CookieConsent from "./components/CookieConsent"; // add back if you use it

import Home from "./pages/Home";
import About from "./pages/About";
import Features from "./pages/Features";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import CustomCursor from "./components/CustomCursor";

export default function App(): React.ReactElement {
  return (
    <>
      <AnalyticalBaseBackground />
      <Navbar />
      <main style={{ paddingTop: 106 }} className="page-transition">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/features" element={<Features />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />

          {/* Any unknown route -> redirect to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <CustomCursor />
      {/* <CookieConsent /> */}
    </>
  );
}
