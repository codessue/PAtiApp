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
import { Clock, Minus, Plus } from 'lucide-react-native';
import { useCreateMedication } from '../../hooks/useMedications';
import { colors } from '../../constants/colors';
import { fonts, radius, spacing } from '../../constants/typography';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Header } from '../../components/ui/Header';
import { formatApiDate } from '../../utils/dateHelpers';
import { scheduleMedicationNotifications } from '../../utils/notifications';

const schema = z.object({
  name: z.string().min(1, 'İlaç adı zorunludur'),
  dosage: z.string().optional(),
  frequencyType: z.enum(['daily', 'weekly', 'custom']),
  frequencyTimes: z.number().min(1).max(4),
  startDate: z.string().min(1, 'Başlangıç tarihi zorunludur'),
  endDate: z.string().optional(),
  notes: z.string().optional(),
  reminderTimes: z.array(z.string()),
});

type FormData = z.infer<typeof schema>;

const FREQ_OPTIONS = [
  { value: 'daily' as const, label: 'Günlük' },
  { value: 'weekly' as const, label: 'Haftalık' },
  { value: 'custom' as const, label: 'Özel' },
];

const buildTimes = (n: number) =>
  Array.from({ length: n }, (_, i) => `${(8 + i * 6).toString().padStart(2, '0')}:00`);

export const AddMedicationScreen = () => {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const route = useRoute();
  const { catId } = route.params as { catId: string };
  const { mutateAsync: createMed } = useCreateMedication(catId);
  const [loading, setLoading] = useState(false);

  useLayoutEffect(() => {
    nav.setOptions({ headerShown: false });
  }, [nav]);

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      frequencyType: 'daily',
      frequencyTimes: 1,
      startDate: formatApiDate(new Date()),
      reminderTimes: ['08:00'],
    },
  });

  const frequencyTimes = watch('frequencyTimes');
  const reminderTimes = watch('reminderTimes');

  const setCount = (n: number) => {
    const clamped = Math.max(1, Math.min(4, n));
    setValue('frequencyTimes', clamped);
    setValue('reminderTimes', buildTimes(clamped));
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { data: res } = await createMed(data);
      await scheduleMedicationNotifications(res.data);
      nav.goBack();
    } catch {
      Alert.alert('Hata', 'İlaç eklenirken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <Header title="İlaç Ekle" onBack={() => nav.goBack()} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input label="İlaç Adı" placeholder="Örn. Antibiyotik" onChangeText={onChange} onBlur={onBlur} value={value} error={errors.name?.message} />
            )}
          />

          <Controller
            control={control}
            name="dosage"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input label="Dozaj" placeholder="Örn. 1 Tablet veya 2 Damla" onChangeText={onChange} onBlur={onBlur} value={value} />
            )}
          />

          {/* Frequency */}
          <Controller
            control={control}
            name="frequencyType"
            render={({ field: { onChange, value } }) => (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Sıklık</Text>
                <View style={styles.segment}>
                  {FREQ_OPTIONS.map((opt) => {
                    const selected = value === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        activeOpacity={0.85}
                        onPress={() => onChange(opt.value)}
                        style={[styles.segmentBtn, selected && styles.segmentBtnActive]}
                      >
                        <Text style={[styles.segmentText, selected && styles.segmentTextActive]}>{opt.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          />

          {/* Daily count stepper */}
          <View style={styles.stepperTile}>
            <Text style={styles.stepperLabel}>Günde kaç kez?</Text>
            <View style={styles.stepper}>
              <TouchableOpacity style={styles.stepBtn} activeOpacity={0.8} onPress={() => setCount(frequencyTimes - 1)}>
                <Minus size={18} color={colors.foreground} strokeWidth={2.5} />
              </TouchableOpacity>
              <Text style={styles.stepValue}>{frequencyTimes}</Text>
              <TouchableOpacity style={[styles.stepBtn, styles.stepBtnPlus]} activeOpacity={0.8} onPress={() => setCount(frequencyTimes + 1)}>
                <Plus size={18} color={colors.primary} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Reminder times */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Hatırlatıcı Saati</Text>
            <View style={styles.timesTile}>
              {reminderTimes.map((t, i) => (
                <View key={`${t}-${i}`} style={styles.timeChip}>
                  <Clock size={14} color={colors.primary} strokeWidth={2.2} />
                  <Text style={styles.timeChipText}>{t}</Text>
                </View>
              ))}
            </View>
          </View>

          <Controller
            control={control}
            name="startDate"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input label="Başlangıç Tarihi" placeholder="YYYY-AA-GG" onChangeText={onChange} onBlur={onBlur} value={value} error={errors.startDate?.message} />
            )}
          />

          <Controller
            control={control}
            name="endDate"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input label="Bitiş Tarihi (Opsiyonel)" placeholder="YYYY-AA-GG" onChangeText={onChange} onBlur={onBlur} value={value} />
            )}
          />

          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input label="Notlar" multiline numberOfLines={3} style={styles.textArea} onChangeText={onChange} onBlur={onBlur} value={value} />
            )}
          />

          <Button title="İlacı Kaydet" onPress={handleSubmit(onSubmit)} loading={loading} style={styles.submit} />
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

  segment: { flexDirection: 'row', backgroundColor: colors.muted, borderRadius: radius.lg, padding: 4 },
  segmentBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md, alignItems: 'center' },
  segmentBtnActive: {
    backgroundColor: colors.card,
    shadowColor: '#1C1A18',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  segmentText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.mutedForeground },
  segmentTextActive: { color: colors.foreground, fontFamily: fonts.sansBold },

  stepperTile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: spacing.md,
  },
  stepperLabel: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.foreground },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  stepBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  stepBtnPlus: { backgroundColor: colors.primaryTint, borderColor: 'transparent' },
  stepValue: { fontFamily: fonts.sansBold, fontSize: 18, color: colors.foreground, minWidth: 20, textAlign: 'center' },

  timesTile: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  timeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.muted,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  timeChipText: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.foreground },

  textArea: { height: 88, paddingTop: 14, textAlignVertical: 'top' },
  submit: { marginTop: spacing.md },
});
