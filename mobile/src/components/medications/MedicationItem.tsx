import React from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/typography';
import { Medication } from '../../types';

interface MedicationItemProps {
  medication: Medication;
  onToggle?: (isActive: boolean) => void;
  onPress?: () => void;
}

export const MedicationItem: React.FC<MedicationItemProps> = ({
  medication,
  onToggle,
  onPress,
}) => {
  const freqLabel: Record<string, string> = {
    daily: 'Günlük',
    weekly: 'Haftalık',
    custom: 'Özel',
  };

  return (
    <TouchableOpacity activeOpacity={0.75} onPress={onPress} style={styles.container}>
      <View style={styles.left}>
        <Text style={styles.name}>{medication.name}</Text>
        {medication.dosage && <Text style={styles.dosage}>{medication.dosage}</Text>}
        <Text style={styles.frequency}>
          {freqLabel[medication.frequencyType] ?? medication.frequencyType} · Günde {medication.frequencyTimes}x
        </Text>
        {medication.reminderTimes.length > 0 && (
          <Text style={styles.times}>⏰ {medication.reminderTimes.join(', ')}</Text>
        )}
      </View>
      {onToggle && (
        <Switch
          value={medication.isActive}
          onValueChange={onToggle}
          trackColor={{ true: colors.secondary, false: colors.border }}
          thumbColor={medication.isActive ? colors.surface : colors.textLight}
        />
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
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  left: { flex: 1, gap: 2 },
  name: { fontFamily: 'DMSans_500Medium', fontSize: 15, color: colors.text },
  dosage: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.textMuted },
  frequency: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.textMuted },
  times: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.primary },
});
