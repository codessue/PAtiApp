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

// Aşı değişiklikleri üç yeri etkiler: o dostun listesi, ana sayfadaki yaklaşan
// aşılar ve dost kartındaki "sonraki aşı" özeti.
const invalidateVaccines = (qc: ReturnType<typeof useQueryClient>, catId: string) => {
  qc.invalidateQueries({ queryKey: ['vaccines', catId] });
  qc.invalidateQueries({ queryKey: ['vaccines', 'upcoming'] });
  qc.invalidateQueries({ queryKey: ['cats'] });
};

export const useCreateVaccine = (catId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<VaccineSchedule>) => vaccinesApi.create(catId, data),
    onSuccess: () => invalidateVaccines(qc, catId),
  });
};

export const useUpdateVaccine = (catId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VaccineSchedule> }) =>
      vaccinesApi.update(catId, id, data),
    onSuccess: () => invalidateVaccines(qc, catId),
  });
};

export const useDeleteVaccine = (catId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vaccinesApi.delete(catId, id),
    // Silinen aşı, tazelenmediği için ana sayfadaki "yaklaşan aşı" kartında ve
    // dost kartındaki sonraki-aşı bilgisinde görünmeye devam ediyordu.
    onSuccess: () => invalidateVaccines(qc, catId),
  });
};
