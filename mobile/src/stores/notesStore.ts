import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Note } from '../types';
import { scheduleNoteReminder, cancelNoteReminder } from '../utils/notifications';

// Device-only persistence (per UI scope: notes never leave the phone).
//
// Each note is stored under its own SecureStore key (`note.item.<id>`) with a
// separate index key holding the ordered list of ids. Per-note keys keep each
// stored value small, sidestepping SecureStore's ~2KB per-value Android limit
// that a single combined JSON blob would eventually hit.
const INDEX_KEY = 'notes.index';
const itemKey = (id: string) => `note.item.${id}`;

// SecureStore keys must be [A-Za-z0-9._-]; this id generator stays within that.
const newId = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const readIndex = async (): Promise<string[]> => {
  const raw = await SecureStore.getItemAsync(INDEX_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeIndex = (ids: string[]) =>
  SecureStore.setItemAsync(INDEX_KEY, JSON.stringify(ids));

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
      const ids = await readIndex();
      const raw = await Promise.all(ids.map((id) => SecureStore.getItemAsync(itemKey(id))));
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

    await SecureStore.setItemAsync(itemKey(note.id), JSON.stringify(note));
    if (!existing) {
      const ids = await readIndex();
      await writeIndex([note.id, ...ids]);
    }

    const others = get().notes.filter((n) => n.id !== note.id);
    set({ notes: sortNotes([note, ...others]) });
    return note;
  },

  deleteNote: async (id) => {
    const existing = get().notes.find((n) => n.id === id);
    await cancelNoteReminder(existing?.notificationId);
    await SecureStore.deleteItemAsync(itemKey(id));
    const ids = (await readIndex()).filter((x) => x !== id);
    await writeIndex(ids);
    set({ notes: get().notes.filter((n) => n.id !== id) });
  },

  togglePin: async (id) => {
    const existing = get().notes.find((n) => n.id === id);
    if (!existing) return;
    const updated: Note = { ...existing, pinned: !existing.pinned, updatedAt: new Date().toISOString() };
    await SecureStore.setItemAsync(itemKey(id), JSON.stringify(updated));
    set({ notes: sortNotes(get().notes.map((n) => (n.id === id ? updated : n))) });
  },
}));
