import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Bell, BellRing, Pin, Plus } from 'lucide-react-native';
import { RootStackParamList } from '../Navigation';
import { DIARY_REMINDER_PREF } from '../../constants/app';
import { useNotesStore } from '../../stores/notesStore';
import { useCats } from '../../hooks/useCats';
import { colors } from '../../constants/colors';
import { fonts, radius, shadow, spacing } from '../../constants/typography';
import { getNoteCategory } from '../../constants/noteCategories';
import { getMood } from '../../constants/moods';
import { EmptyState } from '../../components/ui/EmptyState';
import { Note } from '../../types';
import { formatDate, formatRelativeDateTime } from '../../utils/dateHelpers';
import {
  cancelDailyDiaryReminder,
  scheduleDailyDiaryReminder,
} from '../../utils/notifications';

type Nav = StackNavigationProp<RootStackParamList>;
type ViewMode = 'gunluk' | 'liste';


const isUpcoming = (n: Note): boolean =>
  !!n.reminderAt && new Date(n.reminderAt).getTime() > Date.now();

const dayLabel = (iso: string): string => {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86400000);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay(d, today)) return 'Bugün';
  if (sameDay(d, yesterday)) return 'Dün';
  return formatDate(d);
};

const timeLabel = (iso: string): string => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export const NotesScreen = () => {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const { notes, loaded, load, togglePin } = useNotesStore();
  const { data: cats } = useCats();
  const [filterCatId, setFilterCatId] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>('gunluk');
  const [dailyReminder, setDailyReminder] = useState(false);

  useEffect(() => {
    if (!loaded) load();
    SecureStore.getItemAsync(DIARY_REMINDER_PREF).then((v) => setDailyReminder(v === '1'));
  }, [loaded, load]);

  // Re-read on focus so edits/additions from the editor are reflected.
  useFocusEffect(
    React.useCallback(() => {
      load();
    }, [load])
  );

  const toggleDailyReminder = async (on: boolean) => {
    if (on) {
      const ok = await scheduleDailyDiaryReminder(cats?.[0]?.name);
      if (!ok) return; // izin verilmedi
      await SecureStore.setItemAsync(DIARY_REMINDER_PREF, '1');
      setDailyReminder(true);
    } else {
      await cancelDailyDiaryReminder();
      await SecureStore.deleteItemAsync(DIARY_REMINDER_PREF);
      setDailyReminder(false);
    }
  };

  const catName = (id?: string) => cats?.find((c) => c.id === id)?.name;

  const visible = useMemo(
    () => (filterCatId ? notes.filter((n) => n.catId === filterCatId) : notes),
    [notes, filterCatId]
  );

  // Günlük görünümü: en yeni en üstte, gün başlıklarıyla gruplu.
  const timeline = useMemo(() => {
    const sorted = [...visible].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const groups: { label: string; items: Note[] }[] = [];
    for (const n of sorted) {
      const label = dayLabel(n.createdAt);
      const last = groups[groups.length - 1];
      if (last && last.label === label) last.items.push(n);
      else groups.push({ label, items: [n] });
    }
    return groups;
  }, [visible]);

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
        <Text style={styles.title}>Günlük</Text>
        <Text style={styles.subtitle}>Anılar, notlar ve hatırlatıcılar</Text>

        {/* View toggle */}
        <View style={styles.viewToggle}>
          {(['gunluk', 'liste'] as const).map((v) => (
            <TouchableOpacity
              key={v}
              activeOpacity={0.85}
              onPress={() => setView(v)}
              style={[styles.viewBtn, view === v && styles.viewBtnActive]}
            >
              <Text style={[styles.viewBtnText, view === v && styles.viewBtnTextActive]}>
                {v === 'gunluk' ? 'Zaman Çizelgesi' : 'Liste'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

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

        {/* Daily diary reminder toggle */}
        <View style={styles.reminderPref}>
          <View style={styles.reminderPrefIcon}>
            {dailyReminder ? (
              <BellRing size={18} color={colors.primary} strokeWidth={2.3} />
            ) : (
              <Bell size={18} color={colors.mutedForeground} strokeWidth={2.2} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.reminderPrefTitle}>Akşam günlük hatırlatması</Text>
            <Text style={styles.reminderPrefSub}>Her akşam 20:30&apos;da nazikçe hatırlatalım</Text>
          </View>
          <Switch
            value={dailyReminder}
            onValueChange={toggleDailyReminder}
            trackColor={{ false: colors.muted, true: colors.primary }}
            thumbColor={colors.card}
          />
        </View>

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

        {/* Content */}
        {loaded && notes.length === 0 ? (
          <EmptyState
            emoji="📔"
            title="Günlüğün henüz boş"
            description="İlk kaydını ekle — bugün yaşadığınız bir an, bir gözlem ya da hatırlatma."
            actionLabel="İlk Kaydı Ekle"
            onAction={() => nav.navigate('NoteEditor', {})}
          />
        ) : visible.length === 0 ? (
          <View style={styles.emptyFilter}>
            <Text style={styles.emptyFilterText}>Bu dost için kayıt yok.</Text>
          </View>
        ) : view === 'gunluk' ? (
          <View style={styles.timeline}>
            {timeline.map((group) => (
              <View key={group.label}>
                <View style={styles.dayHeader}>
                  <View style={styles.dayLine} />
                  <Text style={styles.dayLabel}>{group.label}</Text>
                  <View style={styles.dayLine} />
                </View>
                {group.items.map((n) => (
                  <DiaryCard
                    key={n.id}
                    note={n}
                    catName={catName(n.catId)}
                    onPress={() => nav.navigate('NoteEditor', { noteId: n.id })}
                  />
                ))}
              </View>
            ))}
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

// Günlük (zaman çizelgesi) kartı — fotoğraf ve ruh hali öne çıkar.
const DiaryCard = ({
  note,
  catName,
  onPress,
}: {
  note: Note;
  catName?: string;
  onPress: () => void;
}) => {
  const mood = getMood(note.mood);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.diaryCard, pressed && styles.pressed]}>
      {note.photoUri ? (
        <Image source={{ uri: note.photoUri }} style={styles.diaryPhoto} resizeMode="cover" />
      ) : null}
      <View style={styles.diaryBody}>
        <View style={styles.diaryTop}>
          <Text style={styles.diaryTime}>{timeLabel(note.createdAt)}</Text>
          {mood ? <Text style={styles.diaryMood}>{mood.emoji} {mood.label}</Text> : null}
          {catName ? <Text style={styles.diaryCat}>🐾 {catName}</Text> : null}
        </View>
        {note.title ? <Text style={styles.diaryTitle}>{note.title}</Text> : null}
        {note.body ? (
          <Text style={styles.diaryText} numberOfLines={4}>
            {note.body}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
};

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
  const mood = getMood(note.mood);

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
        {mood ? <Text style={styles.cardMood}>{mood.emoji}</Text> : null}
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

  viewToggle: {
    flexDirection: 'row',
    backgroundColor: colors.muted,
    borderRadius: radius.full,
    padding: 3,
  },
  viewBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.full, alignItems: 'center' },
  viewBtnActive: { backgroundColor: colors.card, ...shadow.card },
  viewBtnText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.mutedForeground },
  viewBtnTextActive: { color: colors.foreground },

  chips: { gap: spacing.sm, paddingVertical: spacing.xs },
  chip: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full, maxWidth: 160 },
  chipActive: { backgroundColor: colors.primary },
  chipIdle: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  chipText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.foreground },
  chipTextActive: { color: colors.primaryForeground },

  reminderPref: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  reminderPrefIcon: {
    width: 36, height: 36, borderRadius: radius.md,
    backgroundColor: colors.primaryTint,
    alignItems: 'center', justifyContent: 'center',
  },
  reminderPrefTitle: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.foreground },
  reminderPrefSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.mutedForeground, marginTop: 1 },

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

  timeline: { gap: spacing.md },
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.sm },
  dayLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dayLabel: { fontFamily: fonts.serifSemi, fontSize: 15, color: colors.mutedForeground },

  diaryCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadow.card,
  },
  diaryPhoto: { width: '100%', height: 170 },
  diaryBody: { padding: spacing.lg, gap: spacing.xs },
  diaryTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap' },
  diaryTime: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.primary },
  diaryMood: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.foreground },
  diaryCat: { fontFamily: fonts.sans, fontSize: 13, color: colors.mutedForeground },
  diaryTitle: { fontFamily: fonts.serifSemi, fontSize: 17, color: colors.foreground },
  diaryText: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 21, color: colors.foreground },

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
  cardMood: { fontSize: 16 },
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
