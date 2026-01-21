'use client';

import Link from 'next/link';

export default function Retailers() {
  return (
    <main>
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <span className="hero-badge">For Cannabis Retailers</span>
            <h1>Streamline Your Supply Chain</h1>
            <p className="hero-subtitle">Connect directly with verified brands and wholesalers. Order quality products, manage multiple suppliers from one platform, and reduce costs with direct-to-retailer pricing.</p>
            <div className="cta-buttons">
              <Link href="/register" className="btn btn-primary">Start Free Trial</Link>
              <Link href="/features" className="btn btn-secondary">Learn More</Link>
            </div>
          </div>
          <div className="hero-visual">
            <div className="visual-card">
              <div className="stat-grid">
                <div className="stat-item">
                  <span className="stat-number">Lower Costs</span>
                  <span className="stat-label">Direct Pricing, No Markup</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">Easy Compliance</span>
                  <span className="stat-label">Automated Tracking Built-In</span>
                </div>
              </div>
              <div className="trust-badge">
                <div className="trust-badge-title">Retailer-Focused</div>
                <div className="trust-badge-text">Built for dispensaries and cannabis retailers</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="benefits">
        <div className="section-header">
          <span className="section-tag">Why Retailers Choose Us</span>
          <h2>Tools That Save You Money</h2>
          <p className="section-description">Reduce costs, improve efficiency, and grow your retail business.</p>
        </div>
        <div className="benefits-grid">
          <div className="benefit-card fade-in">
            <div className="benefit-icon">✅</div>
            <h3 className="benefit-title">Quality Products</h3>
            <p className="benefit-description">Connect directly with verified brands and wholesalers. Source quality products you trust for your customers.</p>
          </div>
          <div className="benefit-card fade-in">
            <div className="benefit-icon">💰</div>
            <h3 className="benefit-title">Better Pricing</h3>
            <p className="benefit-description">Direct-to-retailer pricing without middleman markups. Improve your margins and stay competitive.</p>
          </div>
          <div className="benefit-card fade-in">
            <div className="benefit-icon">⚡</div>
            <h3 className="benefit-title">Fast Ordering</h3>
            <p className="benefit-description">Place orders anytime, track shipments in real-time, and manage multiple suppliers from one dashboard.</p>
          </div>
          <div className="benefit-card fade-in">
            <div className="benefit-icon">📋</div>
            <h3 className="benefit-title">Compliance Made Easy</h3>
            <p className="benefit-description">All tracking and reporting built-in. Stay compliant with state regulations without the headache.</p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-container">
          <h2>Reduce Costs. Improve Efficiency. Grow Your Business.</h2>
          <p>Start connecting with quality brands today.</p>
          <div className="cta-highlight">
            <div className="cta-highlight-title">30-Day Free Trial</div>
            <div className="cta-highlight-text">No credit card required. Full access to all retailer tools.</div>
          </div>
          <Link href="/register" className="btn btn-cta">Get Started</Link>
        </div>
      </section>
    </main>
  );
}