import React from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../Navigation';
import { useCats } from '../../hooks/useCats';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/typography';
import { CatCard } from '../../components/cats/CatCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';

type Nav = StackNavigationProp<RootStackParamList>;

export const CatsScreen = () => {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const { data: cats, isLoading, refetch, isRefetching } = useCats();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Kedilerim 🐱</Text>
        <Button title="+ Ekle" variant="outline" size="sm" onPress={() => nav.navigate('AddCat')} />
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing['2xl'] }} />
      ) : !cats || cats.length === 0 ? (
        <EmptyState
          emoji="🐱"
          title="Henüz kedi eklemediniz"
          description="İlk kedinizi ekleyerek sağlık takibine başlayın."
          actionLabel="Kedi Ekle"
          onAction={() => nav.navigate('AddCat')}
        />
      ) : (
        cats.map((cat) => (
          <CatCard
            key={cat.id}
            cat={cat}
            onPress={() => nav.navigate('CatDetail', { catId: cat.id })}
          />
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing['3xl'] },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  title: { fontFamily: 'Fraunces_700Bold', fontSize: 26, color: colors.text },
});
