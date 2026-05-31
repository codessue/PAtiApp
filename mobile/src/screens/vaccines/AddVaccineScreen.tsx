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
import { useCreateVaccine } from '../../hooks/useVaccines';
import { colors } from '../../constants/colors';
import { fonts, radius, spacing } from '../../constants/typography';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Header } from '../../components/ui/Header';
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

const CalendarIcon = () => <Calendar size={20} color={colors.mutedForeground} strokeWidth={2} />;

export const AddVaccineScreen = () => {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const route = useRoute();
  const { catId } = route.params as { catId: string };
  const { mutateAsync: createVaccine } = useCreateVaccine(catId);
  const [loading, setLoading] = useState(false);

  useLayoutEffect(() => {
    nav.setOptions({ headerShown: false });
  }, [nav]);

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
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <Header title="Aşı Ekle" onBack={() => nav.goBack()} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Controller
            control={control}
            name="vaccineType"
            render={({ field: { onChange, value } }) => (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Aşı Tipi</Text>
                {errors.vaccineType && <Text style={styles.error}>{errors.vaccineType.message}</Text>}
                <View style={styles.typeGrid}>
                  {VACCINE_TYPES.map((type) => {
                    const selected = value === type;
                    return (
                      <TouchableOpacity
                        key={type}
                        onPress={() => onChange(type)}
                        style={[styles.typeBtn, selected && styles.typeBtnSelected]}
                      >
                        <Text style={[styles.typeBtnText, selected && styles.typeBtnTextSelected]} numberOfLines={1}>{type}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          />

          <Controller
            control={control}
            name="lastGivenDate"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Aşı Tarihi"
                placeholder="YYYY-AA-GG"
                trailingIcon={<CalendarIcon />}
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
              />
            )}
          />

          <Controller
            control={control}
            name="nextDueDate"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Sonraki Aşı Tarihi"
                placeholder="YYYY-AA-GG"
                trailingIcon={<CalendarIcon />}
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.nextDueDate?.message}
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
              <Input label="Klinik Adı" placeholder="Örn. Pati Veteriner Kliniği" onChangeText={onChange} onBlur={onBlur} value={value} />
            )}
          />

          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Notlar"
                placeholder="Aşı hakkında notlar..."
                multiline
                numberOfLines={3}
                style={styles.textArea}
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
              />
            )}
          />

          <Button title="Aşıyı Kaydet" onPress={handleSubmit(onSubmit)} loading={loading} style={styles.submit} />
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
  error: { fontFamily: fonts.sans, fontSize: 13, color: colors.destructive, marginLeft: 4, marginBottom: spacing.xs },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: spacing.sm },
  typeBtn: {
    width: '48%',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
  },
  typeBtnSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeBtnText: { fontFamily: fonts.sans, fontSize: 14, color: colors.mutedForeground },
  typeBtnTextSelected: { color: colors.primaryForeground, fontFamily: fonts.sansMedium },
  textArea: { height: 88, paddingTop: 14, textAlignVertical: 'top' },
  submit: { marginTop: spacing.md },
});
