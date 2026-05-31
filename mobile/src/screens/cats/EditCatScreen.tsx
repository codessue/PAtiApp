import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Plus } from 'lucide-react-native';
import { useCat, useUpdateCat } from '../../hooks/useCats';
import { colors } from '../../constants/colors';
import { fonts, radius, spacing } from '../../constants/typography';
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
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Photo picker (UI only — upload wired in a later step) */}
        <View style={styles.photoWrap}>
          <TouchableOpacity style={styles.photoPicker} activeOpacity={0.8}>
            {cat?.photoUrl ? (
              <Image source={{ uri: cat.photoUrl }} style={styles.photoImage} />
            ) : (
              <>
                <Plus size={24} color={colors.primary} strokeWidth={2.5} />
                <Text style={styles.photoLabel}>Fotoğraf</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Kedinin Adı" onChangeText={onChange} onBlur={onBlur} value={value} error={errors.name?.message} />
          )}
        />

        <Controller
          control={control}
          name="breed"
          render={({ field: { onChange, value } }) => (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Irk</Text>
              <View style={styles.chipWrap}>
                {CAT_BREEDS.map((breed) => {
                  const selected = value === breed;
                  return (
                    <TouchableOpacity
                      key={breed}
                      onPress={() => onChange(selected ? undefined : breed)}
                      style={[styles.chip, selected && styles.chipSelected]}
                    >
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{breed}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        />

        <Controller
          control={control}
          name="isNeutered"
          render={({ field: { onChange, value } }) => (
            <View style={styles.toggleTile}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleTitle}>Kısırlaştırılmış</Text>
                <Text style={styles.toggleSub}>Kediniz kısırlaştırıldı mı?</Text>
              </View>
              <Switch
                value={value}
                onValueChange={onChange}
                trackColor={{ false: colors.muted, true: colors.primary }}
                thumbColor={colors.card}
                ios_backgroundColor={colors.muted}
              />
            </View>
          )}
        />

        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Notlar" multiline numberOfLines={3} style={styles.textArea} onChangeText={onChange} onBlur={onBlur} value={value} />
          )}
        />

        <Button title="Kaydet" onPress={handleSubmit(onSubmit)} loading={loading} style={styles.submit} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { paddingHorizontal: 24, paddingTop: spacing.lg, gap: spacing.md, paddingBottom: spacing['3xl'] },

  photoWrap: { alignItems: 'center', marginBottom: spacing.sm },
  photoPicker: {
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 1.5, borderColor: colors.primary, borderStyle: 'dashed',
    backgroundColor: 'rgba(196,98,45,0.05)',
    alignItems: 'center', justifyContent: 'center', gap: 2, overflow: 'hidden',
  },
  photoImage: { width: '100%', height: '100%' },
  photoLabel: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.primary },

  fieldGroup: { marginBottom: spacing.xs },
  label: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.foreground, marginLeft: 4, marginBottom: 8 },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.full, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontFamily: fonts.sans, fontSize: 14, color: colors.mutedForeground },
  chipTextSelected: { color: colors.primaryForeground, fontFamily: fonts.sansMedium },

  toggleTile: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, paddingHorizontal: 16, paddingVertical: spacing.md,
  },
  toggleTitle: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.foreground },
  toggleSub: { fontFamily: fonts.sans, fontSize: 13, color: colors.mutedForeground, marginTop: 2 },

  textArea: { height: 88, paddingTop: 14, textAlignVertical: 'top' },
  submit: { marginTop: spacing.md },
});
