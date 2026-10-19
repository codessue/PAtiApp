import React, { useCallback, useLayoutEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Bell, BellOff, Globe, Info, Moon, Syringe } from 'lucide-react-native';
import { useCats } from '../../hooks/useCats';
import {
  cancelDailyDiaryReminder,
  hasNotificationPermission,
  scheduleDailyDiaryReminder,
} from '../../utils/notifications';
import { DIARY_REMINDER_PREF } from '../../constants/app';
import { colors } from '../../constants/colors';
import { fonts, radius, spacing } from '../../constants/typography';
import { Card } from '../../components/ui/Card';
import { Header } from '../../components/ui/Header';

export const AppSettingsScreen = () => {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const { data: cats } = useCats();
  const [dailyReminder, setDailyReminder] = useState(false);
  const [notificationsAllowed, setNotificationsAllowed] = useState(true);

  useLayoutEffect(() => {
    nav.setOptions({ headerShown: false });
  }, [nav]);

  // Kullanıcı sistem ayarlarından izni değiştirip geri dönebilir; her
  // odaklanmada yeniden okuyoruz ki ekran gerçeği göstersin.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      SecureStore.getItemAsync(DIARY_REMINDER_PREF).then((v) => {
        if (active) setDailyReminder(v === '1');
      });
      hasNotificationPermission().then((ok) => {
        if (active) setNotificationsAllowed(ok);
      });
      return () => { active = false; };
    }, [])
  );

  const toggleDailyReminder = async (on: boolean) => {
    if (on) {
      const ok = await scheduleDailyDiaryReminder(cats?.[0]?.name);
      if (!ok) {
        // İzin verilmedi: anahtarı geri al ve durumu tazele.
        setNotificationsAllowed(false);
        return;
      }
      await SecureStore.setItemAsync(DIARY_REMINDER_PREF, '1');
      setDailyReminder(true);
      setNotificationsAllowed(true);
    } else {
      await cancelDailyDiaryReminder();
      await SecureStore.deleteItemAsync(DIARY_REMINDER_PREF);
      setDailyReminder(false);
    }
  };

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title="Uygulama Ayarları" onBack={() => nav.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Bildirimler */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bildirimler</Text>

          {!notificationsAllowed && (
            <TouchableOpacity
              style={styles.warningCard}
              activeOpacity={0.8}
              onPress={() => Linking.openSettings()}
            >
              <View style={styles.warningIcon}>
                <BellOff size={18} color={colors.warning} strokeWidth={2.2} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.warningTitle}>Bildirim izni kapalı</Text>
                <Text style={styles.rowSub}>
                  Aşı, ilaç ve günlük hatırlatmaları gönderilemiyor. Açmak için dokunun.
                </Text>
              </View>
            </TouchableOpacity>
          )}

          <Card style={styles.rowCard}>
            <View style={styles.row}>
              <View style={styles.rowIcon}>
                <Moon size={18} color={colors.primary} strokeWidth={2.2} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>Akşam günlük hatırlatması</Text>
                <Text style={styles.rowSub}>Her akşam 20:30&apos;da nazikçe hatırlatalım</Text>
              </View>
              <Switch
                value={dailyReminder}
                onValueChange={toggleDailyReminder}
                trackColor={{ false: colors.muted, true: colors.primary }}
                thumbColor={colors.card}
              />
            </View>

            <View style={[styles.row, styles.rowLast]}>
              <View style={styles.rowIcon}>
                <Syringe size={18} color={colors.primary} strokeWidth={2.2} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>Aşı ve ilaç hatırlatmaları</Text>
                <Text style={styles.rowSub}>
                  Kayıt eklediğinizde otomatik kurulur; kaydı silince kalkar.
                </Text>
              </View>
            </View>
          </Card>

          <TouchableOpacity style={styles.linkRow} activeOpacity={0.75} onPress={() => Linking.openSettings()}>
            <Bell size={16} color={colors.primary} strokeWidth={2.2} />
            <Text style={styles.linkText}>Sistem bildirim ayarlarını aç</Text>
          </TouchableOpacity>
        </View>

        {/* Genel */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Genel</Text>
          <Card style={styles.rowCard}>
            <View style={styles.row}>
              <View style={styles.rowIcon}>
                <Globe size={18} color={colors.primary} strokeWidth={2.2} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>Dil</Text>
                <Text style={styles.rowSub}>Şimdilik yalnızca Türkçe</Text>
              </View>
              <Text style={styles.rowValue}>Türkçe</Text>
            </View>

            <View style={[styles.row, styles.rowLast]}>
              <View style={styles.rowIcon}>
                <Info size={18} color={colors.primary} strokeWidth={2.2} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>Sürüm</Text>
              </View>
              <Text style={styles.rowValue}>{appVersion}</Text>
            </View>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 24, paddingTop: spacing.sm, gap: spacing.xl, paddingBottom: spacing['3xl'] },

  section: { gap: spacing.md },
  sectionTitle: { fontFamily: fonts.serifSemi, fontSize: 18, color: colors.foreground },

  rowCard: { gap: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLast: { borderBottomWidth: 0 },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.foreground },
  rowSub: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, color: colors.mutedForeground },
  rowValue: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.mutedForeground },

  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.warningTint,
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: radius.xl,
    padding: 16,
  },
  warningIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningTitle: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.foreground },

  linkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  linkText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.primary },
});
