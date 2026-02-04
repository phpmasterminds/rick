'use client';

import { PermissionGuard } from '@/components/PermissionGuard';
import PageContent from './pageContent';

export default function InventoryPageWrapper() {
  return (
    <PermissionGuard
      requiredPermission="can_access_reports"
      featureName="Reports"
      description="You need Reports access permission."
    >
      <PageContent />
    </PermissionGuard>
  );
}
