import React, { useEffect, useLayoutEffect, useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Plus } from 'lucide-react-native';
import { useCat, useUpdateCat, useUploadCatPhoto } from '../../hooks/useCats';
import { colors } from '../../constants/colors';
import { fonts, radius, spacing } from '../../constants/typography';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { DatePicker } from '../../components/ui/DatePicker';
import { Header } from '../../components/ui/Header';
import { BREEDS_BY_SPECIES, SPECIES_LIST, Species } from '../../constants/species';
import { mediaUrl } from '../../utils/media';

const schema = z.object({
  name: z.string().min(1, 'İsim zorunludur'),
  species: z.enum(['kedi', 'kopek', 'kus', 'hamster', 'tavsan', 'diger']),
  breed: z.string().optional(),
  gender: z.enum(['male', 'female']).optional(),
  color: z.string().optional(),
  birthDate: z.string().optional(),
  isNeutered: z.boolean(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export const EditCatScreen = () => {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const route = useRoute();
  const { catId } = route.params as { catId: string };
  const { data: cat } = useCat(catId);
  const { mutateAsync: updateCat } = useUpdateCat();
  const { mutateAsync: uploadPhoto } = useUploadCatPhoto();
  const [loading, setLoading] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  // Hide the native stack header (and its "Main" back-title) — this screen
  // renders its own custom Header below.
  useLayoutEffect(() => {
    nav.setOptions({ headerShown: false });
  }, [nav]);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('İzin Gerekli', 'Fotoğraf seçebilmek için galeri erişim izni vermeniz gerekiyor.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      species: 'kedi',
      breed: undefined,
      gender: undefined,
      color: undefined,
      birthDate: undefined,
      isNeutered: false,
      notes: undefined,
    },
  });

  useEffect(() => {
    if (!cat) return;
    reset({
      name: cat.name,
      species: (cat.species as Species) ?? 'kedi',
      breed: cat.breed,
      gender: cat.gender as 'male' | 'female' | undefined,
      color: cat.color,
      birthDate: cat.birthDate,
      isNeutered: cat.isNeutered,
      notes: cat.notes,
    });
  }, [cat, reset]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await updateCat({ id: catId, data });
      // Only upload when the user picked a NEW photo this session.
      if (photoUri) {
        try { await uploadPhoto({ id: catId, uri: photoUri }); } catch { /* foto opsiyonel */ }
      }
      nav.goBack();
    } catch {
      Alert.alert('Hata', 'Güncelleme sırasında bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const displayUri = photoUri ?? mediaUrl(cat?.photoUrl) ?? null;

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <Header title="Dostu Düzenle" onBack={() => nav.goBack()} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Photo picker */}
          <View style={styles.photoWrap}>
            <TouchableOpacity style={styles.photoPicker} activeOpacity={0.8} onPress={pickImage}>
              {displayUri ? (
                <Image source={{ uri: displayUri }} style={styles.photoImage} />
              ) : (
                <>
                  <Plus size={24} color={colors.primary} strokeWidth={2.5} />
                  <Text style={styles.photoLabel}>Fotoğraf</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

        {/* Species picker */}
        <Controller
          control={control}
          name="species"
          render={({ field: { onChange, value } }) => (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Tür</Text>
              <View style={styles.chipWrap}>
                {SPECIES_LIST.map((s) => {
                  const selected = value === s.key;
                  return (
                    <TouchableOpacity
                      key={s.key}
                      onPress={() => {
                        onChange(s.key);
                        setValue('breed', undefined); // tür değişince ırk sıfırlanır
                      }}
                      style={[styles.chip, selected && styles.chipSelected]}
                    >
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                        {s.emoji} {s.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        />

        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Adı" onChangeText={onChange} onBlur={onBlur} value={value} error={errors.name?.message} />
          )}
        />

        <Controller
          control={control}
          name="breed"
          render={({ field: { onChange, onBlur, value } }) => {
            const breedOptions = BREEDS_BY_SPECIES[watch('species') as Species];
            return breedOptions ? (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Irk</Text>
                <View style={styles.chipWrap}>
                  {breedOptions.map((breed) => {
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
            ) : (
              <Input label="Irk / Cins (opsiyonel)" placeholder="Örn. Suriye hamsterı" onChangeText={onChange} onBlur={onBlur} value={value ?? ''} />
            );
          }}
        />

        <Controller
          control={control}
          name="birthDate"
          render={({ field: { onChange, value } }) => (
            <DatePicker
              label="Doğum Tarihi"
              value={value}
              onChange={onChange}
              maximumDate={new Date()}
            />
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
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { paddingHorizontal: 24, paddingTop: spacing.sm, gap: spacing.md, paddingBottom: 40 },

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
