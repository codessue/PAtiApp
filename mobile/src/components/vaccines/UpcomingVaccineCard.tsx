import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/typography';
import { VaccineSchedule } from '../../types';
import { formatShortDate, getVaccineUrgencyColor, getVaccineUrgencyLabel } from '../../utils/dateHelpers';

interface UpcomingVaccineCardProps {
  vaccine: VaccineSchedule;
  onPress?: () => void;
}

export const UpcomingVaccineCard: React.FC<UpcomingVaccineCardProps> = ({ vaccine, onPress }) => {
  const color = getVaccineUrgencyColor(vaccine.daysUntilDue);

  return (
    <TouchableOpacity activeOpacity={0.75} onPress={onPress} style={styles.card}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <View style={styles.info}>
        <Text style={styles.cat}>{vaccine.catName}</Text>
        <Text style={styles.type}>{vaccine.vaccineType}</Text>
      </View>
      <View style={styles.dateContainer}>
        <Text style={[styles.urgency, { color }]}>{getVaccineUrgencyLabel(vaccine.daysUntilDue)}</Text>
        <Text style={styles.date}>{formatShortDate(vaccine.nextDueDate)}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dot: { width: 10, height: 10, borderRadius: radius.full },
  info: { flex: 1 },
  cat: { fontFamily: 'DMSans_500Medium', fontSize: 14, color: colors.text },
  type: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.textMuted },
  dateContainer: { alignItems: 'flex-end' },
  urgency: { fontFamily: 'DMSans_500Medium', fontSize: 12 },
  date: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.textMuted },
});
