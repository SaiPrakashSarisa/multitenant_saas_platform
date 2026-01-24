import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const response = await api.get('/admin/analytics/overview');
      return response.data.data;
    },
  });
}

export function useGrowthStats() {
  return useQuery({
    queryKey: ['admin-growth'],
    queryFn: async () => {
      const response = await api.get('/admin/analytics/growth');
      return response.data.data;
    },
  });
}
