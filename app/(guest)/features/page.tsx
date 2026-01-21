'use client';

import Link from 'next/link';

export default function Features() {
  return (
    <main>
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <span className="hero-badge">Platform Features</span>
            <h1>Everything You Need to Succeed</h1>
            <p className="hero-subtitle">Our comprehensive platform provides all the tools modern cannabis businesses need to manage wholesale operations efficiently. From order management to compliance tracking.</p>
            <div className="cta-buttons">
              <Link href="/register" className="btn btn-primary">Start Free Trial</Link>
              <Link href="/" className="btn btn-secondary">Back Home</Link>
            </div>
          </div>
          <div className="hero-visual">
            <div className="visual-card">
              <div className="stat-grid">
                <div className="stat-item">
                  <span className="stat-number">6+</span>
                  <span className="stat-label">Core Features</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">100%</span>
                  <span className="stat-label">Mobile Ready</span>
                </div>
              </div>
              <div className="trust-badge">
                <div className="trust-badge-title">Full-Featured Platform</div>
                <div className="trust-badge-text">Everything for cannabis wholesale</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="features-container">
          <div className="section-header">
            <span className="section-tag">Core Features</span>
            <h2>Powerful Tools for Your Business</h2>
            <p className="section-description">Explore the features that make Nature's High the best choice for cannabis wholesale.</p>
          </div>
          <div className="features-grid">
            <div className="feature-item fade-in">
              <div className="feature-number">01</div>
              <div className="feature-content">
                <h3>Order Management</h3>
                <p>Streamlined order processing with real-time tracking and communication tools for seamless transactions.</p>
              </div>
            </div>
            <div className="feature-item fade-in">
              <div className="feature-number">02</div>
              <div className="feature-content">
                <h3>Inventory Tracking</h3>
                <p>Real-time inventory management with multi-location support and automated low-stock alerts.</p>
              </div>
            </div>
            <div className="feature-item fade-in">
              <div className="feature-number">03</div>
              <div className="feature-content">
                <h3>CRM Tools</h3>
                <p>Build relationships with integrated customer management. Track history, preferences, and communication.</p>
              </div>
            </div>
            <div className="feature-item fade-in">
              <div className="feature-number">04</div>
              <div className="feature-content">
                <h3>Analytics & Reporting</h3>
                <p>Comprehensive insights and data-driven reports. Monitor sales, trends, and performance metrics.</p>
              </div>
            </div>
            <div className="feature-item fade-in">
              <div className="feature-number">05</div>
              <div className="feature-content">
                <h3>Compliance Tools</h3>
                <p>Automated compliance tracking for state regulations. Manage reporting with ease and confidence.</p>
              </div>
            </div>
            <div className="feature-item fade-in">
              <div className="feature-number">06</div>
              <div className="feature-content">
                <h3>Mobile Access</h3>
                <p>Manage your business anywhere. Mobile-optimized tools for iOS and Android devices.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-container">
          <h2>Ready to Get Started?</h2>
          <p>Experience all features with a free 30-day trial.</p>
          <Link href="/register" className="btn btn-cta">Start Free Trial</Link>
        </div>
      </section>
    </main>
  );
}