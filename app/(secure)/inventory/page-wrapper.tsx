'use client';

import { PermissionGuard } from '@/components/PermissionGuard';
import PageContent from './pageContent';

export default function InventoryPageWrapper() {
  return (
    <PermissionGuard
      requiredPermission="can_access_inventory"
      featureName="Inventory"
      description="You need Inventory access permission to manage products"
    >
      <PageContent />
    </PermissionGuard>
  );
}
