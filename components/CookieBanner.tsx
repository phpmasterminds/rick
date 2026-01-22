'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function CookieBanner() {
  useEffect(() => {
    const banner = document.getElementById('cookieNotification');
    const choice = localStorage.getItem('cookieConsent');

    if (!choice && banner) {
      setTimeout(() => {
        banner.classList.add('show');
      }, 1000);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    document.getElementById('cookieNotification')?.classList.remove('show');
    console.log('Cookies accepted');
  };

  const declineCookies = () => {
    localStorage.setItem('cookieConsent', 'declined');
    document.getElementById('cookieNotification')?.classList.remove('show');
    console.log('Cookies declined');
  };

  return (
    <div className="cookie-notification" id="cookieNotification">
      <div className="cookie-content">
        <div className="cookie-text">
          <h4>We Value Your Privacy</h4>
          <p>
            We use cookies to enhance your browsing experience and analyze our
            traffic. By clicking &quot;Accept All&quot;, you consent to our use
            of cookies.{' '}
            <Link href="/cookies">Learn more about our Cookie Policy</Link>.
          </p>
        </div>

        <div className="cookie-buttons">
          <button
            className="btn-cookie btn-cookie-accept"
            onClick={acceptCookies}
          >
            Accept All
          </button>

          <button
            className="btn-cookie btn-cookie-decline"
            onClick={declineCookies}
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
