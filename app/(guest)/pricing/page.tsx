'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Pricing() {
  const [billingPeriod, setBillingPeriod] = useState('monthly');

  const plans = [
    {
      name: 'Starter',
      price: billingPeriod === 'monthly' ? '$99' : '$990',
      period: billingPeriod === 'monthly' ? '/month' : '/year',
      features: ['Up to 100 products', 'Basic order management', 'Email support', 'Mobile app access']
    },
    {
      name: 'Professional',
      price: billingPeriod === 'monthly' ? '$299' : '$2,990',
      period: billingPeriod === 'monthly' ? '/month' : '/year',
      features: ['Unlimited products', 'Advanced features', 'Priority support', 'CRM included', 'Analytics & reports', 'API access'],
      highlighted: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'quote',
      features: ['Everything included', 'Custom integrations', 'Dedicated support', 'Advanced compliance', 'SLA guaranteed']
    }
  ];

  return (
    <main>
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <span className="hero-badge">Pricing</span>
            <h1>Simple, Transparent Pricing</h1>
            <p className="hero-subtitle">Choose the plan that fits your business. All plans include a 30-day free trial with no credit card required.</p>
            <div className="cta-buttons">
              <Link href="/auth/register" className="btn btn-primary">Start Free Trial</Link>
            </div>
          </div>
          <div className="hero-visual">
            <div className="visual-card">
              <div className="stat-grid">
                <div className="stat-item">
                  <span className="stat-number">3</span>
                  <span className="stat-label">Flexible Plans</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">30</span>
                  <span className="stat-label">Days Free</span>
                </div>
              </div>
              <div className="trust-badge">
                <div className="trust-badge-title">No Setup Fees</div>
                <div className="trust-badge-text">No hidden charges, only what you see</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="benefits">
        <div className="section-header">
          <span className="section-tag">Billing</span>
          <h2>Choose Your Billing Period</h2>
        </div>
        <div style={{textAlign: 'center', marginBottom: '3rem'}}>
          <label style={{fontSize: '1.1rem', fontWeight: '600'}}>
            <input 
              type="radio" 
              value="monthly" 
              checked={billingPeriod === 'monthly'}
              onChange={(e) => setBillingPeriod(e.target.value)}
              style={{marginRight: '0.5rem'}}
            />
            Monthly
          </label>
          <label style={{fontSize: '1.1rem', fontWeight: '600', marginLeft: '2rem'}}>
            <input 
              type="radio" 
              value="annual" 
              checked={billingPeriod === 'annual'}
              onChange={(e) => setBillingPeriod(e.target.value)}
              style={{marginRight: '0.5rem'}}
            />
            Annual (Save 10%)
          </label>
        </div>

        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', maxWidth: '1400px', margin: '0 auto'}}>
          {plans.map((plan) => (
            <div key={plan.name} style={{
              background: plan.highlighted ? 'var(--warm-white)' : 'var(--cream)',
              border: plan.highlighted ? '2px solid var(--forest-700)' : '1px solid var(--sage-300)',
              borderRadius: '12px',
              padding: '2.5rem',
              textAlign: 'center',
              transition: 'all 0.3s ease',
              transform: plan.highlighted ? 'scale(1.05)' : 'scale(1)'
            }}>
              <h3 style={{fontSize: '1.5rem', fontWeight: '700', color: 'var(--forest-900)', marginBottom: '1rem'}}>{plan.name}</h3>
              <div style={{fontSize: '2.5rem', fontWeight: '600', color: 'var(--forest-700)', marginBottom: '0.5rem'}}>
                {plan.price}
                {plan.period !== 'quote' && <span style={{fontSize: '1rem'}}>{plan.period}</span>}
              </div>
              <div style={{marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid var(--sage-300)'}}>
                {plan.features.map((feature, i) => (
                  <div key={i} style={{padding: '0.5rem 0', color: 'var(--earth-700)', fontSize: '0.9rem'}}>
                    ✓ {feature}
                  </div>
                ))}
              </div>
              <Link href="/auth/register" className="btn btn-primary" style={{width: '100%', textAlign: 'center', display: 'block'}}>
                {plan.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-container">
          <h2>Questions About Pricing?</h2>
          <p>Contact our team or view our FAQ page.</p>
          <Link href="/contact" className="btn btn-cta">Contact Us</Link>
        </div>
      </section>
    </main>
  );
}