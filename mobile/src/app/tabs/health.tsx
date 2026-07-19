import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Bot, ChevronRight, LucideIcon, Pill, Scale, Syringe } from 'lucide-react-native';
import { RootStackParamList } from '../Navigation';
import { useCats } from '../../hooks/useCats';
import { colors } from '../../constants/colors';
import { fonts, radius, shadow, spacing } from '../../constants/typography';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { getSpecies } from '../../constants/species';
import { getCatAge } from '../../utils/dateHelpers';

type Nav = StackNavigationProp<RootStackParamList>;
type HealthRoute = 'VaccineList' | 'WeightChart' | 'MedicationList';

interface Action {
  key: string;
  label: string;
  icon: LucideIcon;
  route: HealthRoute;
  color: string;
  tint: string;
}

const ACTIONS: Action[] = [
  { key: 'vaccines', label: 'Aşılar', icon: Syringe, route: 'VaccineList', color: colors.primary, tint: colors.primaryTint },
  { key: 'weight', label: 'Kilo', icon: Scale, route: 'WeightChart', color: colors.secondary, tint: colors.secondaryTint },
  { key: 'medications', label: 'İlaçlar', icon: Pill, route: 'MedicationList', color: colors.warning, tint: colors.warningTint },
];

export const HealthScreen = () => {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const { data: cats, isError, refetch, isRefetching } = useCats();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Sağlık Merkezi</Text>
      <Text style={styles.subtitle}>Tüylü dostlarının sağlık takibi</Text>

      {/* AI symptom assistant entry */}
      <Pressable
        onPress={() => nav.navigate('SymptomAssistant')}
        style={({ pressed }) => [styles.assistant, pressed && styles.assistantPressed]}
      >
        <View style={styles.assistantIcon}>
          <Bot size={24} color={colors.primaryForeground} strokeWidth={2.2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.assistantTitle}>Sağlık Asistanı</Text>
          <Text style={styles.assistantSub}>Belirtileri anlat, aciliyeti öğren</Text>
        </View>
        <ChevronRight size={22} color={colors.primaryForeground} />
      </Pressable>

      {isError && (!cats || cats.length === 0) ? (
        <ErrorState onRetry={refetch} retrying={isRefetching} />
      ) : !cats || cats.length === 0 ? (
        <EmptyState
          image={require('../../../assets/cat-walk.png')}
          title="Henüz dost yok"
          description="Sağlık kayıtlarını görmek için önce bir dost ekleyin."
          actionLabel="Dost Ekle"
          onAction={() => nav.navigate('AddCat')}
        />
      ) : (
        cats.map((cat) => (
          <Card key={cat.id} style={styles.catCard}>
            {/* Cat header */}
            <View style={styles.catHeader}>
              <Avatar uri={cat.photoUrl} name={cat.name} size={44} />
              <View style={{ flex: 1 }}>
                <Text style={styles.catName} numberOfLines={1}>{cat.name}</Text>
                <Text style={styles.catMeta} numberOfLines={1}>
                  {getSpecies(cat.species).emoji} {cat.breed ?? getSpecies(cat.species).label} • {getCatAge(cat.birthDate)}
                </Text>
              </View>
            </View>

            {/* Action tiles */}
            <View style={styles.actions}>
              {ACTIONS.map((a) => (
                <Pressable
                  key={a.key}
                  onPress={() => nav.navigate(a.route as 'VaccineList', { catId: cat.id, catName: cat.name })}
                  style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
                >
                  <View style={[styles.actionIcon, { backgroundColor: a.tint }]}>
                    <a.icon size={24} color={a.color} strokeWidth={2.2} />
                  </View>
                  <Text style={styles.actionLabel}>{a.label}</Text>
                </Pressable>
              ))}
            </View>
          </Card>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 24, gap: spacing.lg, paddingBottom: spacing['3xl'] },

  title: { fontFamily: fonts.serif, fontSize: 30, color: colors.foreground, letterSpacing: -0.6 },
  subtitle: { fontFamily: fonts.sans, fontSize: 15, color: colors.mutedForeground, marginTop: 2, marginBottom: spacing.xs },

  assistant: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 3,
  },
  assistantPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  assistantIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  assistantTitle: { fontFamily: fonts.serifSemi, fontSize: 18, color: colors.primaryForeground },
  assistantSub: { fontFamily: fonts.sans, fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 1 },

  catCard: { gap: spacing.lg },
  catHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  catName: { fontFamily: fonts.serifSemi, fontSize: 18, color: colors.foreground },
  catMeta: { fontFamily: fonts.sans, fontSize: 13, color: colors.mutedForeground, marginTop: 1 },

  actions: { flexDirection: 'row', gap: spacing.md },
  action: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.85,
    backgroundColor: colors.muted,
  },
  actionIcon: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  actionLabel: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.foreground },
});
