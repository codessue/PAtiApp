import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Note } from '../types';
import { scheduleNoteReminder, cancelNoteReminder } from '../utils/notifications';
import { useAuthStore } from './authStore';

// Device-only persistence (per UI scope: notes never leave the phone).
//
// Each note is stored under its own SecureStore key with a separate index key
// holding the ordered list of ids. Per-note keys keep each stored value small,
// sidestepping SecureStore's ~2KB per-value Android limit that a single
// combined JSON blob would eventually hit.
//
// Keys are namespaced by the LOGGED-IN USER's id so accounts on the same
// device never see each other's notes. (Notes are never sent to the server,
// so cross-device/cross-user leakage is impossible by design.)
const indexKey = (uid: string) => `notes.index.${uid}`;
const itemKey = (uid: string, id: string) => `note.item.${uid}.${id}`;

// Pre-namespace legacy keys (v1) — cleaned up once on first load.
const LEGACY_INDEX_KEY = 'notes.index';
const legacyItemKey = (id: string) => `note.item.${id}`;

const currentUid = (): string | null => useAuthStore.getState().user?.id ?? null;

// SecureStore keys must be [A-Za-z0-9._-]; this id generator stays within that.
const newId = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const parseIds = (raw: string | null): string[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const readIndex = async (uid: string): Promise<string[]> =>
  parseIds(await SecureStore.getItemAsync(indexKey(uid)));

const writeIndex = (uid: string, ids: string[]) =>
  SecureStore.setItemAsync(indexKey(uid), JSON.stringify(ids));

// v1 notes weren't tied to an account, so their owner is unknowable — showing
// them to whichever account is logged in would mix accounts' notes. Remove
// them (and their pending reminders) once.
const cleanupLegacyNotes = async (): Promise<void> => {
  const raw = await SecureStore.getItemAsync(LEGACY_INDEX_KEY);
  if (raw === null) return;
  for (const id of parseIds(raw)) {
    const itemRaw = await SecureStore.getItemAsync(legacyItemKey(id));
    if (itemRaw) {
      try {
        const note = JSON.parse(itemRaw) as Note;
        await cancelNoteReminder(note.notificationId);
      } catch {
        // bozuk kayıt — yine de sil
      }
      await SecureStore.deleteItemAsync(legacyItemKey(id));
    }
  }
  await SecureStore.deleteItemAsync(LEGACY_INDEX_KEY);
};

// Sort: pinned first, then most-recently-updated.
const sortNotes = (notes: Note[]): Note[] =>
  [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  });

export interface NoteInput {
  id?: string;
  catId?: string;
  category: Note['category'];
  title: string;
  body: string;
  reminderAt?: string;
  pinned?: boolean;
}

interface NotesState {
  notes: Note[];
  loaded: boolean;
  load: () => Promise<void>;
  saveNote: (input: NoteInput) => Promise<Note>;
  deleteNote: (id: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  loaded: false,

  load: async () => {
    try {
      const uid = currentUid();
      if (!uid) {
        set({ notes: [], loaded: true });
        return;
      }

      await cleanupLegacyNotes();

      const ids = await readIndex(uid);
      const raw = await Promise.all(ids.map((id) => SecureStore.getItemAsync(itemKey(uid, id))));
      const notes = raw
        .map((r) => {
          if (!r) return null;
          try {
            return JSON.parse(r) as Note;
          } catch {
            return null;
          }
        })
        .filter((n): n is Note => n !== null);
      set({ notes: sortNotes(notes), loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  saveNote: async (input) => {
    const uid = currentUid();
    if (!uid) throw new Error('Not kaydetmek için giriş yapmalısınız.');

    const now = new Date().toISOString();
    const existing = input.id ? get().notes.find((n) => n.id === input.id) : undefined;

    // Re-schedule the reminder whenever we save: cancel the previous one, then
    // schedule a fresh notification if a future date is set.
    await cancelNoteReminder(existing?.notificationId);
    const notificationId = await scheduleNoteReminder({
      id: input.id ?? 'pending',
      title: input.title,
      body: input.body,
      reminderAt: input.reminderAt,
    });

    const note: Note = {
      id: existing?.id ?? newId(),
      catId: input.catId,
      category: input.category,
      title: input.title.trim(),
      body: input.body.trim(),
      reminderAt: input.reminderAt,
      notificationId,
      pinned: input.pinned ?? existing?.pinned ?? false,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    await SecureStore.setItemAsync(itemKey(uid, note.id), JSON.stringify(note));
    if (!existing) {
      const ids = await readIndex(uid);
      await writeIndex(uid, [note.id, ...ids]);
    }

    const others = get().notes.filter((n) => n.id !== note.id);
    set({ notes: sortNotes([note, ...others]) });
    return note;
  },

  deleteNote: async (id) => {
    const uid = currentUid();
    if (!uid) return;
    const existing = get().notes.find((n) => n.id === id);
    await cancelNoteReminder(existing?.notificationId);
    await SecureStore.deleteItemAsync(itemKey(uid, id));
    const ids = (await readIndex(uid)).filter((x) => x !== id);
    await writeIndex(uid, ids);
    set({ notes: get().notes.filter((n) => n.id !== id) });
  },

  togglePin: async (id) => {
    const uid = currentUid();
    if (!uid) return;
    const existing = get().notes.find((n) => n.id === id);
    if (!existing) return;
    const updated: Note = { ...existing, pinned: !existing.pinned, updatedAt: new Date().toISOString() };
    await SecureStore.setItemAsync(itemKey(uid, id), JSON.stringify(updated));
    set({ notes: sortNotes(get().notes.map((n) => (n.id === id ? updated : n))) });
  },
}));

/// Hesap silinirken o hesabın cihazdaki notlarını ve hatırlatıcılarını temizler.
export const clearNotesForUser = async (uid: string): Promise<void> => {
  const ids = await readIndex(uid);
  for (const id of ids) {
    const raw = await SecureStore.getItemAsync(itemKey(uid, id));
    if (raw) {
      try {
        const note = JSON.parse(raw) as Note;
        await cancelNoteReminder(note.notificationId);
      } catch {
        // bozuk kayıt — yine de sil
      }
      await SecureStore.deleteItemAsync(itemKey(uid, id));
    }
  }
  await SecureStore.deleteItemAsync(indexKey(uid));
  useNotesStore.setState({ notes: [], loaded: false });
};
