'use client';

import { useEffect, useState } from 'react';

/**
 * Custom hook to detect current theme (dark/light mode)
 * Works with class-based ThemeProvider (dark class on html element)
 * 
 * @returns {object} Object with isDark boolean
 * @example
 * const { isDark } = useTheme();
 * className={isDark ? 'dark-bg' : 'light-bg'}
 */
export const useTheme = () => {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const htmlElement = window.document.documentElement;
    
    // Get initial theme state
    const initialIsDark = htmlElement.classList.contains('dark');
    setIsDark(initialIsDark);
    setMounted(true);

    // Watch for theme changes using MutationObserver
    const observer = new MutationObserver(() => {
      const isDarkMode = htmlElement.classList.contains('dark');
      setIsDark(isDarkMode);
    });

    // Observe class attribute changes
    observer.observe(htmlElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return { isDark: false };
  }

  return { isDark };
};