import React from 'react';
import { usePermission } from '../app/contexts/PermissionContext';
import { PermissionDenied } from '@/components/PermissionDenied';

interface PermissionGuardProps {
  requiredPermission: 'can_access_crm' | 'can_access_inventory' | 'can_access_production_packaging' | 'can_access_business_pages' | 'can_access_customer';
  featureName: string;
  description?: string;
  children: React.ReactNode;
}

/**
 * PermissionGuard Component
 * 
 * Wraps page content and shows permission denied if user lacks access
 * 
 * Usage:
 * <PermissionGuard 
 *   requiredPermission="can_access_inventory"
 *   featureName="Inventory Management"
 *   description="You need inventory access permission to view this page"
 * >
 *   <YourPageContent />
 * </PermissionGuard>
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  requiredPermission,
  featureName,
  description,
  children,
}) => {
  const { hasPermission, isLoading } = usePermission();

  // Show loading state while checking permissions
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  // Show permission denied if user doesn't have required permission
  if (!hasPermission(requiredPermission)) {
    return (
      <PermissionDenied
        featureName={featureName}
        description={description}
        showBackButton={true}
      />
    );
  }

  // Render children if user has permission
  return <>{children}</>;
};