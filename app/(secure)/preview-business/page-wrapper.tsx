'use client';

import { PermissionGuard } from '@/components/PermissionGuard';
import PageContent from './pageContent';

export default function OrderPageWrapper({ business }: { business: string }) {
  return (
    <PermissionGuard requiredPermission="can_access_inventory" featureName="Inventory"
      description="You need Inventory access permission.">
      <PageContent slug={business} />
    </PermissionGuard>
  );
}
