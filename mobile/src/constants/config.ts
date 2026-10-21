// Production değerleri eas.json içindeki build profillerinden (EXPO_PUBLIC_*) gelir.
export const config = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080/api',
  privacyPolicyUrl:
    process.env.EXPO_PUBLIC_PRIVACY_URL ?? 'https://codessue.github.io/PAtiApp/privacy.html',
  supportUrl:
    process.env.EXPO_PUBLIC_SUPPORT_URL ?? 'https://codessue.github.io/PAtiApp/support.html',
};
