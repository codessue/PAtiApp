import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { vaccinesApi } from '../services/api';
import { VaccineSchedule } from '../types';

export const useVaccines = (catId: string) =>
  useQuery<VaccineSchedule[]>({
    queryKey: ['vaccines', catId],
    queryFn: async () => {
      const { data } = await vaccinesApi.getByCat(catId);
      return data.data;
    },
    enabled: !!catId,
  });

export const useUpcomingVaccines = (days = 30) =>
  useQuery<VaccineSchedule[]>({
    queryKey: ['vaccines', 'upcoming', days],
    queryFn: async () => {
      const { data } = await vaccinesApi.getUpcoming(days);
      return data.data;
    },
  });

export const useCreateVaccine = (catId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<VaccineSchedule>) => vaccinesApi.create(catId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vaccines', catId] });
      qc.invalidateQueries({ queryKey: ['vaccines', 'upcoming'] });
      qc.invalidateQueries({ queryKey: ['cats'] });
    },
  });
};

export const useUpdateVaccine = (catId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VaccineSchedule> }) =>
      vaccinesApi.update(catId, id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vaccines', catId] });
      qc.invalidateQueries({ queryKey: ['vaccines', 'upcoming'] });
    },
  });
};

export const useDeleteVaccine = (catId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vaccinesApi.delete(catId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vaccines', catId] }),
  });
};
