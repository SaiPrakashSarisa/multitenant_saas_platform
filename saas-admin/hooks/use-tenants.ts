import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export function useTenants(page: number, limit: number, search?: string, status?: string) {
  return useQuery({
    queryKey: ['admin-tenants', page, limit, search, status],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (search) params.append('search', search);
      if (status && status !== 'all') params.append('status', status);

      const response = await api.get(`/admin/tenants?${params.toString()}`);
      return response.data.data;
    },
    placeholderData: (previousData) => previousData,
  });
}
