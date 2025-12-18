import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';

interface UseApprovalStatusReturn {
  userGroupId: number | null;
  isLoading: boolean;
  setUserGroupId: (groupId: number) => void;
  // isApproved is now derived from userGroupId: if groupId === 2, not approved
  isApproved: boolean; // true if userGroupId !== 2, false if userGroupId === 2
  isMounted: boolean; // True only after client-side hydration
}

/**
 * Simplified hook to manage user group ID
 * Approval status is determined by user_group_id:
 * - If user_group_id === 2 → NOT APPROVED
 * - If user_group_id !== 2 → APPROVED
 * 
 * CRITICAL: This hook requires client-side only execution.
 * It will NOT initialize during SSR, only after hydration.
 * 
 * Usage:
 * const { userGroupId, isApproved, setUserGroupId, isMounted } = useApprovalStatus();
 * 
 * // Wait for mount before rendering approval-dependent content
 * if (!isMounted) return null;
 */
export function useApprovalStatus(): UseApprovalStatusReturn {
  const [userGroupId, setUserGroupIdState] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Initialize from localStorage only after client-side hydration
  useEffect(() => {
    try {
      setIsMounted(true);
      
      const storedGroupId = localStorage.getItem('user_group_id');
      const groupId = storedGroupId ? parseInt(storedGroupId, 10) : null;

      setUserGroupIdState(groupId);

      // Sync to cookies for middleware access
      if (groupId !== null) {
        Cookies.set('user_group_id', groupId.toString(), {
          expires: 7,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'Lax',
        });
      }
    } catch (error) {
      console.error('Error initializing approval status:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update user group ID and sync to cookie
  const setUserGroupId = (groupId: number) => {
    setUserGroupIdState(groupId);
    
    // Only access localStorage if mounted (client-side)
    if (isMounted && typeof window !== 'undefined') {
      localStorage.setItem('user_group_id', groupId.toString());
      Cookies.set('user_group_id', groupId.toString(), {
        expires: 7,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
      });
    }
  };

  // Derived: isApproved means user_group_id !== 2
  const isApproved = userGroupId !== null && userGroupId !== 2;

  return {
    userGroupId,
    isApproved,
    isLoading,
    isMounted,
    setUserGroupId,
  };
}