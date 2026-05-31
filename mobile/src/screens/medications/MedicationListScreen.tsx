import React, { useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { useMedications, useUpdateMedication } from '../../hooks/useMedications';
import { colors } from '../../constants/colors';
import { fonts, radius, spacing } from '../../constants/typography';
import { Header } from '../../components/ui/Header';
import { MedicationItem } from '../../components/medications/MedicationItem';
import { EmptyState } from '../../components/ui/EmptyState';
import { cancelMedicationNotifications, scheduleMedicationNotifications } from '../../utils/notifications';

type Nav = StackNavigationProp<RootStackParamList>;
type Segment = 'active' | 'history';

export const MedicationListScreen = () => {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const route = useRoute();
  const { catId, catName } = route.params as { catId: string; catName: string };
  const { data: meds, isLoading, refetch, isRefetching } = useMedications(catId);
  const { mutateAsync: updateMed } = useUpdateMedication(catId);
  const [segment, setSegment] = useState<Segment>('active');

  useLayoutEffect(() => {
    nav.setOptions({ headerShown: false });
  }, [nav]);

  const activeMeds = meds?.filter((m) => m.isActive) ?? [];
  const inactiveMeds = meds?.filter((m) => !m.isActive) ?? [];
  const shown = segment === 'active' ? activeMeds : inactiveMeds;

  const handleToggle = async (id: string, isActive: boolean) => {
    const med = meds?.find((m) => m.id === id);
    if (!med) return;
    const updated = { ...med, isActive };
    await updateMed({ id, data: updated });
    if (isActive) {
      await scheduleMedicationNotifications({ ...updated, catName });
    } else {
      await cancelMedicationNotifications(id);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header
        title="İlaçlar"
        onBack={() => nav.goBack()}
        right={
          <TouchableOpacity style={styles.addBtn} activeOpacity={0.8} onPress={() => nav.navigate('AddMedication', { catId })}>
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
        ) : !meds || meds.length === 0 ? (
          <EmptyState
            image={require('../../../assets/cat-walk.png')}
            title="Henüz ilaç kaydı yok"
            description="İlk ilaç programını ekleyin."
            actionLabel="İlaç Ekle"
            onAction={() => nav.navigate('AddMedication', { catId })}
          />
        ) : (
          <>
            {/* Segmented toggle */}
            <View style={styles.segment}>
              {([['active', 'Aktif'], ['history', 'Geçmiş']] as const).map(([key, label]) => {
                const selected = segment === key;
                return (
                  <TouchableOpacity
                    key={key}
                    activeOpacity={0.85}
                    onPress={() => setSegment(key)}
                    style={[styles.segmentBtn, selected && styles.segmentBtnActive]}
                  >
                    <Text style={[styles.segmentText, selected && styles.segmentTextActive]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {shown.length === 0 ? (
              <Text style={styles.emptyLine}>
                {segment === 'active' ? 'Aktif ilaç yok.' : 'Geçmiş ilaç yok.'}
              </Text>
            ) : (
              shown.map((med) => (
                <MedicationItem
                  key={med.id}
                  medication={med}
                  onToggle={segment === 'active' ? (val) => handleToggle(med.id, val) : undefined}
                />
              ))
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
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.muted,
    borderRadius: radius.lg,
    padding: 4,
    marginBottom: spacing.lg,
  },
  segmentBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md, alignItems: 'center' },
  segmentBtnActive: {
    backgroundColor: colors.card,
    shadowColor: '#1C1A18',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  segmentText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.mutedForeground },
  segmentTextActive: { color: colors.foreground, fontFamily: fonts.sansBold },
  emptyLine: { fontFamily: fonts.sans, fontSize: 14, color: colors.mutedForeground, textAlign: 'center', marginTop: spacing.xl },
});
