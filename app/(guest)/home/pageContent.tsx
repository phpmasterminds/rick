'use client';

import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <main>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <span className="hero-badge">Legal Cannabis B2B Marketplace</span>
            <h1>Wholesale Cannabis Trading, Simplified</h1>
            <p className="hero-subtitle">Nature's High is a modern B2B wholesale marketplace built specifically for the legal cannabis industry. We connect licensed cannabis brands and wholesalers with dispensaries, retailers, and other wholesale buyers across the nation—all on one easy-to-use platform.</p>
            <p className="hero-description">Our mission is simple: help cannabis businesses grow by making wholesale trading more accessible, affordable, and efficient.</p>
            <div className="cta-buttons">
              <Link href="/auth/register" className="btn btn-primary">Start 30-Day Free Trial</Link>
              <Link href="#demo" className="btn btn-secondary">See How It Works</Link>
            </div>
          </div>
          <div className="hero-visual">
            <div className="visual-card">
              <div className="stat-grid">
                <div className="stat-item">
                  <span className="stat-number">$1000s</span>
                  <span className="stat-label">Saved Annually</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">30</span>
                  <span className="stat-label">Days Free Trial</span>
                </div>
              </div>
              <div className="trust-badge">
                <div className="trust-badge-title">Licensed & Compliant</div>
                <div className="trust-badge-text">Built for the regulated cannabis industry</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits">
        <div className="section-header">
          <span className="section-tag">Why Nature's High</span>
          <h2>Built for Cannabis Businesses</h2>
          <p className="section-description">We understand the unique challenges of cannabis wholesale. Our platform delivers the tools and savings you need to thrive in this competitive market.</p>
        </div>
        <div className="benefits-grid">
          <div className="benefit-card fade-in">
            <div className="benefit-icon">💰</div>
            <h3 className="benefit-title">Massive Cost Savings</h3>
            <p className="benefit-description">Save thousands of dollars annually compared to expensive competitors like LeafLink. We believe in affordable pricing that helps your business grow, not drain your profits.</p>
          </div>
          <div className="benefit-card fade-in">
            <div className="benefit-icon">🚀</div>
            <h3 className="benefit-title">Easy Customer Onboarding</h3>
            <p className="benefit-description">Pre-register your existing customers for seamless ordering. They can start purchasing immediately without complicated setup processes.</p>
          </div>
          <div className="benefit-card fade-in">
            <div className="benefit-icon">🎯</div>
            <h3 className="benefit-title">Flexible Deal Management</h3>
            <p className="benefit-description">Create custom deals and discounts for specific customers or product categories. Manage promotions with complete control and transparency.</p>
          </div>
          <div className="benefit-card fade-in">
            <div className="benefit-icon">🌐</div>
            <h3 className="benefit-title">Free Public Business Page</h3>
            <p className="benefit-description">Promote your brand with a professional public profile page. Showcase your products, share your story, and attract new wholesale buyers—at no extra cost.</p>
          </div>
          <div className="benefit-card fade-in">
            <div className="benefit-icon">🤝</div>
            <h3 className="benefit-title">Wholesale-to-Wholesale Trading</h3>
            <p className="benefit-description">Expand your reach beyond retail. Sell to other wholesalers and grow your distribution network across the legal cannabis supply chain.</p>
          </div>
          <div className="benefit-card fade-in">
            <div className="benefit-icon">✅</div>
            <h3 className="benefit-title">Risk-Free Trial</h3>
            <p className="benefit-description">Try Nature's High completely free for 30 days. No credit card required. Experience the platform with zero commitment and see the difference for yourself.</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="features-container">
          <div className="section-header">
            <span className="section-tag">Platform Features</span>
            <h2>Everything You Need to Succeed</h2>
            <p className="section-description">Our comprehensive platform provides all the tools modern cannabis businesses need to manage wholesale operations efficiently.</p>
          </div>
          <div className="features-grid">
            <div className="feature-item fade-in">
              <div className="feature-number">01</div>
              <div className="feature-content">
                <h3>Streamlined Order Management</h3>
                <p>Process orders quickly with intuitive workflows. Track inventory, manage fulfillment, and maintain clear communication with buyers.</p>
              </div>
            </div>
            <div className="feature-item fade-in">
              <div className="feature-number">02</div>
              <div className="feature-content">
                <h3>Customer Relationship Tools</h3>
                <p>Build lasting relationships with integrated CRM features. Track purchase history, preferences, and communication in one place.</p>
              </div>
            </div>
            <div className="feature-item fade-in">
              <div className="feature-number">03</div>
              <div className="feature-content">
                <h3>Analytics & Insights</h3>
                <p>Make data-driven decisions with comprehensive reporting. Monitor sales trends, customer behavior, and product performance.</p>
              </div>
            </div>
            <div className="feature-item fade-in">
              <div className="feature-number">04</div>
              <div className="feature-content">
                <h3>Compliance Management</h3>
                <p>Stay compliant with automated tracking and reporting tools designed specifically for cannabis regulations across different states.</p>
              </div>
            </div>
            <div className="feature-item fade-in">
              <div className="feature-number">05</div>
              <div className="feature-content">
                <h3>Multi-Channel Sales</h3>
                <p>Reach dispensaries, retailers, and wholesalers through one unified platform. Expand your market without additional complexity.</p>
              </div>
            </div>
            <div className="feature-item fade-in">
              <div className="feature-number">06</div>
              <div className="feature-content">
                <h3>Mobile Accessibility</h3>
                <p>Manage your business on the go with mobile-optimized tools. Your buyers can order anytime, anywhere from their devices.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <h2>Ready to Transform Your Wholesale Business?</h2>
          <p>Join the modern cannabis marketplace that's built for growth, savings, and success.</p>
          <div className="cta-highlight">
            <div className="cta-highlight-title">Limited Time: 30-Day Free Trial</div>
            <div className="cta-highlight-text">Experience the full platform with zero commitment. No credit card required.</div>
          </div>
          <Link href="/auth/register" className="btn btn-cta">Start Your Free Trial Today</Link>
        </div>
      </section>
    </main>
  );
}