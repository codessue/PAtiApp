import React, { useState } from 'react';
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
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useCreateMedication } from '../../hooks/useMedications';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/typography';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
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

export const AddMedicationScreen = () => {
  const nav = useNavigation();
  const route = useRoute();
  const { catId } = route.params as { catId: string };
  const { mutateAsync: createMed } = useCreateMedication(catId);
  const [loading, setLoading] = useState(false);

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
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label="İlaç Adı *" placeholder="Drontal, Frontline..." onChangeText={onChange} onBlur={onBlur} value={value} error={errors.name?.message} />
          )}
        />

        <Controller
          control={control}
          name="dosage"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Doz" placeholder="0.5ml, 1 tablet..." onChangeText={onChange} onBlur={onBlur} value={value} />
          )}
        />

        <Controller
          control={control}
          name="frequencyType"
          render={({ field: { onChange, value } }) => (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Sıklık</Text>
              <View style={styles.row}>
                {FREQ_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => onChange(opt.value)}
                    style={[styles.segBtn, value === opt.value && styles.segBtnActive]}
                  >
                    <Text style={[styles.segText, value === opt.value && styles.segTextActive]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        />

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Günlük Kaç Kez?</Text>
          <View style={styles.row}>
            {[1, 2, 3, 4].map((n) => (
              <TouchableOpacity
                key={n}
                onPress={() => {
                  setValue('frequencyTimes', n);
                  setValue('reminderTimes', Array.from({ length: n }, (_, i) => `${(8 + i * 6).toString().padStart(2, '0')}:00`));
                }}
                style={[styles.countBtn, frequencyTimes === n && styles.countBtnActive]}
              >
                <Text style={[styles.countText, frequencyTimes === n && styles.countTextActive]}>{n}x</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Controller
          control={control}
          name="startDate"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Başlangıç Tarihi *" placeholder="YYYY-AA-GG" onChangeText={onChange} onBlur={onBlur} value={value} error={errors.startDate?.message} />
          )}
        />

        <Controller
          control={control}
          name="endDate"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Bitiş Tarihi (Süresiz bırakın)" placeholder="YYYY-AA-GG" onChangeText={onChange} onBlur={onBlur} value={value} />
          )}
        />

        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Notlar" multiline numberOfLines={3} style={{ height: 80 }} onChangeText={onChange} onBlur={onBlur} value={value} />
          )}
        />

        <Button title="İlaç Ekle" onPress={handleSubmit(onSubmit)} loading={loading} style={styles.submit} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing['3xl'] },
  fieldGroup: { marginBottom: spacing.md },
  label: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.textMuted, marginBottom: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  segBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center' },
  segBtnActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  segText: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.textMuted },
  segTextActive: { color: colors.primary, fontFamily: 'DMSans_500Medium' },
  countBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center' },
  countBtnActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  countText: { fontFamily: 'DMSans_400Regular', fontSize: 15, color: colors.textMuted },
  countTextActive: { color: colors.primary, fontFamily: 'DMSans_500Medium' },
  submit: { marginTop: spacing.md },
});
