'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

// ==================== PERMISSION TYPES ====================
export interface PermissionState {
  account_type: 'staff' | 'admin' | 'business_owner' | null;
  can_access_crm: boolean;
  can_access_inventory: boolean;
  can_access_production_packaging: boolean;
  can_access_business_pages: boolean;
  can_access_customer: boolean;
  // ✅ Flag to detect if user is owner/admin (no localStorage)
  isOwnerOrAdmin: boolean;
}

interface PermissionContextType {
  permissions: PermissionState;
  isLoading: boolean;
  hasPermission: (permission: keyof Omit<PermissionState, 'account_type' | 'isOwnerOrAdmin'>) => boolean;
  isAdmin: () => boolean;
  isStaff: () => boolean;
  isOwnerOrAdmin: () => boolean;
  refreshPermissions: () => void;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

// ==================== PERMISSION PROVIDER ====================
export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [permissions, setPermissions] = useState<PermissionState>({
    account_type: null,
    can_access_crm: false,
    can_access_inventory: false,
    can_access_production_packaging: false,
    can_access_business_pages: false,
    can_access_customer: false,
    isOwnerOrAdmin: false,
  });

  const [isLoading, setIsLoading] = useState(true);

  // ✅ NEW: Check localStorage for permissions
  const loadPermissionsFromLocalStorage = () => {
    try {
      // Check if localStorage is available
      if (typeof window === 'undefined') {
        setIsLoading(false);
        return;
      }

      // Try to get permissions from localStorage
      const permissionsData = localStorage.getItem('permissions');
	  
      // ✅ NEW LOGIC: If NO localStorage data → User is owner/admin
      if (!permissionsData || permissionsData === 'null' || permissionsData === 'undefined') {
        // No permissions in localStorage = Business Owner or Site Admin
        setPermissions({
          account_type: 'business_owner',
          can_access_crm: true,        // Full access
          can_access_inventory: true,   // Full access
          can_access_production_packaging: true, // Full access
          can_access_business_pages: true, // Full access
          can_access_customer: true, // Full access
          isOwnerOrAdmin: true,
        });
        setIsLoading(false);
        return;
      }

      // Parse permissions from localStorage
      const parsed = JSON.parse(permissionsData);

      setPermissions({
        account_type: parsed.account_type || 'staff',
        can_access_crm: parsed.can_access_crm === true || parsed.can_access_crm === '1',
        can_access_inventory: parsed.can_access_inventory === true || parsed.can_access_inventory === '1',
        can_access_production_packaging: parsed.can_access_production_packaging === true || parsed.can_access_production_packaging === '1',
        can_access_business_pages: parsed.can_access_business_pages === true || parsed.can_access_business_pages === '1',
        can_access_customer: parsed.can_access_customer === true || parsed.can_access_customer === '1',
        isOwnerOrAdmin: false, // Has localStorage = Staff member
      });
    } catch (error) {
      console.error('Error loading permissions from localStorage:', error);
      // On error, treat as owner/admin (safe default)
      setPermissions({
        account_type: 'business_owner',
        can_access_crm: true,
        can_access_inventory: true,
        can_access_production_packaging: true,
        can_access_business_pages: true,
        can_access_customer: true,
        isOwnerOrAdmin: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Load on mount
  useEffect(() => {
    loadPermissionsFromLocalStorage();

    // ✅ Listen for localStorage changes (from other tabs/windows)
    const handleStorageChange = () => {
      loadPermissionsFromLocalStorage();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const hasPermission = (permission: keyof Omit<PermissionState, 'account_type' | 'isOwnerOrAdmin'>): boolean => {
    // ✅ Owner/Admin has ALL permissions (no restrictions)
    if (permissions.isOwnerOrAdmin) {
      return true;
    }
    return permissions[permission] === true;
  };

  const isAdmin = (): boolean => {
    // Account type is admin, OR is owner/admin (no localStorage)
    return permissions.account_type === 'admin' || permissions.isOwnerOrAdmin;
  };

  const isStaff = (): boolean => {
    return permissions.account_type === 'staff' && !permissions.isOwnerOrAdmin;
  };

  const isOwnerOrAdminFn = (): boolean => {
    return permissions.isOwnerOrAdmin;
  };

  const value: PermissionContextType = {
    permissions,
    isLoading,
    hasPermission,
    isAdmin,
    isStaff,
    isOwnerOrAdmin: isOwnerOrAdminFn,
    refreshPermissions: loadPermissionsFromLocalStorage,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

// ==================== CUSTOM HOOK ====================
export const usePermission = (): PermissionContextType => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermission must be used within PermissionProvider');
  }
  return context;
};