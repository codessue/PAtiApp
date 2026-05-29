import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../Navigation';
import { useAuthStore } from '../../stores/authStore';
import { useUpcomingVaccines } from '../../hooks/useVaccines';
import { useTodayMedications } from '../../hooks/useMedications';
import { useCats } from '../../hooks/useCats';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/typography';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { UpcomingVaccineCard } from '../../components/vaccines/UpcomingVaccineCard';
import { formatDayOfWeek } from '../../utils/dateHelpers';

type Nav = StackNavigationProp<RootStackParamList>;

export const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const { user } = useAuthStore();
  const { data: cats, isLoading: catsLoading } = useCats();
  const { data: upcoming, refetch: refetchVaccines, isRefetching: v_refreshing } = useUpcomingVaccines(30);
  const { data: todayMeds, refetch: refetchMeds, isRefetching: m_refreshing } = useTodayMedications();

  const refreshing = v_refreshing || m_refreshing;
  const onRefresh = () => { refetchVaccines(); refetchMeds(); };

  const completedMeds = todayMeds?.filter((m) => m.status === 'given').length ?? 0;
  const totalMeds = todayMeds?.length ?? 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <View style={styles.greeting}>
        <View>
          <Text style={styles.hello}>Merhaba, {user?.name?.split(' ')[0]} 🌿</Text>
          <Text style={styles.date}>{formatDayOfWeek()}</Text>
        </View>
        <TouchableOpacity onPress={() => nav.navigate('AddCat')} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Cat Quick Access */}
      {!catsLoading && cats && cats.length > 0 && (
        <View style={styles.section}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[...cats, null]}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={styles.catScroll}
            renderItem={({ item }) =>
              item ? (
                <TouchableOpacity
                  onPress={() => nav.navigate('CatDetail', { catId: item.id })}
                  style={styles.catChip}
                >
                  <Avatar uri={item.photoUrl} name={item.name} size={52} />
                  <Text style={styles.catChipName} numberOfLines={1}>{item.name}</Text>
                  {item.latestWeight && (
                    <Text style={styles.catChipWeight}>{item.latestWeight.toFixed(1)} kg</Text>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => nav.navigate('AddCat')} style={styles.addCatChip}>
                  <Text style={styles.addCatPlus}>+</Text>
                  <Text style={styles.catChipName}>Ekle</Text>
                </TouchableOpacity>
              )
            }
          />
        </View>
      )}

      {/* Upcoming Vaccines */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>💉 Yaklaşan Aşılar</Text>
          {upcoming && upcoming.length > 3 && (
            <Text style={styles.seeAll}>{upcoming.length} aşı</Text>
          )}
        </View>
        {!upcoming || upcoming.length === 0 ? (
          <Text style={styles.emptySection}>Yaklaşan aşı yok 🎉</Text>
        ) : (
          upcoming.slice(0, 3).map((v) => (
            <UpcomingVaccineCard key={v.id} vaccine={v} />
          ))
        )}
      </Card>

      {/* Today's Medications */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>💊 Bugünkü İlaçlar</Text>
          {totalMeds > 0 && (
            <Text style={styles.progress}>{completedMeds}/{totalMeds} tamamlandı</Text>
          )}
        </View>
        {!todayMeds || todayMeds.length === 0 ? (
          <Text style={styles.emptySection}>Bugün ilaç yok 👍</Text>
        ) : (
          todayMeds.map((med, i) => (
            <View key={i} style={styles.medRow}>
              <View style={[styles.medStatus, { backgroundColor: med.status === 'given' ? colors.successLight : med.status === 'skipped' ? colors.dangerLight : colors.warningLight }]}>
                <Text style={{ fontSize: 14 }}>
                  {med.status === 'given' ? '✅' : med.status === 'skipped' ? '❌' : '⏰'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.medName}>{med.medicationName}</Text>
                <Text style={styles.medMeta}>{med.catName} · {med.reminderTime}</Text>
              </View>
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing['3xl'] },
  greeting: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hello: { fontFamily: 'Fraunces_700Bold', fontSize: 26, color: colors.text },
  date: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.textMuted, marginTop: 2, textTransform: 'capitalize' },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: '#fff', fontSize: 22, fontFamily: 'DMSans_400Regular' },
  section: {},
  catScroll: { gap: spacing.md, paddingRight: spacing.lg },
  catChip: { alignItems: 'center', width: 72, gap: 4 },
  catChipName: { fontFamily: 'DMSans_500Medium', fontSize: 12, color: colors.text, textAlign: 'center' },
  catChipWeight: { fontFamily: 'DMSans_400Regular', fontSize: 10, color: colors.textMuted },
  addCatChip: { alignItems: 'center', width: 72, gap: 4 },
  addCatPlus: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primaryLight, textAlign: 'center', lineHeight: 52, fontSize: 24, color: colors.primary, fontFamily: 'DMSans_400Regular' },
  sectionCard: { gap: spacing.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  sectionTitle: { fontFamily: 'Fraunces_600SemiBold', fontSize: 17, color: colors.text },
  seeAll: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.primary },
  progress: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.secondary },
  emptySection: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.md },
  medRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  medStatus: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  medName: { fontFamily: 'DMSans_500Medium', fontSize: 14, color: colors.text },
  medMeta: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.textMuted },
});
