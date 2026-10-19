// Uygulama geneli sabitler: destek adresi ve ekranlar arasında paylaşılan
// SecureStore anahtarları.

/** Yardım ve Destek ekranındaki e-posta bağlantısının hedefi. */
export const SUPPORT_EMAIL = 'durusuegunes@gmail.com';

/**
 * Günlük hatırlatıcısı tercihi (her akşam 20:30).
 *
 * Hem Günlük sekmesi hem Uygulama Ayarları bu anahtarı okuyup yazar; ortak
 * sabit olmadan iki ekran birbirinden habersiz kalır ve biri kapattığında
 * diğeri hâlâ açık görünürdü.
 */
export const DIARY_REMINDER_PREF = 'diaryReminderOn';
