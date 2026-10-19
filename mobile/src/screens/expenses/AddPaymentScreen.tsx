import React, { useLayoutEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { isAxiosError } from 'axios';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Calendar } from 'lucide-react-native';
import { useAddPayment } from '../../hooks/useExpenses';
import { colors } from '../../constants/colors';
import { fonts, radius, spacing } from '../../constants/typography';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Header } from '../../components/ui/Header';
import { formatApiDate } from '../../utils/dateHelpers';
import { formatCurrency, parseAmount } from '../../utils/currency';

type Params = { catId: string; expenseId: string; title: string; remaining: number };

export const AddPaymentScreen = () => {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const route = useRoute();
  const { catId, expenseId, title, remaining } = route.params as Params;
  const { mutateAsync: addPayment } = useAddPayment(catId);
  const [loading, setLoading] = useState(false);

  useLayoutEffect(() => {
    nav.setOptions({ headerShown: false });
  }, [nav]);

  const schema = z.object({
    amount: z.string()
      .refine((v) => parseAmount(v) > 0, 'Geçerli bir tutar girin')
      .refine((v) => parseAmount(v) <= remaining, `Kalan borçtan (${formatCurrency(remaining)}) fazla olamaz`),
    paidAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tarih YYYY-AA-GG formatında olmalı'),
    notes: z.string().optional(),
  });
  type FormData = z.infer<typeof schema>;

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { paidAt: formatApiDate(new Date()) },
  });

  const entered = parseAmount(watch('amount') ?? '') || 0;
  const after = Math.max(remaining - entered, 0);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await addPayment({ expenseId, amount: parseAmount(data.amount), paidAt: data.paidAt, notes: data.notes?.trim() || undefined });
      nav.goBack();
    } catch (e) {
      const message = isAxiosError(e) ? e.response?.data?.message : undefined;
      Alert.alert('Hata', message ?? 'Ödeme kaydedilirken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <Header title="Ödeme Ekle" onBack={() => nav.goBack()} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.summary}>
            <Text style={styles.summaryTitle} numberOfLines={2}>{title}</Text>
            <Text style={styles.summaryLabel}>Kalan borç: <Text style={styles.summaryDebt}>{formatCurrency(remaining)}</Text></Text>
          </View>

          {/* Big amount input */}
          <View style={styles.amountWrap}>
            <Controller
              control={control}
              name="amount"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.amountRow}>
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={colors.mutedForeground}
                    style={styles.amountInput}
                  />
                  <Text style={styles.currency}>₺</Text>
                </View>
              )}
            />
            {errors.amount && <Text style={styles.errorText}>{errors.amount.message}</Text>}
            <TouchableOpacity
              style={styles.fullBtn}
              activeOpacity={0.85}
              onPress={() => setValue('amount', String(remaining).replace('.', ','), { shouldValidate: true })}
            >
              <Text style={styles.fullText}>Tamamını öde</Text>
            </TouchableOpacity>
          </View>

          <Controller
            control={control}
            name="paidAt"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Ödeme Tarihi"
                placeholder="YYYY-AA-GG"
                trailingIcon={<Calendar size={20} color={colors.primary} strokeWidth={2} />}
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.paidAt?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input label="Not (Opsiyonel)" placeholder="Nakit, kredi kartı vb..." onChangeText={onChange} onBlur={onBlur} value={value} />
            )}
          />

          {entered > 0 && (
            <View style={[styles.afterTile, { backgroundColor: after > 0 ? colors.warningTint : colors.successTint }]}>
              <Text style={styles.afterLabel}>Ödemeden sonra kalan</Text>
              <Text style={[styles.afterValue, { color: after > 0 ? colors.warning : colors.success }]}>
                {after > 0 ? formatCurrency(after) : 'Borç kapanıyor 🎉'}
              </Text>
            </View>
          )}

          <View style={styles.spacer} />

          <Button title="Ödemeyi Kaydet" onPress={handleSubmit(onSubmit)} loading={loading} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, paddingHorizontal: 24, paddingTop: spacing.sm, gap: spacing.md, paddingBottom: spacing.xl },

  summary: { alignItems: 'center', gap: spacing.xs },
  summaryTitle: { fontFamily: fonts.serifSemi, fontSize: 18, color: colors.foreground, textAlign: 'center' },
  summaryLabel: { fontFamily: fonts.sans, fontSize: 14, color: colors.mutedForeground },
  summaryDebt: { fontFamily: fonts.sansBold, color: colors.destructive },

  amountWrap: { alignItems: 'center', marginVertical: spacing.lg, gap: spacing.sm },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingBottom: spacing.sm,
    minWidth: 180,
  },
  amountInput: { fontFamily: fonts.serif, fontSize: 48, color: colors.foreground, textAlign: 'center', padding: 0, minWidth: 110 },
  currency: { fontFamily: fonts.serifSemi, fontSize: 28, color: colors.mutedForeground, marginLeft: spacing.sm, marginBottom: 6 },
  errorText: { fontFamily: fonts.sans, fontSize: 13, color: colors.destructive, textAlign: 'center' },
  fullBtn: { backgroundColor: colors.primaryTint, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full, marginTop: spacing.xs },
  fullText: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.primary },

  afterTile: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: radius.lg },
  afterLabel: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.foreground },
  afterValue: { fontFamily: fonts.sansBold, fontSize: 16 },

  spacer: { flex: 1, minHeight: spacing.xl },
});
