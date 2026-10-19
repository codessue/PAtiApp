import React, { useLayoutEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronDown, Mail } from 'lucide-react-native';
import { useAuthStore } from '../../stores/authStore';
import { SUPPORT_EMAIL } from '../../constants/app';
import { openSupportEmail } from '../../utils/supportEmail';
import { colors } from '../../constants/colors';
import { fonts, radius, spacing } from '../../constants/typography';
import { Card } from '../../components/ui/Card';
import { Header } from '../../components/ui/Header';

const FAQ: { q: string; a: string }[] = [
  {
    q: 'Nasıl dost eklerim?',
    a: 'Dostlarım sekmesine gidin ve listenin altındaki "Yeni Dost Ekle" düğmesine dokunun. Kedi, köpek, kuş, hamster ve tavşan ekleyebilirsiniz.',
  },
  {
    q: 'Aşı ve ilaç hatırlatmaları nasıl çalışır?',
    a: 'Bir aşı ya da ilaç kaydı eklediğinizde hatırlatma bildirimi otomatik olarak kurulur, kaydı sildiğinizde kalkar. Bunun için uygulamaya bildirim izni vermiş olmanız gerekir; izni Uygulama Ayarları ekranından kontrol edebilirsiniz.',
  },
  {
    q: 'Günlük notlarım nerede saklanıyor?',
    a: 'Notlarınız ve fotoğrafları yalnızca bu telefonda saklanır, sunucuya hiç gönderilmez. Bu yüzden başka bir cihazdan giriş yaptığınızda notlarınızı göremezsiniz. Aynı telefonda birden fazla hesap kullanıyorsanız, her hesap yalnızca kendi notlarını görür.',
  },
  {
    q: 'Yapay zekâ asistanı ne kadar güvenilir?',
    a: 'Asistan yalnızca bir ön değerlendirme sunar, veteriner hekim muayenesinin yerini tutmaz. Dostunuzda ciddi ya da ani bir belirti varsa vakit kaybetmeden veterinerinize başvurun. Ücretsiz kullanım için günde 5 soru hakkınız vardır.',
  },
  {
    q: 'Hesabımı nasıl silerim?',
    a: 'Profil sekmesi → Hesap Bilgileri → "Hesabımı Kalıcı Olarak Sil" adımlarını izleyin. Hesabınız, dostlarınız, tüm sağlık kayıtlarınız ve bu cihazdaki notlarınız kalıcı olarak silinir; işlem geri alınamaz.',
  },
  {
    q: 'Şifremi unuttum, ne yapmalıyım?',
    a: `Şifre sıfırlama henüz uygulamada yok. ${SUPPORT_EMAIL} adresine hesabınızın e-postasıyla yazarsanız yardımcı oluruz.`,
  },
];

export const SupportScreen = () => {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const { user } = useAuthStore();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useLayoutEffect(() => {
    nav.setOptions({ headerShown: false });
  }, [nav]);

  const sendEmail = () =>
    openSupportEmail({
      subject: 'Pati · Destek Talebi',
      accountEmail: user?.email,
    });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title="Yardım ve Destek" onBack={() => nav.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* İletişim */}
        <Card style={styles.contactCard}>
          <View style={styles.contactIcon}>
            <Mail size={22} color={colors.primary} strokeWidth={2.2} />
          </View>
          <Text style={styles.contactTitle}>Bize yazın</Text>
          <Text style={styles.contactBody}>
            Sorunuz, öneriniz ya da karşılaştığınız bir hata mı var? E-posta gönderin,
            en kısa sürede dönüş yapalım.
          </Text>
          <TouchableOpacity style={styles.contactButton} activeOpacity={0.85} onPress={sendEmail}>
            <Mail size={18} color={colors.primaryForeground} strokeWidth={2.4} />
            <Text style={styles.contactButtonText}>E-posta Gönder</Text>
          </TouchableOpacity>
          <Text style={styles.contactAddress}>{SUPPORT_EMAIL}</Text>
        </Card>

        {/* SSS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sık Sorulan Sorular</Text>
          <Card style={styles.faqCard}>
            {FAQ.map((item, i) => {
              const open = openIndex === i;
              return (
                <View key={item.q} style={[styles.faqItem, i === FAQ.length - 1 && styles.faqItemLast]}>
                  <TouchableOpacity
                    style={styles.faqHeader}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: open }}
                    onPress={() => setOpenIndex(open ? null : i)}
                  >
                    <Text style={styles.faqQuestion}>{item.q}</Text>
                    <View style={[styles.faqChevron, open && styles.faqChevronOpen]}>
                      <ChevronDown size={18} color={colors.mutedForeground} strokeWidth={2.2} />
                    </View>
                  </TouchableOpacity>
                  {open && <Text style={styles.faqAnswer}>{item.a}</Text>}
                </View>
              );
            })}
          </Card>
        </View>

        <Text style={styles.footnote}>
          Pati, dostlarınızın sağlık kayıtlarını takip etmenize yardımcı olur; veteriner
          hekim muayenesinin yerini tutmaz.
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 24, paddingTop: spacing.sm, gap: spacing.xl, paddingBottom: spacing['3xl'] },

  contactCard: { alignItems: 'center', gap: spacing.sm },
  contactIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.xl,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  contactTitle: { fontFamily: fonts.serif, fontSize: 20, color: colors.foreground },
  contactBody: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    alignSelf: 'stretch',
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    marginTop: spacing.sm,
  },
  contactButtonText: { fontFamily: fonts.sansBold, fontSize: 17, color: colors.primaryForeground },
  contactAddress: { fontFamily: fonts.sans, fontSize: 13, color: colors.mutedForeground },

  section: { gap: spacing.md },
  sectionTitle: { fontFamily: fonts.serifSemi, fontSize: 18, color: colors.foreground },

  faqCard: { gap: 0 },
  faqItem: { borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: spacing.xs },
  faqItemLast: { borderBottomWidth: 0 },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  faqQuestion: { flex: 1, fontFamily: fonts.sansMedium, fontSize: 15, color: colors.foreground },
  faqChevron: { transform: [{ rotate: '0deg' }] },
  faqChevronOpen: { transform: [{ rotate: '180deg' }] },
  faqAnswer: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    color: colors.mutedForeground,
    paddingBottom: spacing.md,
  },

  footnote: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 18,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
});
