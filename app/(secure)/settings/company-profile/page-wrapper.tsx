'use client';

import { PermissionGuard } from '@/components/PermissionGuard';
import PageContent from './pageContent';

export default function InventoryPageWrapper() {
  return (
    <PermissionGuard
      requiredPermission="can_access_settings_page"
      featureName="Settings"
      description="You need Settings access permission to access this page."
    >
      <PageContent />
    </PermissionGuard>
  );
}
