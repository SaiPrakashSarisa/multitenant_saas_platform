'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboardStats } from '@/hooks/use-dashboard-stats';
import { Users, Building2, CreditCard, Activity } from 'lucide-react';

export function StatsCards() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="animate-pulse bg-white/50 h-32" />
      ))}
    </div>;
  }

  const items = [
    {
      title: 'Total Tenants',
      value: stats?.totalTenants || 0,
      description: `+${stats?.newTenantsThisMonth || 0} this month`,
      icon: Building2,
      color: 'text-violet-600',
    },
    {
      title: 'Active Users',
      value: stats?.totalUsers || 0,
      description: ' across all tenants',
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: 'Monthly Revenue',
      value: `$${stats?.mrr?.toLocaleString() || 0}`,
      description: 'Recurring Revenue',
      icon: CreditCard,
      color: 'text-emerald-600',
    },
    {
      title: 'Trial Users',
      value: stats?.trialTenants || 0,
      description: 'Potential conversions',
      icon: Activity,
      color: 'text-pink-600',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.title} className="bg-white hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              {item.title}
            </CardTitle>
            <item.icon className={`h-4 w-4 ${item.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{item.value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {item.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
