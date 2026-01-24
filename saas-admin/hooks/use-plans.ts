import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export function usePlans() {
  return useQuery({
    queryKey: ['admin-plans'],
    queryFn: async () => {
      const response = await api.get('/admin/plans');
      return response.data.data;
    },
  });
}

export function usePlanActions() {
  const queryClient = useQueryClient();

  const createPlan = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/admin/plans', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
    },
  });

  const updatePlan = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.put(`/admin/plans/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
    },
  });

  const deletePlan = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/plans/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
    },
  });

  return {
    createPlan: createPlan.mutateAsync,
    updatePlan: updatePlan.mutateAsync,
    deletePlan: deletePlan.mutateAsync,
    isCreating: createPlan.isPending,
    isUpdating: updatePlan.isPending,
    isDeleting: deletePlan.isPending,
  };
}
