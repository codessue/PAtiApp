import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { User } from '../types';
import { authApi, setSessionExpiredHandler } from '../services/api';
import { clearNotesForUser, useNotesStore } from './notesStore';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** Locally-chosen profile photo URI (device-only, not yet synced to backend). */
  avatarUri: string | null;
  /** Locally-chosen "Kedilerim" cover photo URI (device-only). */
  coverUri: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Sunucuda hesabı kalıcı siler, ardından yerel oturumu temizler. */
  deleteAccount: () => Promise<void>;
  loadUser: () => Promise<void>;
  setAvatarUri: (uri: string | null) => Promise<void>;
  setCoverUri: (uri: string | null) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  avatarUri: null,
  coverUri: null,

  loadUser: async () => {
    try {
      const userJson = await SecureStore.getItemAsync('user');
      const accessToken = await SecureStore.getItemAsync('accessToken');
      const avatarUri = await SecureStore.getItemAsync('avatarUri');
      const coverUri = await SecureStore.getItemAsync('coverUri');
      if (userJson && accessToken) {
        set({
          user: JSON.parse(userJson),
          isAuthenticated: true,
          avatarUri: avatarUri ?? null,
          coverUri: coverUri ?? null,
        });
      }
    } catch {
      // ignore
    } finally {
      set({ isLoading: false });
    }
  },

  setAvatarUri: async (uri) => {
    if (uri) {
      await SecureStore.setItemAsync('avatarUri', uri);
    } else {
      await SecureStore.deleteItemAsync('avatarUri');
    }
    set({ avatarUri: uri });
  },

  setCoverUri: async (uri) => {
    if (uri) {
      await SecureStore.setItemAsync('coverUri', uri);
    } else {
      await SecureStore.deleteItemAsync('coverUri');
    }
    set({ coverUri: uri });
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

  deleteAccount: async () => {
    const uid = useAuthStore.getState().user?.id;
    await authApi.deleteAccount(); // hata olursa fırlatır — UI gösterir, oturum korunur
    if (uid) {
      // Cihazda kalan notları ve hatırlatıcıları da temizle (KVKK).
      try { await clearNotesForUser(uid); } catch { /* en-iyi-çaba */ }
    }
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('user');
    await SecureStore.deleteItemAsync('avatarUri');
    await SecureStore.deleteItemAsync('coverUri');
    set({ user: null, isAuthenticated: false, avatarUri: null, coverUri: null });
  },

  logout: async () => {
    try { await authApi.logout(); } catch { /* best-effort */ }
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('user');
    await SecureStore.deleteItemAsync('avatarUri');
    await SecureStore.deleteItemAsync('coverUri');
    // Bellekteki not listesini sıfırla — sonraki girişte doğru hesabın
    // notları diskteki hesaba-özel anahtarlardan yeniden yüklenir.
    useNotesStore.setState({ notes: [], loaded: false });
    set({ user: null, isAuthenticated: false, avatarUri: null, coverUri: null });
  },
}));

// Refresh token da geçersizse kullanıcıyı login ekranına döndür — tokenlar
// api.ts tarafında zaten silindi, burada yalnızca state ve yerel oturum temizlenir.
setSessionExpiredHandler(() => {
  SecureStore.deleteItemAsync('user').catch(() => {});
  useNotesStore.setState({ notes: [], loaded: false });
  useAuthStore.setState({ user: null, isAuthenticated: false });
});
