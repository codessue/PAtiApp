export interface MoodMeta {
  key: string;
  emoji: string;
  label: string;
}

// Günlük kayıtlarındaki ruh hali seçenekleri.
export const MOODS: MoodMeta[] = [
  { key: 'harika',   emoji: '🤩', label: 'Harika' },
  { key: 'mutlu',    emoji: '😊', label: 'Mutlu' },
  { key: 'sakin',    emoji: '😌', label: 'Sakin' },
  { key: 'keyifsiz', emoji: '😕', label: 'Keyifsiz' },
  { key: 'hasta',    emoji: '🤒', label: 'Hasta' },
];

export const getMood = (key?: string): MoodMeta | undefined =>
  MOODS.find((m) => m.key === key);
