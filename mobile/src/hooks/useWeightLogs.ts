import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { weightApi } from '../services/api';
import { WeightLog, WeightSummary } from '../types';

export const useWeightLogs = (catId: string) =>
  useQuery<WeightLog[]>({
    queryKey: ['weight', catId],
    queryFn: async () => {
      const { data } = await weightApi.getByCat(catId);
      return data.data;
    },
    enabled: !!catId,
  });

export const useWeightSummary = (catId: string) =>
  useQuery<WeightSummary>({
    queryKey: ['weight', catId, 'summary'],
    queryFn: async () => {
      const { data } = await weightApi.getSummary(catId);
      return data.data;
    },
    enabled: !!catId,
  });

export const useAddWeight = (catId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { weightKg: number; loggedAt: string; notes?: string }) =>
      weightApi.create(catId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['weight', catId] });
      qc.invalidateQueries({ queryKey: ['cats'] });
    },
  });
};

export const useDeleteWeight = (catId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => weightApi.delete(catId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['weight', catId] }),
  });
};
