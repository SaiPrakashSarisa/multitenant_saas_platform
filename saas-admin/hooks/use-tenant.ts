import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export function useTenant(id: string) {
  return useQuery({
    queryKey: ['admin-tenant', id],
    queryFn: async () => {
      const response = await api.get(`/admin/tenants/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });
}

export function useTenantActions() {
  const queryClient = useQueryClient();

  const suspendMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await api.put(`/admin/tenants/${id}/suspend`, { reason });
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-tenant', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
    },
  });

  const activateMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.put(`/admin/tenants/${id}/activate`);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['admin-tenant', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
    },
  });

  return {
    suspendTenant: suspendMutation.mutateAsync,
    activateTenant: activateMutation.mutateAsync,
    isSuspending: suspendMutation.isPending,
    isActivating: activateMutation.isPending,
  };
}
