'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePlanDistribution } from '@/hooks/use-analytics';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function PlanDistributionChart() {
  const { data, isLoading } = usePlanDistribution();

  if (isLoading) {
    return <Card className="h-[350px] animate-pulse bg-white/50" />;
  }

  // Transform for Recharts if needed, but API returns [{ plan: 'basic', count: 10 }]
  const chartData = data?.map((item: any) => ({
    name: item.plan,
    value: item.count
  })) || [];

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-gray-800">Subscription Plans</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
