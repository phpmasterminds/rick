'use client';

import Link from 'next/link';
import styles from './pricing.module.css';

export default function PricingPage() {
  return (
    <>
      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles['hero-container']}>
          <h1>Transparent, Affordable Pricing</h1>
          <p className={styles['hero-subtitle']}>
            Choose the plan that fits your business. Scale as you grow. No hidden
            fees, no surprises.
          </p>
          <div className={styles['savings-banner']}>
            Save $1,000s Annually vs. Competitors
          </div>
        </div>
      </section>

      {/* PRICING PLANS */}
      <section className={styles['pricing-plans']}>
        <span className={styles['section-tag']}>Our Plans</span>
        <h2>Flexible Pricing for Every Business</h2>
        <p className={styles['section-description']}>
          Whether you're just starting out or managing a large operation, we
          have a plan that fits your needs and budget.
        </p>

        <div className={styles['plans-container']}>
          {/* FREE TRIAL */}
          <div className={styles['plan-card']}>
            <div className={styles['plan-name']}>Free Trial</div>
            <div className={styles['plan-price']}>
              <div className={styles['price-amount']}>$0</div>
              <div className={styles['price-period']}>for 30 days</div>
            </div>
            <p className={styles['plan-description']}>
              Experience the full platform with zero commitment. No credit card
              required.
            </p>
            <ul className={styles['plan-features']}>
              <li>Full access to all features</li>
              <li>Unlimited product listings</li>
              <li>Free e-commerce business page</li>
              <li>Order management tools</li>
              <li>Analytics and reporting</li>
              <li>Customer support</li>
            </ul>
            <Link
              href="/register"
              className={`${styles['btn-plan']} ${styles['btn-plan-primary']}`}
            >
              Start Free Trial
            </Link>
          </div>

          {/* STARTER */}
          <div className={`${styles['plan-card']} ${styles.featured}`}>
            <div className={styles['plan-badge']}>MOST POPULAR</div>
            <div className={styles['plan-name']}>Starter</div>
            <div className={styles['plan-price']}>
              <div className={styles['price-amount']}>Contact</div>
              <div className={styles['price-period']}>for pricing</div>
            </div>
            <p className={styles['plan-description']}>
              Perfect for small to medium cannabis brands and retailers getting
              started.
            </p>
            <ul className={styles['plan-features']}>
              <li>Everything in Free Trial</li>
              <li>Priority customer support</li>
              <li>Advanced analytics</li>
              <li>Custom branding options</li>
              <li>Volume discounts available</li>
              <li>Monthly or annual billing</li>
            </ul>
            <Link
              href="/contact"
              className={`${styles['btn-plan']} ${styles['btn-plan-primary']}`}
            >
              Contact Sales
            </Link>
          </div>

          {/* ENTERPRISE */}
          <div className={styles['plan-card']}>
            <div className={styles['plan-name']}>Enterprise</div>
            <div className={styles['plan-price']}>
              <div className={styles['price-amount']}>Custom</div>
              <div className={styles['price-period']}>tailored to you</div>
            </div>
            <p className={styles['plan-description']}>
              For large operations requiring customized solutions and dedicated
              support.
            </p>
            <ul className={styles['plan-features']}>
              <li>Everything in Starter</li>
              <li>Custom integrations</li>
              <li>Dedicated account manager</li>
              <li>White-label options</li>
              <li>API access</li>
              <li>Partner program benefits</li>
            </ul>
            <Link
              href="/contact"
              className={`${styles['btn-plan']} ${styles['btn-plan-secondary']}`}
            >
              Get Custom Quote
            </Link>
          </div>
        </div>
      </section>

      {/* ADDITIONAL SERVICES */}
      <section className={styles['additional-services']}>
        <div className={styles['services-container']}>
          <span className={styles['section-tag']}>Additional Services</span>
          <h2>Grow Your Business Further</h2>
          <p className={styles['section-description']}>
            Enhance your marketplace presence with additional services designed
            to increase visibility and sales.
          </p>

          <div className={styles['services-grid']}>
            {[
              ['📢', 'Platform Advertising', 'Learn More →'],
              ['🤝', 'Partner Agreements', 'Become a Partner →'],
              ['🎯', 'Featured Listings', 'Increase Visibility →'],
              ['💼', 'Custom Solutions', 'Discuss Your Needs →'],
              ['📊', 'Volume Discounts', 'Get Volume Pricing →'],
              ['🎓', 'Training & Onboarding', 'Schedule Training →'],
            ].map(([icon, title, linkText]) => (
              <div key={title} className={styles['service-card']}>
                <div className={styles['service-icon']}>{icon}</div>
                <h3 className={styles['service-title']}>{title}</h3>
                <p className={styles['service-description']}>
                  {/* description kept in CSS/content file as-is */}
                </p>
                <Link href="/contact" className={styles['service-link']}>
                  {linkText}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles['cta-section']}>
        <div className={styles['cta-container']}>
          <h2>Ready to Get Started?</h2>
          <p className={styles['section-description']}>
            Try Nature&apos;s High free for 30 days. No credit card required.
            Experience the difference that affordable, powerful wholesale tools
            can make for your cannabis business.
          </p>
          <div className={styles['cta-buttons']}>
            <Link
              href="/register"
              className={`${styles.btn} ${styles['btn-primary']}`}
            >
              Start Free Trial
            </Link>
            <Link
              href="/contact"
              className={`${styles.btn} ${styles['btn-secondary']}`}
            >
              Talk to Sales
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
