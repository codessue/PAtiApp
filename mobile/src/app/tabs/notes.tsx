import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Bell, Pin, Plus } from 'lucide-react-native';
import { RootStackParamList } from '../Navigation';
import { useNotesStore } from '../../stores/notesStore';
import { useCats } from '../../hooks/useCats';
import { colors } from '../../constants/colors';
import { fonts, radius, shadow, spacing } from '../../constants/typography';
import { getNoteCategory } from '../../constants/noteCategories';
import { EmptyState } from '../../components/ui/EmptyState';
import { Note } from '../../types';
import { formatRelativeDateTime } from '../../utils/dateHelpers';

type Nav = StackNavigationProp<RootStackParamList>;

const isUpcoming = (n: Note): boolean =>
  !!n.reminderAt && new Date(n.reminderAt).getTime() > Date.now();

export const NotesScreen = () => {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const { notes, loaded, load, togglePin } = useNotesStore();
  const { data: cats } = useCats();
  const [filterCatId, setFilterCatId] = useState<string | null>(null);

  useEffect(() => {
    if (!loaded) load();
  }, [loaded, load]);

  // Re-read on focus so edits/additions from the editor are reflected.
  useFocusEffect(
    React.useCallback(() => {
      load();
    }, [load])
  );

  const catName = (id?: string) => cats?.find((c) => c.id === id)?.name;

  const visible = useMemo(
    () => (filterCatId ? notes.filter((n) => n.catId === filterCatId) : notes),
    [notes, filterCatId]
  );

  const upcoming = useMemo(
    () =>
      [...notes]
        .filter(isUpcoming)
        .sort((a, b) => a.reminderAt!.localeCompare(b.reminderAt!))
        .slice(0, 3),
    [notes]
  );

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Notlar</Text>
        <Text style={styles.subtitle}>Aklındakileri yaz, hatırlatıcı kur, unutma</Text>

        {/* Cat filter chips */}
        {cats && cats.length > 0 && notes.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            <FilterChip label="Tümü" active={filterCatId === null} onPress={() => setFilterCatId(null)} />
            {cats.map((c) => (
              <FilterChip
                key={c.id}
                label={c.name}
                active={filterCatId === c.id}
                onPress={() => setFilterCatId(c.id)}
              />
            ))}
          </ScrollView>
        )}

        {/* Upcoming reminders strip */}
        {upcoming.length > 0 && filterCatId === null && (
          <View style={styles.reminderBlock}>
            <View style={styles.reminderHeader}>
              <Bell size={16} color={colors.primary} strokeWidth={2.4} />
              <Text style={styles.reminderHeaderText}>Yaklaşan Hatırlatıcılar</Text>
            </View>
            {upcoming.map((n) => (
              <Pressable
                key={n.id}
                onPress={() => nav.navigate('NoteEditor', { noteId: n.id })}
                style={({ pressed }) => [styles.reminderRow, pressed && styles.pressed]}
              >
                <View style={styles.reminderDot} />
                <Text style={styles.reminderTitle} numberOfLines={1}>
                  {n.title || 'Başlıksız not'}
                </Text>
                <Text style={styles.reminderWhen}>{formatRelativeDateTime(n.reminderAt!)}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Notes list / empty state */}
        {loaded && notes.length === 0 ? (
          <EmptyState
            emoji="📝"
            title="Henüz not yok"
            description="İlk notunu ekle — bir gözlem, veteriner sorusu ya da hatırlatma."
            actionLabel="Not Ekle"
            onAction={() => nav.navigate('NoteEditor', {})}
          />
        ) : visible.length === 0 ? (
          <View style={styles.emptyFilter}>
            <Text style={styles.emptyFilterText}>Bu kedi için not yok.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {visible.map((n) => (
              <NoteCard
                key={n.id}
                note={n}
                catName={catName(n.catId)}
                onPress={() => nav.navigate('NoteEditor', { noteId: n.id })}
                onTogglePin={() => togglePin(n.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating add button */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => nav.navigate('NoteEditor', filterCatId ? { catId: filterCatId } : {})}
        style={[styles.fab, { bottom: spacing.xl }]}
      >
        <Plus size={26} color={colors.primaryForeground} strokeWidth={2.6} />
      </TouchableOpacity>
    </View>
  );
};

const FilterChip = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    style={[styles.chip, active ? styles.chipActive : styles.chipIdle]}
  >
    <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
      {label}
    </Text>
  </TouchableOpacity>
);

const NoteCard = ({
  note,
  catName,
  onPress,
  onTogglePin,
}: {
  note: Note;
  catName?: string;
  onPress: () => void;
  onTogglePin: () => void;
}) => {
  const cat = getNoteCategory(note.category);
  const CatIcon = cat.icon;
  const upcoming = isUpcoming(note);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, { borderLeftColor: cat.color }, pressed && styles.pressed]}
    >
      <View style={styles.cardTop}>
        <View style={[styles.cardIcon, { backgroundColor: cat.tint }]}>
          <CatIcon size={18} color={cat.color} strokeWidth={2.2} />
        </View>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {note.title || 'Başlıksız not'}
        </Text>
        <TouchableOpacity
          onPress={onTogglePin}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel={note.pinned ? 'Sabitlemeyi kaldır' : 'Sabitle'}
        >
          <Pin
            size={18}
            color={note.pinned ? colors.primary : colors.mutedForeground}
            fill={note.pinned ? colors.primary : 'transparent'}
            strokeWidth={2}
          />
        </TouchableOpacity>
      </View>

      {note.body ? (
        <Text style={styles.cardBody} numberOfLines={2}>
          {note.body}
        </Text>
      ) : null}

      {(catName || note.reminderAt) && (
        <View style={styles.cardFooter}>
          {catName ? (
            <View style={styles.tag}>
              <Text style={styles.tagText}>🐾 {catName}</Text>
            </View>
          ) : null}
          {note.reminderAt ? (
            <View style={[styles.tag, upcoming ? styles.tagReminder : styles.tagReminderPast]}>
              <Bell size={12} color={upcoming ? colors.primary : colors.mutedForeground} strokeWidth={2.4} />
              <Text style={[styles.tagText, upcoming && styles.tagTextReminder]}>
                {formatRelativeDateTime(note.reminderAt)}
              </Text>
            </View>
          ) : null}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 24, paddingBottom: 120, gap: spacing.lg },

  title: { fontFamily: fonts.serif, fontSize: 30, color: colors.foreground, letterSpacing: -0.6 },
  subtitle: { fontFamily: fonts.sans, fontSize: 15, color: colors.mutedForeground, marginTop: 2 },

  chips: { gap: spacing.sm, paddingVertical: spacing.xs },
  chip: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full, maxWidth: 160 },
  chipActive: { backgroundColor: colors.primary },
  chipIdle: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  chipText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.foreground },
  chipTextActive: { color: colors.primaryForeground },

  reminderBlock: {
    backgroundColor: colors.primaryTint,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  reminderHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 2 },
  reminderHeaderText: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.primary },
  reminderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 6 },
  reminderDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary },
  reminderTitle: { flex: 1, fontFamily: fonts.sansMedium, fontSize: 14, color: colors.foreground },
  reminderWhen: { fontFamily: fonts.sans, fontSize: 12, color: colors.mutedForeground },

  list: { gap: spacing.md },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadow.card,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardIcon: { width: 32, height: 32, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { flex: 1, fontFamily: fonts.sansBold, fontSize: 16, color: colors.foreground },
  cardBody: { fontFamily: fonts.sans, fontSize: 14, color: colors.mutedForeground, lineHeight: 20 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap', marginTop: 2 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.muted,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  tagReminder: { backgroundColor: colors.primaryTint },
  tagReminderPast: { backgroundColor: colors.muted },
  tagText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.mutedForeground },
  tagTextReminder: { color: colors.primary },

  emptyFilter: { paddingVertical: spacing['2xl'], alignItems: 'center' },
  emptyFilterText: { fontFamily: fonts.sans, fontSize: 14, color: colors.mutedForeground },

  fab: {
    position: 'absolute',
    right: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
});
