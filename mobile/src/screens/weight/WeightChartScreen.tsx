import React, { useLayoutEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Activity, Plus, Scale } from 'lucide-react-native';
import { RootStackParamList } from '../../app/Navigation';
import { useDeleteWeight, useWeightLogs, useWeightSummary } from '../../hooks/useWeightLogs';
import { colors } from '../../constants/colors';
import { fonts, radius, spacing } from '../../constants/typography';
import { WeightChart } from '../../components/weight/WeightChart';
import { EmptyState } from '../../components/ui/EmptyState';
import { Card } from '../../components/ui/Card';
import { formatDate } from '../../utils/dateHelpers';
import { Header } from '../../components/ui/Header';

type Nav = StackNavigationProp<RootStackParamList>;

export const WeightChartScreen = () => {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const route = useRoute();
  const { catId } = route.params as { catId: string };
  const { data: logs, isLoading, refetch, isRefetching } = useWeightLogs(catId);
  const { data: summary } = useWeightSummary(catId);
  const { mutateAsync: deleteWeight } = useDeleteWeight(catId);

  useLayoutEffect(() => {
    nav.setOptions({ headerShown: false });
  }, [nav]);

  const currentWeight = summary?.current ?? (logs && logs.length ? logs[0].weightKg : null);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header
        title="Kilo Takibi"
        onBack={() => nav.goBack()}
        right={
          <TouchableOpacity style={styles.addBtn} activeOpacity={0.8} onPress={() => nav.navigate('AddWeight', { catId })}>
            <Plus size={22} color={colors.primary} strokeWidth={2.5} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing['2xl'] }} />
        ) : !logs || logs.length === 0 ? (
          <EmptyState
            image={require('../../../assets/cat-walk.png')}
            title="Henüz kilo kaydı yok"
            description="İlk kilo ölçümünü ekleyin."
            actionLabel="Kilo Ekle"
            onAction={() => nav.navigate('AddWeight', { catId })}
          />
        ) : (
          <>
            {/* Current weight hero */}
            <View style={styles.hero}>
              <Text style={styles.heroLabel}>Mevcut Kilo</Text>
              <View style={styles.heroValueRow}>
                <Text style={styles.heroValue}>{currentWeight != null ? currentWeight.toFixed(2) : '—'}</Text>
                <Text style={styles.heroUnit}>kg</Text>
              </View>
              <View style={styles.idealPill}>
                <Activity size={14} color={colors.success} strokeWidth={2.4} />
                <Text style={styles.idealText}>İdeal kiloda</Text>
              </View>
            </View>

            {/* Chart */}
            <Card>
              <WeightChart logs={logs} />
            </Card>

            {/* History */}
            <Text style={styles.sectionTitle}>Geçmiş Kayıtlar</Text>
            <Card noPadding>
              {logs.map((log, i) => {
                const older = logs[i + 1];
                const diff = older ? log.weightKg - older.weightKg : null;
                return (
                  <TouchableOpacity
                    key={log.id}
                    activeOpacity={0.8}
                    onLongPress={() =>
                      Alert.alert('Kaydı Sil', `${log.weightKg.toFixed(2)} kg kaydını silmek istiyor musunuz?`, [
                        { text: 'İptal', style: 'cancel' },
                        { text: 'Sil', style: 'destructive', onPress: () => deleteWeight(log.id) },
                      ])
                    }
                    style={[styles.logRow, i < logs.length - 1 && styles.logRowDivider]}
                  >
                    <View style={styles.scaleTile}>
                      <Scale size={20} color={colors.primary} strokeWidth={2.2} />
                    </View>
                    <View style={styles.logInfo}>
                      <Text style={styles.logWeight}>{log.weightKg.toFixed(2)} kg</Text>
                      <Text style={styles.logDate}>{formatDate(log.loggedAt)}</Text>
                    </View>
                    {diff != null && (
                      <Text style={[styles.diff, { color: diff >= 0 ? colors.success : colors.destructive }]}>
                        {`${diff >= 0 ? '+' : ''}${diff.toFixed(2)} kg`}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </Card>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 24, paddingTop: spacing.sm, gap: spacing.xl, paddingBottom: spacing['3xl'] },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(196,98,45,0.10)',
  },

  hero: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  heroLabel: { fontFamily: fonts.sans, fontSize: 14, color: colors.mutedForeground },
  heroValueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs },
  heroValue: { fontFamily: fonts.serif, fontSize: 48, color: colors.primary, letterSpacing: -1 },
  heroUnit: { fontFamily: fonts.serifSemi, fontSize: 22, color: colors.primary, marginBottom: 8 },
  idealPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.successTint,
    paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.full,
  },
  idealText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.success },

  sectionTitle: { fontFamily: fonts.serif, fontSize: 20, color: colors.foreground, letterSpacing: -0.3, marginBottom: -spacing.sm },

  logRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: 16 },
  logRowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  scaleTile: { width: 40, height: 40, borderRadius: radius.lg, backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  logInfo: { flex: 1 },
  logWeight: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.foreground },
  logDate: { fontFamily: fonts.sans, fontSize: 13, color: colors.mutedForeground, marginTop: 1 },
  diff: { fontFamily: fonts.sansMedium, fontSize: 14 },
});
