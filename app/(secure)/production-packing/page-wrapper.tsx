'use client';

import { PermissionGuard } from '@/components/PermissionGuard';
import PageContent from './pageContent';

export default function InventoryPageWrapper({ business }: { business: string }) {
  return (
    <PermissionGuard
      requiredPermission="can_access_production_packaging"
      featureName="Production Packaging"
      description="You need Production Packaging access permission to manage orders"
    >
      <PageContent business={business} />
    </PermissionGuard>
  );
}
