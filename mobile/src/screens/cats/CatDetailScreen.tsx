import React, { useLayoutEffect, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Plus, Settings, Syringe } from 'lucide-react-native';
import { RootStackParamList } from '../../app/Navigation';
import { useCat, useDeleteCat } from '../../hooks/useCats';
import { useWeightLogs } from '../../hooks/useWeightLogs';
import { colors } from '../../constants/colors';
import { fonts, radius, shadow, spacing } from '../../constants/typography';
import { Button } from '../../components/ui/Button';
import {
  getCatAge,
  getVaccineUrgencyColor,
  getVaccineUrgencyLabel,
} from '../../utils/dateHelpers';

type Nav = StackNavigationProp<RootStackParamList>;

const TABS = ['Özet', 'Aşılar', 'Kilo', 'İlaçlar'] as const;
type TabKey = typeof TABS[number];

// Light-blue gender accent (per design; not part of the core token palette).
const GENDER_BG = '#E8EEF5';
const GENDER_FG = '#5B7FA6';

export const CatDetailScreen = () => {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const route = useRoute();
  const { catId } = route.params as { catId: string };
  const { data: cat } = useCat(catId);
  const { mutateAsync: deleteCat } = useDeleteCat();
  const { data: weightLogs } = useWeightLogs(catId);
  const [activeTab, setActiveTab] = useState<TabKey>('Özet');

  // Full-bleed hero needs the native stack header hidden (presentation only).
  useLayoutEffect(() => {
    nav.setOptions({ headerShown: false });
  }, [nav]);

  if (!cat) return null;

  const handleDelete = () => {
    Alert.alert(
      'Kediyi Sil',
      `${cat.name}'ı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Sil', style: 'destructive', onPress: async () => {
          await deleteCat(cat.id);
          nav.goBack();
        }},
      ]
    );
  };

  const onFabPress = () => {
    if (activeTab === 'Kilo') nav.navigate('AddWeight', { catId: cat.id });
    else if (activeTab === 'İlaçlar') nav.navigate('AddMedication', { catId: cat.id });
    else nav.navigate('AddVaccine', { catId: cat.id });
  };

  // Upcoming-vaccine urgency.
  const vacDays = cat.nextVaccineDate
    ? Math.ceil((new Date(cat.nextVaccineDate).getTime() - Date.now()) / 86400000)
    : null;
  const vacColor = vacDays != null ? getVaccineUrgencyColor(vacDays) : colors.success;

  // Weight progression preview.
  const asc = [...(weightLogs ?? [])].sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
  const recent = asc.slice(-7);
  const currentWeight = cat.latestWeight ?? (recent.length ? recent[recent.length - 1].weightKg : null);
  const weightDiff = recent.length >= 2
    ? recent[recent.length - 1].weightKg - recent[recent.length - 2].weightKg
    : null;
  const barWeights = recent.map((l) => l.weightKg);
  const barMin = barWeights.length ? Math.min(...barWeights) : 0;
  const barMax = barWeights.length ? Math.max(...barWeights) : 1;
  const barRange = barMax - barMin || 1;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Hero */}
        <View style={styles.hero}>
          {cat.photoUrl ? (
            <Image source={{ uri: cat.photoUrl }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Text style={styles.heroEmoji}>🐱</Text>
            </View>
          )}
          <LinearGradient
            colors={['rgba(28,26,24,0.30)', 'rgba(250,246,240,0)', colors.background]}
            locations={[0, 0.55, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        </View>

        {/* Identity */}
        <View style={styles.identity}>
          <Text style={styles.name}>{cat.name}</Text>
          <View style={styles.identityRow}>
            <Text style={styles.breed}>{cat.breed ?? 'Irk bilinmiyor'}</Text>
            {cat.gender && (
              <View style={styles.genderBadge}>
                <Text style={styles.genderText}>
                  {cat.gender === 'male' ? '♂️ Erkek' : '♀️ Dişi'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Stat row */}
        <View style={styles.statRow}>
          <View style={styles.statTile}>
            <Text style={styles.statLabel}>Yaş</Text>
            <Text style={styles.statValue}>{getCatAge(cat.birthDate)}</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statLabel}>Kilo</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {cat.latestWeight != null ? `${cat.latestWeight.toFixed(2)} kg` : '—'}
            </Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statLabel}>Kısır</Text>
            <Text style={[styles.statValue, { color: cat.isNeutered ? colors.success : colors.foreground }]}>
              {cat.isNeutered ? 'Evet' : 'Hayır'}
            </Text>
          </View>
        </View>

        {/* Inner tabs */}
        <View style={styles.tabBar}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab content */}
        <View style={styles.tabContent}>
          {activeTab === 'Özet' && (
            <View style={{ gap: spacing.lg }}>
              {/* Upcoming vaccines */}
              <View>
                <Text style={styles.sectionTitle}>Yaklaşan Aşılar</Text>
                {cat.nextVaccineDate ? (
                  <View style={[styles.summaryCard, styles.cardRow, { borderLeftWidth: 4, borderLeftColor: vacColor }]}>
                    <View style={[styles.iconTile, { backgroundColor: vacColor + '1A' }]}>
                      <Syringe size={20} color={vacColor} strokeWidth={2.2} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle} numberOfLines={1}>{cat.nextVaccineType}</Text>
                      <Text style={[styles.cardStatus, { color: vacColor }]}>
                        {vacDays != null ? getVaccineUrgencyLabel(vacDays) : ''}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.summaryCard}>
                    <Text style={styles.mutedLine}>Yaklaşan aşı bulunmuyor</Text>
                  </View>
                )}
              </View>

              {/* Weight progression */}
              <View>
                <Text style={styles.sectionTitle}>Kilo Gelişimi</Text>
                <View style={styles.summaryCard}>
                  <View style={styles.weightHeader}>
                    <Text style={styles.weightValue}>
                      {currentWeight != null ? `${currentWeight.toFixed(2)} kg` : '—'}
                    </Text>
                    {weightDiff != null && (
                      <View style={[styles.diffPill, { backgroundColor: weightDiff >= 0 ? colors.successTint : colors.destructiveTint }]}>
                        <Text style={[styles.diffText, { color: weightDiff >= 0 ? colors.success : colors.destructive }]}>
                          {`${weightDiff >= 0 ? '+' : ''}${weightDiff.toFixed(2)} kg`}
                        </Text>
                      </View>
                    )}
                  </View>
                  {recent.length >= 2 ? (
                    <View style={styles.bars}>
                      {recent.map((log) => (
                        <View
                          key={log.id}
                          style={[
                            styles.bar,
                            { height: 8 + ((log.weightKg - barMin) / barRange) * 40 },
                          ]}
                        />
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.mutedLine}>Yeterli kilo kaydı yok</Text>
                  )}
                </View>
              </View>

              <Button title="Kediyi Sil" variant="danger" onPress={handleDelete} />
            </View>
          )}

          {activeTab === 'Aşılar' && (
            <Button title="Aşı Geçmişini Görüntüle" onPress={() => nav.navigate('VaccineList', { catId: cat.id, catName: cat.name })} />
          )}

          {activeTab === 'Kilo' && (
            <Button title="Kilo Grafiğini Görüntüle" onPress={() => nav.navigate('WeightChart', { catId: cat.id, catName: cat.name })} />
          )}

          {activeTab === 'İlaçlar' && (
            <Button title="İlaç Listesini Görüntüle" onPress={() => nav.navigate('MedicationList', { catId: cat.id, catName: cat.name })} />
          )}
        </View>
      </ScrollView>

      {/* Floating back / settings */}
      <View style={[styles.floatRow, { top: insets.top + 8 }]} pointerEvents="box-none">
        <TouchableOpacity style={styles.circleBtn} activeOpacity={0.8} onPress={() => nav.goBack()}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.circleBtn} activeOpacity={0.8} onPress={() => nav.navigate('EditCat', { catId: cat.id })}>
          <Settings size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={onFabPress}>
        <Plus size={26} color={colors.primaryForeground} strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  hero: { width: '100%', height: 280, position: 'relative', backgroundColor: 'rgba(212,165,160,0.20)' },
  heroImage: { width: '100%', height: 280 },
  heroPlaceholder: { width: '100%', height: 280, alignItems: 'center', justifyContent: 'center' },
  heroEmoji: { fontSize: 96 },

  floatRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  circleBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(28,26,24,0.45)',
  },

  identity: { paddingHorizontal: 24, marginTop: -8, gap: spacing.xs },
  name: { fontFamily: fonts.serif, fontSize: 36, color: colors.foreground, letterSpacing: -0.6 },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  breed: { fontFamily: fonts.sans, fontSize: 18, color: colors.mutedForeground },
  genderBadge: { backgroundColor: GENDER_BG, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 4 },
  genderText: { fontFamily: fonts.sansMedium, fontSize: 13, color: GENDER_FG },

  statRow: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: 24, marginTop: spacing.xl },
  statTile: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    gap: 4,
    ...shadow.card,
  },
  statLabel: { fontFamily: fonts.sans, fontSize: 12, color: colors.mutedForeground },
  statValue: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.foreground, textAlign: 'center' },

  tabBar: { flexDirection: 'row', marginTop: spacing.xl, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, paddingVertical: spacing.md, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.mutedForeground },
  tabTextActive: { color: colors.primary, fontFamily: fonts.sansBold },

  tabContent: { padding: 24 },
  sectionTitle: { fontFamily: fonts.serif, fontSize: 20, color: colors.foreground, letterSpacing: -0.3, marginBottom: spacing.md },

  summaryCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: 20,
    ...shadow.card,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconTile: { width: 40, height: 40, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.foreground },
  cardStatus: { fontFamily: fonts.sansMedium, fontSize: 13, marginTop: 2 },
  mutedLine: { fontFamily: fonts.sans, fontSize: 14, color: colors.mutedForeground },

  weightHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  weightValue: { fontFamily: fonts.serif, fontSize: 28, color: colors.foreground },
  diffPill: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.full },
  diffText: { fontFamily: fonts.sansMedium, fontSize: 13 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, height: 56, marginTop: spacing.lg },
  bar: { flex: 1, backgroundColor: colors.primary, borderRadius: radius.sm, opacity: 0.85 },

  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
});
