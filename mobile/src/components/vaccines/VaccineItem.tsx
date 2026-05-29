import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/typography';
import { VaccineSchedule } from '../../types';
import { formatDate, getVaccineUrgencyColor, getVaccineUrgencyLabel } from '../../utils/dateHelpers';
import { Badge } from '../ui/Badge';

interface VaccineItemProps {
  vaccine: VaccineSchedule;
  onPress?: () => void;
}

export const VaccineItem: React.FC<VaccineItemProps> = ({ vaccine, onPress }) => {
  const urgencyColor = getVaccineUrgencyColor(vaccine.daysUntilDue);

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[styles.container, { borderLeftColor: urgencyColor }]}
    >
      <View style={styles.header}>
        <Text style={styles.type}>{vaccine.vaccineType}</Text>
        {vaccine.isCompleted ? (
          <Badge label="Tamamlandı" color={colors.success} backgroundColor={colors.successLight} />
        ) : (
          <Badge
            label={getVaccineUrgencyLabel(vaccine.daysUntilDue)}
            color={urgencyColor}
            backgroundColor={urgencyColor + '20'}
          />
        )}
      </View>
      <Text style={styles.date}>📅 {formatDate(vaccine.nextDueDate)}</Text>
      {vaccine.vetName && (
        <Text style={styles.vet}>👨‍⚕️ {vaccine.vetName}{vaccine.clinicName ? ` · ${vaccine.clinicName}` : ''}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  type: { fontFamily: 'DMSans_500Medium', fontSize: 15, color: colors.text },
  date: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.textMuted },
  vet: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.textMuted },
});
