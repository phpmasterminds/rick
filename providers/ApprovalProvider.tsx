'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { useApprovalStatus } from '@/hooks/useApprovalStatus';

interface ApprovalProviderProps {
  children: ReactNode;
}

/**
 * Provider component that initializes approval status on app load
 * Must wrap your entire app or at least the root layout
 * 
 * IMPORTANT: This provider is "use client" only and will NOT block
 * SSR. It initializes asynchronously after client-side hydration.
 * 
 * Usage in layout.tsx (or providers.tsx):
 * <ApprovalProvider>
 *   {children}
 * </ApprovalProvider>
 */
export function ApprovalProvider({ children }: ApprovalProviderProps) {
  const { isMounted, isLoading } = useApprovalStatus();
  const [showContent, setShowContent] = useState(false);

  // Only show loading screen if we're still initializing after mount
  useEffect(() => {
    // After component mounts and initializes, show content
    if (!isLoading) {
      setShowContent(true);
    }
  }, [isLoading]);

  // During hydration mismatch window, render minimal content
  // Don't block rendering with loading screen - children render immediately
  if (!isMounted) {
    return <>{children}</>;
  }

  // Once mounted and fully initialized, render content
  // (Optional: show loading state briefly, but it will be very quick)
  if (isLoading && !showContent) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Initializing...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}