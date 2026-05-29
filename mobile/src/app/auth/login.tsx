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
import { useAuthStore } from '../../stores/authStore';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/typography';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  email: z.string().min(1, 'Email zorunludur').email('Geçerli bir email girin'),
  password: z.string().min(1, 'Şifre zorunludur'),
});

type FormData = z.infer<typeof schema>;

interface Props {
  onNavigateToRegister: () => void;
}

export const LoginScreen: React.FC<Props> = ({ onNavigateToRegister }) => {
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Giriş yapılamadı. Tekrar deneyin.';
      Alert.alert('Hata', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.logo}>🐾 Pati</Text>
          <Text style={styles.tagline}>Kedinizin sağlığı, elinizde.</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.title}>Giriş Yap</Text>

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email"
                placeholder="ornek@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
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

          <Button
            title="Giriş Yap"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            style={styles.submitButton}
          />

          <TouchableOpacity onPress={onNavigateToRegister} style={styles.registerLink}>
            <Text style={styles.registerText}>
              Hesabın yok mu? <Text style={styles.registerHighlight}>Kayıt Ol</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, padding: spacing.xl, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: spacing['3xl'] },
  logo: { fontFamily: 'Fraunces_700Bold', fontSize: 40, color: colors.primary },
  tagline: { fontFamily: 'DMSans_400Regular', fontSize: 15, color: colors.textMuted, marginTop: spacing.sm },
  form: { gap: spacing.sm },
  title: { fontFamily: 'Fraunces_700Bold', fontSize: 28, color: colors.text, marginBottom: spacing.md },
  submitButton: { marginTop: spacing.md },
  registerLink: { alignItems: 'center', marginTop: spacing.lg },
  registerText: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.textMuted },
  registerHighlight: { color: colors.primary, fontFamily: 'DMSans_500Medium' },
});
