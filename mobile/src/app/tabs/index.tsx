import React, { useEffect, useMemo } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Bell, Check, ChevronRight, Pill, Plus, Syringe, Wallet, WifiOff } from 'lucide-react-native';
import { RootStackParamList } from '../Navigation';
import { useAuthStore } from '../../stores/authStore';
import { useUpcomingVaccines } from '../../hooks/useVaccines';
import { useLogTodayDose, useTodayMedications } from '../../hooks/useMedications';
import { useCats } from '../../hooks/useCats';
import { useNotesStore } from '../../stores/notesStore';
import { useOverallExpenseSummary } from '../../hooks/useExpenses';
import { colors } from '../../constants/colors';
import { fonts, radius, spacing } from '../../constants/typography';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import {
  formatDate,
  formatDayOfWeek,
  formatRelativeDateTime,
  getVaccineUrgencyColor,
  getVaccineUrgencyLabel,
} from '../../utils/dateHelpers';
import { formatCurrency } from '../../utils/currency';

type Nav = StackNavigationProp<RootStackParamList>;

export const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const { user } = useAuthStore();
  const { data: cats, isError: catsError, refetch: refetchCats } = useCats();
  const { data: upcoming, refetch: refetchVaccines, isRefetching: v_refreshing } = useUpcomingVaccines(30);
  const { data: todayMeds, refetch: refetchMeds, isRefetching: m_refreshing } = useTodayMedications();
  const { data: expenses, refetch: refetchExpenses, isRefetching: e_refreshing } = useOverallExpenseSummary();
  const { mutate: logDose, isPending: loggingDose } = useLogTodayDose();
  const { notes, loaded: notesLoaded, load: loadNotes } = useNotesStore();

  useEffect(() => { if (!notesLoaded) loadNotes(); }, [notesLoaded, loadNotes]);
  // Refresh reminders whenever Home regains focus (e.g. after adding a note).
  useFocusEffect(React.useCallback(() => { loadNotes(); }, [loadNotes]));

  const upcomingReminders = useMemo(
    () =>
      [...notes]
        .filter((n) => n.reminderAt && new Date(n.reminderAt).getTime() > Date.now())
        .sort((a, b) => a.reminderAt!.localeCompare(b.reminderAt!))
        .slice(0, 3),
    [notes]
  );

  const refreshing = v_refreshing || m_refreshing || e_refreshing;
  const onRefresh = () => { refetchCats(); refetchVaccines(); refetchMeds(); refetchExpenses(); loadNotes(); };

  const hasDebt = (expenses?.totalRemaining ?? 0) > 0;
  const hasExpenses = (expenses?.expenseCount ?? 0) > 0;
  const debtColor = hasDebt ? colors.destructive : hasExpenses ? colors.success : colors.mutedForeground;

  const completedMeds = todayMeds?.filter((m) => m.status === 'given').length ?? 0;
  const totalMeds = todayMeds?.length ?? 0;

  const topVaccine = upcoming?.[0];
  const alertColor = topVaccine ? getVaccineUrgencyColor(topVaccine.daysUntilDue) : colors.warning;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Connection banner — server data unreachable (local reminders still work) */}
      {catsError && (
        <TouchableOpacity activeOpacity={0.85} onPress={onRefresh} style={styles.offlineBanner}>
          <WifiOff size={16} color={colors.destructive} strokeWidth={2.2} />
          <Text style={styles.offlineText}>Sunucuya ulaşılamıyor — dokunarak tekrar dene</Text>
        </TouchableOpacity>
      )}

      {/* Greeting */}
      <View style={styles.greeting}>
        <View style={styles.greetingText}>
          <Text style={styles.hello}>Merhaba, {user?.name?.split(' ')[0]} 🌿</Text>
          <Text style={styles.date}>{formatDayOfWeek()}</Text>
        </View>
        <Avatar name={user?.name} size={48} style={styles.greetingAvatar} />
      </View>

      {/* Pet carousel */}
      {cats && cats.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carousel}
        >
          {cats.map((cat, i) => {
            const active = i === 0;
            return (
              <TouchableOpacity
                key={cat.id}
                activeOpacity={0.85}
                onPress={() => nav.navigate('CatDetail', { catId: cat.id })}
                style={[styles.petCard, active ? styles.petCardActive : styles.petCardIdle]}
              >
                <Avatar
                  uri={cat.photoUrl}
                  name={cat.name}
                  size={68}
                  style={active ? styles.petAvatarActive : undefined}
                />
                <Text style={[styles.petName, active && styles.petTextActive]} numberOfLines={1}>
                  {cat.name}
                </Text>
                {cat.latestWeight != null && (
                  <Text style={[styles.petWeight, active && styles.petWeightActive]}>
                    {cat.latestWeight.toFixed(1)} kg
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => nav.navigate('AddCat')}
            style={[styles.petCard, styles.petCardAdd]}
          >
            <View style={styles.addCircle}>
              <Plus size={24} color={colors.primary} strokeWidth={2.5} />
            </View>
            <Text style={styles.addLabel}>Ekle</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Alert card — most urgent upcoming vaccine */}
      {topVaccine && (
        <Card style={[styles.alertCard, { borderLeftColor: alertColor }]}>
          <View style={[styles.alertIcon, { backgroundColor: alertColor + '1A' }]}>
            <Syringe size={20} color={alertColor} strokeWidth={2.2} />
          </View>
          <View style={styles.alertBody}>
            <View style={styles.alertTitleRow}>
              <Text style={styles.alertTitle} numberOfLines={1}>
                {topVaccine.vaccineType} - {topVaccine.catName}
              </Text>
              <View style={[styles.alertBadge, { backgroundColor: alertColor }]}>
                <Text style={styles.alertBadgeText}>{getVaccineUrgencyLabel(topVaccine.daysUntilDue)}</Text>
              </View>
            </View>
            <Text style={styles.alertSub} numberOfLines={1}>
              {topVaccine.clinicName ?? formatDate(topVaccine.nextDueDate)}
            </Text>
          </View>
        </Card>
      )}

      {/* Vet debt across all cats — always visible so payments are one tap away */}
      {(
        <View>
          <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>Veteriner Ödemeleri</Text>
          <Card noPadding>
            <View style={styles.debtHeader}>
              <View style={[styles.debtIcon, { backgroundColor: hasDebt ? colors.destructiveTint : hasExpenses ? colors.successTint : colors.primaryTint }]}>
                <Wallet size={22} color={debtColor} strokeWidth={2.2} />
              </View>
              <View style={styles.debtHeaderText}>
                <Text style={styles.debtLabel}>{hasDebt ? 'Toplam kalan borç' : hasExpenses ? 'Tüm borçlar ödendi' : 'Henüz gider yok'}</Text>
                <Text style={[styles.debtValue, { color: debtColor }]}>{formatCurrency(expenses?.totalRemaining ?? 0)}</Text>
              </View>
            </View>
            <View style={styles.debtTotals}>
              <Text style={styles.debtTotalText}>
                Harcama <Text style={styles.debtTotalStrong}>{formatCurrency(expenses?.totalAmount ?? 0)}</Text>
              </Text>
              <Text style={styles.debtTotalText}>
                Ödenen <Text style={[styles.debtTotalStrong, { color: colors.success }]}>{formatCurrency(expenses?.totalPaid ?? 0)}</Text>
              </Text>
            </View>
            {(cats ?? []).map((cat) => {
              const c = expenses?.cats.find((x) => x.catId === cat.id);
              return (
                <TouchableOpacity
                  key={cat.id}
                  activeOpacity={0.8}
                  onPress={() => nav.navigate('ExpenseList', { catId: cat.id, catName: cat.name })}
                  style={styles.debtCatRow}
                >
                  <Text style={styles.debtCatName} numberOfLines={1}>{cat.name}</Text>
                  <Text
                    style={[
                      styles.debtCatValue,
                      { color: !c ? colors.mutedForeground : c.totalRemaining > 0 ? colors.destructive : colors.success },
                    ]}
                  >
                    {!c ? 'Gider ekle' : c.totalRemaining > 0 ? `${formatCurrency(c.totalRemaining)} borç` : 'Ödendi'}
                  </Text>
                  <ChevronRight size={18} color={colors.mutedForeground} />
                </TouchableOpacity>
              );
            })}
            {(cats ?? []).length === 0 && (
              <Text style={[styles.emptySection, styles.debtEmpty]}>Ödeme takibi için önce bir dost ekle.</Text>
            )}
          </Card>
        </View>
      )}

      {/* Today's medications */}
      <View>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Bugünkü İlaçlar</Text>
          {totalMeds > 0 && (
            <TouchableOpacity onPress={() => nav.navigate('Health' as never)} activeOpacity={0.7}>
              <Text style={styles.seeAll}>Tümünü Gör</Text>
            </TouchableOpacity>
          )}
        </View>

        {!todayMeds || todayMeds.length === 0 ? (
          <Card>
            <Text style={styles.emptySection}>Bugün ilaç yok 👍</Text>
          </Card>
        ) : (
          <Card noPadding>
            {todayMeds.map((med, i) => {
              const done = med.status === 'given';
              return (
                <View
                  key={`${med.medicationId}-${med.reminderTime}-${i}`}
                  style={[styles.medRow, i < todayMeds.length - 1 && styles.medRowDivider]}
                >
                  <View style={[styles.medIcon, { backgroundColor: done ? colors.secondaryTint : colors.muted }]}>
                    <Pill size={20} color={done ? colors.secondary : colors.mutedForeground} strokeWidth={2.2} />
                  </View>
                  <View style={styles.medInfo}>
                    <Text style={styles.medName} numberOfLines={1}>{med.medicationName}</Text>
                    <Text style={styles.medMeta} numberOfLines={1}>{med.catName} • {med.reminderTime}</Text>
                  </View>
                  {/* Kutucuk daha önce salt görseldi — dokunulunca doz "verildi"
                      olarak işaretleniyor (aynı ilacın diğer saatleri etkilenmez). */}
                  <TouchableOpacity
                    disabled={done || loggingDose}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityRole="button"
                    accessibilityLabel={done ? 'Verildi olarak işaretlendi' : 'Verildi olarak işaretle'}
                    onPress={() =>
                      logDose({
                        catId: med.catId,
                        medicationId: med.medicationId,
                        status: 'given',
                        reminderTime: med.reminderTime,
                      })
                    }
                  >
                    {done ? (
                      <View style={styles.medCheckDone}>
                        <Check size={16} color={colors.secondaryForeground} strokeWidth={3} />
                      </View>
                    ) : (
                      <View style={styles.medCheckPending} />
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </Card>
        )}
      </View>

      {/* Note reminders */}
      <View>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Hatırlatıcılar</Text>
          <TouchableOpacity onPress={() => nav.navigate('Notes' as never)} activeOpacity={0.7}>
            <Text style={styles.seeAll}>Günlük</Text>
          </TouchableOpacity>
        </View>

        {upcomingReminders.length === 0 ? (
          <TouchableOpacity activeOpacity={0.85} onPress={() => nav.navigate('NoteEditor', {})}>
            <Card style={styles.reminderEmpty}>
              <View style={styles.reminderEmptyIcon}>
                <Bell size={18} color={colors.primary} strokeWidth={2.2} />
              </View>
              <Text style={styles.reminderEmptyText}>Yaklaşan hatırlatıcı yok — bir not ekle</Text>
              <Plus size={18} color={colors.mutedForeground} strokeWidth={2.2} />
            </Card>
          </TouchableOpacity>
        ) : (
          <Card noPadding>
            {upcomingReminders.map((n, i) => (
              <TouchableOpacity
                key={n.id}
                activeOpacity={0.7}
                onPress={() => nav.navigate('NoteEditor', { noteId: n.id })}
                style={[styles.medRow, i < upcomingReminders.length - 1 && styles.medRowDivider]}
              >
                <View style={[styles.medIcon, { backgroundColor: colors.primaryTint }]}>
                  <Bell size={20} color={colors.primary} strokeWidth={2.2} />
                </View>
                <View style={styles.medInfo}>
                  <Text style={styles.medName} numberOfLines={1}>{n.title || 'Başlıksız not'}</Text>
                  <Text style={styles.medMeta} numberOfLines={1}>{formatRelativeDateTime(n.reminderAt!)}</Text>
                </View>
                <ChevronRight size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            ))}
          </Card>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 24, gap: spacing.xl, paddingBottom: spacing['3xl'] },

  greeting: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greetingText: { flex: 1 },
  hello: { fontFamily: fonts.serif, fontSize: 24, color: colors.foreground, letterSpacing: -0.3 },
  date: { fontFamily: fonts.sans, fontSize: 15, color: colors.mutedForeground, marginTop: 2, textTransform: 'capitalize' },
  greetingAvatar: { backgroundColor: colors.card, borderWidth: 2, borderColor: colors.primaryTint },

  carousel: { gap: spacing.md, paddingVertical: spacing.xs },
  petCard: {
    width: 140,
    borderRadius: radius['3xl'],
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  petCardActive: { backgroundColor: colors.primary },
  petCardIdle: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  petCardAdd: {
    backgroundColor: 'rgba(196,98,45,0.05)',
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
  },
  petAvatarActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  petName: { fontFamily: fonts.sansBold, fontSize: 17, color: colors.foreground },
  petTextActive: { color: colors.primaryForeground },
  petWeight: { fontFamily: fonts.sans, fontSize: 12, color: colors.mutedForeground },
  petWeightActive: { color: 'rgba(255,255,255,0.85)' },
  addCircle: {
    width: 68, height: 68, borderRadius: 34,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(196,98,45,0.10)',
  },
  addLabel: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.primary },

  alertCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderLeftWidth: 4 },
  alertIcon: { width: 40, height: 40, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  alertBody: { flex: 1, gap: 2 },
  alertTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  alertTitle: { flex: 1, fontFamily: fonts.sansBold, fontSize: 16, color: colors.foreground },
  alertBadge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full },
  alertBadgeText: { fontFamily: fonts.sansMedium, fontSize: 11, color: colors.destructiveForeground },
  alertSub: { fontFamily: fonts.sans, fontSize: 13, color: colors.mutedForeground },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { fontFamily: fonts.serif, fontSize: 20, color: colors.foreground, letterSpacing: -0.3 },
  sectionTitleSpaced: { marginBottom: spacing.md },

  debtHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  debtIcon: { width: 44, height: 44, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  debtHeaderText: { flex: 1 },
  debtLabel: { fontFamily: fonts.sans, fontSize: 13, color: colors.mutedForeground },
  debtValue: { fontFamily: fonts.serif, fontSize: 28, letterSpacing: -0.5 },
  debtTotals: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
  },
  debtTotalText: { fontFamily: fonts.sans, fontSize: 13, color: colors.mutedForeground },
  debtTotalStrong: { fontFamily: fonts.sansBold, color: colors.foreground },
  debtCatRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  debtCatName: { flex: 1, fontFamily: fonts.sansMedium, fontSize: 15, color: colors.foreground },
  debtCatValue: { fontFamily: fonts.sansBold, fontSize: 14 },
  debtEmpty: { padding: spacing.lg },
  seeAll: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.primary },
  emptySection: { fontFamily: fonts.sans, fontSize: 14, color: colors.mutedForeground, textAlign: 'center' },

  medRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  medRowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  medIcon: { width: 40, height: 40, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  medInfo: { flex: 1 },
  medName: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.foreground },
  medMeta: { fontFamily: fonts.sans, fontSize: 13, color: colors.mutedForeground, marginTop: 1 },
  medCheckDone: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.secondary,
    alignItems: 'center', justifyContent: 'center',
  },
  medCheckPending: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 2, borderColor: colors.border,
  },

  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.destructiveTint,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  offlineText: { flex: 1, fontFamily: fonts.sansMedium, fontSize: 13, color: colors.destructive },

  reminderEmpty: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  reminderEmptyIcon: {
    width: 40, height: 40, borderRadius: radius.lg,
    backgroundColor: colors.primaryTint,
    alignItems: 'center', justifyContent: 'center',
  },
  reminderEmptyText: { flex: 1, fontFamily: fonts.sans, fontSize: 14, color: colors.mutedForeground },
});
