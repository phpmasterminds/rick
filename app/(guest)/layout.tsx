'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Cookie Notification Logic
    const cookieNotification = document.getElementById('cookieNotification');
    const acceptCookies = document.getElementById('acceptCookies');
    const declineCookies = document.getElementById('declineCookies');

    if (cookieNotification && acceptCookies && declineCookies) {
      const cookieChoice = localStorage.getItem('cookieConsent');
      
      if (!cookieChoice) {
        setTimeout(() => {
          cookieNotification.classList.add('show');
        }, 1000);
      }

      acceptCookies.addEventListener('click', () => {
        localStorage.setItem('cookieConsent', 'accepted');
        cookieNotification.classList.remove('show');
      });

      declineCookies.addEventListener('click', () => {
        localStorage.setItem('cookieConsent', 'declined');
        cookieNotification.classList.remove('show');
      });
    }

    // Intersection Observer for fade-in animations
    const observerOptions = {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px',
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.fade-in').forEach((el) => {
      observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="Nature's High - A modern B2B wholesale marketplace for the legal cannabis industry. Connect licensed brands with dispensaries and retailers nationwide." />
        <meta name="keywords" content="cannabis wholesale, B2B cannabis marketplace, wholesale cannabis, cannabis brands, dispensaries, cannabis retailers" />
        <meta name="author" content="Nature's High" />
        <meta property="og:title" content="Nature's High - B2B Cannabis Wholesale Marketplace" />
        <meta property="og:description" content="Connect licensed cannabis brands with dispensaries and retailers. Save thousands with affordable wholesale trading." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://natureshigh.com" />
        <title>Nature's High - A modern B2B wholesale marketplace for the legal cannabis industry</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@300;400;600&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        {/* Navigation */}
        <nav>
          <div className="nav-container">
            <div className="logo">
              Nature's <span className="logo-accent">High</span>
            </div>
            <ul className="nav-links">
              <li><Link href="/brands">For Brands</Link></li>
              <li><Link href="/retailers">For Retailers</Link></li>
              <li><Link href="/features">Features</Link></li>
              <li><Link href="/pricing">Pricing</Link></li>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/login">Login</Link></li>
              <li><Link href="/register" className="cta-nav">Start Free Trial</Link></li>
            </ul>
          </div>
        </nav>

        {/* Page Content */}
        {children}

        {/* Footer */}
        <footer>
          <div className="footer-container">
            <div>
              <div className="footer-brand">Nature's High</div>
              <p className="footer-description">
                The modern B2B wholesale marketplace for the legal cannabis industry. Connecting brands, wholesalers, dispensaries, and retailers nationwide.
              </p>
            </div>
            <div className="footer-column">
              <h4>Platform</h4>
              <ul className="footer-links">
                <li><Link href="/brands">For Brands</Link></li>
                <li><Link href="/retailers">For Retailers</Link></li>
                <li><Link href="/features">Features</Link></li>
                <li><Link href="/pricing">Pricing</Link></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>Company</h4>
              <ul className="footer-links">
                <li><Link href="/about">About Us</Link></li>
                <li><Link href="/contact">Contact</Link></li>
                <li><Link href="/auth/login">Login</Link></li>
                <li><Link href="/auth/register">Start Free Trial</Link></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>Legal</h4>
              <ul className="footer-links">
                <li><Link href="/privacy">Privacy Policy</Link></li>
                <li><Link href="/terms">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 Nature's High. All rights reserved.</p>
            <div className="footer-legal">
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Terms of Service</Link>
            </div>
          </div>
        </footer>

        {/* Cookie Notification */}
        <div className="cookie-notification" id="cookieNotification">
          <div className="cookie-content">
            <div className="cookie-text">
              <h4>We Value Your Privacy</h4>
              <p>
                We use cookies to enhance your browsing experience and analyze our traffic. By clicking "Accept All", you consent to our use of cookies. <Link href="/privacy">Learn more about our Cookie Policy</Link>.
              </p>
            </div>
            <div className="cookie-buttons">
              <button className="btn-cookie btn-cookie-accept" id="acceptCookies">Accept All</button>
              <button className="btn-cookie btn-cookie-decline" id="declineCookies">Decline</button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}