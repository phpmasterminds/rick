'use client';
import Link from 'next/link';
import styles from './retailers.module.css';

export default function RetailersPage() {
  return (
    <>
      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles['hero-container']}>
          <div className={styles['hero-content']}>
            <span className={styles['hero-badge']}>
              For Dispensaries &amp; Retailers
            </span>
            <h1>Source Premium Cannabis Products with Ease</h1>
            <p className={styles['hero-subtitle']}>
              Discover and order from licensed cannabis brands nationwide.
              Access exclusive deals, streamline your wholesale ordering, and
              stock your shelves with the best products in the industry.
            </p>

            <div className={styles['cta-buttons']}>
              <Link
                href="/register"
                className={`${styles.btn} ${styles['btn-primary']}`}
              >
                Get Started
              </Link>
              <Link
                href="/contact"
                className={`${styles.btn} ${styles['btn-secondary']}`}
              >
                Tell Me More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className={styles.benefits}>
        <div className={styles['section-header']}>
          <span className={styles['section-tag']}>Retailer Benefits</span>
          <h2>Everything You Need to Stock Your Store</h2>
          <p className={styles['section-description']}>
            Nature&apos;s High makes wholesale ordering simple, efficient, and
            cost-effective for dispensaries and cannabis retailers.
          </p>
        </div>

        <div className={styles['benefits-grid']}>
          <div className={styles['benefit-card']}>
            <div className={styles['benefit-icon']}>🏪</div>
            <h3 className={styles['benefit-title']}>
              Access Licensed Brands
            </h3>
            <p className={styles['benefit-description']}>
              Browse products from verified, licensed cannabis brands nationwide.
            </p>
          </div>

          <div className={styles['benefit-card']}>
            <div className={styles['benefit-icon']}>💰</div>
            <h3 className={styles['benefit-title']}>
              Competitive Wholesale Pricing
            </h3>
            <p className={styles['benefit-description']}>
              Access exclusive deals, volume discounts, and special promotions.
            </p>
          </div>

          <div className={styles['benefit-card']}>
            <div className={styles['benefit-icon']}>⚡</div>
            <h3 className={styles['benefit-title']}>
              Simple Ordering Process
            </h3>
            <p className={styles['benefit-description']}>
              Place orders quickly, track shipments, and reorder bestsellers.
            </p>
          </div>

          <div className={styles['benefit-card']}>
            <div className={styles['benefit-icon']}>📦</div>
            <h3 className={styles['benefit-title']}>
              Reliable Fulfillment
            </h3>
            <p className={styles['benefit-description']}>
              Real-time inventory updates ensure reliable deliveries.
            </p>
          </div>

          <div className={styles['benefit-card']}>
            <div className={styles['benefit-icon']}>🎯</div>
            <h3 className={styles['benefit-title']}>
              Curated Product Discovery
            </h3>
            <p className={styles['benefit-description']}>
              Smart recommendations help you stock what sells.
            </p>
          </div>

          <div className={styles['benefit-card']}>
            <div className={styles['benefit-icon']}>📊</div>
            <h3 className={styles['benefit-title']}>
              Purchase Analytics
            </h3>
            <p className={styles['benefit-description']}>
              Make data-driven inventory decisions with reporting tools.
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className={styles['how-it-works']}>
        <div className={styles['how-container']}>
          <div className={styles['section-header']}>
            <span className={styles['section-tag']}>Simple Process</span>
            <h2>Get Started in Minutes</h2>
            <p className={styles['section-description']}>
              Start ordering from premium cannabis brands in three easy steps.
            </p>
          </div>

          <div className={styles['steps-grid']}>
            <div className={styles['step-item']}>
              <div className={styles['step-number']}>1</div>
              <h3>Create Your Account</h3>
              <p>
                Sign up with your dispensary or retail license information.
              </p>
            </div>

            <div className={styles['step-item']}>
              <div className={styles['step-number']}>2</div>
              <h3>Browse &amp; Discover</h3>
              <p>
                Explore licensed brands, view catalogs, and compare pricing.
              </p>
            </div>

            <div className={styles['step-item']}>
              <div className={styles['step-number']}>3</div>
              <h3>Order &amp; Receive</h3>
              <p>
                Place orders, track shipments, and receive reliable deliveries.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className={styles.features}>
        <div className={styles['features-container']}>
          <div className={styles['section-header']}>
            <span className={styles['section-tag']}>Platform Features</span>
            <h2>Tools Built for Retail Success</h2>
            <p className={styles['section-description']}>
              Everything you need to manage wholesale purchasing efficiently.
            </p>
          </div>

          <div className={styles['features-list']}>
            <div className={styles['feature-item']}>
              <h3>Multi-Brand Ordering</h3>
              <p>Order from multiple brands in a single checkout.</p>
            </div>

            <div className={styles['feature-item']}>
              <h3>Real-Time Inventory</h3>
              <p>Never place an order for out-of-stock items.</p>
            </div>

            <div className={styles['feature-item']}>
              <h3>Order History &amp; Reordering</h3>
              <p>Reorder your bestsellers with one click.</p>
            </div>

            <div className={styles['feature-item']}>
              <h3>Invoicing and Payments</h3>
              <p>Manage invoicing and payments offered by Wholesalers.</p>
            </div>

            <div className={styles['feature-item']}>
              <h3>Shipment Tracking</h3>
              <p>Monitor orders from placement to delivery.</p>
            </div>

            <div className={styles['feature-item']}>
              <h3>Compliance Documentation</h3>
              <p>Maintain complete audit trails automatically.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles['cta-section']}>
        <div className={styles['cta-container']}>
          <h2>Ready to Simplify Your Wholesale Ordering?</h2>
          <p className={styles['section-description']}>
            Join dispensaries and retailers who trust Nature&apos;s
            High for their wholesale cannabis needs.
          </p>

          <div className={styles['trial-highlight']}>
            <p className={styles['trial-text']}>
              Save Cash • Become More Efficient • Smile More Often
            </p>
          </div>

          <div className={styles['cta-buttons']}>
            <Link
              href="/register"
              className={`${styles.btn} ${styles['btn-primary']}`}
            >
              Start Now!
            </Link>
            <Link
              href="/contact"
              className={`${styles.btn} ${styles['btn-secondary']}`}
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
