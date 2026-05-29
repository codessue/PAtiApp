import React, { useEffect, useState } from 'react';
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
import { useCat, useUpdateCat } from '../../hooks/useCats';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/typography';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { CAT_BREEDS } from '../../constants/vaccineTypes';

const schema = z.object({
  name: z.string().min(1, 'Kedi adı zorunludur'),
  breed: z.string().optional(),
  gender: z.enum(['male', 'female']).optional(),
  color: z.string().optional(),
  isNeutered: z.boolean(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export const EditCatScreen = () => {
  const nav = useNavigation();
  const route = useRoute();
  const { catId } = route.params as { catId: string };
  const { data: cat } = useCat(catId);
  const { mutateAsync: updateCat } = useUpdateCat();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      breed: undefined,
      gender: undefined,
      color: undefined,
      isNeutered: false,
      notes: undefined,
    },
  });

  useEffect(() => {
    if (!cat) return;
    reset({
      name: cat.name,
      breed: cat.breed,
      gender: cat.gender as 'male' | 'female' | undefined,
      color: cat.color,
      isNeutered: cat.isNeutered,
      notes: cat.notes,
    });
  }, [cat, reset]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await updateCat({ id: catId, data });
      nav.goBack();
    } catch {
      Alert.alert('Hata', 'Kedi güncellenirken bir sorun oluştu.');
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
            <Input label="Kedi Adı *" onChangeText={onChange} onBlur={onBlur} value={value} error={errors.name?.message} />
          )}
        />

        <Controller
          control={control}
          name="breed"
          render={({ field: { onChange, value } }) => (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Irk</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
                    <Text style={[styles.genderLabel, value === v && styles.genderLabelSelected]}>{v ? 'Evet' : 'Hayır'}</Text>
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
            <Input label="Notlar" multiline numberOfLines={3} style={{ height: 80 }} onChangeText={onChange} onBlur={onBlur} value={value} />
          )}
        />

        <Button title="Kaydet" onPress={handleSubmit(onSubmit)} loading={loading} style={styles.submit} />
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
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, marginRight: spacing.sm },
  chipSelected: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  chipText: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.textMuted },
  chipTextSelected: { color: colors.primary, fontFamily: 'DMSans_500Medium' },
  genderBtn: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  genderBtnSelected: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  genderLabel: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.textMuted },
  genderLabelSelected: { color: colors.primary, fontFamily: 'DMSans_500Medium' },
  submit: { marginTop: spacing.md },
});
