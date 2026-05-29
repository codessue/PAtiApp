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
import { useNavigation } from '@react-navigation/native';
import { useCreateCat } from '../../hooks/useCats';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/typography';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { CAT_BREEDS } from '../../constants/vaccineTypes';
import { formatApiDate } from '../../utils/dateHelpers';

const schema = z.object({
  name: z.string().min(1, 'Kedi adı zorunludur'),
  breed: z.string().optional(),
  gender: z.enum(['male', 'female']).optional(),
  color: z.string().optional(),
  isNeutered: z.boolean(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export const AddCatScreen = () => {
  const nav = useNavigation();
  const { mutateAsync: createCat } = useCreateCat();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { isNeutered: false },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await createCat(data);
      nav.goBack();
    } catch {
      Alert.alert('Hata', 'Kedi eklenirken bir sorun oluştu.');
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
            <Input label="Kedi Adı *" placeholder="Boncuk" onChangeText={onChange} onBlur={onBlur} value={value} error={errors.name?.message} />
          )}
        />

        <Controller
          control={control}
          name="breed"
          render={({ field: { onChange, value } }) => (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Irk</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                {CAT_BREEDS.map((breed) => (
                  <TouchableOpacity
                    key={breed}
                    onPress={() => onChange(value === breed ? undefined : breed)}
                    style={[styles.chip, value === breed && styles.chipSelected]}
                  >
                    <Text style={[styles.chipText, value === breed && styles.chipTextSelected]}>{breed}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        />

        <Controller
          control={control}
          name="gender"
          render={({ field: { onChange, value } }) => (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Cinsiyet</Text>
              <View style={styles.row}>
                {(['male', 'female'] as const).map((g) => (
                  <TouchableOpacity
                    key={g}
                    onPress={() => onChange(value === g ? undefined : g)}
                    style={[styles.genderBtn, value === g && styles.genderBtnSelected]}
                  >
                    <Text style={styles.genderEmoji}>{g === 'male' ? '♂️' : '♀️'}</Text>
                    <Text style={[styles.genderLabel, value === g && styles.genderLabelSelected]}>
                      {g === 'male' ? 'Erkek' : 'Dişi'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        />

        <Controller
          control={control}
          name="color"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Renk" placeholder="Gri, Siyah-Beyaz..." onChangeText={onChange} onBlur={onBlur} value={value} />
          )}
        />

        <Controller
          control={control}
          name="isNeutered"
          render={({ field: { onChange, value } }) => (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Kısırlaştırıldı mı?</Text>
              <View style={styles.row}>
                {([true, false] as const).map((v) => (
                  <TouchableOpacity
                    key={String(v)}
                    onPress={() => onChange(v)}
                    style={[styles.genderBtn, value === v && styles.genderBtnSelected]}
                  >
                    <Text style={[styles.genderLabel, value === v && styles.genderLabelSelected]}>
                      {v ? 'Evet' : 'Hayır'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        />

        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Notlar"
              placeholder="Ek bilgiler..."
              multiline
              numberOfLines={3}
              style={{ height: 80 }}
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
            />
          )}
        />

        <Button title="Kedi Ekle" onPress={handleSubmit(onSubmit)} loading={loading} style={styles.submit} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing['3xl'] },
  fieldGroup: { marginBottom: spacing.md },
  label: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.textMuted, marginBottom: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.md },
  chipsScroll: { marginTop: spacing.xs },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: 20, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface, marginRight: spacing.sm,
  },
  chipSelected: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  chipText: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.textMuted },
  chipTextSelected: { color: colors.primary, fontFamily: 'DMSans_500Medium' },
  genderBtn: {
    flex: 1, alignItems: 'center', paddingVertical: spacing.md,
    borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  genderBtnSelected: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  genderEmoji: { fontSize: 24 },
  genderLabel: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.textMuted },
  genderLabelSelected: { color: colors.primary, fontFamily: 'DMSans_500Medium' },
  submit: { marginTop: spacing.md },
});
