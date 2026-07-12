import React, { useLayoutEffect, useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { Plus } from 'lucide-react-native';
import { useCreateCat, useUploadCatPhoto } from '../../hooks/useCats';
import { colors } from '../../constants/colors';
import { fonts, radius, spacing } from '../../constants/typography';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { DatePicker } from '../../components/ui/DatePicker';
import { Header } from '../../components/ui/Header';
import { CAT_BREEDS } from '../../constants/vaccineTypes';

// Light-blue gender accent (per design; not part of the core token palette).
const GENDER_BG = '#E8EEF5';
const GENDER_FG = '#5B7FA6';

const schema = z.object({
  name: z.string().min(1, 'Kedi adı zorunludur'),
  breed: z.string().optional(),
  gender: z.enum(['male', 'female']).optional(),
  color: z.string().optional(),
  birthDate: z.string().optional(),
  isNeutered: z.boolean(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export const AddCatScreen = () => {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const { mutateAsync: createCat } = useCreateCat();
  const { mutateAsync: uploadPhoto } = useUploadCatPhoto();
  const [loading, setLoading] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  // Hide the native stack header (and its "Main" back-title) — this screen
  // renders its own custom Header below.
  useLayoutEffect(() => {
    nav.setOptions({ headerShown: false });
  }, [nav]);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { isNeutered: false },
  });

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

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await createCat(data);
      const newId = res?.data?.data?.id as string | undefined;
      // Photo is optional and uploaded separately; don't fail the whole save on it.
      if (photoUri && newId) {
        try { await uploadPhoto({ id: newId, uri: photoUri }); } catch { /* foto opsiyonel */ }
      }
      nav.goBack();
    } catch {
      Alert.alert('Hata', 'Kedi eklenirken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <Header title="Kedi Ekle" onBack={() => nav.goBack()} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Photo picker */}
          <View style={styles.photoWrap}>
            <TouchableOpacity style={styles.photoPicker} activeOpacity={0.8} onPress={pickImage}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.photoImage} />
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
            <Input label="Kedinin Adı" placeholder="Örn. Tarçın" onChangeText={onChange} onBlur={onBlur} value={value} error={errors.name?.message} />
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
          name="gender"
          render={({ field: { onChange, value } }) => (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Cinsiyet</Text>
              <View style={styles.row}>
                {(['male', 'female'] as const).map((g) => {
                  const selected = value === g;
                  return (
                    <TouchableOpacity
                      key={g}
                      onPress={() => onChange(selected ? undefined : g)}
                      style={[styles.genderBtn, selected && styles.genderBtnSelected]}
                    >
                      <Text style={styles.genderEmoji}>{g === 'male' ? '♂️' : '♀️'}</Text>
                      <Text style={[styles.genderLabel, selected && styles.genderLabelSelected]}>
                        {g === 'male' ? 'Erkek' : 'Dişi'}
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
          name="color"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Renk" placeholder="Gri, Siyah-Beyaz..." onChangeText={onChange} onBlur={onBlur} value={value} />
          )}
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
            <Input
              label="Notlar"
              placeholder="Ek bilgiler..."
              multiline
              numberOfLines={3}
              style={styles.textArea}
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
            />
          )}
        />

          <Button title="Kedi Ekle" onPress={handleSubmit(onSubmit)} loading={loading} style={styles.submit} />
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
  row: { flexDirection: 'row', gap: spacing.md },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.full, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontFamily: fonts.sans, fontSize: 14, color: colors.mutedForeground },
  chipTextSelected: { color: colors.primaryForeground, fontFamily: fonts.sansMedium },

  genderBtn: {
    flex: 1, alignItems: 'center', paddingVertical: spacing.md,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card,
    gap: spacing.xs, flexDirection: 'row', justifyContent: 'center',
  },
  genderBtnSelected: { backgroundColor: GENDER_BG, borderColor: GENDER_FG },
  genderEmoji: { fontSize: 18 },
  genderLabel: { fontFamily: fonts.sans, fontSize: 15, color: colors.mutedForeground },
  genderLabelSelected: { color: GENDER_FG, fontFamily: fonts.sansMedium },

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
