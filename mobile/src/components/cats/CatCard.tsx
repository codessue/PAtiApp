import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../constants/colors';
import { radius, shadow, spacing } from '../../constants/typography';
import { Cat } from '../../types';
import { getCatAge, getVaccineUrgencyColor } from '../../utils/dateHelpers';
import { Avatar } from '../ui/Avatar';

interface CatCardProps {
  cat: Cat;
  onPress: () => void;
}

export const CatCard: React.FC<CatCardProps> = ({ cat, onPress }) => (
  <TouchableOpacity activeOpacity={0.75} onPress={onPress} style={styles.card}>
    <Avatar uri={cat.photoUrl} name={cat.name} size={64} />
    <View style={styles.info}>
      <Text style={styles.name}>{cat.name}</Text>
      <Text style={styles.details}>
        {cat.breed ?? 'Irk bilinmiyor'} · {getCatAge(cat.birthDate)}
      </Text>
      {cat.latestWeight && (
        <Text style={styles.weight}>⚖️ {cat.latestWeight.toFixed(2)} kg</Text>
      )}
    </View>
    {cat.nextVaccineDate && (
      <View style={[styles.vaccineBadge, { backgroundColor: getVaccineUrgencyColor(
        Math.ceil((new Date(cat.nextVaccineDate).getTime() - Date.now()) / 86400000)
      ) + '20' }]}>
        <Text style={styles.vaccineText}>💉</Text>
      </View>
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  info: { flex: 1 },
  name: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 17,
    color: colors.text,
    marginBottom: 2,
  },
  details: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 2,
  },
  weight: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
  vaccineBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vaccineText: { fontSize: 18 },
});
