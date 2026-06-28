import { Heart, LucideIcon, NotebookPen, Stethoscope, UtensilsCrossed, Cat } from 'lucide-react-native';
import { NoteCategory } from '../types';
import { colors } from './colors';

export interface NoteCategoryMeta {
  key: NoteCategory;
  label: string;
  icon: LucideIcon;
  color: string;
  tint: string;
}

// Ordered as they appear in the editor's category picker.
export const NOTE_CATEGORIES: NoteCategoryMeta[] = [
  { key: 'general',  label: 'Genel',    icon: NotebookPen,      color: colors.primary,     tint: colors.primaryTint },
  { key: 'health',   label: 'Sağlık',   icon: Heart,            color: colors.secondary,   tint: colors.secondaryTint },
  { key: 'behavior', label: 'Davranış', icon: Cat,              color: colors.accent,      tint: 'rgba(212,165,160,0.14)' },
  { key: 'diet',     label: 'Beslenme', icon: UtensilsCrossed,  color: colors.warning,     tint: colors.warningTint },
  { key: 'vet',      label: 'Veteriner',icon: Stethoscope,      color: colors.destructive, tint: colors.destructiveTint },
];

export const getNoteCategory = (key: NoteCategory): NoteCategoryMeta =>
  NOTE_CATEGORIES.find((c) => c.key === key) ?? NOTE_CATEGORIES[0];
