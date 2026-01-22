'use client';
import styles from './privacy.module.css';

export default function PrivacyPage() {
  return (
    <>
      {/* PAGE HEADER */}
      <div className={styles['page-header']}>
        <h1>Privacy Policy</h1>
        <p className={styles['last-updated']}>
          Last Updated: January 19, 2026
        </p>
      </div>

      {/* CONTENT */}
      <div className={styles.content}>
        <p>
          At Nature&apos;s High, we are committed to protecting your privacy and
          ensuring the security of your personal information. This Privacy
          Policy explains how we collect, use, disclose, and safeguard your
          information when you use our B2B wholesale marketplace platform.
        </p>

        <div className={styles['highlight-box']}>
          <strong>Your Privacy Matters:</strong> We take your privacy seriously
          and are committed to transparency about our data practices. Please
          read this policy carefully to understand how we handle your
          information.
        </div>

        <h2>1. Information We Collect</h2>

        <h3>1.1 Information You Provide</h3>
        <p>We collect information that you voluntarily provide when you:</p>
        <ul>
          <li>
            <strong>Create an Account:</strong> Name, email address, phone
            number, business name, business address, and business license
            information
          </li>
          <li>
            <strong>Complete Your Profile:</strong> Business description,
            product offerings, payment information, and preferences
          </li>
          <li>
            <strong>Use Our Platform:</strong> Order information, product
            listings, messages, reviews, and feedback
          </li>
          <li>
            <strong>Contact Us:</strong> Information in correspondence, support
            tickets, or surveys
          </li>
        </ul>

        <h3>1.2 Automatically Collected Information</h3>
        <p>When you access our Platform, we automatically collect:</p>
        <ul>
          <li>
            <strong>Device Information:</strong> IP address, browser type,
            operating system, device identifiers
          </li>
          <li>
            <strong>Usage Data:</strong> Pages viewed, time spent on pages,
            navigation paths, click data
          </li>
          <li>
            <strong>Location Data:</strong> General geographic location based on
            IP address
          </li>
          <li>
            <strong>Cookies and Tracking:</strong> Information collected through
            cookies, web beacons, and similar technologies
          </li>
        </ul>

        <h3>1.3 Business Information</h3>
        <p>As a B2B platform serving the cannabis industry, we collect:</p>
        <ul>
          <li>Cannabis business licenses and permits</li>
          <li>Tax identification numbers</li>
          <li>Business financial information for payment processing</li>
          <li>Compliance documentation required by applicable regulations</li>
        </ul>

        <h2>2. How We Use Your Information</h2>

        <h3>2.1 Platform Operations</h3>
        <ul>
          <li>Create and manage your account</li>
          <li>Process orders and transactions</li>
          <li>Facilitate communication between buyers and sellers</li>
          <li>Provide customer support</li>
          <li>Generate analytics and reports</li>
        </ul>

        <h3>2.2 Compliance and Security</h3>
        <ul>
          <li>Verify business licenses and compliance with cannabis regulations</li>
          <li>Prevent fraud and unauthorized access</li>
          <li>Comply with legal obligations and regulatory requirements</li>
          <li>Enforce our Terms of Service</li>
        </ul>

        <h3>2.3 Platform Improvement</h3>
        <ul>
          <li>Analyze usage patterns to improve functionality</li>
          <li>Develop new features and services</li>
          <li>Personalize user experience</li>
          <li>Conduct research and analytics</li>
        </ul>

        <h3>2.4 Communications</h3>
        <ul>
          <li>Send transactional emails</li>
          <li>Provide customer support responses</li>
          <li>Send platform updates and announcements</li>
          <li>Deliver marketing communications (with your consent)</li>
        </ul>

        <h2>3. Information Sharing and Disclosure</h2>

        <h3>3.1 With Other Users</h3>
        <ul>
          <li>Your business profile is visible to other verified users</li>
          <li>Sellers can view buyer contact information for fulfillment</li>
          <li>Buyers can view seller business information</li>
          <li>Order details are shared between parties</li>
        </ul>

        <h3>3.2 Service Providers</h3>
        <ul>
          <li>Payment processors</li>
          <li>Cloud hosting providers</li>
          <li>Analytics providers</li>
          <li>Customer support tools</li>
          <li>Security and fraud prevention services</li>
        </ul>

        <h3>3.3 Legal Requirements</h3>
        <ul>
          <li>Comply with legal processes</li>
          <li>Enforce Terms of Service</li>
          <li>Protect rights and safety</li>
          <li>Respond to regulatory inquiries</li>
        </ul>

        <h3>3.4 Business Transfers</h3>
        <p>
          In the event of a merger, acquisition, or sale of assets, your
          information may be transferred.
        </p>

        <h2>4. Data Security</h2>
        <ul>
          <li>Encryption of data in transit and at rest</li>
          <li>Secure access controls</li>
          <li>Regular security assessments</li>
          <li>Employee training</li>
          <li>Incident response procedures</li>
        </ul>

        <h2>5. Cookies and Tracking Technologies</h2>

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
              <td>Required for platform functionality</td>
            </tr>
            <tr>
              <td>Analytics Cookies</td>
              <td>Usage analytics</td>
            </tr>
            <tr>
              <td>Functionality Cookies</td>
              <td>Preferences and settings</td>
            </tr>
            <tr>
              <td>Advertising Cookies</td>
              <td>Relevant advertising</td>
            </tr>
          </tbody>
        </table>

        <h2>6. Your Privacy Rights</h2>

        <h3>6.1 Exercising Your Rights</h3>
        <p>
          To exercise your rights, contact us at privacy@natureshigh.com. We
          respond within 30 days.
        </p>

        <h2>7. Data Retention</h2>
        <ul>
          <li>Provide services</li>
          <li>Meet compliance obligations</li>
          <li>Resolve disputes</li>
          <li>Maintain records</li>
        </ul>

        <h2>8. Children&apos;s Privacy</h2>
        <p>
          Our Platform is intended for users aged 21 and above. We do not
          knowingly collect information from minors.
        </p>

        <h2>9. Contact Us</h2>
        <p>
          <strong>Privacy Team</strong>
          <br />
          Nature&apos;s High
          <br />
          Email: privacy@natureshigh.com
          <br />
          Phone: 1-800-555-1234
          <br />
          Address: Johnson, Arkansas, United States
        </p>

        <div className={styles['highlight-box']}>
          <strong>Data Protection Officer:</strong> dpo@natureshigh.com
        </div>

        <h2>15. Dispute Resolution</h2>
        <p>
          If you have concerns that have not been resolved, you may lodge a
          complaint with your local data protection authority.
        </p>
      </div>
    </>
  );
}
