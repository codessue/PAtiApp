import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { expensesApi } from '../services/api';
import { ExpenseCategory, ExpenseSummary, OverallExpenseSummary, VetExpense } from '../types';

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
      clinicName?: string;
      expenseDate: string;
      amount: number;
      paidAmount?: number;
      notes?: string;
    }) => expensesApi.create(catId, data),
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
