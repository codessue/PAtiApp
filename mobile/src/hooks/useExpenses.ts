import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { expensesApi } from '../services/api';
import { ExpenseCategory, ExpensePlace, ExpenseSummary, OverallExpenseSummary, VetExpense } from '../types';

export const useExpenses = (catId: string) =>
  useQuery<VetExpense[]>({
    queryKey: ['expenses', catId],
    queryFn: async () => {
      const { data } = await expensesApi.getByCat(catId);
      return data.data;
    },
    enabled: !!catId,
  });

export const useExpenseSummary = (catId: string) =>
  useQuery<ExpenseSummary>({
    queryKey: ['expenses', catId, 'summary'],
    queryFn: async () => {
      const { data } = await expensesApi.getSummary(catId);
      return data.data;
    },
    enabled: !!catId,
  });

export const useOverallExpenseSummary = () =>
  useQuery<OverallExpenseSummary>({
    queryKey: ['expenses', 'overall'],
    queryFn: async () => {
      const { data } = await expensesApi.getOverallSummary();
      return data.data;
    },
  });

// Mutations invalidate the whole 'expenses' prefix so the per-cat lists and
// the home-screen overall summary stay in sync.
export const useCreateExpense = (catId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      title: string;
      category: ExpenseCategory;
      place: ExpensePlace;
      clinicName?: string;
      expenseDate: string;
      amount: number;
      paidAmount?: number;
      notes?: string;
    }) => expensesApi.create(catId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  });
};

/** Fiş / ürün görselini yükler (yeni kayıt sonrası ya da sonradan ekleme). */
export const useUploadReceipt = (catId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ expenseId, uri }: { expenseId: string; uri: string }) => {
      const name = uri.split('/').pop() || 'receipt.jpg';
      const ext = name.split('.').pop()?.toLowerCase();
      const type = ext === 'png' ? 'image/png' : ext === 'heic' ? 'image/heic' : 'image/jpeg';
      const form = new FormData();
      // React Native FormData file shape: { uri, name, type }.
      form.append('receipt', { uri, name, type } as unknown as Blob);
      return expensesApi.uploadReceipt(catId, expenseId, form);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  });
};

export const useDeleteReceipt = (catId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (expenseId: string) => expensesApi.deleteReceipt(catId, expenseId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  });
};

export const useDeleteExpense = (catId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expensesApi.delete(catId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  });
};

export const useAddPayment = (catId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ expenseId, ...data }: { expenseId: string; amount: number; paidAt: string; notes?: string }) =>
      expensesApi.addPayment(catId, expenseId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  });
};

export const useDeletePayment = (catId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ expenseId, paymentId }: { expenseId: string; paymentId: string }) =>
      expensesApi.deletePayment(catId, expenseId, paymentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  });
};
