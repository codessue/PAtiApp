import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { catsApi } from '../services/api';
import { Cat } from '../types';

export const useCats = () =>
  useQuery<Cat[]>({
    queryKey: ['cats'],
    queryFn: async () => {
      const { data } = await catsApi.getAll();
      return data.data;
    },
  });

export const useCat = (id: string) =>
  useQuery<Cat>({
    queryKey: ['cats', id],
    queryFn: async () => {
      const { data } = await catsApi.getById(id);
      return data.data;
    },
    enabled: !!id,
  });

export const useCreateCat = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Cat>) => catsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cats'] }),
  });
};

export const useUpdateCat = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Cat> }) =>
      catsApi.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['cats'] });
      qc.invalidateQueries({ queryKey: ['cats', id] });
    },
  });
};

export const useDeleteCat = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => catsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cats'] }),
  });
};

export const useUploadCatPhoto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, uri }: { id: string; uri: string }) => {
      const name = uri.split('/').pop() || 'photo.jpg';
      const ext = name.split('.').pop()?.toLowerCase();
      const type = ext === 'png' ? 'image/png' : ext === 'heic' ? 'image/heic' : 'image/jpeg';
      const form = new FormData();
      // React Native FormData file shape: { uri, name, type }.
      form.append('photo', { uri, name, type } as unknown as Blob);
      return catsApi.uploadPhoto(id, form);
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['cats'] });
      qc.invalidateQueries({ queryKey: ['cats', id] });
    },
  });
};
