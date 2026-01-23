import './globals.css';
import GuestNavbar from '@/components/GuestNavbar';
import { Crimson_Pro, DM_Sans } from 'next/font/google';
import CookieBanner from '@/components/CookieBanner';
import ScrollEffects from '@/components/ScrollEffects';
import GuestFooter from '@/components/GuestFooter';

export default function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="guest_page">
      <GuestNavbar />
      {children}
      <GuestFooter />
      <CookieBanner />
      <ScrollEffects />
    </div>
  );
}
