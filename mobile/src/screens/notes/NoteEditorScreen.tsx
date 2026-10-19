import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { Bell, ImagePlus, Trash2, X } from 'lucide-react-native';
import { Image } from 'react-native';
import { useNotesStore } from '../../stores/notesStore';
import { useCats } from '../../hooks/useCats';
import { colors } from '../../constants/colors';
import { fonts, radius, spacing } from '../../constants/typography';
import { Header } from '../../components/ui/Header';
import { Button } from '../../components/ui/Button';
import { NOTE_CATEGORIES } from '../../constants/noteCategories';
import { MOODS } from '../../constants/moods';
import { NoteCategory } from '../../types';
import { formatDateTime } from '../../utils/dateHelpers';
import { persistPickedPhoto } from '../../utils/photoStorage';

// Default reminder = next full hour from now.
const defaultReminder = (): Date => {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return d;
};

export const NoteEditorScreen = () => {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const route = useRoute();
  const { noteId, catId: presetCatId } = (route.params ?? {}) as { noteId?: string; catId?: string };

  const { notes, loaded: notesLoaded, load: loadNotes, saveNote, deleteNote } = useNotesStore();
  const { data: cats } = useCats();
  const existing = useMemo(() => notes.find((n) => n.id === noteId), [notes, noteId]);

  const [title, setTitle] = useState(existing?.title ?? '');
  const [body, setBody] = useState(existing?.body ?? '');
  const [category, setCategory] = useState<NoteCategory>(existing?.category ?? 'general');
  const [catId, setCatId] = useState<string | undefined>(existing?.catId ?? presetCatId);
  const [photoUri, setPhotoUri] = useState<string | undefined>(existing?.photoUri);
  const [mood, setMood] = useState<string | undefined>(existing?.mood);
  const [reminderOn, setReminderOn] = useState(!!existing?.reminderAt);
  const [reminderDate, setReminderDate] = useState<Date>(
    existing?.reminderAt ? new Date(existing.reminderAt) : defaultReminder()
  );
  const [saving, setSaving] = useState(false);

  // Android shows date then time as two sequential dialogs.
  const [picker, setPicker] = useState<null | 'date' | 'time' | 'ios'>(null);
  const [iosTemp, setIosTemp] = useState<Date>(reminderDate);

  // Notlar henüz yüklenmediyse (bildirimden ya da soğuk açılış) düzenlenen not
  // bellekte olmaz; yüklendiğinde formu bir kez doldur — aksi hâlde ekran boş
  // açılıp kaydedildiğinde notun içeriği silinirdi.
  useEffect(() => { if (!notesLoaded) loadNotes(); }, [notesLoaded, loadNotes]);

  const hydratedId = useRef<string | undefined>(existing?.id);
  useEffect(() => {
    if (!existing || hydratedId.current === existing.id) return;
    hydratedId.current = existing.id;
    setTitle(existing.title);
    setBody(existing.body);
    setCategory(existing.category);
    setCatId(existing.catId);
    setPhotoUri(existing.photoUri);
    setMood(existing.mood);
    setReminderOn(!!existing.reminderAt);
    if (existing.reminderAt) setReminderDate(new Date(existing.reminderAt));
  }, [existing]);

  useLayoutEffect(() => {
    nav.setOptions({ headerShown: false });
  }, [nav]);

  const onSave = async () => {
    // Sadece fotoğraf ya da ruh hali de geçerli bir günlük kaydıdır.
    if (!title.trim() && !body.trim() && !photoUri && !mood) {
      Alert.alert('Boş kayıt', 'Bir başlık, içerik, fotoğraf ya da ruh hali ekle.');
      return;
    }
    setSaving(true);
    try {
      const reminderAt = reminderOn ? reminderDate.toISOString() : undefined;
      if (reminderOn && reminderDate.getTime() <= Date.now()) {
        Alert.alert('Geçmiş tarih', 'Hatırlatıcı tarihi gelecekte olmalı.');
        setSaving(false);
        return;
      }
      await saveNote({ id: noteId, catId, category, title, body, reminderAt, photoUri, mood });
      nav.goBack();
    } catch {
      Alert.alert('Hata', 'Not kaydedilirken bir sorun oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    if (!noteId) return;
    Alert.alert('Notu Sil', 'Bu notu silmek istediğine emin misin?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          await deleteNote(noteId);
          nav.goBack();
        },
      },
    ]);
  };

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('İzin Gerekli', 'Fotoğraf seçebilmek için galeri erişim izni vermeniz gerekiyor.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      // Seçici fotoğrafı önbelleğe koyar; anı kaybolmasın diye kalıcı klasöre alıyoruz.
      setPhotoUri(persistPickedPhoto(result.assets[0].uri));
    }
  };

  // --- reminder picker handlers ---
  const openPicker = () => {
    setIosTemp(reminderDate);
    setPicker(Platform.OS === 'ios' ? 'ios' : 'date');
  };

  const onAndroidChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (event.type !== 'set' || !selected) {
      setPicker(null);
      return;
    }
    if (picker === 'date') {
      // carry over current time, then ask for time
      const merged = new Date(selected);
      merged.setHours(reminderDate.getHours(), reminderDate.getMinutes(), 0, 0);
      setReminderDate(merged);
      setPicker('time');
    } else {
      const merged = new Date(reminderDate);
      merged.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      setReminderDate(merged);
      setPicker(null);
    }
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <Header
        title={noteId ? 'Notu Düzenle' : 'Yeni Not'}
        onBack={() => nav.goBack()}
        right={
          noteId ? (
            <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Trash2 size={22} color={colors.destructive} strokeWidth={2.2} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Başlık"
            placeholderTextColor={colors.mutedForeground}
            style={styles.titleInput}
            maxLength={80}
          />

          {/* Category picker */}
          <Text style={styles.fieldLabel}>Kategori</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {NOTE_CATEGORIES.map((c) => {
              const active = category === c.key;
              const Icon = c.icon;
              return (
                <TouchableOpacity
                  key={c.key}
                  activeOpacity={0.8}
                  onPress={() => setCategory(c.key)}
                  style={[styles.pill, active ? { backgroundColor: c.color, borderColor: c.color } : styles.pillIdle]}
                >
                  <Icon size={15} color={active ? colors.primaryForeground : c.color} strokeWidth={2.3} />
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>{c.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Cat picker (optional) */}
          {cats && cats.length > 0 && (
            <>
              <Text style={styles.fieldLabel}>Dost (opsiyonel)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setCatId(undefined)}
                  style={[styles.pill, !catId ? styles.pillActiveNeutral : styles.pillIdle]}
                >
                  <Text style={[styles.pillText, !catId && styles.pillTextActive]}>Genel</Text>
                </TouchableOpacity>
                {cats.map((c) => {
                  const active = catId === c.id;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      activeOpacity={0.8}
                      onPress={() => setCatId(c.id)}
                      style={[styles.pill, active ? styles.pillActiveNeutral : styles.pillIdle]}
                    >
                      <Text style={[styles.pillText, active && styles.pillTextActive]}>🐾 {c.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </>
          )}

          {/* Body */}
          <Text style={styles.fieldLabel}>Not</Text>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Aklındakileri buraya yaz..."
            placeholderTextColor={colors.mutedForeground}
            style={styles.bodyInput}
            multiline
            textAlignVertical="top"
          />

          {/* Mood (günlük) */}
          <Text style={styles.fieldLabel}>Bugün nasıldı? (opsiyonel)</Text>
          <View style={styles.moodRow}>
            {MOODS.map((m) => {
              const active = mood === m.key;
              return (
                <TouchableOpacity
                  key={m.key}
                  activeOpacity={0.8}
                  onPress={() => setMood(active ? undefined : m.key)}
                  style={[styles.moodBtn, active && styles.moodBtnActive]}
                >
                  <Text style={styles.moodEmoji}>{m.emoji}</Text>
                  <Text style={[styles.moodLabel, active && styles.moodLabelActive]}>{m.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Photo (günlük) */}
          <Text style={styles.fieldLabel}>Fotoğraf (opsiyonel)</Text>
          {photoUri ? (
            <View style={styles.photoWrap}>
              <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
              <TouchableOpacity
                style={styles.photoRemove}
                onPress={() => setPhotoUri(undefined)}
                accessibilityLabel="Fotoğrafı kaldır"
              >
                <X size={16} color={colors.primaryForeground} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.photoPicker} activeOpacity={0.8} onPress={pickPhoto}>
              <ImagePlus size={22} color={colors.primary} strokeWidth={2.2} />
              <Text style={styles.photoPickerText}>Bir anı fotoğrafı ekle</Text>
            </TouchableOpacity>
          )}

          {/* Reminder */}
          <View style={styles.reminderCard}>
            <View style={styles.reminderTop}>
              <View style={styles.reminderIcon}>
                <Bell size={18} color={colors.primary} strokeWidth={2.3} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reminderLabel}>Hatırlatıcı</Text>
                <Text style={styles.reminderHint}>Seçilen zamanda bildirim al</Text>
              </View>
              <Switch
                value={reminderOn}
                onValueChange={setReminderOn}
                trackColor={{ false: colors.muted, true: colors.primary }}
                thumbColor={colors.card}
              />
            </View>

            {reminderOn && (
              <TouchableOpacity style={styles.reminderDateBtn} onPress={openPicker} activeOpacity={0.8}>
                <Text style={styles.reminderDateText}>{formatDateTime(reminderDate)}</Text>
                <Text style={styles.reminderDateChange}>Değiştir</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.spacer} />
          <Button title="Kaydet" onPress={onSave} loading={saving} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Android sequential pickers */}
      {Platform.OS === 'android' && (picker === 'date' || picker === 'time') && (
        <DateTimePicker
          value={reminderDate}
          mode={picker}
          display="default"
          onChange={onAndroidChange}
          minimumDate={picker === 'date' ? new Date() : undefined}
        />
      )}

      {/* iOS inline datetime sheet */}
      {Platform.OS === 'ios' && picker === 'ios' && (
        <Modal visible transparent animationType="slide" onRequestClose={() => setPicker(null)}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setPicker(null)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <TouchableOpacity onPress={() => setPicker(null)}>
                <Text style={styles.sheetCancel}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setReminderDate(iosTemp);
                  setPicker(null);
                }}
              >
                <Text style={styles.sheetDone}>Tamam</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={iosTemp}
              mode="datetime"
              display="inline"
              onChange={(_, d) => d && setIosTemp(d)}
              minimumDate={new Date()}
              themeVariant="light"
              locale="tr-TR"
              accentColor={colors.primary}
              style={styles.inline}
            />
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 24, paddingTop: spacing.sm, paddingBottom: spacing['2xl'], gap: spacing.sm },

  titleInput: {
    fontFamily: fonts.serif,
    fontSize: 24,
    color: colors.foreground,
    paddingVertical: spacing.sm,
    letterSpacing: -0.3,
  },

  fieldLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.mutedForeground,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  row: { gap: spacing.sm, paddingVertical: 2 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  pillIdle: { backgroundColor: colors.card, borderColor: colors.border },
  pillActiveNeutral: { backgroundColor: colors.foreground, borderColor: colors.foreground },
  pillText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.foreground },
  pillTextActive: { color: colors.primaryForeground },

  bodyInput: {
    minHeight: 140,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 24,
    color: colors.foreground,
  },

  moodRow: { flexDirection: 'row', gap: spacing.sm },
  moodBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  moodBtnActive: { borderColor: colors.primary, backgroundColor: colors.primaryTint },
  moodEmoji: { fontSize: 22 },
  moodLabel: { fontFamily: fonts.sans, fontSize: 11, color: colors.mutedForeground },
  moodLabelActive: { color: colors.primary, fontFamily: fonts.sansMedium },

  photoWrap: { borderRadius: radius.lg, overflow: 'hidden' },
  photo: { width: '100%', height: 180 },
  photoRemove: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(28,26,24,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(196,98,45,0.05)',
  },
  photoPickerText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.primary },

  reminderCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: spacing.md,
    gap: spacing.md,
  },
  reminderTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  reminderIcon: {
    width: 38, height: 38, borderRadius: radius.md,
    backgroundColor: colors.primaryTint,
    alignItems: 'center', justifyContent: 'center',
  },
  reminderLabel: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.foreground },
  reminderHint: { fontFamily: fonts.sans, fontSize: 13, color: colors.mutedForeground, marginTop: 1 },
  reminderDateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryTint,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  reminderDateText: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.foreground },
  reminderDateChange: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.primary },

  spacer: { height: spacing.xl },

  backdrop: { flex: 1, backgroundColor: 'rgba(28,26,24,0.4)' },
  sheet: { backgroundColor: colors.card, paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetCancel: { fontFamily: fonts.sansMedium, fontSize: 16, color: colors.mutedForeground },
  sheetDone: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.primary },
  inline: { alignSelf: 'stretch', height: 380 },
});
