'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './features.module.css';

export default function FeaturesPage() {
  const [activeTab, setActiveTab] = useState<'sellers' | 'retailers'>('sellers');

  return (
    <>
      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles['hero-container']}>
          <div className={styles['hero-content']}>
            <h1>Powerful Features for Your Wholesale Business</h1>
            <p className={styles['hero-subtitle']}>
              Everything you need to manage wholesale operations efficiently—from
              inventory and orders to analytics and customer relationships.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURES OVERVIEW */}
      <section className={styles['features-overview']}>
        <div className={styles['overview-container']}>
          <span className={styles['section-tag']}>Complete Platform</span>
          <h2>Built for Brands &amp; Retailers</h2>
          <p className={styles['section-description']}>
            Explore our comprehensive feature set designed specifically for
            cannabis wholesale operations.
          </p>

          {/* TABS */}
          <div className={styles['role-tabs']}>
            <button
              className={`${styles['tab-button']} ${
                activeTab === 'sellers' ? styles.active : ''
              }`}
              onClick={() => setActiveTab('sellers')}
            >
              For Sellers/Brands
            </button>

            <button
              className={`${styles['tab-button']} ${
                activeTab === 'retailers' ? styles.active : ''
              }`}
              onClick={() => setActiveTab('retailers')}
            >
              For Retailers
            </button>
          </div>

          {/* SELLERS TAB */}
          {activeTab === 'sellers' && (
            <div className={`${styles['tab-content']} ${styles.active}`}>
              <div className={styles['feature-categories']}>
                <div className={styles['feature-category']}>
                  <div className={styles['category-icon']}>📬</div>
                  <h3 className={styles['category-title']}>
                    Customer Communication
                  </h3>
                  <ul className={styles['feature-list']}>
                    <li>Message current customers directly through the platform</li>
                    <li>Prospect and reach out to new retailers</li>
                    <li>Send bulk announcements and product updates</li>
                    <li>Track message history and responses</li>
                  </ul>
                </div>

                <div className={styles['feature-category']}>
                  <div className={styles['category-icon']}>📦</div>
                  <h3 className={styles['category-title']}>
                    Inventory &amp; Order Management
                  </h3>
                  <ul className={styles['feature-list']}>
                    <li>Real-time inventory management and tracking</li>
                    <li>Place orders on behalf of customers</li>
                    <li>Track all orders through fulfillment</li>
                    <li>Guide production and packaging workflows</li>
                    <li>Automated low-stock alerts</li>
                  </ul>
                </div>

                <div className={styles['feature-category']}>
                  <div className={styles['category-icon']}>💰</div>
                  <h3 className={styles['category-title']}>Financial Management</h3>
                  <ul className={styles['feature-list']}>
                    <li>Professional invoicing with custom branding</li>
                    <li>Apply and track payments seamlessly</li>
                    <li>Offer deals, discounts, and promotions</li>
                    <li>Volume pricing and tiered discounts</li>
                    <li>Payment history and reporting</li>
                  </ul>
                </div>

                <div className={styles['feature-category']}>
                  <div className={styles['category-icon']}>📊</div>
                  <h3 className={styles['category-title']}>
                    Analytics &amp; Reporting
                  </h3>
                  <ul className={styles['feature-list']}>
                    <li>Run comprehensive analytical reports</li>
                    <li>Sales performance tracking</li>
                    <li>Customer purchasing patterns</li>
                    <li>Product performance insights</li>
                    <li>Revenue forecasting tools</li>
                  </ul>
                </div>

                <div className={styles['feature-category']}>
                  <div className={styles['category-icon']}>👥</div>
                  <h3 className={styles['category-title']}>Team Management</h3>
                  <ul className={styles['feature-list']}>
                    <li>Set up multiple users with role-based access</li>
                    <li>Granular permissions control</li>
                    <li>Activity logs and audit trails</li>
                    <li>Collaborative workflows</li>
                  </ul>
                </div>

                <div className={styles['feature-category']}>
                  <div className={styles['category-icon']}>🌐</div>
                  <h3 className={styles['category-title']}>
                    Free E-Commerce Page
                  </h3>
                  <ul className={styles['feature-list']}>
                    <li>Professional business page to promote your brand</li>
                    <li>Showcase products with images and descriptions</li>
                    <li>Custom branding and design options</li>
                    <li>SEO-optimized for discovery</li>
                    <li>Shareable catalog link</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* RETAILERS TAB */}
          {activeTab === 'retailers' && (
            <div className={`${styles['tab-content']} ${styles.active}`}>
              <div className={styles['feature-categories']}>
                <div className={styles['feature-category']}>
                  <div className={styles['category-icon']}>📱</div>
                  <h3 className={styles['category-title']}>
                    Order Flow &amp; Process
                  </h3>
                  <ul className={styles['feature-list']}>
                    <li>Stay informed throughout the entire order process</li>
                    <li>Real-time order status updates</li>
                    <li>Shipment tracking and notifications</li>
                    <li>Order history and reordering</li>
                    <li>Multi-brand checkout</li>
                  </ul>
                </div>

                <div className={styles['feature-category']}>
                  <div className={styles['category-icon']}>💬</div>
                  <h3 className={styles['category-title']}>
                    Wholesale Communication
                  </h3>
                  <ul className={styles['feature-list']}>
                    <li>Message wholesalers and brands directly</li>
                    <li>Ask questions about products</li>
                    <li>Negotiate pricing and terms</li>
                    <li>Receive promotional announcements</li>
                  </ul>
                </div>

                <div className={styles['feature-category']}>
                  <div className={styles['category-icon']}>👨‍💼</div>
                  <h3 className={styles['category-title']}>User Management</h3>
                  <ul className={styles['feature-list']}>
                    <li>Set up users with different permission levels</li>
                    <li>Control ordering and approval workflows</li>
                    <li>Track team member activities</li>
                    <li>Manage multiple locations</li>
                  </ul>
                </div>

                <div className={styles['feature-category']}>
                  <div className={styles['category-icon']}>🏪</div>
                  <h3 className={styles['category-title']}>
                    Free E-Commerce Business Page
                  </h3>
                  <ul className={styles['feature-list']}>
                    <li>Professional storefront for your dispensary</li>
                    <li>Full inventory management system</li>
                    <li>Complete product menu display</li>
                    <li>Online shopping for your customers</li>
                    <li>Custom branding and design</li>
                  </ul>
                </div>

                <div className={styles['feature-category']}>
                  <div className={styles['category-icon']}>📋</div>
                  <h3 className={styles['category-title']}>
                    Product Discovery
                  </h3>
                  <ul className={styles['feature-list']}>
                    <li>Browse thousands of licensed cannabis brands</li>
                    <li>Advanced search and filtering</li>
                    <li>Product recommendations</li>
                    <li>New arrivals and trending products</li>
                    <li>Favorite brands and products</li>
                  </ul>
                </div>

                <div className={styles['feature-category']}>
                  <div className={styles['category-icon']}>💳</div>
                  <h3 className={styles['category-title']}>
                    Purchasing Management
                  </h3>
                  <ul className={styles['feature-list']}>
                    <li>Secure payment processing</li>
                    <li>Purchase order management</li>
                    <li>Budget tracking and controls</li>
                    <li>Invoice management</li>
                    <li>Spending analytics</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className={styles['cta-section']}>
        <div className={styles['cta-container']}>
          <h2>Experience All Features Free for 30 Days</h2>
          <p className={styles['section-description']}>
            No credit card required. Full access to all features. See why
            cannabis businesses choose Nature&apos;s High.
          </p>

          <div className={styles['cta-buttons']}>
            <Link href="/register" className={`${styles.btn} ${styles['btn-primary']}`}>
              Start Your Free Trial
            </Link>
            <Link href="/contact" className={`${styles.btn} ${styles['btn-secondary']}`}>
              Schedule a Demo
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
