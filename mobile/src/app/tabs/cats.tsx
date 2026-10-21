import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Camera, CheckCircle2, ImagePlus, PawPrint, Plus, Syringe } from 'lucide-react-native';
import { RootStackParamList } from '../Navigation';
import { useCats } from '../../hooks/useCats';
import { useAuthStore } from '../../stores/authStore';
import { colors } from '../../constants/colors';
import { fonts, radius, shadow, spacing } from '../../constants/typography';
import { CatCard } from '../../components/cats/CatCard';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState } from '../../components/ui/EmptyState';
import { illustrations } from '../../constants/illustrations';
import { ErrorState } from '../../components/ui/ErrorState';
import { Cat } from '../../types';
import { persistPickedPhoto } from '../../utils/photoStorage';

type Nav = StackNavigationProp<RootStackParamList>;

const isOverdue = (cat: Cat): boolean => {
  if (!cat.nextVaccineDate) return false;
  return Math.ceil((new Date(cat.nextVaccineDate).getTime() - Date.now()) / 86400000) < 0;
};

export const CatsScreen = () => {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const { data: cats, isLoading, isError, refetch, isRefetching } = useCats();
  const { coverUri, setCoverUri } = useAuthStore();

  const pickCover = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('İzin Gerekli', 'Fotoğraf seçebilmek için galeri erişim izni vermeniz gerekiyor.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 10],
      quality: 0.85,
    });
    if (!result.canceled && result.assets.length > 0) {
      await setCoverUri(persistPickedPhoto(result.assets[0].uri));
    }
  };

  const list = cats ?? [];
  const total = list.length;
  const healthy = list.filter((c) => !isOverdue(c)).length;
  const tracked = list.filter((c) => !!c.nextVaccineDate).length;
  const coverCaption = total > 0 ? `${total} tüylü dostun` : 'Tüylü ailen';

  const stats = [
    { icon: PawPrint, value: total, label: 'Dost', color: colors.primary, tint: colors.primaryTint },
    { icon: CheckCircle2, value: healthy, label: 'Sağlıklı', color: colors.success, tint: colors.successTint },
    { icon: Syringe, value: tracked, label: 'Aşı Takibi', color: colors.warning, tint: colors.warningTint },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
      >
        <Text style={styles.title}>Dostlarım</Text>
        <Text style={styles.subtitle}>Sevimli ailenin sağlık merkezi</Text>

        {/* Customizable cover photo */}
        <TouchableOpacity style={styles.cover} activeOpacity={0.9} onPress={pickCover}>
          {coverUri ? (
            <>
              <Image source={{ uri: coverUri }} style={styles.coverImage} resizeMode="cover" />
              <LinearGradient
                colors={['transparent', 'rgba(28,26,24,0.6)']}
                style={styles.coverGradient}
                pointerEvents="none"
              />
              <Text style={styles.coverCaption}>{coverCaption}</Text>
              {total > 0 && (
                <View style={styles.coverAvatars}>
                  {list.slice(0, 4).map((cat, i) => (
                    <Avatar
                      key={cat.id}
                      uri={cat.photoUrl}
                      name={cat.name}
                      size={38}
                      style={{ borderWidth: 2, borderColor: '#fff', marginLeft: i === 0 ? 0 : -12 }}
                    />
                  ))}
                  {total > 4 && (
                    <View style={styles.coverMore}>
                      <Text style={styles.coverMoreText}>+{total - 4}</Text>
                    </View>
                  )}
                </View>
              )}
            </>
          ) : (
            <View style={styles.coverPlaceholder}>
              <View style={styles.coverIconCircle}>
                <ImagePlus size={26} color={colors.primary} strokeWidth={2} />
              </View>
              <Text style={styles.coverPlaceholderText}>Kapak fotoğrafı ekle</Text>
              <Text style={styles.coverPlaceholderHint}>Dostlarınla bir anınızı seçin</Text>
            </View>
          )}
          <View style={styles.coverBadge}>
            <Camera size={16} color={colors.primaryForeground} strokeWidth={2.5} />
          </View>
        </TouchableOpacity>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing['2xl'] }} />
        ) : isError && total === 0 ? (
          <ErrorState onRetry={refetch} retrying={isRefetching} />
        ) : total === 0 ? (
          <EmptyState
            image={illustrations.dostlar}
            title="Henüz dost eklemedin"
            description="İlk dostunu ekleyerek sağlık takibine başla."
            actionLabel="Dost Ekle"
            onAction={() => nav.navigate('AddCat')}
          />
        ) : (
          <>
            {/* Stat summary */}
            <View style={styles.statRow}>
              {stats.map((s) => (
                <View key={s.label} style={styles.statCard}>
                  <View style={[styles.statIcon, { backgroundColor: s.tint }]}>
                    <s.icon size={18} color={s.color} strokeWidth={2.4} />
                  </View>
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Section header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Ailem</Text>
              <View style={styles.countPill}>
                <Text style={styles.countPillText}>{total}</Text>
              </View>
            </View>

            {list.map((cat) => (
              <CatCard
                key={cat.id}
                cat={cat}
                onPress={() => nav.navigate('CatDetail', { catId: cat.id })}
              />
            ))}

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => nav.navigate('AddCat')}
              style={styles.addButton}
            >
              <Plus size={22} color={colors.primary} strokeWidth={2.5} />
              <Text style={styles.addLabel}>Yeni Dost Ekle</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const COVER_HEIGHT = 200;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 24, paddingTop: spacing.md, paddingBottom: spacing['3xl'] },

  title: { fontFamily: fonts.serif, fontSize: 30, color: colors.foreground, letterSpacing: -0.6 },
  subtitle: { fontFamily: fonts.sans, fontSize: 15, color: colors.mutedForeground, marginTop: 2, marginBottom: spacing.lg },

  cover: {
    height: COVER_HEIGHT,
    borderRadius: radius['3xl'],
    overflow: 'hidden',
    backgroundColor: colors.muted,
    marginBottom: spacing.lg,
  },
  coverImage: { width: '100%', height: '100%' },
  coverGradient: { position: 'absolute', left: 0, right: 0, bottom: 0, height: COVER_HEIGHT * 0.6 },
  coverCaption: {
    position: 'absolute',
    left: spacing.lg,
    bottom: spacing.lg,
    fontFamily: fonts.serif,
    fontSize: 20,
    color: '#fff',
  },
  coverAvatars: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  coverMore: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(28,26,24,0.55)',
    borderWidth: 2, borderColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    marginLeft: -12,
  },
  coverMoreText: { fontFamily: fonts.sansBold, fontSize: 12, color: '#fff' },
  coverPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(212,165,160,0.18)',
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: radius['3xl'],
  },
  coverIconCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  coverPlaceholderText: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.foreground },
  coverPlaceholderHint: { fontFamily: fonts.sans, fontSize: 13, color: colors.mutedForeground },
  coverBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.background,
  },

  statRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: 2,
    ...shadow.card,
  },
  statIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  statValue: { fontFamily: fonts.serif, fontSize: 22, color: colors.foreground },
  statLabel: { fontFamily: fonts.sans, fontSize: 12, color: colors.mutedForeground },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  sectionTitle: { fontFamily: fonts.serif, fontSize: 20, color: colors.foreground, letterSpacing: -0.3 },
  countPill: {
    minWidth: 24, height: 24, borderRadius: 12, paddingHorizontal: 8,
    backgroundColor: colors.primaryTint,
    alignItems: 'center', justifyContent: 'center',
  },
  countPillText: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.primary },

  addButton: {
    height: 88,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(196,98,45,0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  addLabel: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.primary },
});
