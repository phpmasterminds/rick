'use client';

import { PermissionGuard } from '@/components/PermissionGuard';
import PageContent from './pageContent';

export default function InventoryPageWrapper() {
  return (
    <PermissionGuard
      requiredPermission="can_access_messages"
      featureName="Messages"
      description="You need Messages access permission."
    >
      <PageContent />
    </PermissionGuard>
  );
}
