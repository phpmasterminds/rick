/**
 * Loading Spinner Component - Themed Version
 * Location: components/common/LoadingSpinner.tsx
 * 
 * Updated to use accent-text class for dynamic theme color
 */

'use client';

import React from 'react';

interface LoadingSpinnerProps {
  /**
   * Size of the spinner
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Optional text to display below spinner
   */
  text?: string;
  
  /**
   * Optional custom class names
   */
  className?: string;
  
  /**
   * Whether to display centered in full height
   * @default false
   */
  fullHeight?: boolean;
}

export default function LoadingSpinner({
  size = 'md',
  text,
  className = '',
  fullHeight = false
}: LoadingSpinnerProps) {
  // Size classes for spinner
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  // Size classes for container
  const containerSize = {
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6'
  };

  const spinnerClass = sizeClasses[size];
  const containerClass = containerSize[size];

  // Full height container
  if (fullHeight) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className={`text-center ${className}`}>
          <svg
            className={`${spinnerClass} mx-auto animate-spin accent-text`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {text && (
            <p className="mt-3 text-sm font-medium text-gray-600 dark:text-gray-400">{text}</p>
          )}
        </div>
      </div>
    );
  }

  // Inline spinner
  return (
    <div className={`flex items-center justify-center ${containerClass} ${className}`}>
      <div className="text-center">
        <svg
          className={`${spinnerClass} mx-auto animate-spin accent-text`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        {text && (
          <p className="mt-2 text-xs font-medium text-gray-600 dark:text-gray-400">{text}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Usage Examples:
 * 
 * // Simple inline spinner
 * <LoadingSpinner />
 * 
 * // Small spinner with text
 * <LoadingSpinner size="sm" text="Loading..." />
 * 
 * // Large full-height spinner (e.g., page load)
 * <LoadingSpinner size="lg" text="Loading messages..." fullHeight />
 * 
 * // Custom styled spinner
 * <LoadingSpinner className="bg-white dark:bg-gray-800 rounded-lg p-8" text="Please wait..." />
 */