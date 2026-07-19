import { CAT_BREEDS, VACCINE_TYPES } from './vaccineTypes';

export type Species = 'kedi' | 'kopek' | 'kus' | 'hamster' | 'tavsan' | 'diger';

export interface SpeciesMeta {
  key: Species;
  label: string;
  emoji: string;
}

export const SPECIES_LIST: SpeciesMeta[] = [
  { key: 'kedi',    label: 'Kedi',    emoji: '🐱' },
  { key: 'kopek',   label: 'Köpek',   emoji: '🐶' },
  { key: 'kus',     label: 'Kuş',     emoji: '🦜' },
  { key: 'hamster', label: 'Hamster', emoji: '🐹' },
  { key: 'tavsan',  label: 'Tavşan',  emoji: '🐰' },
  { key: 'diger',   label: 'Diğer',   emoji: '🐾' },
];

export const getSpecies = (key?: string): SpeciesMeta =>
  SPECIES_LIST.find((s) => s.key === key) ?? SPECIES_LIST[0];

const DOG_BREEDS = [
  'Golden Retriever', 'Labrador', 'Alman Kurdu', 'Kangal', 'Akbaş',
  'Pomeranian', 'Poodle', 'Terrier', 'Chihuahua', 'Bulldog',
  'Beagle', 'Husky', 'Cocker Spaniel', 'Shih Tzu', 'Maltese', 'Diğer',
] as const;

const BIRD_BREEDS = [
  'Muhabbet Kuşu', 'Sultan Papağanı', 'Kanarya', 'Cennet Papağanı',
  'Jako', 'Hint Bülbülü', 'İspinoz', 'Diğer',
] as const;

// Tür başına ırk önerileri; listede olmayan türlerde serbest metin kullanılır.
export const BREEDS_BY_SPECIES: Partial<Record<Species, readonly string[]>> = {
  kedi: CAT_BREEDS,
  kopek: DOG_BREEDS,
  kus: BIRD_BREEDS,
};

const DOG_VACCINES = [
  'Karma (5\'li)', 'Karma (6\'lı)', 'Kuduz', 'Bronşin (Kennel Cough)',
  'Corona', 'Lyme', 'Parazit (İç/Dış)', 'Diğer',
] as const;

const GENERIC_VACCINES = ['Karma', 'Kuduz', 'Parazit (İç/Dış)', 'Diğer'] as const;

// Tür başına aşı önerileri; kuş/hamster gibi türlerde genel liste kullanılır.
export const VACCINES_BY_SPECIES: Record<Species, readonly string[]> = {
  kedi: VACCINE_TYPES,
  kopek: DOG_VACCINES,
  kus: GENERIC_VACCINES,
  hamster: GENERIC_VACCINES,
  tavsan: GENERIC_VACCINES,
  diger: GENERIC_VACCINES,
};
