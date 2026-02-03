'use client';

import { PermissionGuard } from '@/components/PermissionGuard';
import PageContent from './pageContent';

export default function OrderPageWrapper() {
  return (
    <PermissionGuard requiredPermission="can_access_order_section" featureName="Order Page Section"
      description="You need Order Page Section access permission.">
      <PageContent />
    </PermissionGuard>
  );
}
