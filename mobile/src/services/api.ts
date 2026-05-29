import axios, { AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { ApiResponse } from '../types';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080/api';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const original = error.config as typeof error.config & { _retry?: boolean };

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post<ApiResponse<{
          accessToken: string;
          refreshToken: string;
        }>>(`${BASE_URL}/auth/refresh`, { refreshToken });

        if (data.data) {
          await SecureStore.setItemAsync('accessToken', data.data.accessToken);
          await SecureStore.setItemAsync('refreshToken', data.data.refreshToken);
          original.headers!.Authorization = `Bearer ${data.data.accessToken}`;
          return api(original);
        }
      } catch {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
  logout: () => api.post('/auth/logout'),
  updatePushToken: (expoPushToken: string) =>
    api.put('/auth/push-token', { expoPushToken }),
};

export const catsApi = {
  getAll: () => api.get('/cats'),
  getById: (id: string) => api.get(`/cats/${id}`),
  create: (data: unknown) => api.post('/cats', data),
  update: (id: string, data: unknown) => api.put(`/cats/${id}`, data),
  delete: (id: string) => api.delete(`/cats/${id}`),
  uploadPhoto: (id: string, formData: FormData) =>
    api.post(`/cats/${id}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const vaccinesApi = {
  getByCat: (catId: string) => api.get(`/cats/${catId}/vaccines`),
  getUpcoming: (days = 30) => api.get(`/vaccines/upcoming?days=${days}`),
  create: (catId: string, data: unknown) => api.post(`/cats/${catId}/vaccines`, data),
  update: (catId: string, id: string, data: unknown) =>
    api.put(`/cats/${catId}/vaccines/${id}`, data),
  delete: (catId: string, id: string) => api.delete(`/cats/${catId}/vaccines/${id}`),
};

export const weightApi = {
  getByCat: (catId: string) => api.get(`/cats/${catId}/weight`),
  getSummary: (catId: string) => api.get(`/cats/${catId}/weight/summary`),
  create: (catId: string, data: unknown) => api.post(`/cats/${catId}/weight`, data),
  delete: (catId: string, id: string) => api.delete(`/cats/${catId}/weight/${id}`),
};

export const medicationsApi = {
  getByCat: (catId: string) => api.get(`/cats/${catId}/medications`),
  getToday: () => api.get('/medications/today'),
  create: (catId: string, data: unknown) => api.post(`/cats/${catId}/medications`, data),
  update: (catId: string, id: string, data: unknown) =>
    api.put(`/cats/${catId}/medications/${id}`, data),
  delete: (catId: string, id: string) => api.delete(`/cats/${catId}/medications/${id}`),
  logDose: (catId: string, id: string, data: { status: string; notes?: string }) =>
    api.post(`/cats/${catId}/medications/${id}/log`, data),
};
