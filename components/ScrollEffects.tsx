'use client';

import { useEffect } from 'react';

export default function ScrollEffects() {
  useEffect(() => {
    // Fade-in observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    document.querySelectorAll('.fade-in').forEach((el) => {
      observer.observe(el);
    });

    // Smooth scroll
    const anchors = document.querySelectorAll('a[href^="#"]');
    const handleClick = (e: Event) => {
      e.preventDefault();
      const target = document.querySelector(
        (e.currentTarget as HTMLAnchorElement).getAttribute('href')!
      );
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    anchors.forEach((a) => a.addEventListener('click', handleClick));

    return () => {
      anchors.forEach((a) => a.removeEventListener('click', handleClick));
      observer.disconnect();
    };
  }, []);

  return null;
}
