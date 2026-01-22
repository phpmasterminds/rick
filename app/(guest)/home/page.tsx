import type { Metadata } from 'next';
import Link from 'next/link';
import styles from './home.module.css';

export const metadata: Metadata = {
  title: "Nature's High - B2B Cannabis Wholesale Marketplace",
  description:
    "Nature's High - A modern B2B wholesale marketplace for the legal cannabis industry. Connect licensed brands with dispensaries and retailers nationwide.",
  keywords: [
    'cannabis wholesale',
    'B2B cannabis marketplace',
    'wholesale cannabis',
    'cannabis brands',
    'dispensaries',
    'cannabis retailers',
  ],
  authors: [{ name: "Nature's High" }],
  openGraph: {
    title: "Nature's High - B2B Cannabis Wholesale Marketplace",
    description:
      'Connect licensed cannabis brands with dispensaries and retailers. Save thousands with affordable wholesale trading.',
    type: 'website',
    url: 'https://natureshigh.com',
  },
};

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles['hero-container']}>
          <div className={styles['hero-content']}>
            <span className={styles['hero-badge']}>
              Legal Cannabis B2B Marketplace
            </span>

            <h1>Wholesale Cannabis Trading, Simplified</h1>

            <p className={styles['hero-subtitle']}>
              Nature&apos;s High is a modern B2B wholesale marketplace built
              specifically for the legal cannabis industry. We connect licensed
              cannabis brands and wholesalers with dispensaries, retailers, and
              other wholesale buyers across the nation—all on one easy-to-use
              platform.
            </p>

            <p className={styles['hero-description']}>
              Our mission is simple: help cannabis businesses grow by making
              wholesale trading more accessible, affordable, and efficient.
            </p>

            <div className={styles['cta-buttons']}>
              <Link
                href="/register"
                className={`${styles.btn} ${styles['btn-primary']}`}
              >
                Start 30-Day Free Trial
              </Link>

              <a
                href="#demo"
                className={`${styles.btn} ${styles['btn-secondary']}`}
              >
                See How It Works
              </a>
            </div>
          </div>

          <div className={styles['hero-visual']}>
            <div className={styles['visual-card']}>
              <div className={styles['stat-grid']}>
                <div className={styles['stat-item']}>
                  <span className={styles['stat-number']}>$1000s</span>
                  <span className={styles['stat-label']}>
                    Saved Annually
                  </span>
                </div>

                <div className={styles['stat-item']}>
                  <span className={styles['stat-number']}>30</span>
                  <span className={styles['stat-label']}>
                    Days Free Trial
                  </span>
                </div>
              </div>

              <div className={styles['trust-badge']}>
                <div className={styles['trust-badge-title']}>
                  Licensed &amp; Compliant
                </div>
                <div className={styles['trust-badge-text']}>
                  Built for the regulated cannabis industry
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className={styles.benefits} id="benefits">
        <div className={styles['section-header']}>
          <span className={styles['section-tag']}>
            Why Nature&apos;s High
          </span>
          <h2>Built for Cannabis Businesses</h2>
          <p className={styles['section-description']}>
            We understand the unique challenges of cannabis wholesale. Our
            platform delivers the tools and savings you need to thrive in this
            competitive market.
          </p>
        </div>

        <div className={styles['benefits-grid']}>
          <div className={styles['benefit-card']}>
            <div className={styles['benefit-icon']}>💰</div>
            <h3 className={styles['benefit-title']}>
              Massive Cost Savings
            </h3>
            <p className={styles['benefit-description']}>
              Save thousands of dollars annually compared to expensive
              competitors like LeafLink.
            </p>
          </div>

          <div className={styles['benefit-card']}>
            <div className={styles['benefit-icon']}>🚀</div>
            <h3 className={styles['benefit-title']}>
              Easy Customer Onboarding
            </h3>
            <p className={styles['benefit-description']}>
              Pre-register your existing customers for seamless ordering.
            </p>
          </div>

          <div className={styles['benefit-card']}>
            <div className={styles['benefit-icon']}>🎯</div>
            <h3 className={styles['benefit-title']}>
              Flexible Deal Management
            </h3>
            <p className={styles['benefit-description']}>
              Create custom deals and discounts with complete control.
            </p>
          </div>

          <div className={styles['benefit-card']}>
            <div className={styles['benefit-icon']}>🌐</div>
            <h3 className={styles['benefit-title']}>
              Free Public Business Page
            </h3>
            <p className={styles['benefit-description']}>
              Showcase your products and attract new wholesale buyers.
            </p>
          </div>

          <div className={styles['benefit-card']}>
            <div className={styles['benefit-icon']}>🤝</div>
            <h3 className={styles['benefit-title']}>
              Wholesale-to-Wholesale Trading
            </h3>
            <p className={styles['benefit-description']}>
              Expand your reach beyond retail.
            </p>
          </div>

          <div className={styles['benefit-card']}>
            <div className={styles['benefit-icon']}>✅</div>
            <h3 className={styles['benefit-title']}>Risk-Free Trial</h3>
            <p className={styles['benefit-description']}>
              Try Nature&apos;s High free for 30 days. No credit card required.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className={styles.features} id="features">
        <div className={styles['features-container']}>
          <div className={styles['section-header']}>
            <span className={styles['section-tag']}>
              Platform Features
            </span>
            <h2>Everything You Need to Succeed</h2>
            <p className={styles['section-description']}>
              Our comprehensive platform provides all the tools modern cannabis
              businesses need to manage wholesale operations efficiently.
            </p>
          </div>

          <div className={styles['features-grid']}>
            <div
              className={`${styles['feature-item']} ${styles['fade-in']}`}
            >
              <div className={styles['feature-number']}>01</div>
              <div className={styles['feature-content']}>
                <h3>Streamlined Order Management</h3>
                <p>
                  Process orders quickly with intuitive workflows.
                </p>
              </div>
            </div>

            <div
              className={`${styles['feature-item']} ${styles['fade-in']}`}
            >
              <div className={styles['feature-number']}>02</div>
              <div className={styles['feature-content']}>
                <h3>Customer Relationship Tools</h3>
                <p>
                  Build lasting relationships with integrated CRM features.
                </p>
              </div>
            </div>

            <div
              className={`${styles['feature-item']} ${styles['fade-in']}`}
            >
              <div className={styles['feature-number']}>03</div>
              <div className={styles['feature-content']}>
                <h3>Analytics &amp; Insights</h3>
                <p>
                  Make data-driven decisions with comprehensive reporting.
                </p>
              </div>
            </div>

            <div
              className={`${styles['feature-item']} ${styles['fade-in']}`}
            >
              <div className={styles['feature-number']}>04</div>
              <div className={styles['feature-content']}>
                <h3>Compliance Management</h3>
                <p>
                  Stay compliant with automated tracking tools.
                </p>
              </div>
            </div>

            <div
              className={`${styles['feature-item']} ${styles['fade-in']}`}
            >
              <div className={styles['feature-number']}>05</div>
              <div className={styles['feature-content']}>
                <h3>Multi-Channel Sales</h3>
                <p>
                  Reach retailers and wholesalers through one platform.
                </p>
              </div>
            </div>

            <div
              className={`${styles['feature-item']} ${styles['fade-in']}`}
            >
              <div className={styles['feature-number']}>06</div>
              <div className={styles['feature-content']}>
                <h3>Mobile Accessibility</h3>
                <p>
                  Manage your business anytime, anywhere.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles['cta-section']}>
        <div className={styles['cta-container']}>
          <h2>Ready to Transform Your Wholesale Business?</h2>
          <p>
            Join the modern cannabis marketplace built for growth and success.
          </p>

          <div className={styles['cta-highlight']}>
            <div className={styles['cta-highlight-title']}>
              Limited Time: 30-Day Free Trial
            </div>
            <div className={styles['cta-highlight-text']}>
              Experience the full platform with zero commitment.
            </div>
          </div>

          <a
            href="/register"
            className={`${styles.btn} ${styles['btn-cta']}`}
          >
            Start Your Free Trial Today
          </a>
        </div>
      </section>
    </>
  );
}
