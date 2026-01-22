'use client';

import styles from './cookies.module.css';

export default function CookiesPage() {
  return (
    <>
      {/* PAGE HEADER */}
      <div className={styles['page-header']}>
        <h1>Cookie Policy</h1>
        <p className={styles['last-updated']}>
          Last Updated: January 19, 2026
        </p>
      </div>

      {/* CONTENT */}
      <div className={styles.content}>
        <p>
          This Cookie Policy explains how Nature&apos;s High (&quot;we&quot;,
          &quot;our&quot;, or &quot;us&quot;) uses cookies and similar
          technologies when you visit or use our B2B wholesale marketplace
          platform.
        </p>

        <div className={styles['highlight-box']}>
          <strong>What Are Cookies?</strong> Cookies are small text files stored
          on your device that help websites function properly, improve user
          experience, and provide analytical insights.
        </div>

        <h2>1. Why We Use Cookies</h2>
        <p>We use cookies to:</p>
        <ul>
          <li>Ensure the Platform functions correctly</li>
          <li>Maintain secure user sessions</li>
          <li>Remember your preferences and settings</li>
          <li>Analyze usage patterns to improve our services</li>
          <li>Deliver relevant marketing communications (with consent)</li>
        </ul>

        <h2>2. Types of Cookies We Use</h2>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Cookie Type</th>
              <th>Purpose</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Essential Cookies</td>
              <td>
                Required for core platform functionality, security, and user
                authentication.
              </td>
            </tr>
            <tr>
              <td>Analytics Cookies</td>
              <td>
                Help us understand how users interact with the Platform so we
                can improve performance and usability.
              </td>
            </tr>
            <tr>
              <td>Functionality Cookies</td>
              <td>
                Remember your preferences such as language, region, and saved
                settings.
              </td>
            </tr>
            <tr>
              <td>Advertising Cookies</td>
              <td>
                Used to deliver relevant advertisements and measure marketing
                effectiveness (only with your consent).
              </td>
            </tr>
          </tbody>
        </table>

        <h2>3. Third-Party Cookies</h2>
        <p>
          We may allow trusted third-party service providers to place cookies on
          your device to support:
        </p>
        <ul>
          <li>Analytics and performance monitoring</li>
          <li>Payment processing</li>
          <li>Customer support tools</li>
          <li>Marketing and advertising (where permitted)</li>
        </ul>
        <p>
          These providers are contractually obligated to protect your data and
          use it only for the purposes specified by Nature&apos;s High.
        </p>

        <h2>4. Managing Cookie Preferences</h2>
        <p>
          You can manage or disable cookies through your browser settings at any
          time. Please note:
        </p>
        <ul>
          <li>Disabling essential cookies may prevent the Platform from working correctly</li>
          <li>Some features may not function as intended</li>
          <li>Your preferences may need to be reset if cookies are cleared</li>
        </ul>

        <h2>5. Cookie Consent</h2>
        <p>
          When you first visit our Platform, you may see a cookie notice
          requesting your consent. By clicking &quot;Accept All&quot;, you
          consent to the use of cookies as described in this policy.
        </p>
        <p>
          You may withdraw or modify your consent at any time through your
          browser settings or future consent tools we provide.
        </p>

        <h2>6. Cannabis Industry Considerations</h2>
        <p>
          Due to the regulatory nature of the cannabis industry, certain cookies
          are required to:
        </p>
        <ul>
          <li>Verify user eligibility and access permissions</li>
          <li>Maintain compliance records</li>
          <li>Support audit trails and security logging</li>
        </ul>

        <h2>7. Changes to This Cookie Policy</h2>
        <p>
          We may update this Cookie Policy periodically to reflect changes in
          technology, regulations, or business practices. Updates will be
          posted on this page with a revised &quot;Last Updated&quot; date.
        </p>

        <h2>8. Contact Us</h2>
        <p>
          If you have questions about our use of cookies or this Cookie Policy,
          please contact us:
        </p>
        <p>
          <strong>Nature&apos;s High</strong>
          <br />
          Email: privacy@natureshigh.com
          <br />
          Phone: 1-800-555-1234
          <br />
          Address: Johnson, Arkansas, United States
        </p>

        <div className={styles['highlight-box']}>
          <strong>Your Control:</strong> You are always in control of your cookie
          preferences. We are committed to transparency and responsible data
          practices.
        </div>
      </div>
    </>
  );
}
