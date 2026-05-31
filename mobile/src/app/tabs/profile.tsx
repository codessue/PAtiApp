import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, Info, LogOut, Settings, User } from 'lucide-react-native';
import { useAuthStore } from '../../stores/authStore';
import { colors } from '../../constants/colors';
import { fonts, radius, spacing } from '../../constants/typography';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Header } from '../../components/ui/Header';

const MENU = [
  { icon: User, label: 'Hesap Bilgileri' },
  { icon: Settings, label: 'Uygulama Ayarları' },
  { icon: Info, label: 'Yardım ve Destek' },
] as const;

export const ProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Çıkış Yap', 'Hesabınızdan çıkmak istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Çıkış Yap', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title="Profil" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Identity */}
        <View style={styles.identity}>
          <Avatar name={user?.name} size={96} style={styles.avatar} />
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* Menu */}
        <View style={styles.menu}>
          {MENU.map(({ icon: Icon, label }) => (
            <TouchableOpacity key={label} style={styles.menuRow} activeOpacity={0.8}>
              <View style={styles.menuIcon}>
                <Icon size={20} color={colors.primary} strokeWidth={2.2} />
              </View>
              <Text style={styles.menuLabel}>{label}</Text>
              <ChevronRight size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </View>

        {/* App info */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Versiyon</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={[styles.infoRow, styles.infoRowLast]}>
            <Text style={styles.infoLabel}>Dil</Text>
            <Text style={styles.infoValue}>Türkçe</Text>
          </View>
        </Card>

        <Button
          title="Çıkış Yap"
          variant="danger"
          onPress={handleLogout}
          icon={<LogOut size={20} color={colors.destructive} strokeWidth={2.2} />}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 24, paddingTop: spacing.sm, gap: spacing.xl, paddingBottom: spacing['3xl'] },

  identity: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  avatar: { backgroundColor: colors.accent, borderWidth: 2, borderColor: colors.card },
  name: { fontFamily: fonts.serif, fontSize: 24, color: colors.foreground, marginTop: spacing.sm },
  email: { fontFamily: fonts.sans, fontSize: 14, color: colors.mutedForeground },

  menu: { gap: spacing.md },
  menuRow: {
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
  menuIcon: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontFamily: fonts.sansMedium, fontSize: 16, color: colors.foreground },

  infoCard: { gap: 0 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoRowLast: { borderBottomWidth: 0 },
  infoLabel: { fontFamily: fonts.sans, fontSize: 15, color: colors.foreground },
  infoValue: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.mutedForeground },
});
