import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { fonts, radius, spacing } from '../../constants/typography';
import { formatApiDate, formatDate } from '../../utils/dateHelpers';

interface DatePickerProps {
  label?: string;
  /** Source of truth: stored/submitted value in ISO `YYYY-MM-DD`. */
  value?: string;
  /** Always called with an ISO `YYYY-MM-DD` string. */
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  minimumDate?: Date;
  maximumDate?: Date;
}

// ISO `YYYY-MM-DD` → local-midnight Date (no timezone drift). Falls back to today.
const parseValue = (value?: string): Date => {
  if (value) {
    const d = new Date(`${value}T00:00:00`);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
};

// Strictly parse manual `GG.AA.YYYY` (DD.MM.YYYY) entry → Date, or null if invalid.
const parseManual = (text: string): Date | null => {
  const m = text.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(year, month - 1, day);
  // Reject overflow like 31.02.2026 (which JS would roll into March).
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
  return d;
};

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  placeholder = 'GG.AA.YYYY',
  error,
  minimumDate,
  maximumDate,
}) => {
  // `text` is the editable buffer shown in the field; the committed source of
  // truth is the parent `value` (ISO). They stay in sync via the effect below.
  const [text, setText] = useState<string>(value ? formatDate(value) : '');
  const [focused, setFocused] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  // `tempDate` drives the controlled calendar; `selectedRef` holds the latest
  // tapped day so "Tamam" can't read a stale/batched state.
  const [tempDate, setTempDate] = useState<Date>(parseValue(value));
  const selectedRef = useRef<Date>(parseValue(value));

  // Reflect external value changes (prefill, calendar commit) as friendly text,
  // but never while the user is actively typing.
  useEffect(() => {
    if (focused) return;
    setText(value ? formatDate(value) : '');
  }, [value, focused]);

  const handleManualChange = (t: string) => {
    setText(t);
    const parsed = parseManual(t);
    if (parsed) onChange(formatApiDate(parsed));
  };

  const openPicker = () => {
    const initial = parseValue(value);
    setTempDate(initial);
    selectedRef.current = initial;
    setShowPicker(true);
  };

  const commit = (d: Date) => {
    onChange(formatApiDate(d)); // ISO to the form/API
    setText(formatDate(d));     // friendly in the field
  };

  const handlePickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      // Android shows a one-shot dialog with its own buttons.
      setShowPicker(false);
      if (event.type === 'set' && selected) {
        selectedRef.current = selected;
        commit(selected);
      }
      return;
    }
    // iOS inline grid: capture the tapped day into state; commit on "Tamam".
    if (selected) {
      selectedRef.current = selected;
      setTempDate(selected);
    }
  };

  const confirmIOS = () => {
    commit(selectedRef.current);
    setShowPicker(false);
  };

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={[styles.field, focused && styles.fieldFocused, error ? styles.fieldError : null]}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={handleManualChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          keyboardType="numbers-and-punctuation"
          maxLength={10}
          returnKeyType="done"
        />
        <TouchableOpacity
          onPress={openPicker}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Takvimi aç"
        >
          <Calendar size={20} color={colors.mutedForeground} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* Android: native calendar dialog. */}
      {showPicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={parseValue(value)}
          mode="date"
          display="default"
          onChange={handlePickerChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}

      {/* iOS: inline month-grid calendar in a bottom sheet with Tamam/İptal. */}
      {Platform.OS === 'ios' && showPicker && (
        <Modal visible transparent animationType="slide" onRequestClose={() => setShowPicker(false)}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setShowPicker(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Text style={styles.sheetCancel}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmIOS}>
                <Text style={styles.sheetDone}>Tamam</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="inline"
              onChange={handlePickerChange}
              minimumDate={minimumDate}
              maximumDate={maximumDate}
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
  container: { marginBottom: spacing.md },
  label: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    color: colors.foreground,
    marginLeft: 4,
    marginBottom: 8,
  },
  field: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
  },
  fieldFocused: { borderColor: colors.primary },
  fieldError: { borderColor: colors.destructive },
  input: {
    flex: 1,
    height: '100%',
    paddingVertical: 0,
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.foreground,
  },
  error: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.destructive,
    marginTop: 6,
    marginLeft: 4,
  },
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
  // The iOS inline calendar doesn't report an intrinsic height inside a Modal,
  // so the sheet collapses to just the header unless we give it an explicit one.
  inline: { alignSelf: 'stretch', height: 380 },
});
