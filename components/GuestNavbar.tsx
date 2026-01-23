'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';


export default function GuestNavbar() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const isActive = (path: string) => pathname === path;
	useEffect(() => {
    setIsLoggedIn(!!Cookies.get('user_id'));
  }, []);
  
  return (
    <nav>
      <div className="nav-container">
        <Link href="/home" className="logo">
          Nature&apos;s <span className="logo-accent">High</span>
        </Link>

        <ul className="nav-links">
          <li>
            <Link href="/brands" className={isActive('/brands') ? 'active' : ''}>
              For Brands
            </Link>
          </li>

          <li>
            <Link
              href="/retailers"
              className={isActive('/retailers') ? 'active' : ''}
            >
              For Retailers
            </Link>
          </li>

          <li>
            <Link
              href="/features"
              className={isActive('/features') ? 'active' : ''}
            >
              Features
            </Link>
          </li>

          {/*<li>
            <Link
              href="/pricing"
              className={isActive('/pricing') ? 'active' : ''}
            >
              Pricing
            </Link>
          </li>*/}

          <li>
            <Link
              href="/contact"
              className={isActive('/contact') ? 'active' : ''}
            >
              Contact
            </Link>
          </li>
			{!isLoggedIn && (
            <>
          <li>
            <Link href="/login">Login</Link>
          </li>

          <li>
            <Link href="/register" className="cta-nav">
              Start Free Trial
            </Link>
          </li>
		   </>
          )}
		  {isLoggedIn && (
			  <li>
				<Link href="/dashboard">Dashboard</Link>
			  </li>
			)}
        </ul>
      </div>
    </nav>
  );
}
