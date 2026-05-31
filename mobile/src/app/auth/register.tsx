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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../../stores/authStore';
import { colors } from '../../constants/colors';
import { fonts, spacing } from '../../constants/typography';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Header } from '../../components/ui/Header';

const schema = z
  .object({
    name: z.string().min(2, 'Ad en az 2 karakter olmalıdır'),
    email: z.string().min(1, 'Email zorunludur').email('Geçerli bir email girin'),
    password: z.string().min(8, 'Şifre en az 8 karakter olmalıdır'),
    confirmPassword: z.string().min(1, 'Şifreyi onaylayın'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Şifreler eşleşmiyor',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

interface Props {
  onNavigateToLogin: () => void;
}

export const RegisterScreen: React.FC<Props> = ({ onNavigateToLogin }) => {
  const insets = useSafeAreaInsets();
  const { register } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await register(data.name, data.email, data.password);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Kayıt yapılamadı.';
      Alert.alert('Hata', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <Header title="" onBack={onNavigateToLogin} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Kayıt Ol</Text>
          <Text style={styles.subtitle}>Pati ailesine katılmak için bilgilerini gir.</Text>

          <View style={styles.form}>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Ad Soyad"
                  placeholder="Duru Sue"
                  autoCapitalize="words"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={errors.name?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="E-posta Adresi"
                  placeholder="ornek@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={errors.email?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Şifre"
                  placeholder="••••••••"
                  secureTextEntry
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={errors.password?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Şifre Tekrarı"
                  placeholder="••••••••"
                  secureTextEntry
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={errors.confirmPassword?.message}
                />
              )}
            />
          </View>

          <View style={styles.spacer} />

          <Button
            title="Kayıt Ol"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
          />

          <TouchableOpacity onPress={onNavigateToLogin} style={styles.footerLink}>
            <Text style={styles.footerText}>
              Zaten hesabın var mı? <Text style={styles.footerHighlight}>Giriş Yap</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: spacing.xl },
  title: { fontFamily: fonts.serif, fontSize: 30, color: colors.foreground, letterSpacing: -0.6, marginTop: spacing.sm },
  subtitle: { fontFamily: fonts.sans, fontSize: 16, color: colors.mutedForeground, marginTop: spacing.xs, lineHeight: 24 },
  form: { marginTop: spacing.xl },
  spacer: { flex: 1, minHeight: spacing.xl },
  footerLink: { alignItems: 'center', marginTop: spacing.xl },
  footerText: { fontFamily: fonts.sans, fontSize: 15, color: colors.mutedForeground },
  footerHighlight: { fontFamily: fonts.sansBold, color: colors.primary },
});
