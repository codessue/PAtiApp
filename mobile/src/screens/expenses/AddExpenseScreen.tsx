import React, { useLayoutEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Calendar } from 'lucide-react-native';
import { useCreateExpense } from '../../hooks/useExpenses';
import { colors } from '../../constants/colors';
import { fonts, radius, spacing } from '../../constants/typography';
import { EXPENSE_CATEGORIES } from '../../constants/expenseCategories';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Header } from '../../components/ui/Header';
import { formatApiDate } from '../../utils/dateHelpers';
import { formatCurrency, parseAmount } from '../../utils/currency';

const schema = z.object({
  title: z.string().min(1, 'Yapılan işlem zorunludur'),
  category: z.enum(['exam', 'treatment', 'medication', 'vaccine', 'surgery', 'lab', 'other']),
  clinicName: z.string().optional(),
  expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tarih YYYY-AA-GG formatında olmalı'),
  amount: z.string().refine((v) => parseAmount(v) > 0, 'Geçerli bir tutar girin'),
  paidAmount: z.string().optional().refine((v) => !v || parseAmount(v) >= 0, 'Geçerli bir tutar girin'),
  notes: z.string().optional(),
}).refine((d) => !d.paidAmount || parseAmount(d.paidAmount) <= parseAmount(d.amount), {
  message: 'Ödenen tutar toplam tutardan büyük olamaz',
  path: ['paidAmount'],
});

type FormData = z.infer<typeof schema>;

export const AddExpenseScreen = () => {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const route = useRoute();
  const { catId } = route.params as { catId: string };
  const { mutateAsync: createExpense } = useCreateExpense(catId);
  const [loading, setLoading] = useState(false);

  useLayoutEffect(() => {
    nav.setOptions({ headerShown: false });
  }, [nav]);

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { category: 'exam', expenseDate: formatApiDate(new Date()) },
  });

  const amount = parseAmount(watch('amount') ?? '');
  const paid = parseAmount(watch('paidAmount') ?? '') || 0;
  const remaining = amount > 0 ? Math.max(amount - paid, 0) : null;

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await createExpense({
        title: data.title.trim(),
        category: data.category,
        clinicName: data.clinicName?.trim() || undefined,
        expenseDate: data.expenseDate,
        amount: parseAmount(data.amount),
        paidAmount: data.paidAmount ? parseAmount(data.paidAmount) : undefined,
        notes: data.notes?.trim() || undefined,
      });
      nav.goBack();
    } catch {
      Alert.alert('Hata', 'Gider eklenirken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <Header title="Gider Ekle" onBack={() => nav.goBack()} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Controller
            control={control}
            name="category"
            render={({ field: { onChange, value } }) => (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Kategori</Text>
                <View style={styles.chips}>
                  {EXPENSE_CATEGORIES.map((c) => {
                    const selected = value === c.value;
                    const Icon = c.icon;
                    return (
                      <TouchableOpacity
                        key={c.value}
                        activeOpacity={0.85}
                        onPress={() => onChange(c.value)}
                        style={[styles.chip, selected && styles.chipActive]}
                      >
                        <Icon size={16} color={selected ? colors.primaryForeground : colors.primary} strokeWidth={2.2} />
                        <Text style={[styles.chipText, selected && styles.chipTextActive]}>{c.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          />

          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input label="Yapılan İşlem" placeholder="Örn. Kısırlaştırma, kan tahlili, antibiyotik" onChangeText={onChange} onBlur={onBlur} value={value} error={errors.title?.message} />
            )}
          />

          <Controller
            control={control}
            name="clinicName"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input label="Veteriner / Klinik (Opsiyonel)" placeholder="Örn. Pati Veteriner Kliniği" onChangeText={onChange} onBlur={onBlur} value={value} />
            )}
          />

          <Controller
            control={control}
            name="expenseDate"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Tarih"
                placeholder="YYYY-AA-GG"
                trailingIcon={<Calendar size={20} color={colors.primary} strokeWidth={2} />}
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.expenseDate?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="amount"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input label="Toplam Tutar (₺)" placeholder="0" keyboardType="decimal-pad" onChangeText={onChange} onBlur={onBlur} value={value} error={errors.amount?.message} />
            )}
          />

          <Controller
            control={control}
            name="paidAmount"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Şimdi Ödenen (₺)"
                placeholder="0"
                keyboardType="decimal-pad"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.paidAmount?.message}
                hint="Boş bırakırsanız tamamı borç olarak kaydedilir."
              />
            )}
          />

          {amount > 0 && (
            <View style={styles.quickRow}>
              <TouchableOpacity style={styles.quickBtn} activeOpacity={0.85} onPress={() => setValue('paidAmount', String(amount).replace('.', ','), { shouldValidate: true })}>
                <Text style={styles.quickText}>Tamamı ödendi</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickBtn} activeOpacity={0.85} onPress={() => setValue('paidAmount', '', { shouldValidate: true })}>
                <Text style={styles.quickText}>Hiç ödenmedi</Text>
              </TouchableOpacity>
            </View>
          )}

          {remaining != null && (
            <View style={[styles.remainingTile, { backgroundColor: remaining > 0 ? colors.destructiveTint : colors.successTint }]}>
              <Text style={styles.remainingLabel}>Kalan borç</Text>
              <Text style={[styles.remainingValue, { color: remaining > 0 ? colors.destructive : colors.success }]}>
                {formatCurrency(remaining)}
              </Text>
            </View>
          )}

          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Notlar (Opsiyonel)"
                placeholder="Teşhis, verilen ilaçlar vb..."
                multiline
                numberOfLines={3}
                style={styles.textArea}
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
              />
            )}
          />

          <Button title="Kaydet" onPress={handleSubmit(onSubmit)} loading={loading} style={styles.submit} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { paddingHorizontal: 24, paddingTop: spacing.sm, gap: spacing.md, paddingBottom: spacing['3xl'] },
  fieldGroup: { marginBottom: spacing.xs },
  label: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.foreground, marginLeft: 4, marginBottom: 8 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primaryTint,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.primary },
  chipTextActive: { color: colors.primaryForeground, fontFamily: fonts.sansBold },

  quickRow: { flexDirection: 'row', gap: spacing.sm, marginTop: -spacing.sm },
  quickBtn: { backgroundColor: colors.muted, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full },
  quickText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.foreground },

  remainingTile: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: radius.lg },
  remainingLabel: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.foreground },
  remainingValue: { fontFamily: fonts.sansBold, fontSize: 18 },

  textArea: { height: 88, paddingTop: 14, textAlignVertical: 'top' },
  submit: { marginTop: spacing.md },
});
