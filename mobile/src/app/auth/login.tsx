import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PawPrint } from 'lucide-react-native';
import { useAuthStore } from '../../stores/authStore';
import { colors } from '../../constants/colors';
import { fonts, radius, spacing } from '../../constants/typography';
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
  const insets = useSafeAreaInsets();
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
        contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing.lg }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand */}
        <View style={styles.brand}>
          <PawPrint size={28} color={colors.primary} fill={colors.primary} />
          <Text style={styles.brandName}>Pati</Text>
        </View>

        {/* Watercolor banner (§5). */}
        <View style={styles.banner}>
          <Image source={require('../../../assets/watercolor-cat.png')} style={styles.bannerImage} resizeMode="cover" />
        </View>

        <Text style={styles.title}>Giriş Yap</Text>
        <Text style={styles.subtitle}>Tekrar hoş geldin! Devam etmek için giriş yap.</Text>

        <View style={styles.form}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="E-posta Adresi"
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

          <TouchableOpacity style={styles.forgotLink} activeOpacity={0.7}>
            <Text style={styles.forgotText}>Şifremi Unuttum</Text>
          </TouchableOpacity>

          <Button
            title="Giriş Yap"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            style={styles.submitButton}
          />

          <TouchableOpacity onPress={onNavigateToRegister} style={styles.footerLink}>
            <Text style={styles.footerText}>
              Hesabın yok mu? <Text style={styles.footerHighlight}>Kayıt Ol</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: spacing.xl },
  brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  brandName: { fontFamily: fonts.serif, fontSize: 24, color: colors.primary },
  banner: {
    height: 192,
    borderRadius: radius['3xl'],
    backgroundColor: 'rgba(212,165,160,0.20)',
    overflow: 'hidden',
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  bannerImage: { width: '100%', height: 192 },
  title: { fontFamily: fonts.serif, fontSize: 30, color: colors.foreground, letterSpacing: -0.6 },
  subtitle: { fontFamily: fonts.sans, fontSize: 16, color: colors.mutedForeground, marginTop: spacing.xs, lineHeight: 24 },
  form: { marginTop: spacing.xl },
  forgotLink: { alignSelf: 'flex-end', marginBottom: spacing.lg },
  forgotText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.primary },
  submitButton: { marginTop: spacing.xs },
  footerLink: { alignItems: 'center', marginTop: spacing.xl },
  footerText: { fontFamily: fonts.sans, fontSize: 15, color: colors.mutedForeground },
  footerHighlight: { fontFamily: fonts.sansBold, color: colors.primary },
});
