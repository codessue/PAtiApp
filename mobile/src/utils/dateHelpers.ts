import { format, formatDistance, differenceInYears, differenceInMonths, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd MMMM yyyy', { locale: tr });
};

export const formatShortDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'd MMM', { locale: tr });
};

export const formatDayOfWeek = (): string =>
  format(new Date(), 'EEEE, d MMMM', { locale: tr });

export const formatApiDate = (date: Date): string =>
  format(date, 'yyyy-MM-dd');

export const getCatAge = (birthDate?: string): string => {
  if (!birthDate) return 'Yaş bilinmiyor';
  const birth = parseISO(birthDate);
  const years = differenceInYears(new Date(), birth);
  if (years > 0) return `${years} yaşında`;
  const months = differenceInMonths(new Date(), birth);
  return `${months} aylık`;
};

export const getVaccineUrgencyColor = (daysUntilDue: number): string => {
  if (daysUntilDue < 0) return '#D94F3D';
  if (daysUntilDue <= 7) return '#E6891A';
  if (daysUntilDue <= 30) return '#E6C819';
  return '#3D9A5C';
};

export const getVaccineUrgencyLabel = (daysUntilDue: number): string => {
  if (daysUntilDue < 0) return `${Math.abs(daysUntilDue)} gün gecikti`;
  if (daysUntilDue === 0) return 'Bugün!';
  if (daysUntilDue === 1) return 'Yarın';
  return `${daysUntilDue} gün sonra`;
};
