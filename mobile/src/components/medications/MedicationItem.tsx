import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { Clock, Pill } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { fonts, radius, spacing } from '../../constants/typography';
import { Medication } from '../../types';
import { Card } from '../ui/Card';

interface MedicationItemProps {
  medication: Medication;
  onToggle?: (isActive: boolean) => void;
}

const FREQ_TEXT: Record<string, string> = {
  daily: 'Her gün',
  weekly: 'Her hafta',
  custom: 'Özel',
};

export const MedicationItem: React.FC<MedicationItemProps> = ({ medication, onToggle }) => {
  const freqText = FREQ_TEXT[medication.frequencyType] ?? medication.frequencyType;
  const schedule = `Günde ${medication.frequencyTimes} kez • ${freqText}`;

  return (
    <Card noPadding style={styles.card}>
      <View style={[styles.header, medication.isActive && styles.headerActive]}>
        <View style={styles.pillTile}>
          <Pill size={20} color={colors.primary} strokeWidth={2.2} />
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{medication.name}</Text>
          <Text style={styles.schedule} numberOfLines={1}>{schedule}</Text>
          {medication.dosage ? <Text style={styles.dosage} numberOfLines={1}>{medication.dosage}</Text> : null}
        </View>
        {onToggle && (
          <Switch
            value={medication.isActive}
            onValueChange={onToggle}
            trackColor={{ false: colors.muted, true: colors.primary }}
            thumbColor={colors.card}
            ios_backgroundColor={colors.muted}
          />
        )}
      </View>

      {medication.reminderTimes.length > 0 && (
        <View style={styles.body}>
          {medication.reminderTimes.map((time, i) => (
            <View key={`${time}-${i}`} style={styles.timeRow}>
              <Clock size={16} color={colors.mutedForeground} strokeWidth={2} />
              <Text style={styles.timeText}>{time}</Text>
              <View style={styles.hollowCircle} />
            </View>
          ))}
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { overflow: 'hidden', marginBottom: spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: 16,
    backgroundColor: colors.card,
  },
  headerActive: { backgroundColor: 'rgba(196,98,45,0.05)' },
  pillTile: { width: 40, height: 40, borderRadius: radius.lg, backgroundColor: colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  name: { fontFamily: fonts.sansBold, fontSize: 18, color: colors.foreground },
  schedule: { fontFamily: fonts.sans, fontSize: 13, color: colors.mutedForeground, marginTop: 2 },
  dosage: { fontFamily: fonts.sans, fontSize: 12, color: colors.mutedForeground, marginTop: 1 },

  body: { borderTopWidth: 1, borderTopColor: colors.border },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: 16, paddingVertical: spacing.md },
  timeText: { flex: 1, fontFamily: fonts.sansMedium, fontSize: 14, color: colors.foreground },
  hollowCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.border },
});
