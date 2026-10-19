import { Bandage, FlaskConical, LucideIcon, Pill, Receipt, Scissors, Stethoscope, Syringe } from 'lucide-react-native';
import { ExpenseCategory } from '../types';

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string; icon: LucideIcon }[] = [
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
