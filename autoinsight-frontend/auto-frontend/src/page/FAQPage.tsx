import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, HelpCircle, ChevronDown } from 'lucide-react';
import '../styles/FAQPage.css';

interface FAQItem {
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    question: 'What is AutoInsight?',
    answer:
      'AutoInsight is a vehicle market analytics platform for Sri Lanka that helps you search, compare, and analyze vehicle listings with real-time pricing data, market trends, and actionable insights to make smarter buying decisions.',
  },
  {
    question: 'How does the search feature work?',
    answer:
      'Use our advanced search with filters for make, model, year, price range, mileage, city, and vehicle condition. Results are displayed with market insights, pricing trends, and listing quality indicators.',
  },
  {
    question: 'Can I save my favorite vehicles?',
    answer:
      'Yes! You can save vehicles to your favorites list while browsing. This keeps your shortlist organized so you can compare options and review them later.',
  },
  {
    question: 'How does the comparison feature work?',
    answer:
      'Select multiple vehicles and use our smart comparison tool to view them side-by-side. Compare specifications, pricing, condition, location, and market signals all in one view.',
  },
  {
    question: 'What market insights does AutoInsight provide?',
    answer:
      'We provide pricing direction, market trends, listing quality metrics, regional context, and comparative analysis to help you understand vehicle values and identify good deals.',
  },
  {
    question: 'Is AutoInsight only for Sri Lanka?',
    answer:
      'Currently, AutoInsight focuses on vehicle market data and listings for Sri Lanka. We provide localized insights, regional pricing, and context specific to the Sri Lankan automotive market.',
  },
  {
    question: 'How often is the listing data updated?',
    answer:
      'Our data is regularly updated to reflect current market listings and pricing trends. We continuously scrape and analyze listings from major vehicle marketplaces to keep our information fresh and accurate.',
  },
  {
    question: 'Does AutoInsight help with vehicle inspection?',
    answer:
      'While AutoInsight doesn\'t conduct inspections, we provide clear, practical details and checklists to prepare you for the inspection process. Our listings include comprehensive information to help you plan effectively.',
  },
  {
    question: 'How can I contact a seller?',
    answer:
      'Each listing includes direct contact information for the seller. From the vehicle detail page, you can reach out to the seller to arrange viewings, ask questions, or proceed with your purchase.',
  },
  {
    question: 'How can I track vehicle price trends and market changes?',
    answer:
      'AutoInsight displays pricing trends and market direction indicators for each vehicle type. You can monitor how prices change over time for specific makes and models to identify the best time to buy or understand market movements.',
  },
  {
    question: 'How do I use the location filter?',
    answer:
      'The location filter lets you search for vehicles in specific cities and regions across Sri Lanka. This helps you find listings near you or in areas that matter for your purchase decision.',
  },
  {
    question: 'What data sources does AutoInsight use?',
    answer:
      'We aggregate vehicle listing data from major automotive marketplaces and sources in Sri Lanka. Our data sources page provides detailed information about where our listings and market data come from.',
  },
  {
    question: 'How is my data protected?',
    answer:
      'We take your privacy seriously. Your data is encrypted and stored securely. Visit our Privacy Policy page for detailed information about data protection, collection, and usage practices.',
  },
  {
    question: 'What if I find an incorrect listing?',
    answer:
      'You can report incorrect or suspicious listings through our contact page. Our team reviews flagged listings to maintain data accuracy and platform quality.',
  },
  {
    question: 'What should I look for when comparing vehicles?',
    answer:
      'When comparing vehicles on AutoInsight, focus on key factors like price, mileage, year, condition, location, and market signals. Our comparison tool highlights differences in specifications and pricing trends to help you make data-driven decisions and find the best value.',
  },
];

const FAQPage: React.FC = () => {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  return (
    <div className="faq-page">
      {/* Hero Section */}
      <section className="faq-hero">
        <span className="faq-badge">
          <HelpCircle size={16} /> Common Questions
        </span>
        <h1>Frequently Asked Questions</h1>
        <p>
          Find answers to common questions about AutoInsight, our features, data, and how to get the most out of our platform.
        </p>
        <div className="faq-hero-actions">
          <Link to="/results" className="faq-btn-primary">
            Explore Listings <ArrowRight size={16} />
          </Link>
          <Link to="/guides" className="faq-btn-secondary">
            View Guide
          </Link>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-container">
        <div className="faq-section">
          <h2 className="faq-section-title">All Questions</h2>
          <div className="faq-list">
            {faqItems.map((item, index) => (
              <div key={index} className="faq-item">
                <button
                  className="faq-question"
                  onClick={() => toggleFAQ(index)}
                  aria-expanded={expandedFAQ === index}
                >
                  <span>{item.question}</span>
                  <ChevronDown
                    size={18}
                    className={`faq-chevron ${expandedFAQ === index ? 'expanded' : ''}`}
                  />
                </button>
                {expandedFAQ === index && (
                  <div className="faq-answer">
                    {item.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="faq-cta">
        <div>
          <h3>Didn't find your answer?</h3>
          <p>Our support team is here to help. Reach out with any questions or concerns.</p>
        </div>
        <Link to="/contact" className="faq-cta-link">
          Contact Support
        </Link>
      </section>
    </div>
  );
};

export default FAQPage;
