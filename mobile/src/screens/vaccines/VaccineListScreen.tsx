import React, { useLayoutEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Plus } from 'lucide-react-native';
import { RootStackParamList } from '../../app/Navigation';
import { useDeleteVaccine, useVaccines } from '../../hooks/useVaccines';
import { colors } from '../../constants/colors';
import { fonts, spacing } from '../../constants/typography';
import { Header } from '../../components/ui/Header';
import { UpcomingVaccineCard } from '../../components/vaccines/UpcomingVaccineCard';
import { VaccineItem } from '../../components/vaccines/VaccineItem';
import { EmptyState } from '../../components/ui/EmptyState';

type Nav = StackNavigationProp<RootStackParamList>;

export const VaccineListScreen = () => {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const route = useRoute();
  const { catId } = route.params as { catId: string };
  const { data: vaccines, isLoading, refetch, isRefetching } = useVaccines(catId);
  const { mutateAsync: deleteVaccine } = useDeleteVaccine(catId);

  useLayoutEffect(() => {
    nav.setOptions({ headerShown: false });
  }, [nav]);

  const upcoming = vaccines?.filter((v) => !v.isCompleted) ?? [];
  const completed = vaccines?.filter((v) => v.isCompleted) ?? [];

  const handleDelete = (id: string, type: string) => {
    Alert.alert('Aşı Kaydını Sil', `${type} aşısını silmek istediğinize emin misiniz?`, [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => deleteVaccine(id) },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header
        title="Aşılar"
        onBack={() => nav.goBack()}
        right={
          <TouchableOpacity style={styles.addBtn} activeOpacity={0.8} onPress={() => nav.navigate('AddVaccine', { catId })}>
            <Plus size={22} color={colors.primary} strokeWidth={2.5} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing['2xl'] }} />
        ) : !vaccines || vaccines.length === 0 ? (
          <EmptyState
            image={require('../../../assets/cat-walk.png')}
            title="Henüz aşı kaydı yok"
            description="İlk aşı programını ekleyin."
            actionLabel="Aşı Ekle"
            onAction={() => nav.navigate('AddVaccine', { catId })}
          />
        ) : (
          <>
            {upcoming.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Yaklaşan Aşılar</Text>
                {upcoming.map((v) => (
                  <UpcomingVaccineCard
                    key={v.id}
                    vaccine={v}
                    onPress={() => handleDelete(v.id, v.vaccineType)}
                  />
                ))}
              </View>
            )}
            {completed.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Geçmiş Aşılar</Text>
                {completed.map((v) => (
                  <VaccineItem key={v.id} vaccine={v} />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 24, paddingTop: spacing.sm, paddingBottom: spacing['3xl'] },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(196,98,45,0.10)',
  },
  section: { marginBottom: spacing.lg },
  sectionTitle: { fontFamily: fonts.serif, fontSize: 20, color: colors.foreground, letterSpacing: -0.3, marginBottom: spacing.md },
});
