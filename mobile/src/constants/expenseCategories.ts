import {
  Bandage,
  Bath,
  FlaskConical,
  Globe,
  LucideIcon,
  Package,
  PawPrint,
  Pill,
  Receipt,
  Scissors,
  ShoppingCart,
  Sparkles,
  Stethoscope,
  Store,
  Syringe,
  ToyBrick,
} from 'lucide-react-native';
import { ExpenseCategory, ExpensePlace } from '../types';

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string; icon: LucideIcon }[] = [
  { value: 'food',       label: 'Mama',     icon: PawPrint },
  { value: 'litter',     label: 'Kum',      icon: Package },
  { value: 'toy',        label: 'Oyuncak',  icon: ToyBrick },
  { value: 'accessory',  label: 'Aksesuar', icon: Sparkles },
  { value: 'grooming',   label: 'Bakım',    icon: Bath },
  { value: 'exam',       label: 'Muayene',  icon: Stethoscope },
  { value: 'treatment',  label: 'Tedavi',   icon: Bandage },
  { value: 'medication', label: 'İlaç',     icon: Pill },
  { value: 'vaccine',    label: 'Aşı',      icon: Syringe },
  { value: 'surgery',    label: 'Ameliyat', icon: Scissors },
  { value: 'lab',        label: 'Tahlil',   icon: FlaskConical },
  { value: 'other',      label: 'Diğer',    icon: Receipt },
];

export const getExpenseCategory = (value: ExpenseCategory) =>
  EXPENSE_CATEGORIES.find((c) => c.value === value) ?? EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1];

// Alışveriş yeri. `namePlaceholder` mağaza/klinik adı alanının örneği.
export const EXPENSE_PLACES: { value: ExpensePlace; label: string; icon: LucideIcon; namePlaceholder: string }[] = [
  { value: 'market',  label: 'Market',            icon: ShoppingCart, namePlaceholder: 'Örn. Migros, BİM, A101' },
  { value: 'petshop', label: 'Petshop',           icon: Store,        namePlaceholder: 'Örn. Pati Petshop' },
  { value: 'online',  label: 'E-ticaret',         icon: Globe,        namePlaceholder: 'Örn. Trendyol, Hepsiburada, Amazon' },
  { value: 'vet',     label: 'Veteriner Kliniği', icon: Stethoscope,  namePlaceholder: 'Örn. Pati Veteriner Kliniği' },
  { value: 'other',   label: 'Diğer',             icon: Receipt,      namePlaceholder: 'Nereden alındı?' },
];

export const getExpensePlace = (value?: ExpensePlace) =>
  EXPENSE_PLACES.find((p) => p.value === value) ?? EXPENSE_PLACES[EXPENSE_PLACES.length - 1];
