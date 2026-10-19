import axios, { AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { ApiResponse } from '../types';
import { config } from '../constants/config';

const BASE_URL = config.apiUrl;

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Token yenileme de başarısız olduğunda (oturum gerçekten düştü) çağrılır;
// authStore kayıt olur ve kullanıcıyı login ekranına döndürür.
let onSessionExpired: (() => void) | null = null;
export const setSessionExpiredHandler = (handler: () => void) => {
  onSessionExpired = handler;
};

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Sunucu her yenilemede refresh token'ı döndürüyor (rotasyon). Ana sayfa gibi
// ekranlar aynı anda birkaç istek attığı için erişim tokenı dolduğunda hepsi
// birden 401 alır; her biri ayrı ayrı yenilemeye kalkarsa ilki tokenı çevirir,
// diğerleri "geçersiz token" alıp kullanıcıyı boş yere çıkışa düşürürdü.
// Bu yüzden aynı anda yalnızca tek bir yenileme isteği çalışır, diğerleri onu bekler.
let refreshInFlight: Promise<string> | null = null;

const refreshAccessToken = (): Promise<string> => {
  refreshInFlight ??= (async () => {
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    if (!refreshToken) throw new Error('No refresh token');

    const { data } = await axios.post<ApiResponse<{
      accessToken: string;
      refreshToken: string;
    }>>(`${BASE_URL}/auth/refresh`, { refreshToken });

    if (!data.data?.accessToken) throw new Error('Refresh response missing tokens');

    await SecureStore.setItemAsync('accessToken', data.data.accessToken);
    await SecureStore.setItemAsync('refreshToken', data.data.refreshToken);
    return data.data.accessToken;
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
};

const endSession = async () => {
  await SecureStore.deleteItemAsync('accessToken');
  await SecureStore.deleteItemAsync('refreshToken');
  onSessionExpired?.();
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const original = error.config as
      | (NonNullable<AxiosError['config']> & { _retry?: boolean })
      | undefined;

    // Yenileme isteğinin kendisi 401 alırsa tekrar yenilemeye çalışma.
    const isRefreshCall = original?.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && original && !original._retry && !isRefreshCall) {
      original._retry = true;
      try {
        const accessToken = await refreshAccessToken();
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${accessToken}`;
        return await api(original);
      } catch {
        await endSession();
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
  deleteAccount: () => api.delete('/auth/account'),
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

export const assistantApi = {
  // AI yanıtı genel 15sn zaman aşımından uzun sürebilir — bu istekte 60sn tanınır.
  symptomCheck: (data: { catId?: string; message: string; durationDays?: number }) =>
    api.post('/assistant/symptom-check', data, { timeout: 60000 }),
};

export const medicationsApi = {
  getByCat: (catId: string) => api.get(`/cats/${catId}/medications`),
  getToday: () => api.get('/medications/today'),
  create: (catId: string, data: unknown) => api.post(`/cats/${catId}/medications`, data),
  update: (catId: string, id: string, data: unknown) =>
    api.put(`/cats/${catId}/medications/${id}`, data),
  delete: (catId: string, id: string) => api.delete(`/cats/${catId}/medications/${id}`),
  logDose: (
    catId: string,
    id: string,
    data: { status: string; notes?: string; reminderTime?: string },
  ) => api.post(`/cats/${catId}/medications/${id}/log`, data),
};

export const expensesApi = {
  getByCat: (catId: string) => api.get(`/cats/${catId}/expenses`),
  getSummary: (catId: string) => api.get(`/cats/${catId}/expenses/summary`),
  getOverallSummary: () => api.get('/expenses/summary'),
  create: (catId: string, data: unknown) => api.post(`/cats/${catId}/expenses`, data),
  delete: (catId: string, id: string) => api.delete(`/cats/${catId}/expenses/${id}`),
  uploadReceipt: (catId: string, id: string, formData: FormData) =>
    api.post(`/cats/${catId}/expenses/${id}/receipt`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteReceipt: (catId: string, id: string) => api.delete(`/cats/${catId}/expenses/${id}/receipt`),
  addPayment: (catId: string, id: string, data: { amount: number; paidAt: string; notes?: string }) =>
    api.post(`/cats/${catId}/expenses/${id}/payments`, data),
  deletePayment: (catId: string, id: string, paymentId: string) =>
    api.delete(`/cats/${catId}/expenses/${id}/payments/${paymentId}`),
};
