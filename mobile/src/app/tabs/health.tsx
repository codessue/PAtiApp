import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../Navigation';
import { useCats } from '../../hooks/useCats';
import { colors } from '../../constants/colors';
import { radius, shadow, spacing } from '../../constants/typography';
import { Card } from '../../components/ui/Card';

type Nav = StackNavigationProp<RootStackParamList>;

export const HealthScreen = () => {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const { data: cats } = useCats();

  const sections = [
    { key: 'vaccines', label: 'Aşılar', emoji: '💉', route: 'VaccineList' as const },
    { key: 'weight', label: 'Kilo', emoji: '⚖️', route: 'WeightChart' as const },
    { key: 'medications', label: 'İlaçlar', emoji: '💊', route: 'MedicationList' as const },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
    >
      <Text style={styles.title}>Sağlık Merkezi ❤️</Text>

      {!cats || cats.length === 0 ? (
        <Card>
          <Text style={styles.empty}>Önce kedi ekleyin.</Text>
        </Card>
      ) : (
        cats.map((cat) => (
          <View key={cat.id} style={styles.catSection}>
            <Text style={styles.catName}>{cat.name}</Text>
            <View style={styles.grid}>
              {sections.map((s) => (
                <TouchableOpacity
                  key={s.key}
                  activeOpacity={0.75}
                  style={styles.gridItem}
                  onPress={() => nav.navigate(s.route as 'VaccineList', { catId: cat.id, catName: cat.name })}
                >
                  <Text style={styles.gridEmoji}>{s.emoji}</Text>
                  <Text style={styles.gridLabel}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing['3xl'] },
  title: { fontFamily: 'Fraunces_700Bold', fontSize: 26, color: colors.text },
  catSection: { gap: spacing.md },
  catName: { fontFamily: 'Fraunces_600SemiBold', fontSize: 18, color: colors.text },
  grid: { flexDirection: 'row', gap: spacing.md },
  gridItem: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  gridEmoji: { fontSize: 32 },
  gridLabel: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.text },
  empty: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.textMuted, textAlign: 'center', padding: spacing.lg },
});
