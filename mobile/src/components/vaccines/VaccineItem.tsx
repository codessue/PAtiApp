import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CheckCircle2, Syringe } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { fonts, radius, shadow, spacing } from '../../constants/typography';
import { VaccineSchedule } from '../../types';
import { formatDate, getVaccineUrgencyColor, getVaccineUrgencyLabel } from '../../utils/dateHelpers';

interface VaccineItemProps {
  vaccine: VaccineSchedule;
  onPress?: () => void;
}

export const VaccineItem: React.FC<VaccineItemProps> = ({ vaccine, onPress }) => {
  const completed = vaccine.isCompleted;
  const urgencyColor = getVaccineUrgencyColor(vaccine.daysUntilDue);
  const tileColor = completed ? colors.secondary : urgencyColor;
  const clinic = vaccine.clinicName ?? vaccine.vetName;
  const givenDate = vaccine.lastGivenDate ?? vaccine.nextDueDate;

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.8 : 1}
      onPress={onPress}
      style={styles.card}
    >
      <View style={[styles.iconTile, { backgroundColor: tileColor + '1A' }]}>
        {completed ? (
          <CheckCircle2 size={20} color={tileColor} strokeWidth={2.2} />
        ) : (
          <Syringe size={20} color={tileColor} strokeWidth={2.2} />
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.type} numberOfLines={1}>{vaccine.vaccineType}</Text>
        <Text style={styles.sub} numberOfLines={1}>
          {completed
            ? `${formatDate(givenDate)}${clinic ? ` • ${clinic}` : ''}`
            : getVaccineUrgencyLabel(vaccine.daysUntilDue)}
        </Text>
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
    padding: 16,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  iconTile: { width: 40, height: 40, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 2 },
  type: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.foreground },
  sub: { fontFamily: fonts.sans, fontSize: 13, color: colors.mutedForeground },
});
