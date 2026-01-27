'use client';

import { PermissionGuard } from '@/components/PermissionGuard';
import PageContent from './pageContent';

export default function InventoryPageWrapper() {
  return (
    <PermissionGuard
      requiredPermission="can_access_production_packaging"
      featureName="Production Packaging"
      description="You need Production Packaging access permission to manage orders"
    >
      <PageContent />
    </PermissionGuard>
  );
}
