import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export function useSystemHealth() {
  return useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      const response = await api.get('/admin/system/health');
      return response.data.data;
    },
    refetchInterval: 30000, // Refresh every 30s
  });
}

export function useAuditLogs(page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: ['audit-logs', page, limit],
    queryFn: async () => {
      const response = await api.get(`/admin/system/logs?page=${page}&limit=${limit}`);
      return response.data.data;
    },
  });
}
