'use client';

import { PermissionGuard } from '@/components/PermissionGuard';
import PageContent from './pageContent';

export default function InventoryPageWrapper() {
  return (
    <PermissionGuard
      requiredPermission="can_access_customer"
      featureName="Customer"
      description="You need Customer access permission."
    >
      <PageContent />
    </PermissionGuard>
  );
}
