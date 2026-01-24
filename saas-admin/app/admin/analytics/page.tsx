'use client';

import { GrowthChart } from '@/components/dashboard/growth-chart';
import { PlanDistributionChart } from '@/components/analytics/plan-distribution';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Analytics</h2>
          <p className="text-gray-500">Deep dive into platform usage and growth metrics.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="col-span-2">
          <GrowthChart />
        </div>
        
        <div>
          <PlanDistributionChart />
        </div>

        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-[300px] text-gray-400 bg-gray-50 rounded-lg border border-dashed">
              Revenue Chart (Coming Soon)
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
