'use client';

import Link from 'next/link';

export default function Brands() {
  return (
    <main>
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <span className="hero-badge">For Cannabis Brands</span>
            <h1>Grow Your Brand, Scale Your Wholesale</h1>
            <p className="hero-subtitle">Reach dispensaries and retailers nationwide with Nature's High. Connect directly with buyers, manage orders efficiently, and grow your distribution network without expensive middlemen.</p>
            <div className="cta-buttons">
              <Link href="/register" className="btn btn-primary">Start Free Trial</Link>
              <Link href="/features" className="btn btn-secondary">Learn More</Link>
            </div>
          </div>
          <div className="hero-visual">
            <div className="visual-card">
              <div className="stat-grid">
                <div className="stat-item">
                  <span className="stat-number">Higher Margins</span>
                  <span className="stat-label">Sell Direct, Cut Middlemen</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">National Reach</span>
                  <span className="stat-label">Access 50+ Licensed Markets</span>
                </div>
              </div>
              <div className="trust-badge">
                <div className="trust-badge-title">Brand-Focused Tools</div>
                <div className="trust-badge-text">Built specifically for cannabis producers</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="benefits">
        <div className="section-header">
          <span className="section-tag">Why Brands Choose Us</span>
          <h2>Tools Built for Your Success</h2>
          <p className="section-description">Everything you need to scale your wholesale business and reach more buyers.</p>
        </div>
        <div className="benefits-grid">
          <div className="benefit-card fade-in">
            <div className="benefit-icon">🌍</div>
            <h3 className="benefit-title">Nationwide Reach</h3>
            <p className="benefit-description">Access dispensaries and retailers across all licensed cannabis markets. Expand your distribution network without geographical limitations.</p>
          </div>
          <div className="benefit-card fade-in">
            <div className="benefit-icon">💎</div>
            <h3 className="benefit-title">Higher Profit Margins</h3>
            <p className="benefit-description">Sell directly to retailers without expensive middlemen. Keep more profit and reinvest in growing your brand.</p>
          </div>
          <div className="benefit-card fade-in">
            <div className="benefit-icon">📱</div>
            <h3 className="benefit-title">Free Public Business Page</h3>
            <p className="benefit-description">Showcase your products and brand story with a professional public profile. Attract new wholesale buyers at no extra cost.</p>
          </div>
          <div className="benefit-card fade-in">
            <div className="benefit-icon">📊</div>
            <h3 className="benefit-title">Smart Analytics</h3>
            <p className="benefit-description">Track sales performance, buyer preferences, and market trends. Make data-driven decisions to optimize your product mix.</p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-container">
          <h2>Ready to Expand Your Brand?</h2>
          <p>Join hundreds of cannabis brands growing their wholesale business on Nature's High.</p>
          <div className="cta-highlight">
            <div className="cta-highlight-title">30-Day Free Trial</div>
            <div className="cta-highlight-text">No credit card required. Full access to all brand tools.</div>
          </div>
          <Link href="/register" className="btn btn-cta">Start Now</Link>
        </div>
      </section>
    </main>
  );
}