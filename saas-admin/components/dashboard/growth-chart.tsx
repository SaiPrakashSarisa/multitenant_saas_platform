'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGrowthStats } from '@/hooks/use-dashboard-stats';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export function GrowthChart() {
  const { data: growthData, isLoading } = useGrowthStats();

  if (isLoading) {
    return <Card className="col-span-4 h-[350px] animate-pulse bg-white/50" />;
  }

  return (
    <Card className="col-span-4 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-gray-800 mb-4">Tenant Growth Trend</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={growthData}>
              <XAxis 
                dataKey="month" 
                stroke="#888888" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip 
                contentStyle={{ background: '#fff', border: '1px solid #eee', borderRadius: '8px' }}
                cursor={{ stroke: '#f3f4f6', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#2563eb" // Blue-600
                strokeWidth={2}
                dot={{ r: 4, fill: '#2563eb', strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
