import React from "react";


interface Feature {
  title: string;
  desc: string;
  icon: React.ReactNode;
}

const features: Feature[] = [
  { icon: "👤", title: "Profile Management", desc: "Easily manage your personalized settings, saved searches, and communication preferences." },
  { icon: "⚙", title: "Interactive Filtering Dashboard", desc: "Control data views based on brand, model, year, mileage, transmission, and fuel type." },
  { icon: "📉", title: "Price-Mileage Scatter", desc: "Visualize the correlation between vehicle price and mileage to identify market outliers." },
  { icon: "📊", title: "Historical Price Trends", desc: "Analyze the long-term historical price movements of specific vehicle models." },
  { icon: "🔥", title: "Trending Models", desc: "See which vehicles are performing the best based on weekly and monthly search and sales activity." },
  { icon: "🗺", title: "Geographic Market View", desc: "Geographic heatmaps showing supply and demand across different provinces." },
  { icon: "🔔", title: "Custom Price Watch", desc: "Set up instant alerts for vehicles that match your criteria and drop below your target price." },
  { icon: "⚖", title: "Side-by-Side Comparison", desc: "Side-by-side comparison of vehicle specifications and market value." },
  { icon: "🔮", title: "AI Price Prediction", desc: "Utilize an advanced model to forecast the future price of any used vehicle." },
  { icon: "🤖", title: "AI Market Assistant", desc: "Chat with an intelligent bot to discuss emerging trends and market insights." }
];

export default function Features() {
  return (
    <div className="features-wrapper">
      
      {/* SECTION 1: Dark Theme Intro */}
      <section className="features-hero">
        <div className="features-hero-content">
          <h1 className="features-hero-title">Let's Dive into Features</h1>
          <p className="features-hero-subtitle">
            Explore the powerful tools designed to give you the market advantage.
          </p>
        </div>
      </section>

      {/* SECTION 2: White Theme Grid */}
      <section className="features-white-section">
        <div className="features-container">
          <div className="features-grid">
            {features.map((f, i) => (
              <div key={i} className="feature-card">
                <div className="feature-icon-wrapper">
                  {f.icon}
                </div>
                <h2 className="feature-title">{f.title}</h2>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
