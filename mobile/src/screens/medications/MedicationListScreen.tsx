import React from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../app/Navigation';
import { useDeleteMedication, useMedications, useUpdateMedication } from '../../hooks/useMedications';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/typography';
import { Button } from '../../components/ui/Button';
import { MedicationItem } from '../../components/medications/MedicationItem';
import { EmptyState } from '../../components/ui/EmptyState';
import { cancelMedicationNotifications, scheduleMedicationNotifications } from '../../utils/notifications';

type Nav = StackNavigationProp<RootStackParamList>;

export const MedicationListScreen = () => {
  const nav = useNavigation<Nav>();
  const route = useRoute();
  const { catId, catName } = route.params as { catId: string; catName: string };
  const { data: meds, isLoading, refetch, isRefetching } = useMedications(catId);
  const { mutateAsync: updateMed } = useUpdateMedication(catId);
  const { mutateAsync: deleteMed } = useDeleteMedication(catId);

  const activeMeds = meds?.filter((m) => m.isActive) ?? [];
  const inactiveMeds = meds?.filter((m) => !m.isActive) ?? [];

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
    <View style={styles.container}>
      <View style={styles.addBar}>
        <Button title="+ İlaç Ekle" size="sm" onPress={() => nav.navigate('AddMedication', { catId })} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing['2xl'] }} />
        ) : !meds || meds.length === 0 ? (
          <EmptyState
            emoji="💊"
            title="Henüz ilaç kaydı yok"
            description="İlk ilaç programını ekleyin."
            actionLabel="İlaç Ekle"
            onAction={() => nav.navigate('AddMedication', { catId })}
          />
        ) : (
          <>
            {activeMeds.length > 0 && (
              <View>
                <Text style={styles.sectionTitle}>Aktif İlaçlar</Text>
                {activeMeds.map((med) => (
                  <MedicationItem
                    key={med.id}
                    medication={med}
                    onToggle={(val) => handleToggle(med.id, val)}
                  />
                ))}
              </View>
            )}
            {inactiveMeds.length > 0 && (
              <View>
                <Text style={styles.sectionTitle}>Pasif İlaçlar</Text>
                {inactiveMeds.map((med) => (
                  <MedicationItem key={med.id} medication={med} />
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
  addBar: { padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing['3xl'] },
  sectionTitle: { fontFamily: 'Fraunces_600SemiBold', fontSize: 16, color: colors.text, marginBottom: spacing.md },
});
