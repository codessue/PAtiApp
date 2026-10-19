import { Alert, Linking, Platform } from 'react-native';
import Constants from 'expo-constants';
import { SUPPORT_EMAIL } from '../constants/app';

interface SupportMailOptions {
  /** Posta konusu. */
  subject: string;
  /** Gövdenin başına yazılan, kullanıcının düzenleyebileceği açıklama. */
  intro?: string;
  /**
   * Talebi bir hesapla eşleştirmek için e-posta adresi. Oturum açıkken
   * kullanıcının kendi adresi, giriş ekranında ise formda yazdığı adres.
   */
  accountEmail?: string;
  /** Posta uygulaması açılamazsa gösterilecek uyarının başlığı. */
  fallbackTitle?: string;
}

/**
 * Destek adresine önceden doldurulmuş bir posta açar.
 *
 * Sürüm/platform bilgisini gövdeye baştan koyuyoruz; destek yazışmasının ilk
 * turunda bunları tek tek sormak zorunda kalmayalım. Cihazda posta uygulaması
 * yoksa (ör. simülatör) `openURL` hata verir; o durumda adresi uyarı olarak
 * gösteriyoruz ki kullanıcı elle yazabilsin.
 */
export async function openSupportEmail({
  subject,
  intro,
  accountEmail,
  fallbackTitle = 'E-posta uygulaması açılamadı',
}: SupportMailOptions): Promise<void> {
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const body = [
    intro ?? '',
    '',
    '---',
    'Aşağıdaki bilgiler sorununuzu çözmemize yardımcı olur, lütfen silmeyin:',
    `Uygulama sürümü: ${version}`,
    `Platform: ${Platform.OS} ${Platform.Version}`,
    `Hesap: ${accountEmail?.trim() || 'belirtilmedi'}`,
  ].join('\n');

  const url =
    `mailto:${SUPPORT_EMAIL}` +
    `?subject=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(body)}`;

  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert(fallbackTitle, `Bize şu adresten yazabilirsiniz:\n\n${SUPPORT_EMAIL}`);
  }
}
