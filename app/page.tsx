"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      // Replace with your actual auth check
      const token = localStorage.getItem('auth-token');
      // or: const token = document.cookie.includes('auth-token');
      // or: await fetch('/api/auth/check')
      
      if (token) {
        router.replace('/dashboard');
      } else {
        router.replace('/home');
      }
    };

    checkAuth();
  }, [router]);

  // Optional: Show loading while checking
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-slate-600">Loading...</div>
    </div>
  );
}