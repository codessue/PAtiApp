import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Heart } from 'lucide-react-native';
import { isUserCancelledError, useIAP } from 'expo-iap';
import { colors } from '../../constants/colors';
import { fonts, radius, spacing } from '../../constants/typography';
import { SUPPORT_PRODUCTS, SUPPORT_SKUS } from '../../constants/supportProducts';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

// Uygulama içi tüketilebilir ürünlerle "mama desteği".
// Mağaza kurallarına göre bu bir bahşiştir: hiçbir özellik açmaz.
export const FoodSupportScreen = () => {
  const [pendingSku, setPendingSku] = useState<string | null>(null);
  const [thanked, setThanked] = useState(false);

  const { connected, products, fetchProducts, requestPurchase, finishTransaction } = useIAP({
    onPurchaseSuccess: async (purchase) => {
      try {
        await finishTransaction({ purchase, isConsumable: true });
        setThanked(true);
      } finally {
        setPendingSku(null);
      }
    },
    onPurchaseError: (error) => {
      setPendingSku(null);
      if (!isUserCancelledError(error)) {
        Alert.alert('Ödeme tamamlanamadı', 'Lütfen daha sonra tekrar deneyin.');
      }
    },
  });

  useEffect(() => {
    if (connected) fetchProducts({ skus: SUPPORT_SKUS, type: 'in-app' });
  }, [connected, fetchProducts]);

  const handleSupport = async (sku: string) => {
    setPendingSku(sku);
    try {
      await requestPurchase({
        type: 'in-app',
        request: { apple: { sku }, google: { skus: [sku] } },
      });
    } catch (error) {
      setPendingSku(null);
      if (!isUserCancelledError(error)) {
        Alert.alert('Ödeme başlatılamadı', 'Lütfen daha sonra tekrar deneyin.');
      }
    }
  };

  const storeAvailable = Platform.OS !== 'web' && connected;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>🐈</Text>
        <Text style={styles.title}>Mama Desteği</Text>
        <Text style={styles.body}>
          Pati tamamen ücretsiz. Uygulamayı geliştirirken baktığım sokak kedilerinin mama
          masrafına küçük bir destek olmak istersen aşağıdan bir mama seçebilirsin.
        </Text>
      </View>

      {thanked ? (
        <Card style={styles.thanks}>
          <Heart size={28} color={colors.primary} fill={colors.primary} />
          <Text style={styles.thanksTitle}>Teşekkürler! 🧡</Text>
          <Text style={styles.thanksBody}>Desteğin kedilerin mama kabına ulaşacak.</Text>
          <Button title="Bir mama daha" variant="outline" size="sm" onPress={() => setThanked(false)} />
        </Card>
      ) : (
        <View style={styles.list}>
          {SUPPORT_PRODUCTS.map((item) => {
            const product = products.find((p) => p.id === item.sku);
            const isPending = pendingSku === item.sku;
            return (
              <TouchableOpacity
                key={item.sku}
                style={[styles.row, !storeAvailable && styles.rowDisabled]}
                activeOpacity={0.85}
                disabled={!storeAvailable || pendingSku !== null}
                onPress={() => handleSupport(item.sku)}
              >
                <View style={styles.emojiTile}>
                  <Text style={styles.rowEmoji}>{item.emoji}</Text>
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{item.title}</Text>
                  <Text style={styles.rowDescription}>{item.description}</Text>
                </View>
                {isPending ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <View style={styles.pricePill}>
                    <Text style={styles.priceText}>{product?.displayPrice ?? item.fallbackPrice}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {!storeAvailable ? (
        <Text style={styles.note}>Mağazaya şu an bağlanılamıyor. Lütfen daha sonra tekrar deneyin.</Text>
      ) : null}

      <Text style={styles.note}>
        Ödemeler App Store / Google Play üzerinden güvenle alınır. Destek tek seferliktir, abonelik
        değildir ve uygulamada ek bir özellik açmaz.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 24, paddingTop: spacing.sm, gap: spacing.xl, paddingBottom: spacing['3xl'] },

  hero: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  heroEmoji: { fontSize: 56 },
  title: { fontFamily: fonts.serif, fontSize: 28, color: colors.foreground, letterSpacing: -0.5 },
  body: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 22, color: colors.mutedForeground, textAlign: 'center' },

  list: { gap: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: spacing.md,
  },
  rowDisabled: { opacity: 0.5 },
  emojiTile: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
  rowEmoji: { fontSize: 24 },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontFamily: fonts.sansMedium, fontSize: 16, color: colors.foreground },
  rowDescription: { fontFamily: fonts.sans, fontSize: 13, color: colors.mutedForeground },
  pricePill: { backgroundColor: colors.primary, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 6 },
  priceText: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.primaryForeground },

  thanks: { alignItems: 'center', gap: spacing.sm },
  thanksTitle: { fontFamily: fonts.serif, fontSize: 22, color: colors.foreground },
  thanksBody: { fontFamily: fonts.sans, fontSize: 15, color: colors.mutedForeground, textAlign: 'center', marginBottom: spacing.sm },

  note: { fontFamily: fonts.sans, fontSize: 12, lineHeight: 18, color: colors.mutedForeground, textAlign: 'center' },
});
