'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

// ==================== PERMISSION TYPES ====================
export interface PermissionState {
  account_type: 'staff' | 'admin' | 'business_owner' | null;
  can_access_crm: boolean;
  can_access_inventory: boolean;
  can_access_production_packaging: boolean;
  can_access_business_pages: boolean;
  can_access_customers: boolean;
  can_access_dashboard: boolean;
  can_access_messages: boolean;
  can_access_order_section: boolean;
  can_access_reports: boolean;
  can_access_settings_page: boolean;
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
    can_access_customers: false,
    can_access_dashboard: false,
    can_access_messages: false,
    can_access_order_section: false,
    can_access_reports: false,
    can_access_settings_page: false,
    isOwnerOrAdmin: false,
  });

  const [isLoading, setIsLoading] = useState(true);

  const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null;

    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);

    if (parts.length === 2) {
      return parts.pop()!.split(';').shift() || null;
    }

    return null;
  };

  // ✅ NEW: Check localStorage for permissions
  const loadPermissionsFromLocalStorage = () => {
    try {
      // SSR safety
      if (typeof window === 'undefined') {
        setIsLoading(false);
        return;
      }

      const accountType = getCookie('current_permission_account_type');
      const canBusinessPages = getCookie('current_permission_can_access_business_pages');
      const canCRM = getCookie('current_permission_can_access_crm');
      const canInventory = getCookie('current_permission_can_access_inventory');
      const canProductionPackaging = getCookie('current_permission_can_access_production_packaging');
      const canCustomer = getCookie('current_permission_can_access_customers');
      const canDashboard = getCookie('current_permission_can_access_dashboard');
      const canMessages = getCookie('current_permission_can_access_messages');
      const canOrderSection = getCookie('current_permission_can_access_order_section');
      const canReports = getCookie('current_permission_can_access_reports');
      const canSettings = getCookie('current_permission_can_access_settings_page');

      // ✅ NEW LOGIC: If NO permission cookies → Owner/Admin
      if (
        !accountType &&
        !canBusinessPages &&
        !canCRM &&
        !canInventory &&
        !canProductionPackaging &&
        !canCustomer
      ) {
        setPermissions({
          account_type: 'business_owner',
          can_access_crm: true,
          can_access_inventory: true,
          can_access_production_packaging: true,
          can_access_business_pages: true,
          can_access_customers: true,
          can_access_dashboard: true,
          can_access_messages: true,
          can_access_order_section: true,
          can_access_reports: true,
          can_access_settings_page: true,
          isOwnerOrAdmin: true,
        });
        setIsLoading(false);
        return;
      }

      // Staff permissions from cookies
      // ✅ FIX: Type narrowing - cast to valid union type
      const validAccountType = (accountType as 'staff' | 'admin' | 'business_owner' | null) || 'staff';

      setPermissions({
        account_type: validAccountType,
        can_access_business_pages: canBusinessPages === '1' || canBusinessPages === 'true',
        can_access_crm: canCRM === '1' || canCRM === 'true',
        can_access_inventory: canInventory === '1' || canInventory === 'true',
        can_access_production_packaging:
          canProductionPackaging === '1' || canProductionPackaging === 'true',
        can_access_customers: canCustomer === '1' || canCustomer === 'true',
        can_access_dashboard: canDashboard === '1' || canDashboard === 'true',
        can_access_messages:  canMessages === '1' || canMessages === 'true',
        can_access_order_section:  canOrderSection === '1' || canOrderSection === 'true',
        can_access_reports:  canReports === '1' || canReports === 'true',
        can_access_settings_page:  canSettings === '1' || canSettings === 'true',
        isOwnerOrAdmin: false,
      });
    } catch (error) {
      console.error('Error loading permissions from cookies:', error);

      // Safe fallback → Owner/Admin
      setPermissions({
        account_type: 'business_owner',
        can_access_crm: true,
        can_access_inventory: true,
        can_access_production_packaging: true,
        can_access_business_pages: true,
        can_access_customers: true,
        can_access_dashboard: true,
        can_access_messages: true,
        can_access_order_section: true,
        can_access_reports: true,
        can_access_settings_page: true,
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