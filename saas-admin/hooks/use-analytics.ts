import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export function usePlanDistribution() {
  return useQuery({
    queryKey: ['admin-analytics-plans'],
    queryFn: async () => {
      const response = await api.get('/admin/analytics/plans');
      return response.data.data;
    },
  });
}
