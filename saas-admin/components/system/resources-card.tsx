'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useSystemHealth } from '@/hooks/use-system';
import { Cpu, Database, HardDrive, Clock, Server } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function ResourcesCard() {
  const { data: health, isLoading } = useSystemHealth();

  if (isLoading) return <Card className="h-64 animate-pulse bg-white/50" />;

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* System Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">System Status</CardTitle>
          <Server className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${health?.status === 'operational' ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <span className="text-2xl font-bold capitalize">{health?.status || 'Unknown'}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Platform: {health?.system?.platform}
          </p>
        </CardContent>
      </Card>

      {/* Database */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Database</CardTitle>
          <Database className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold capitalize">{health?.database?.status}</span>
            <Badge variant="outline">{health?.database?.latencyMs}ms latency</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            PostgreSQL Connection
          </p>
        </CardContent>
      </Card>

      {/* Uptime */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Uptime</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatUptime(health?.uptime || 0)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Since last restart
          </p>
        </CardContent>
      </Card>

      {/* Memory Usage */}
      <Card className="col-span-full md:col-span-3">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Server Resources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <HardDrive className="mr-2 h-4 w-4 text-blue-500" />
                <span>Memory Usage</span>
              </div>
              <span className="text-muted-foreground">
                {health?.system?.memoryUsageMB} MB / {health?.system?.totalMemoryMB} MB
              </span>
            </div>
            <Progress value={(health?.system?.memoryUsageMB / health?.system?.totalMemoryMB) * 100} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <Cpu className="mr-2 h-4 w-4 text-violet-500" />
                <span>Free Memory</span>
              </div>
              <span className="text-muted-foreground">
                {health?.system?.freeMemoryMB} MB Available
              </span>
            </div>
            <Progress value={(health?.system?.freeMemoryMB / health?.system?.totalMemoryMB) * 100} className="h-2 bg-violet-100" indicatorClassName="bg-violet-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
