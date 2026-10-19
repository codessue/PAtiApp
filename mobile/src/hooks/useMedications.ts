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

// ['medications', catId] anahtarını geçersiz kılmak ['medications','today']
// sorgusunu kapsamaz; ilaç ekleyip/silip ana sayfaya dönünce "Bugünkü İlaçlar"
// eski hâlinde kalıyordu. Her iki anahtarı da birlikte tazeliyoruz.
const invalidateMedications = (qc: ReturnType<typeof useQueryClient>, catId: string) => {
  qc.invalidateQueries({ queryKey: ['medications', catId] });
  qc.invalidateQueries({ queryKey: ['medications', 'today'] });
};

export const useCreateMedication = (catId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Medication>) => medicationsApi.create(catId, data),
    onSuccess: () => invalidateMedications(qc, catId),
  });
};

export const useUpdateMedication = (catId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Medication> }) =>
      medicationsApi.update(catId, id, data),
    onSuccess: () => invalidateMedications(qc, catId),
  });
};

export const useDeleteMedication = (catId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => medicationsApi.delete(catId, id),
    onSuccess: () => invalidateMedications(qc, catId),
  });
};

/// Ana sayfadaki "Bugünkü İlaçlar" listesi farklı dostların ilaçlarını bir arada
/// gösterdiği için catId mutasyonla birlikte gelir.
export const useLogTodayDose = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ catId, medicationId, status, reminderTime }: {
      catId: string;
      medicationId: string;
      status: 'given' | 'skipped';
      reminderTime?: string;
    }) => medicationsApi.logDose(catId, medicationId, { status, reminderTime }),
    onSuccess: (_, { catId }) => invalidateMedications(qc, catId),
  });
};

export const useLogDose = (catId: string) => {
  const qc = useQueryClient();
  return useMutation({
    // reminderTime gönderilmezse sunucu kaydı "şu an"a yazar ve o ilacın tüm
    // saatleri aynı duruma düşerdi; hangi dozun işaretlendiğini birlikte yolluyoruz.
    mutationFn: ({ id, status, reminderTime }: {
      id: string;
      status: 'given' | 'skipped';
      reminderTime?: string;
    }) => medicationsApi.logDose(catId, id, { status, reminderTime }),
    onSuccess: () => invalidateMedications(qc, catId),
  });
};
