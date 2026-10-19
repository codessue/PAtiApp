import React, { useLayoutEffect } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Cloud, Smartphone, Trash2 } from 'lucide-react-native';
import { useAuthStore } from '../../stores/authStore';
import { useCats } from '../../hooks/useCats';
import { colors } from '../../constants/colors';
import { fonts, radius, spacing } from '../../constants/typography';
import { Card } from '../../components/ui/Card';
import { Header } from '../../components/ui/Header';
import { confirmDeleteAccount } from '../../utils/confirmDeleteAccount';

const getInitials = (name?: string): string =>
  name ? name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) : '🐾';

/** UUID'nin tamamı destek yazışmasında işe yaramıyor; ilk bloğu yeterli. */
const shortId = (id?: string): string => (id ? id.split('-')[0].toUpperCase() : '—');

export const AccountInfoScreen = () => {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const { user, avatarUri, deleteAccount } = useAuthStore();
  const { data: cats } = useCats();

  useLayoutEffect(() => {
    nav.setOptions({ headerShown: false });
  }, [nav]);

  const catCount = cats?.length ?? 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title="Hesap Bilgileri" onBack={() => nav.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Kimlik */}
        <View style={styles.identity}>
          <View style={styles.avatarCircle}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarInitials}>{getInitials(user?.name)}</Text>
            )}
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* Hesap alanları */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hesap</Text>
          <Card style={styles.rowCard}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Ad Soyad</Text>
              <Text style={styles.rowValue}>{user?.name ?? '—'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>E-posta</Text>
              <Text style={styles.rowValue} numberOfLines={1}>{user?.email ?? '—'}</Text>
            </View>
            <View style={[styles.row, styles.rowLast]}>
              <Text style={styles.rowLabel}>Hesap No</Text>
              <Text style={styles.rowValueMono}>{shortId(user?.id)}</Text>
            </View>
          </Card>
        </View>

        {/* Verilerin nerede durduğu — silme kararını bilinçli vermek için. */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verileriniz</Text>
          <Card style={styles.dataCard}>
            <View style={styles.dataRow}>
              <View style={styles.dataIcon}>
                <Cloud size={18} color={colors.primary} strokeWidth={2.2} />
              </View>
              <View style={styles.dataText}>
                <Text style={styles.dataTitle}>Dostlarınız ve sağlık kayıtları</Text>
                <Text style={styles.dataBody}>
                  {catCount > 0
                    ? `${catCount} dost, aşı, ilaç ve kilo kayıtlarıyla birlikte hesabınızda saklanıyor.`
                    : 'Henüz dost eklenmemiş. Eklediğinizde kayıtlar hesabınızda saklanır.'}
                </Text>
              </View>
            </View>
            <View style={[styles.dataRow, styles.dataRowLast]}>
              <View style={styles.dataIcon}>
                <Smartphone size={18} color={colors.primary} strokeWidth={2.2} />
              </View>
              <View style={styles.dataText}>
                <Text style={styles.dataTitle}>Günlük notlarınız</Text>
                <Text style={styles.dataBody}>
                  Yalnızca bu cihazda saklanıyor, sunucuya hiç gönderilmiyor.
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {/* App Store 5.1.1(v) — hesap silme uygulama içinden erişilebilir olmalı. */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tehlikeli Bölge</Text>
          <TouchableOpacity
            style={styles.dangerCard}
            activeOpacity={0.8}
            onPress={() => confirmDeleteAccount(deleteAccount)}
          >
            <View style={styles.dangerIcon}>
              <Trash2 size={18} color={colors.destructive} strokeWidth={2.2} />
            </View>
            <View style={styles.dataText}>
              <Text style={styles.dangerTitle}>Hesabımı Kalıcı Olarak Sil</Text>
              <Text style={styles.dataBody}>
                Hesabınız, dostlarınız, tüm sağlık kayıtlarınız ve bu cihazdaki
                notlarınız kalıcı olarak silinir. Geri alınamaz.
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const AVATAR_SIZE = 88;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 24, paddingTop: spacing.sm, gap: spacing.xl, paddingBottom: spacing['3xl'] },

  identity: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.md },
  avatarCircle: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: 'hidden',
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarInitials: { fontFamily: fonts.sansMedium, fontSize: AVATAR_SIZE * 0.36, color: colors.accentForeground },
  name: { fontFamily: fonts.serif, fontSize: 22, color: colors.foreground, marginTop: spacing.sm },
  email: { fontFamily: fonts.sans, fontSize: 14, color: colors.mutedForeground },

  section: { gap: spacing.md },
  sectionTitle: { fontFamily: fonts.serifSemi, fontSize: 18, color: colors.foreground },

  rowCard: { gap: 0 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: { fontFamily: fonts.sans, fontSize: 15, color: colors.mutedForeground },
  rowValue: { flexShrink: 1, fontFamily: fonts.sansMedium, fontSize: 15, color: colors.foreground, textAlign: 'right' },
  rowValueMono: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.foreground, letterSpacing: 1 },

  dataCard: { gap: 0 },
  dataRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dataRowLast: { borderBottomWidth: 0 },
  dataIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dataText: { flex: 1, gap: 2 },
  dataTitle: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.foreground },
  dataBody: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, color: colors.mutedForeground },

  dangerCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.destructiveTint,
    borderWidth: 1,
    borderColor: colors.destructive,
    borderRadius: radius.xl,
    padding: 16,
  },
  dangerIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerTitle: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.destructive },
});
