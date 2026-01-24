'use client';

import { StatsCards } from '@/components/dashboard/stats-cards';
import { GrowthChart } from '@/components/dashboard/growth-chart';
import { useAuthStore } from '@/lib/store/auth-store';

export default function DashboardPage() {
  const admin = useAuthStore((state) => state.admin);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h2>
          <p className="text-gray-500">
            Welcome back, {admin?.firstName || 'Admin'}. Here's what's happening today.
          </p>
        </div>
      </div>

      <StatsCards />

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        <div className="col-span-4 lg:col-span-4">
          <GrowthChart />
        </div>
        
        {/* Placeholder for Recent Activity mock */}
        <div className="col-span-3 bg-white rounded-lg border p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded">
              No recent alerts
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
