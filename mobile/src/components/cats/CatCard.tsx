import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CheckCircle2, ChevronRight, Scale, Syringe } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { fonts, radius, shadow, spacing } from '../../constants/typography';
import { Cat } from '../../types';
import { getCatAge } from '../../utils/dateHelpers';
import { Avatar } from '../ui/Avatar';

interface CatCardProps {
  cat: Cat;
  onPress: () => void;
}

export const CatCard: React.FC<CatCardProps> = ({ cat, onPress }) => {
  const daysUntil = cat.nextVaccineDate
    ? Math.ceil((new Date(cat.nextVaccineDate).getTime() - Date.now()) / 86400000)
    : null;
  const vaccineMissing = daysUntil != null && daysUntil < 0;

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.card}>
      <Avatar uri={cat.photoUrl} name={cat.name} size={72} />

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{cat.name}</Text>
          <View style={[styles.statusDot, { backgroundColor: vaccineMissing ? colors.destructive : colors.success }]} />
        </View>

        <Text style={styles.details} numberOfLines={1}>
          {cat.breed ?? 'Irk bilinmiyor'} • {getCatAge(cat.birthDate)}
        </Text>

        <View style={styles.chips}>
          {cat.latestWeight != null && (
            <View style={[styles.chip, styles.weightChip]}>
              <Scale size={13} color={colors.primary} strokeWidth={2.2} />
              <Text style={styles.weightChipText}>{cat.latestWeight.toFixed(2)} kg</Text>
            </View>
          )}

          {vaccineMissing ? (
            <View style={[styles.chip, { backgroundColor: colors.destructiveTint }]}>
              <Syringe size={13} color={colors.destructive} strokeWidth={2.2} />
              <Text style={[styles.statusChipText, { color: colors.destructive }]}>Aşı eksik</Text>
            </View>
          ) : (
            <View style={[styles.chip, { backgroundColor: colors.successTint }]}>
              <CheckCircle2 size={13} color={colors.success} strokeWidth={2.2} />
              <Text style={[styles.statusChipText, { color: colors.success }]}>Sağlıklı</Text>
            </View>
          )}
        </View>
      </View>

      <ChevronRight size={22} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  info: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { fontFamily: fonts.sansBold, fontSize: 18, color: colors.foreground, flexShrink: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  details: { fontFamily: fonts.sans, fontSize: 14, color: colors.mutedForeground },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  weightChip: { backgroundColor: colors.muted },
  weightChipText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.foreground },
  statusChipText: { fontFamily: fonts.sansMedium, fontSize: 12 },
});
