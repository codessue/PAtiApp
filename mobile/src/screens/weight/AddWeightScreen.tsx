import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAddWeight } from '../../hooks/useWeightLogs';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/typography';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { formatApiDate } from '../../utils/dateHelpers';

const schema = z.object({
  weightKg: z.string().min(1, 'Ağırlık zorunludur').refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, 'Geçerli bir ağırlık girin'),
  loggedAt: z.string().min(1, 'Tarih zorunludur'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export const AddWeightScreen = () => {
  const nav = useNavigation();
  const route = useRoute();
  const { catId } = route.params as { catId: string };
  const { mutateAsync: addWeight } = useAddWeight(catId);
  const [loading, setLoading] = useState(false);

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
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Controller
          control={control}
          name="weightKg"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Ağırlık (kg) *"
              placeholder="4.25"
              keyboardType="decimal-pad"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              error={errors.weightKg?.message}
              hint="Örnek: 4.25 kg"
            />
          )}
        />

        <Controller
          control={control}
          name="loggedAt"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Tarih *"
              placeholder="YYYY-AA-GG"
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

        <Button title="Kilo Ekle" onPress={handleSubmit(onSubmit)} loading={loading} style={styles.submit} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing['3xl'] },
  submit: { marginTop: spacing.md },
});
