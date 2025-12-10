'use client';

import React, { ReactNode, useEffect } from 'react';
import { useApprovalStatus } from '@/hooks/useApprovalStatus';

interface ApprovalProviderProps {
  children: ReactNode;
}

/**
 * Provider component that initializes approval status on app load
 * Must wrap your entire app or at least the root layout
 * 
 * Usage in layout.tsx:
 * <ApprovalProvider>
 *   {children}
 * </ApprovalProvider>
 */
export function ApprovalProvider({ children }: ApprovalProviderProps) {
  const { isLoading } = useApprovalStatus();

  // Prevent any content from rendering until approval status is initialized
  if (isLoading) {
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