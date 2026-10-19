import React from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import { Camera, ChevronRight, Info, LogOut, Settings, Trash2, User } from 'lucide-react-native';
import { RootStackParamList } from '../Navigation';
import { useAuthStore } from '../../stores/authStore';
import { colors } from '../../constants/colors';
import { fonts, radius, spacing } from '../../constants/typography';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Header } from '../../components/ui/Header';
import { persistPickedPhoto } from '../../utils/photoStorage';
import { confirmDeleteAccount } from '../../utils/confirmDeleteAccount';

type Nav = StackNavigationProp<RootStackParamList>;

// Parametresiz üç ayar ekranı; satırlar tek döngüde çiziliyor.
const MENU: { icon: typeof User; label: string; route: 'AccountInfo' | 'AppSettings' | 'Support' }[] = [
  { icon: User, label: 'Hesap Bilgileri', route: 'AccountInfo' },
  { icon: Settings, label: 'Uygulama Ayarları', route: 'AppSettings' },
  { icon: Info, label: 'Yardım ve Destek', route: 'Support' },
];

const getInitials = (name?: string): string =>
  name ? name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) : '🐱';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

export const ProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const { user, logout, deleteAccount, avatarUri, setAvatarUri } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Çıkış Yap', 'Hesabınızdan çıkmak istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Çıkış Yap', style: 'destructive', onPress: logout },
    ]);
  };

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('İzin Gerekli', 'Fotoğraf seçebilmek için galeri erişim izni vermeniz gerekiyor.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      await setAvatarUri(persistPickedPhoto(result.assets[0].uri));
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title="Profil" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Identity */}
        <View style={styles.identity}>
          <TouchableOpacity style={styles.avatarTouch} activeOpacity={0.85} onPress={pickAvatar}>
            <View style={styles.avatarCircle}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarInitials}>{getInitials(user?.name)}</Text>
              )}
            </View>
            <View style={styles.avatarBadge}>
              <Camera size={14} color={colors.primaryForeground} strokeWidth={2.5} />
            </View>
          </TouchableOpacity>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* Food support */}
        <TouchableOpacity style={styles.supportCard} activeOpacity={0.85} onPress={() => nav.navigate('FoodSupport')}>
          <Text style={styles.supportEmoji}>🐈</Text>
          <View style={styles.supportText}>
            <Text style={styles.supportTitle}>Mama Desteği</Text>
            <Text style={styles.supportBody}>Sokak kedilerinin mamasına destek ol</Text>
          </View>
          <ChevronRight size={20} color={colors.primary} />
        </TouchableOpacity>

        {/* Menu */}
        <View style={styles.menu}>
          {MENU.map(({ icon: Icon, label, route }) => (
            <TouchableOpacity key={label} style={styles.menuRow} activeOpacity={0.8} onPress={() => nav.navigate(route)}>
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
            <Text style={styles.infoValue}>{APP_VERSION}</Text>
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

        <TouchableOpacity style={styles.deleteRow} activeOpacity={0.7} onPress={() => confirmDeleteAccount(deleteAccount)}>
          <Trash2 size={16} color={colors.mutedForeground} strokeWidth={2} />
          <Text style={styles.deleteText}>Hesabımı Kalıcı Olarak Sil</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const AVATAR_SIZE = 96;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 24, paddingTop: spacing.sm, gap: spacing.xl, paddingBottom: spacing['3xl'] },

  identity: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  avatarTouch: { width: AVATAR_SIZE, height: AVATAR_SIZE },
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
  avatarBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontFamily: fonts.serif, fontSize: 24, color: colors.foreground, marginTop: spacing.sm },
  email: { fontFamily: fonts.sans, fontSize: 14, color: colors.mutedForeground },

  supportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primaryTint,
    borderWidth: 1,
    borderColor: 'rgba(196,98,45,0.25)',
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: spacing.lg,
  },
  supportEmoji: { fontSize: 32 },
  supportText: { flex: 1, gap: 2 },
  supportTitle: { fontFamily: fonts.serifSemi, fontSize: 18, color: colors.foreground },
  supportBody: { fontFamily: fonts.sans, fontSize: 14, color: colors.mutedForeground },

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

  deleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  deleteText: { fontFamily: fonts.sans, fontSize: 13, color: colors.mutedForeground, textDecorationLine: 'underline' },
});
