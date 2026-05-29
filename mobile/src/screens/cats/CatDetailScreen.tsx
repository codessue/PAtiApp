import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../app/Navigation';
import { useCat, useDeleteCat } from '../../hooks/useCats';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/typography';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { getCatAge, getVaccineUrgencyColor } from '../../utils/dateHelpers';

type Nav = StackNavigationProp<RootStackParamList>;

const TABS = ['Özet', 'Aşılar', 'Kilo', 'İlaçlar'] as const;
type TabKey = typeof TABS[number];

export const CatDetailScreen = () => {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const route = useRoute();
  const { catId } = route.params as { catId: string };
  const { data: cat } = useCat(catId);
  const { mutateAsync: deleteCat } = useDeleteCat();
  const [activeTab, setActiveTab] = useState<TabKey>('Özet');

  if (!cat) return null;

  const handleDelete = () => {
    Alert.alert(
      'Kediyi Sil',
      `${cat.name}'ı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Sil', style: 'destructive', onPress: async () => {
          await deleteCat(cat.id);
          nav.goBack();
        }},
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing['3xl'] }}>
      {/* Profile Header */}
      <View style={styles.header}>
        <Avatar uri={cat.photoUrl} name={cat.name} size={96} />
        <Text style={styles.catName}>{cat.name}</Text>
        <Text style={styles.catDetails}>
          {cat.breed ?? 'Irk bilinmiyor'} · {getCatAge(cat.birthDate)}
          {cat.gender ? ` · ${cat.gender === 'male' ? '♂️ Erkek' : '♀️ Dişi'}` : ''}
        </Text>
        <View style={styles.badges}>
          {cat.isNeutered && (
            <Badge label="Kısırlaştırılmış" color={colors.secondary} backgroundColor={colors.secondaryLight} />
          )}
          {cat.latestWeight && (
            <Badge label={`${cat.latestWeight.toFixed(2)} kg`} color={colors.text} backgroundColor={colors.surfaceAlt} />
          )}
          {cat.nextVaccineDate && (
            <Badge
              label={`💉 ${cat.nextVaccineType}`}
              color={getVaccineUrgencyColor(Math.ceil((new Date(cat.nextVaccineDate).getTime() - Date.now()) / 86400000))}
              backgroundColor={getVaccineUrgencyColor(Math.ceil((new Date(cat.nextVaccineDate).getTime() - Date.now()) / 86400000)) + '20'}
            />
          )}
        </View>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <View style={styles.tabContent}>
        {activeTab === 'Özet' && (
          <View style={styles.actions}>
            <Button title="✏️ Düzenle" variant="outline" onPress={() => nav.navigate('EditCat', { catId: cat.id })} />
            <Button title="💉 Aşılar" variant="outline" onPress={() => nav.navigate('VaccineList', { catId: cat.id, catName: cat.name })} />
            <Button title="⚖️ Kilo" variant="outline" onPress={() => nav.navigate('WeightChart', { catId: cat.id, catName: cat.name })} />
            <Button title="💊 İlaçlar" variant="outline" onPress={() => nav.navigate('MedicationList', { catId: cat.id, catName: cat.name })} />
            <Button title="🗑 Sil" variant="ghost" onPress={handleDelete} style={{ marginTop: spacing.md }} />
          </View>
        )}

        {activeTab === 'Aşılar' && (
          <View style={styles.actions}>
            <Button title="Aşı Geçmişini Görüntüle" onPress={() => nav.navigate('VaccineList', { catId: cat.id, catName: cat.name })} />
            <Button title="+ Aşı Ekle" variant="outline" onPress={() => nav.navigate('AddVaccine', { catId: cat.id })} />
          </View>
        )}

        {activeTab === 'Kilo' && (
          <View style={styles.actions}>
            <Button title="Kilo Grafiğini Görüntüle" onPress={() => nav.navigate('WeightChart', { catId: cat.id, catName: cat.name })} />
            <Button title="+ Kilo Ekle" variant="outline" onPress={() => nav.navigate('AddWeight', { catId: cat.id })} />
          </View>
        )}

        {activeTab === 'İlaçlar' && (
          <View style={styles.actions}>
            <Button title="İlaç Listesini Görüntüle" onPress={() => nav.navigate('MedicationList', { catId: cat.id, catName: cat.name })} />
            <Button title="+ İlaç Ekle" variant="outline" onPress={() => nav.navigate('AddMedication', { catId: cat.id })} />
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { alignItems: 'center', padding: spacing.xl, gap: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  catName: { fontFamily: 'Fraunces_700Bold', fontSize: 28, color: colors.text },
  catDetails: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  tabBar: { flexDirection: 'row', backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, paddingVertical: spacing.md, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.textMuted },
  tabTextActive: { color: colors.primary, fontFamily: 'DMSans_500Medium' },
  tabContent: { padding: spacing.lg },
  actions: { gap: spacing.md },
});
