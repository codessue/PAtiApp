import React from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../app/Navigation';
import { useDeleteWeight, useWeightLogs, useWeightSummary } from '../../hooks/useWeightLogs';
import { colors } from '../../constants/colors';
import { radius, shadow, spacing } from '../../constants/typography';
import { Button } from '../../components/ui/Button';
import { WeightChart } from '../../components/weight/WeightChart';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatDate } from '../../utils/dateHelpers';
import { Card } from '../../components/ui/Card';

type Nav = StackNavigationProp<RootStackParamList>;

export const WeightChartScreen = () => {
  const nav = useNavigation<Nav>();
  const route = useRoute();
  const { catId } = route.params as { catId: string };
  const { data: logs, isLoading, refetch, isRefetching } = useWeightLogs(catId);
  const { data: summary } = useWeightSummary(catId);
  const { mutateAsync: deleteWeight } = useDeleteWeight(catId);

  const trendIcon = summary?.trend === 'up' ? '📈' : summary?.trend === 'down' ? '📉' : '➡️';

  return (
    <View style={styles.container}>
      <View style={styles.addBar}>
        <Button title="+ Kilo Ekle" size="sm" onPress={() => nav.navigate('AddWeight', { catId })} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing['2xl'] }} />
        ) : !logs || logs.length === 0 ? (
          <EmptyState
            emoji="⚖️"
            title="Henüz kilo kaydı yok"
            description="İlk kilo ölçümünü ekleyin."
            actionLabel="Kilo Ekle"
            onAction={() => nav.navigate('AddWeight', { catId })}
          />
        ) : (
          <>
            {/* Current weight */}
            {summary?.current && (
              <View style={styles.currentWeight}>
                <Text style={styles.currentWeightLabel}>Mevcut Kilo</Text>
                <Text style={styles.currentWeightValue}>{summary.current.toFixed(2)} kg</Text>
                <Text style={styles.trendIcon}>{trendIcon}</Text>
              </View>
            )}

            {/* Stats */}
            {summary && (
              <Card style={styles.statsCard}>
                <View style={styles.statRow}>
                  {[
                    { label: 'En Az', value: summary.lowest?.toFixed(2) },
                    { label: 'En Fazla', value: summary.highest?.toFixed(2) },
                    { label: 'Ort. (30g)', value: summary.avgLast30Days?.toFixed(2) },
                  ].map((s) => (
                    <View key={s.label} style={styles.statItem}>
                      <Text style={styles.statValue}>{s.value ?? '-'} kg</Text>
                      <Text style={styles.statLabel}>{s.label}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            )}

            {/* Chart */}
            <Card>
              <Text style={styles.chartTitle}>Kilo Grafiği</Text>
              <WeightChart logs={logs} />
            </Card>

            {/* Log list */}
            <Text style={styles.sectionTitle}>Tüm Kayıtlar</Text>
            {logs.map((log) => (
              <TouchableOpacity
                key={log.id}
                onLongPress={() =>
                  Alert.alert('Kaydı Sil', `${log.weightKg} kg kaydını silmek istiyor musunuz?`, [
                    { text: 'İptal', style: 'cancel' },
                    { text: 'Sil', style: 'destructive', onPress: () => deleteWeight(log.id) },
                  ])
                }
                style={styles.logRow}
              >
                <View style={styles.logLeft}>
                  <Text style={styles.logWeight}>{log.weightKg.toFixed(2)} kg</Text>
                  {log.notes && <Text style={styles.logNotes}>{log.notes}</Text>}
                </View>
                <Text style={styles.logDate}>{formatDate(log.loggedAt)}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  addBar: { padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing['3xl'] },
  currentWeight: { alignItems: 'center', gap: spacing.sm },
  currentWeightLabel: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.textMuted },
  currentWeightValue: { fontFamily: 'Fraunces_700Bold', fontSize: 48, color: colors.primary },
  trendIcon: { fontSize: 28 },
  statsCard: {},
  statRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center', gap: spacing.xs },
  statValue: { fontFamily: 'DMSans_500Medium', fontSize: 16, color: colors.text },
  statLabel: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.textMuted },
  chartTitle: { fontFamily: 'Fraunces_600SemiBold', fontSize: 16, color: colors.text, marginBottom: spacing.md },
  sectionTitle: { fontFamily: 'Fraunces_600SemiBold', fontSize: 16, color: colors.text },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    ...shadow.card,
    marginBottom: spacing.sm,
  },
  logLeft: { gap: 2 },
  logWeight: { fontFamily: 'DMSans_500Medium', fontSize: 16, color: colors.text },
  logNotes: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.textMuted },
  logDate: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.textMuted },
});
