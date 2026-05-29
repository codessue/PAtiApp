import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { medicationsApi } from '../services/api';
import { Medication, TodayMedication } from '../types';

export const useMedications = (catId: string) =>
  useQuery<Medication[]>({
    queryKey: ['medications', catId],
    queryFn: async () => {
      const { data } = await medicationsApi.getByCat(catId);
      return data.data;
    },
    enabled: !!catId,
  });

export const useTodayMedications = () =>
  useQuery<TodayMedication[]>({
    queryKey: ['medications', 'today'],
    queryFn: async () => {
      const { data } = await medicationsApi.getToday();
      return data.data;
    },
  });

export const useCreateMedication = (catId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Medication>) => medicationsApi.create(catId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['medications', catId] }),
  });
};

export const useUpdateMedication = (catId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Medication> }) =>
      medicationsApi.update(catId, id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['medications', catId] }),
  });
};

export const useDeleteMedication = (catId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => medicationsApi.delete(catId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['medications', catId] }),
  });
};

export const useLogDose = (catId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'given' | 'skipped' }) =>
      medicationsApi.logDose(catId, id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medications', 'today'] });
      qc.invalidateQueries({ queryKey: ['medications', catId] });
    },
  });
};
