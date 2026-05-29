import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/authStore';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/typography';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';

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
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
    >
      <Text style={styles.title}>Profil 👤</Text>

      <Card style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <Avatar name={user?.name} size={72} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.settingsCard}>
        <Text style={styles.sectionTitle}>Uygulama</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Versiyon</Text>
          <Text style={styles.infoValue}>1.0.0 (MVP)</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Dil</Text>
          <Text style={styles.infoValue}>Türkçe 🇹🇷</Text>
        </View>
      </Card>

      <Button
        title="Çıkış Yap"
        variant="danger"
        onPress={handleLogout}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing['3xl'] },
  title: { fontFamily: 'Fraunces_700Bold', fontSize: 26, color: colors.text },
  profileCard: { gap: spacing.md },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  profileInfo: { flex: 1 },
  profileName: { fontFamily: 'Fraunces_600SemiBold', fontSize: 20, color: colors.text },
  profileEmail: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.textMuted, marginTop: 2 },
  settingsCard: { gap: spacing.sm },
  sectionTitle: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.xs },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLabel: { fontFamily: 'DMSans_400Regular', fontSize: 15, color: colors.text },
  infoValue: { fontFamily: 'DMSans_400Regular', fontSize: 15, color: colors.textMuted },
});
