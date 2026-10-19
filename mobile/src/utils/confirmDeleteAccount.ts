import { Alert } from 'react-native';

/**
 * App Store 5.1.1(v): hesap oluşturan uygulamalar, hesabın uygulama içinden
 * kalıcı olarak silinmesine de izin vermek zorunda. Yanlışlıkla silmeyi
 * zorlaştırmak için akış çift onaylı.
 *
 * Profil ve Hesap Bilgileri ekranları aynı akışı paylaşsın diye burada.
 */
export function confirmDeleteAccount(deleteAccount: () => Promise<void>): void {
  Alert.alert(
    'Hesabı Sil',
    'Hesabınız, dostlarınız ve tüm sağlık kayıtlarınız KALICI olarak silinecek. Bu işlem geri alınamaz.',
    [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Devam Et',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Emin misiniz?', 'Tüm verileriniz kalıcı olarak silinecek.', [
            { text: 'Vazgeç', style: 'cancel' },
            {
              text: 'Hesabımı Kalıcı Olarak Sil',
              style: 'destructive',
              onPress: async () => {
                try {
                  await deleteAccount();
                } catch {
                  Alert.alert('Hata', 'Hesap silinemedi. Lütfen tekrar deneyin.');
                }
              },
            },
          ]),
      },
    ]
  );
}
