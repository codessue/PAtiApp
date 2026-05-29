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
import { useCreateVaccine } from '../../hooks/useVaccines';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/typography';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { VACCINE_TYPES } from '../../constants/vaccineTypes';
import { formatApiDate } from '../../utils/dateHelpers';

const schema = z.object({
  vaccineType: z.string().min(1, 'Aşı türü seçin'),
  nextDueDate: z.string().min(1, 'Sonraki aşı tarihi zorunludur'),
  lastGivenDate: z.string().optional(),
  vetName: z.string().optional(),
  clinicName: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export const AddVaccineScreen = () => {
  const nav = useNavigation();
  const route = useRoute();
  const { catId } = route.params as { catId: string };
  const { mutateAsync: createVaccine } = useCreateVaccine(catId);
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nextDueDate: formatApiDate(new Date()) },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await createVaccine(data);
      nav.goBack();
    } catch {
      Alert.alert('Hata', 'Aşı eklenirken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        <Controller
          control={control}
          name="vaccineType"
          render={({ field: { onChange, value } }) => (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Aşı Türü *</Text>
              {errors.vaccineType && <Text style={styles.error}>{errors.vaccineType.message}</Text>}
              <View style={styles.typeGrid}>
                {VACCINE_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => onChange(type)}
                    style={[styles.typeBtn, value === type && styles.typeBtnSelected]}
                  >
                    <Text style={[styles.typeBtnText, value === type && styles.typeBtnTextSelected]}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        />

        <Controller
          control={control}
          name="nextDueDate"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Sonraki Aşı Tarihi *"
              placeholder="YYYY-AA-GG"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              error={errors.nextDueDate?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="lastGivenDate"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Son Verilme Tarihi"
              placeholder="YYYY-AA-GG (isteğe bağlı)"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
            />
          )}
        />

        <Controller
          control={control}
          name="vetName"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Veteriner Adı" placeholder="Dr. Ahmet Yılmaz" onChangeText={onChange} onBlur={onBlur} value={value} />
          )}
        />

        <Controller
          control={control}
          name="clinicName"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Klinik Adı" placeholder="Pati Veteriner Kliniği" onChangeText={onChange} onBlur={onBlur} value={value} />
          )}
        />

        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Notlar" multiline numberOfLines={3} style={{ height: 80 }} onChangeText={onChange} onBlur={onBlur} value={value} />
          )}
        />

        <Button title="Aşı Ekle" onPress={handleSubmit(onSubmit)} loading={loading} style={styles.submit} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing['3xl'] },
  fieldGroup: { marginBottom: spacing.md },
  label: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.textMuted, marginBottom: spacing.sm },
  error: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.danger, marginBottom: spacing.xs },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  typeBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  typeBtnSelected: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  typeBtnText: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.textMuted },
  typeBtnTextSelected: { color: colors.primary, fontFamily: 'DMSans_500Medium' },
  submit: { marginTop: spacing.md },
});
