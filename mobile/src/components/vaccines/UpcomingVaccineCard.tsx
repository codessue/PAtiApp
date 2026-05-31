import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Clock, Syringe } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { fonts, radius, shadow, spacing } from '../../constants/typography';
import { VaccineSchedule } from '../../types';
import { formatShortDate, getVaccineUrgencyColor, getVaccineUrgencyLabel } from '../../utils/dateHelpers';

interface UpcomingVaccineCardProps {
  vaccine: VaccineSchedule;
  onPress?: () => void;
}

export const UpcomingVaccineCard: React.FC<UpcomingVaccineCardProps> = ({ vaccine, onPress }) => {
  const color = getVaccineUrgencyColor(vaccine.daysUntilDue);

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.8 : 1}
      onPress={onPress}
      style={[styles.card, { borderLeftColor: color }]}
    >
      <View style={[styles.iconTile, { backgroundColor: color + '1A' }]}>
        <Syringe size={20} color={color} strokeWidth={2.2} />
      </View>
      <View style={styles.info}>
        <Text style={styles.type} numberOfLines={1}>{vaccine.vaccineType}</Text>
        {vaccine.catName ? <Text style={styles.cat} numberOfLines={1}>{vaccine.catName}</Text> : null}
        <View style={styles.clockRow}>
          <Clock size={13} color={color} strokeWidth={2.2} />
          <Text style={[styles.clockText, { color }]}>
            {getVaccineUrgencyLabel(vaccine.daysUntilDue)} ({formatShortDate(vaccine.nextDueDate)})
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    padding: 16,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  iconTile: { width: 40, height: 40, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 2 },
  type: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.foreground },
  cat: { fontFamily: fonts.sans, fontSize: 13, color: colors.mutedForeground },
  clockRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  clockText: { fontFamily: fonts.sansMedium, fontSize: 13 },
});
