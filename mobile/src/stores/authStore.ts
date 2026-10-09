import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import { User } from '../types';
import { authApi, setOnSessionExpired } from '../services/api';
import { queryClient } from '../services/queryClient';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  loadUser: () => Promise<void>;
}

const clearSession = async () => {
  await SecureStore.deleteItemAsync('accessToken');
  await SecureStore.deleteItemAsync('refreshToken');
  await SecureStore.deleteItemAsync('user');
  queryClient.clear();
  try { await Notifications.cancelAllScheduledNotificationsAsync(); } catch { /* ignore */ }
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  loadUser: async () => {
    try {
      const userJson = await SecureStore.getItemAsync('user');
      const accessToken = await SecureStore.getItemAsync('accessToken');
      if (userJson && accessToken) {
        set({ user: JSON.parse(userJson), isAuthenticated: true });
      }
    } catch {
      // ignore
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    const { data: res } = await authApi.login({ email, password });
    const { accessToken, refreshToken, user } = res.data;
    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
    await SecureStore.setItemAsync('user', JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },

  register: async (name, email, password) => {
    const { data: res } = await authApi.register({ name, email, password });
    const { accessToken, refreshToken, user } = res.data;
    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
    await SecureStore.setItemAsync('user', JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },

  logout: async () => {
    try { await authApi.logout(); } catch { /* best-effort */ }
    await clearSession();
    set({ user: null, isAuthenticated: false });
  },

  deleteAccount: async () => {
    await authApi.deleteAccount();
    await clearSession();
    set({ user: null, isAuthenticated: false });
  },
}));

setOnSessionExpired(() => {
  queryClient.clear();
  useAuthStore.setState({ user: null, isAuthenticated: false });
});
