'use client';

import Link from 'next/link';
import styles from './brands.module.css';

export default function BrandsPage() {
  return (
    <>
      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles['hero-container']}>
          <div className={styles['hero-content']}>
            <span className={styles['hero-badge']}>
              For Cannabis Brands &amp; Wholesalers
            </span>
            <h1>Grow Your Brand&apos;s Distribution Network</h1>
            <p className={styles['hero-subtitle']}>
              Connect with thousands of licensed dispensaries and retailers
              across the nation. Manage your wholesale operations efficiently
              with tools designed specifically for cannabis brands.
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
                Schedule a Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className={styles.benefits}>
        <div className={styles['section-header']}>
          <span className={styles['section-tag']}>Brand Benefits</span>
          <h2>Everything Your Brand Needs to Scale</h2>
          <p className={styles['section-description']}>
            Nature&apos;s High provides cannabis brands with powerful tools to
            expand distribution, streamline operations, and increase
            profitability.
          </p>
        </div>

        <div className={styles['benefits-grid']}>
          <div className={styles['benefit-card']}>
            <div className={styles['benefit-icon']}>📈</div>
            <h3 className={styles['benefit-title']}>Expand Your Reach</h3>
            <p className={styles['benefit-description']}>
              Connect with licensed dispensaries, retailers, and wholesale
              buyers nationwide.
            </p>
          </div>

          <div className={styles['benefit-card']}>
            <div className={styles['benefit-icon']}>💎</div>
            <h3 className={styles['benefit-title']}>
              Free Public Brand Page
            </h3>
            <p className={styles['benefit-description']}>
              Showcase your products with a professional brand page—completely
              free.
            </p>
          </div>

          <div className={styles['benefit-card']}>
            <div className={styles['benefit-icon']}>🎯</div>
            <h3 className={styles['benefit-title']}>
              Smart Deal Management
            </h3>
            <p className={styles['benefit-description']}>
              Create targeted promotions, volume discounts, and special pricing
              strategies.
            </p>
          </div>

          <div className={styles['benefit-card']}>
            <div className={styles['benefit-icon']}>⚡</div>
            <h3 className={styles['benefit-title']}>
              Quick Customer Onboarding
            </h3>
            <p className={styles['benefit-description']}>
              Pre-register customers for instant access and seamless ordering.
            </p>
          </div>

          <div className={styles['benefit-card']}>
            <div className={styles['benefit-icon']}>🤝</div>
            <h3 className={styles['benefit-title']}>
              Wholesale-to-Wholesale Sales
            </h3>
            <p className={styles['benefit-description']}>
              Sell to retailers and other wholesalers from one platform.
            </p>
          </div>

          <div className={styles['benefit-card']}>
            <div className={styles['benefit-icon']}>📊</div>
            <h3 className={styles['benefit-title']}>
              Actionable Analytics
            </h3>
            <p className={styles['benefit-description']}>
              Gain insights into sales trends, customer behavior, and product
              performance.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className={styles.features}>
        <div className={styles['features-container']}>
          <div className={styles['section-header']}>
            <span className={styles['section-tag']}>
              Platform Capabilities
            </span>
            <h2>Built for Brand Success</h2>
            <p className={styles['section-description']}>
              Our platform handles the complexity of cannabis wholesale so you
              can focus on growing your brand.
            </p>
          </div>

          <div className={styles['features-list']}>
            <div className={styles['feature-item']}>
              <h3>Inventory Management</h3>
              <p>
                Track product availability in real-time and prevent overselling.
              </p>
            </div>

            <div className={styles['feature-item']}>
              <h3>Order Processing</h3>
              <p>
                Streamline order fulfillment with automated workflows.
              </p>
            </div>

            <div className={styles['feature-item']}>
              <h3>Customer Relationships</h3>
              <p>
                Build stronger relationships with integrated CRM tools.
              </p>
            </div>

            <div className={styles['feature-item']}>
              <h3>Compliance Tools</h3>
              <p>
                Stay compliant with state regulations using built-in tracking.
              </p>
            </div>

            <div className={styles['feature-item']}>
              <h3>Marketing Tools</h3>
              <p>
                Promote products and announce deals directly to buyers.
              </p>
            </div>

            <div className={styles['feature-item']}>
              <h3>Payment Processing</h3>
              <p>
                Accept payments securely with cannabis-friendly solutions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING HIGHLIGHT */}
      <section className={styles['pricing-highlight']}>
        <div className={styles['pricing-container']}>
          <h2>Affordable Pricing That Grows With You</h2>
          <p className={styles['pricing-description']}>
            Transparent pricing that helps your brand succeed.
          </p>

          <div className={styles['savings-box']}>
            <div className={styles['savings-amount']}>Save $1,000s</div>
            <div className={styles['savings-text']}>
              Compared to competitor platforms annually
            </div>
          </div>

          <Link
            href="/pricing"
            className={`${styles.btn} ${styles['btn-primary']}`}
          >
            View Pricing Plans
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className={styles['cta-section']}>
        <div className={styles['cta-container']}>
          <h2>Ready to Scale Your Brand?</h2>
          <p className={styles['section-description']}>
            Join Nature&apos;s High today and expand your distribution network.
          </p>

          <div className={styles['cta-buttons']}>
            <Link
              href="/register"
              className={`${styles.btn} ${styles['btn-primary']}`}
            >
              Start Your Free Trial
            </Link>
            <Link
              href="/contact"
              className={`${styles.btn} ${styles['btn-secondary']}`}
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
