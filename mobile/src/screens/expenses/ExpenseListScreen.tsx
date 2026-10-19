import React, { useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
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
import { ChevronDown, ChevronUp, ImagePlus, Plus, Trash2, Wallet, X } from 'lucide-react-native';
import { RootStackParamList } from '../../app/Navigation';
import {
  useDeleteExpense,
  useDeletePayment,
  useDeleteReceipt,
  useExpenseSummary,
  useExpenses,
  useUploadReceipt,
} from '../../hooks/useExpenses';
import { colors } from '../../constants/colors';
import { fonts, radius, spacing } from '../../constants/typography';
import { getExpenseCategory, getExpensePlace } from '../../constants/expenseCategories';
import { EmptyState } from '../../components/ui/EmptyState';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Header } from '../../components/ui/Header';
import { formatDate } from '../../utils/dateHelpers';
import { formatCurrency } from '../../utils/currency';
import { mediaUrl } from '../../utils/media';
import { pickReceipt } from '../../utils/pickReceipt';
import { VetExpense } from '../../types';

type Nav = StackNavigationProp<RootStackParamList>;

export const ExpenseListScreen = () => {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const route = useRoute();
  const { catId } = route.params as { catId: string };
  const { data: expenses, isLoading, refetch, isRefetching } = useExpenses(catId);
  const { data: summary } = useExpenseSummary(catId);
  const { mutateAsync: deleteExpense } = useDeleteExpense(catId);
  const { mutateAsync: deletePayment } = useDeletePayment(catId);
  const { mutateAsync: uploadReceipt, isPending: uploadingReceipt } = useUploadReceipt(catId);
  const { mutateAsync: deleteReceipt } = useDeleteReceipt(catId);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewerUri, setViewerUri] = useState<string | null>(null);

  const addReceipt = async (expenseId: string) => {
    const uri = await pickReceipt();
    if (!uri) return;
    try {
      await uploadReceipt({ expenseId, uri });
    } catch {
      Alert.alert('Hata', 'Fiş yüklenirken bir sorun oluştu.');
    }
  };

  const confirmDeleteReceipt = (expenseId: string) =>
    Alert.alert('Fişi Sil', 'Bu harcamanın fiş görselini silmek istiyor musunuz?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => deleteReceipt(expenseId) },
    ]);

  useLayoutEffect(() => {
    nav.setOptions({ headerShown: false });
  }, [nav]);

  const confirmDeleteExpense = (expense: VetExpense) =>
    Alert.alert('Kaydı Sil', `"${expense.title}" kaydını ve tüm ödemelerini silmek istiyor musunuz?`, [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => deleteExpense(expense.id) },
    ]);

  const confirmDeletePayment = (expenseId: string, paymentId: string, amount: number) =>
    Alert.alert('Ödemeyi Sil', `${formatCurrency(amount)} tutarındaki ödemeyi silmek istiyor musunuz?`, [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => deletePayment({ expenseId, paymentId }) },
    ]);

  const totalAmount = summary?.totalAmount ?? 0;
  const totalPaid = summary?.totalPaid ?? 0;
  const totalRemaining = summary?.totalRemaining ?? 0;
  const paidRatio = totalAmount > 0 ? Math.min(totalPaid / totalAmount, 1) : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header
        title="Kedime Harcamalar"
        onBack={() => nav.goBack()}
        right={
          <TouchableOpacity style={styles.addBtn} activeOpacity={0.8} onPress={() => nav.navigate('AddExpense', { catId })}>
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
        ) : !expenses || expenses.length === 0 ? (
          <EmptyState
            emoji="🧾"
            title="Henüz harcama yok"
            description="Mama, kum, oyuncak, veteriner… Market, petshop ya da internetten aldıklarını fişiyle birlikte kaydet; toplam ve kalan borç otomatik hesaplansın."
            actionLabel="Harcama Ekle"
            onAction={() => nav.navigate('AddExpense', { catId })}
          />
        ) : (
          <>
            {/* Total spent hero */}
            <View style={styles.hero}>
              <Text style={styles.heroLabel}>Toplam Harcama</Text>
              <Text style={styles.heroValue}>{formatCurrency(totalAmount)}</Text>
            </View>

            {/* Totals */}
            <Card>
              <View style={styles.totalsRow}>
                <View style={styles.totalCell}>
                  <Text style={styles.totalLabel}>Ödenen</Text>
                  <Text style={[styles.totalValue, { color: colors.success }]}>{formatCurrency(totalPaid)}</Text>
                </View>
                <View style={styles.totalDivider} />
                <View style={styles.totalCell}>
                  <Text style={styles.totalLabel}>Kalan Borç</Text>
                  <Text style={[styles.totalValue, { color: totalRemaining > 0 ? colors.destructive : colors.success }]}>
                    {formatCurrency(totalRemaining)}
                  </Text>
                </View>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${paidRatio * 100}%` }]} />
              </View>
              <Text style={styles.progressCaption}>
                {`%${Math.round(paidRatio * 100)} ödendi · ${summary?.expenseCount ?? expenses.length} kayıt`}
                {summary && summary.unpaidCount > 0 ? ` · ${summary.unpaidCount} açık hesap` : ''}
              </Text>
            </Card>

            {/* Expense list */}
            <Text style={styles.sectionTitle}>Harcamalar</Text>
            <View style={{ gap: spacing.md }}>
              {expenses.map((expense) => {
                const cat = getExpenseCategory(expense.category);
                const place = getExpensePlace(expense.place);
                const receipt = mediaUrl(expense.receiptUrl);
                const Icon = cat.icon;
                const isPaid = expense.remainingAmount <= 0;
                const expanded = expandedId === expense.id;
                return (
                  <Card key={expense.id} noPadding>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setExpandedId(expanded ? null : expense.id)}
                      onLongPress={() => confirmDeleteExpense(expense)}
                      style={styles.expenseRow}
                    >
                      <View style={styles.iconTile}>
                        <Icon size={20} color={colors.primary} strokeWidth={2.2} />
                      </View>
                      <View style={styles.expenseInfo}>
                        <Text style={styles.expenseTitle} numberOfLines={1}>{expense.title}</Text>
                        <Text style={styles.expenseMeta} numberOfLines={1}>
                          {[cat.label, expense.clinicName || place.label, formatDate(expense.expenseDate)].filter(Boolean).join(' · ')}
                        </Text>
                      </View>
                      <View style={styles.expenseAmounts}>
                        <Text style={styles.expenseAmount}>{formatCurrency(expense.amount)}</Text>
                        <View style={[styles.statusPill, { backgroundColor: isPaid ? colors.successTint : colors.destructiveTint }]}>
                          <Text style={[styles.statusText, { color: isPaid ? colors.success : colors.destructive }]}>
                            {isPaid ? 'Ödendi' : `${formatCurrency(expense.remainingAmount)} borç`}
                          </Text>
                        </View>
                      </View>
                      {expanded
                        ? <ChevronUp size={18} color={colors.mutedForeground} />
                        : <ChevronDown size={18} color={colors.mutedForeground} />}
                    </TouchableOpacity>

                    {expanded && (
                      <View style={styles.detail}>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Nereden</Text>
                          <Text style={styles.detailValue}>
                            {expense.clinicName ? `${place.label} · ${expense.clinicName}` : place.label}
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Tutar</Text>
                          <Text style={styles.detailValue}>{formatCurrency(expense.amount)}</Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Ödenen</Text>
                          <Text style={[styles.detailValue, { color: colors.success }]}>{formatCurrency(expense.paidAmount)}</Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Kalan</Text>
                          <Text style={[styles.detailValue, { color: isPaid ? colors.success : colors.destructive }]}>
                            {formatCurrency(expense.remainingAmount)}
                          </Text>
                        </View>
                        {expense.notes ? <Text style={styles.notes}>{expense.notes}</Text> : null}

                        <Text style={styles.paymentsTitle}>Fiş / Görsel</Text>
                        {receipt ? (
                          <View style={styles.receiptRow}>
                            <TouchableOpacity
                              activeOpacity={0.85}
                              onPress={() => setViewerUri(receipt)}
                              accessibilityRole="imagebutton"
                              accessibilityLabel={`${expense.title} fişini büyüt`}
                            >
                              <Image source={{ uri: receipt }} style={styles.receiptThumb} resizeMode="cover" />
                            </TouchableOpacity>
                            <View style={styles.receiptActions}>
                              <TouchableOpacity onPress={() => addReceipt(expense.id)} disabled={uploadingReceipt} hitSlop={6}>
                                <Text style={styles.linkText}>Değiştir</Text>
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => confirmDeleteReceipt(expense.id)} hitSlop={6}>
                                <Text style={[styles.linkText, { color: colors.destructive }]}>Sil</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={styles.receiptAdd}
                            activeOpacity={0.85}
                            onPress={() => addReceipt(expense.id)}
                            disabled={uploadingReceipt}
                            accessibilityRole="button"
                          >
                            {uploadingReceipt
                              ? <ActivityIndicator color={colors.primary} />
                              : <ImagePlus size={18} color={colors.primary} strokeWidth={2} />}
                            <Text style={styles.linkText}>Fiş veya görsel ekle</Text>
                          </TouchableOpacity>
                        )}

                        <Text style={styles.paymentsTitle}>Ödeme Geçmişi</Text>
                        {expense.payments.length === 0 ? (
                          <Text style={styles.mutedLine}>Henüz ödeme yapılmadı</Text>
                        ) : (
                          expense.payments.map((p) => (
                            <View key={p.id} style={styles.paymentRow}>
                              <Wallet size={16} color={colors.success} strokeWidth={2.2} />
                              <Text style={styles.paymentDate}>{formatDate(p.paidAt)}</Text>
                              <Text style={styles.paymentAmount}>{formatCurrency(p.amount)}</Text>
                              <TouchableOpacity
                                hitSlop={8}
                                onPress={() => confirmDeletePayment(expense.id, p.id, p.amount)}
                              >
                                <Trash2 size={16} color={colors.mutedForeground} />
                              </TouchableOpacity>
                            </View>
                          ))
                        )}

                        <View style={styles.detailActions}>
                          {!isPaid && (
                            <Button
                              title="Ödeme Ekle"
                              size="sm"
                              style={styles.actionBtn}
                              onPress={() => nav.navigate('AddPayment', {
                                catId,
                                expenseId: expense.id,
                                title: expense.title,
                                remaining: expense.remainingAmount,
                              })}
                            />
                          )}
                          <Button title="Kaydı Sil" size="sm" variant="danger" style={styles.actionBtn} onPress={() => confirmDeleteExpense(expense)} />
                        </View>
                      </View>
                    )}
                  </Card>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      <Modal visible={!!viewerUri} transparent animationType="fade" onRequestClose={() => setViewerUri(null)}>
        <View style={styles.viewer}>
          {viewerUri ? (
            <Image source={{ uri: viewerUri }} style={styles.viewerImage} resizeMode="contain" accessibilityLabel="Fiş görseli" />
          ) : null}
          <TouchableOpacity
            style={[styles.viewerClose, { top: insets.top + spacing.md }]}
            onPress={() => setViewerUri(null)}
            accessibilityRole="button"
            accessibilityLabel="Kapat"
          >
            <X size={22} color={colors.primaryForeground} strokeWidth={2.4} />
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 24, paddingTop: spacing.sm, gap: spacing.xl, paddingBottom: spacing['3xl'] },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primaryTint,
  },

  hero: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  heroLabel: { fontFamily: fonts.sans, fontSize: 14, color: colors.mutedForeground },
  heroValue: { fontFamily: fonts.serif, fontSize: 44, letterSpacing: -1, color: colors.foreground },

  totalsRow: { flexDirection: 'row', alignItems: 'center' },
  totalCell: { flex: 1, alignItems: 'center', gap: 4 },
  totalDivider: { width: 1, alignSelf: 'stretch', backgroundColor: colors.border },
  totalLabel: { fontFamily: fonts.sans, fontSize: 13, color: colors.mutedForeground },
  totalValue: { fontFamily: fonts.sansBold, fontSize: 18, color: colors.foreground },
  progressTrack: { height: 8, borderRadius: radius.full, backgroundColor: colors.muted, marginTop: spacing.lg, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: radius.full, backgroundColor: colors.success },
  progressCaption: { fontFamily: fonts.sans, fontSize: 12, color: colors.mutedForeground, marginTop: spacing.sm, textAlign: 'center' },

  sectionTitle: { fontFamily: fonts.serif, fontSize: 20, color: colors.foreground, letterSpacing: -0.3, marginBottom: -spacing.sm },

  expenseRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: 16 },
  iconTile: { width: 40, height: 40, borderRadius: radius.lg, backgroundColor: colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
  expenseInfo: { flex: 1 },
  expenseTitle: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.foreground },
  expenseMeta: { fontFamily: fonts.sans, fontSize: 13, color: colors.mutedForeground, marginTop: 1 },
  expenseAmounts: { alignItems: 'flex-end', gap: 4 },
  expenseAmount: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.foreground },
  statusPill: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  statusText: { fontFamily: fonts.sansMedium, fontSize: 11 },

  detail: { borderTopWidth: 1, borderTopColor: colors.border, padding: 16, gap: spacing.sm },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel: { fontFamily: fonts.sans, fontSize: 14, color: colors.mutedForeground },
  detailValue: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.foreground },
  notes: { fontFamily: fonts.sans, fontSize: 14, color: colors.foreground, marginTop: spacing.xs },
  paymentsTitle: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.foreground, marginTop: spacing.sm },
  mutedLine: { fontFamily: fonts.sans, fontSize: 13, color: colors.mutedForeground },
  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 4 },
  paymentDate: { flex: 1, fontFamily: fonts.sans, fontSize: 14, color: colors.foreground },
  paymentAmount: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.success },
  receiptRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.md },
  receiptThumb: { width: 96, height: 120, borderRadius: radius.md, backgroundColor: colors.muted },
  receiptActions: { gap: spacing.sm, paddingBottom: 4 },
  receiptAdd: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    borderRadius: radius.md, backgroundColor: colors.primaryTint, alignSelf: 'flex-start',
  },
  linkText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.primary },
  viewer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center' },
  viewerImage: { width: '100%', height: '80%' },
  viewerClose: {
    position: 'absolute', right: 20, width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center',
  },
  detailActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  actionBtn: { flex: 1 },
});
