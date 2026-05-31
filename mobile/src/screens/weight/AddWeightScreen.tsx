import React, { useLayoutEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Calendar } from 'lucide-react-native';
import { useAddWeight } from '../../hooks/useWeightLogs';
import { colors } from '../../constants/colors';
import { fonts, spacing } from '../../constants/typography';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Header } from '../../components/ui/Header';
import { formatApiDate } from '../../utils/dateHelpers';

const schema = z.object({
  weightKg: z.string().min(1, 'Ağırlık zorunludur').refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, 'Geçerli bir ağırlık girin'),
  loggedAt: z.string().min(1, 'Tarih zorunludur'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export const AddWeightScreen = () => {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const route = useRoute();
  const { catId } = route.params as { catId: string };
  const { mutateAsync: addWeight } = useAddWeight(catId);
  const [loading, setLoading] = useState(false);

  useLayoutEffect(() => {
    nav.setOptions({ headerShown: false });
  }, [nav]);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { loggedAt: formatApiDate(new Date()) },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await addWeight({ weightKg: parseFloat(data.weightKg), loggedAt: data.loggedAt, notes: data.notes });
      nav.goBack();
    } catch {
      Alert.alert('Hata', 'Kilo eklenirken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <Header title="Kilo Ekle" onBack={() => nav.goBack()} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Big weight input */}
          <View style={styles.weightWrap}>
            <Controller
              control={control}
              name="weightKg"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.weightInputRow}>
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={colors.mutedForeground}
                    style={styles.weightInput}
                  />
                  <Text style={styles.kg}>kg</Text>
                </View>
              )}
            />
            {errors.weightKg && <Text style={styles.errorText}>{errors.weightKg.message}</Text>}
          </View>

          <Controller
            control={control}
            name="loggedAt"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Tarih"
                placeholder="YYYY-AA-GG"
                trailingIcon={<Calendar size={20} color={colors.primary} strokeWidth={2} />}
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.loggedAt?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Notlar (Opsiyonel)"
                placeholder="Beslenme değişikliği vb..."
                multiline
                numberOfLines={3}
                style={styles.textArea}
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
              />
            )}
          />

          <View style={styles.spacer} />

          <Button title="Kaydet" onPress={handleSubmit(onSubmit)} loading={loading} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, paddingHorizontal: 24, paddingTop: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },

  weightWrap: { alignItems: 'center', marginVertical: spacing.xl },
  weightInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingBottom: spacing.sm,
    minWidth: 180,
  },
  weightInput: {
    fontFamily: fonts.serif,
    fontSize: 48,
    color: colors.foreground,
    textAlign: 'center',
    padding: 0,
    minWidth: 110,
  },
  kg: { fontFamily: fonts.serifSemi, fontSize: 24, color: colors.mutedForeground, marginLeft: spacing.sm, marginBottom: 8 },
  errorText: { fontFamily: fonts.sans, fontSize: 13, color: colors.destructive, marginTop: spacing.sm },

  textArea: { height: 88, paddingTop: 14, textAlignVertical: 'top' },
  spacer: { flex: 1, minHeight: spacing.xl },
});
