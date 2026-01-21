'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import Link from 'next/link';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <main>
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <span className="hero-badge">Get in Touch</span>
            <h1>Contact Nature's High</h1>
            <p className="hero-subtitle">Have questions about our platform? Need support? Our team is here to help your cannabis business succeed.</p>
          </div>
          <div className="hero-visual">
            <div className="visual-card">
              <div className="stat-grid">
                <div className="stat-item">
                  <span className="stat-number">24h</span>
                  <span className="stat-label">Response Time</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">100%</span>
                  <span className="stat-label">Satisfaction</span>
                </div>
              </div>
              <div className="trust-badge">
                <div className="trust-badge-title">Expert Support</div>
                <div className="trust-badge-text">Cannabis industry professionals ready to help</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="benefits">
        <div style={{maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem'}}>
          <div>
            <h2 style={{fontSize: '2rem', fontWeight: '700', color: 'var(--forest-900)', marginBottom: '2rem'}}>Send us a Message</h2>
            {submitted && <div style={{padding: '1rem', background: 'var(--sage-300)', borderRadius: '8px', marginBottom: '2rem', color: 'var(--forest-700)'}}>✓ Thank you! We'll be in touch soon.</div>}
            <form onSubmit={handleSubmit}>
              <div style={{marginBottom: '1.5rem'}}>
                <label style={{display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--forest-900)'}}>Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required style={{width: '100%', padding: '0.75rem', border: '1px solid var(--sage-300)', borderRadius: '6px', fontFamily: 'inherit'}} />
              </div>
              <div style={{marginBottom: '1.5rem'}}>
                <label style={{display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--forest-900)'}}>Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required style={{width: '100%', padding: '0.75rem', border: '1px solid var(--sage-300)', borderRadius: '6px', fontFamily: 'inherit'}} />
              </div>
              <div style={{marginBottom: '1.5rem'}}>
                <label style={{display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--forest-900)'}}>Subject</label>
                <input type="text" name="subject" value={formData.subject} onChange={handleChange} required style={{width: '100%', padding: '0.75rem', border: '1px solid var(--sage-300)', borderRadius: '6px', fontFamily: 'inherit'}} />
              </div>
              <div style={{marginBottom: '2rem'}}>
                <label style={{display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--forest-900)'}}>Message</label>
                <textarea name="message" value={formData.message} onChange={handleChange} rows={6} required style={{width: '100%', padding: '0.75rem', border: '1px solid var(--sage-300)', borderRadius: '6px', fontFamily: 'inherit'}} />
              </div>
              <button type="submit" className="btn btn-primary" style={{width: '100%'}}>Send Message</button>
            </form>
          </div>
          <div>
            <h2 style={{fontSize: '2rem', fontWeight: '700', color: 'var(--forest-900)', marginBottom: '2rem'}}>Contact Information</h2>
            <div style={{marginBottom: '2rem'}}>
              <h3 style={{fontWeight: '700', marginBottom: '0.5rem', color: 'var(--forest-900)'}}>Email</h3>
              <p><a href="mailto:support@natureshigh.com" style={{color: 'var(--forest-700)', textDecoration: 'none'}}>support@natureshigh.com</a></p>
              <p style={{fontSize: '0.9rem', color: 'var(--earth-700)'}}>Typically respond within 24 hours</p>
            </div>
            <div style={{marginBottom: '2rem'}}>
              <h3 style={{fontWeight: '700', marginBottom: '0.5rem', color: 'var(--forest-900)'}}>Phone</h3>
              <p><a href="tel:+18002266284" style={{color: 'var(--forest-700)', textDecoration: 'none'}}>(800) 226-6284</a></p>
              <p style={{fontSize: '0.9rem', color: 'var(--earth-700)'}}>Monday-Friday, 9AM-5PM PST</p>
            </div>
            <div>
              <h3 style={{fontWeight: '700', marginBottom: '0.5rem', color: 'var(--forest-900)'}}>Address</h3>
              <p>Nature's High Inc.<br/>San Francisco, CA 94105<br/>United States</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-container">
          <h2>Ready to Get Started?</h2>
          <p>Try Nature's High free for 30 days. No credit card required.</p>
          <Link href="/register" className="btn btn-cta">Start Free Trial</Link>
        </div>
      </section>
    </main>
  );
}