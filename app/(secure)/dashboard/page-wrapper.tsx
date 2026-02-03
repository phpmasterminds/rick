'use client';

import { PermissionGuard } from '@/components/PermissionGuard';
import PageContent from './pageContent';

export default function DashboardPageWrapper() {
  return (
    <PermissionGuard
      requiredPermission="can_access_dashboard"
      featureName="Dashboard"
      description="You need Dashboard access permission."
    >
      <PageContent />
    </PermissionGuard>
  );
}
