'use client';

import Link from 'next/link';

export default function About() {
  return (
    <main>
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <span className="hero-badge">About Us</span>
            <h1>Cannabis Industry Pioneers</h1>
            <p className="hero-subtitle">Since the late 90s, we've been innovators in cannabis business solutions. Our mission: help legal cannabis businesses thrive through modern technology.</p>
            <div className="cta-buttons">
              <Link href="/contact" className="btn btn-primary">Get in Touch</Link>
            </div>
          </div>
          <div className="hero-visual">
            <div className="visual-card">
              <div className="stat-grid">
                <div className="stat-item">
                  <span className="stat-number">25+</span>
                  <span className="stat-label">Years Experience</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">5000+</span>
                  <span className="stat-label">Businesses Served</span>
                </div>
              </div>
              <div className="trust-badge">
                <div className="trust-badge-title">Industry Leaders</div>
                <div className="trust-badge-text">Trusted by cannabis professionals</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="benefits">
        <div className="section-header">
          <span className="section-tag">Our Story</span>
          <h2>Built on Cannabis Industry Expertise</h2>
          <p className="section-description">We understand the unique challenges of cannabis wholesale because we've been part of this industry since the beginning.</p>
        </div>
        <div className="benefits-grid">
          <div className="benefit-card fade-in">
            <div className="benefit-icon">🎯</div>
            <h3 className="benefit-title">Our Mission</h3>
            <p className="benefit-description">To empower cannabis businesses with modern technology that simplifies wholesale operations, ensures compliance, and enables sustainable growth across the legal cannabis supply chain.</p>
          </div>
          <div className="benefit-card fade-in">
            <div className="benefit-icon">💡</div>
            <h3 className="benefit-title">Our Vision</h3>
            <p className="benefit-description">To be the most trusted and used B2B cannabis marketplace, connecting every part of the legal supply chain with fair pricing and transparent business practices.</p>
          </div>
          <div className="benefit-card fade-in">
            <div className="benefit-icon">🤝</div>
            <h3 className="benefit-title">Our Values</h3>
            <p className="benefit-description">Innovation, integrity, and accessibility. We continuously improve our platform, operate with transparency, and make advanced technology available to all cannabis businesses.</p>
          </div>
          <div className="benefit-card fade-in">
            <div className="benefit-icon">👥</div>
            <h3 className="benefit-title">Our Team</h3>
            <p className="benefit-description">Cannabis industry veterans combined with technology experts. We've dedicated our careers to making cannabis wholesale simpler, fairer, and more efficient.</p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-container">
          <h2>Join Our Community</h2>
          <p>Be part of the modern cannabis wholesale revolution.</p>
          <Link href="/register" className="btn btn-cta">Get Started Today</Link>
        </div>
      </section>
    </main>
  );
}