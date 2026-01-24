'use client';

import { ResourcesCard } from '@/components/system/resources-card';
import { AuditLogTable } from '@/components/system/audit-log-table';

export default function SystemHealthPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">System Health</h2>
          <p className="text-gray-500">Monitor server performance and administrative actions.</p>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1">
        <ResourcesCard />
        <AuditLogTable />
      </div>
    </div>
  );
}
