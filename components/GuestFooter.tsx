import Link from 'next/link';

export default function GuestFooter() {
  return (
    <footer>
      <div className="footer-container">
        <div>
          <div className="footer-brand">Nature&apos;s High</div>
          <p className="footer-description">
            The modern B2B wholesale marketplace for the legal cannabis industry.
            Connecting brands, wholesalers, dispensaries, and retailers
            nationwide.
          </p>
        </div>

        <div className="footer-column">
          <h4>Platform</h4>
          <ul className="footer-links">
            <li><Link href="/brands">For Brands</Link></li>
            <li><Link href="/retailers">For Retailers</Link></li>
            <li><Link href="/features">Features</Link></li>
            {/*<li><Link href="/pricing">Pricing</Link></li>*/}
          </ul>
        </div>

        <div className="footer-column">
          <h4>Company</h4>
          <ul className="footer-links">
            <li><Link href="/about">About Us</Link></li>
            <li><Link href="/contact">Contact</Link></li>
            <li><Link href="/login">Login</Link></li>
            <li><Link href="/register">Start Free Trial</Link></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2026 Nature&apos;s High. All rights reserved.</p>
        <div className="footer-legal">
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
          <Link href="/cookies">Cookie Policy</Link>
        </div>
      </div>
    </footer>
  );
}
