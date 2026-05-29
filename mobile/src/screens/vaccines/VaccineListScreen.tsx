import React from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../app/Navigation';
import { useDeleteVaccine, useVaccines } from '../../hooks/useVaccines';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/typography';
import { Button } from '../../components/ui/Button';
import { VaccineItem } from '../../components/vaccines/VaccineItem';
import { EmptyState } from '../../components/ui/EmptyState';

type Nav = StackNavigationProp<RootStackParamList>;

export const VaccineListScreen = () => {
  const nav = useNavigation<Nav>();
  const route = useRoute();
  const { catId } = route.params as { catId: string };
  const { data: vaccines, isLoading, refetch, isRefetching } = useVaccines(catId);
  const { mutateAsync: deleteVaccine } = useDeleteVaccine(catId);

  const upcoming = vaccines?.filter((v) => !v.isCompleted) ?? [];
  const completed = vaccines?.filter((v) => v.isCompleted) ?? [];

  const handleDelete = (id: string, type: string) => {
    Alert.alert('Aşı Kaydını Sil', `${type} aşısını silmek istediğinize emin misiniz?`, [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => deleteVaccine(id) },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.addBar}>
        <Button title="+ Aşı Ekle" variant="primary" size="sm" onPress={() => nav.navigate('AddVaccine', { catId })} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing['2xl'] }} />
        ) : !vaccines || vaccines.length === 0 ? (
          <EmptyState
            emoji="💉"
            title="Henüz aşı kaydı yok"
            description="İlk aşı programını ekleyin."
            actionLabel="Aşı Ekle"
            onAction={() => nav.navigate('AddVaccine', { catId })}
          />
        ) : (
          <>
            {upcoming.length > 0 && (
              <View>
                <Text style={styles.sectionTitle}>Yaklaşan Aşılar ({upcoming.length})</Text>
                {upcoming.map((v) => (
                  <VaccineItem
                    key={v.id}
                    vaccine={v}
                    onPress={() => handleDelete(v.id, v.vaccineType)}
                  />
                ))}
              </View>
            )}
            {completed.length > 0 && (
              <View>
                <Text style={styles.sectionTitle}>Tamamlanan Aşılar ({completed.length})</Text>
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
  addBar: { padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing['3xl'] },
  sectionTitle: { fontFamily: 'Fraunces_600SemiBold', fontSize: 16, color: colors.text, marginBottom: spacing.md },
});
