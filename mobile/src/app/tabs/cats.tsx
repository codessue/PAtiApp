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
import { Plus } from 'lucide-react-native';
import { RootStackParamList } from '../Navigation';
import { useCats } from '../../hooks/useCats';
import { colors } from '../../constants/colors';
import { fonts, radius, spacing } from '../../constants/typography';
import { CatCard } from '../../components/cats/CatCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { Header } from '../../components/ui/Header';

type Nav = StackNavigationProp<RootStackParamList>;

export const CatsScreen = () => {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const { data: cats, isLoading, refetch, isRefetching } = useCats();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title="Kedilerim 🐱" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing['2xl'] }} />
        ) : !cats || cats.length === 0 ? (
          <EmptyState
            image={require('../../../assets/cat-walk.png')}
            title="Henüz kedi eklemediniz"
            description="İlk kedinizi ekleyerek sağlık takibine başlayın."
            actionLabel="Kedi Ekle"
            onAction={() => nav.navigate('AddCat')}
          />
        ) : (
          <>
            {cats.map((cat) => (
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
              <Text style={styles.addLabel}>Yeni Kedi Ekle</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 24, paddingTop: spacing.sm, paddingBottom: spacing['3xl'] },
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
