'use client';

import { PermissionGuard } from '@/components/PermissionGuard';
import PageContent from './pageContent';

export default function OrderPageWrapper({ business, typeid }: { business: string, typeid: string }) {
  return (
    <PermissionGuard requiredPermission="can_access_inventory" featureName="Inventory"
      description="You need Inventory access permission.">
      <PageContent business={business} typeid={typeid} />
    </PermissionGuard>
  );
}
