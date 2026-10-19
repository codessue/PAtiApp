export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Cat {
  id: string;
  name: string;
  /** Tür: kedi | kopek | kus | hamster | tavsan | diger */
  species: string;
  breed?: string;
  birthDate?: string;
  gender?: 'male' | 'female';
  color?: string;
  photoUrl?: string;
  isNeutered: boolean;
  notes?: string;
  latestWeight?: number;
  nextVaccineDate?: string;
  nextVaccineType?: string;
}

export interface VaccineSchedule {
  id: string;
  catId: string;
  catName?: string;
  vaccineType: string;
  lastGivenDate?: string;
  nextDueDate: string;
  vetName?: string;
  clinicName?: string;
  notes?: string;
  isCompleted: boolean;
  daysUntilDue: number;
}

export interface WeightLog {
  id: string;
  catId: string;
  weightKg: number;
  loggedAt: string;
  notes?: string;
}

export interface WeightSummary {
  current?: number;
  lowest?: number;
  highest?: number;
  avgLast30Days?: number;
  trend: 'up' | 'down' | 'stable';
}

export interface Medication {
  id: string;
  catId: string;
  catName?: string;
  name: string;
  dosage?: string;
  frequencyType: 'daily' | 'weekly' | 'custom';
  frequencyTimes: number;
  reminderTimes: string[];
  startDate: string;
  endDate?: string;
  isActive: boolean;
  notes?: string;
}

export interface TodayMedication {
  medicationId: string;
  catId: string;
  catName: string;
  medicationName: string;
  reminderTime: string;
  status: 'given' | 'skipped' | 'pending';
}

export type NoteCategory = 'general' | 'health' | 'behavior' | 'diet' | 'vet';

export interface Note {
  id: string;
  /** Optional link to a cat. When undefined, the note is general. */
  catId?: string;
  category: NoteCategory;
  title: string;
  body: string;
  /** ISO datetime. When set & in the future, a local reminder notification fires. */
  reminderAt?: string;
  /** Günlük: kayda eklenen fotoğrafın cihazdaki URI'si. */
  photoUri?: string;
  /** Günlük: o günkü ruh hali (bkz. constants/moods.ts). */
  mood?: string;
  /** expo-notifications id for the scheduled reminder, so it can be cancelled. */
  notificationId?: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SymptomUrgency = 'acil' | 'yakinda' | 'izle' | 'bilgi';

export interface SymptomCheckRequest {
  catId?: string;
  message: string;
  durationDays?: number;
}

export interface SymptomCheckResult {
  urgency: SymptomUrgency;
  summary: string;
  possibleCauses: string[];
  recommendations: string[];
  vetQuestions: string[];
  disclaimer: string;
}

export type ExpenseCategory = 'exam' | 'treatment' | 'medication' | 'vaccine' | 'surgery' | 'lab' | 'other';

export interface VetPayment {
  id: string;
  expenseId: string;
  amount: number;
  paidAt: string;
  notes?: string;
}

export interface VetExpense {
  id: string;
  catId: string;
  title: string;
  category: ExpenseCategory;
  clinicName?: string;
  expenseDate: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  notes?: string;
  payments: VetPayment[];
}

export interface ExpenseSummary {
  totalAmount: number;
  totalPaid: number;
  totalRemaining: number;
  expenseCount: number;
  unpaidCount: number;
}

export interface CatExpenseSummary {
  catId: string;
  catName: string;
  totalAmount: number;
  totalPaid: number;
  totalRemaining: number;
}

export interface OverallExpenseSummary extends ExpenseSummary {
  cats: CatExpenseSummary[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  errors?: Record<string, string[]>;
  statusCode: number;
}
