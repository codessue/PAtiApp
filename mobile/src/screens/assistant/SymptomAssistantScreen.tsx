import React, { useLayoutEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AlertTriangle, Bot, ClipboardList, Info, ListChecks, Stethoscope } from 'lucide-react-native';
import { AxiosError } from 'axios';
import { useCats } from '../../hooks/useCats';
import { useSymptomCheck } from '../../hooks/useAssistant';
import { colors } from '../../constants/colors';
import { fonts, radius, spacing } from '../../constants/typography';
import { Header } from '../../components/ui/Header';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ApiResponse, SymptomCheckResult, SymptomUrgency } from '../../types';

const QUICK_SYMPTOMS = [
  'İştahsızlık', 'Kusma', 'İshal', 'Halsizlik',
  'Aşırı su içme', 'Hapşırma', 'Kaşıntı', 'İdrar zorluğu',
];

const URGENCY: Record<SymptomUrgency, { label: string; color: string; tint: string }> = {
  acil:    { label: 'Acil — vakit kaybetmeden veterinere', color: colors.destructive, tint: colors.destructiveTint },
  yakinda: { label: 'Yakında — 24-48 saat içinde veteriner', color: colors.warning, tint: colors.warningTint },
  izle:    { label: 'Evde izle — kötüleşirse veterinere', color: '#C8A21E', tint: 'rgba(200,162,30,0.12)' },
  bilgi:   { label: 'Bilgilendirme — acil bir durum değil', color: colors.success, tint: colors.successTint },
};

export const SymptomAssistantScreen = () => {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const route = useRoute();
  const presetCatId = (route.params as { catId?: string } | undefined)?.catId;

  const { data: cats } = useCats();
  const { mutate, data: result, isPending, error, reset } = useSymptomCheck();

  const [catId, setCatId] = useState<string | undefined>(presetCatId);
  const [message, setMessage] = useState('');

  useLayoutEffect(() => {
    nav.setOptions({ headerShown: false });
  }, [nav]);

  const appendSymptom = (s: string) => {
    setMessage((prev) => (prev.trim() ? `${prev.trim()}, ${s.toLowerCase()}` : s));
  };

  const onSubmit = () => {
    if (!message.trim()) return;
    mutate({ catId, message: message.trim() });
  };

  const errorMessage =
    (error as AxiosError<ApiResponse<unknown>>)?.response?.data?.message ??
    (error ? 'Bir sorun oluştu. Lütfen tekrar deneyin.' : null);

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <Header title="Sağlık Asistanı" onBack={() => nav.goBack()} />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Intro */}
          <View style={styles.introRow}>
            <View style={styles.introIcon}>
              <Bot size={22} color={colors.primary} strokeWidth={2.2} />
            </View>
            <Text style={styles.introText}>
              Belirtileri anlat, olası nedenler ve aciliyet hakkında bir ön değerlendirme alalım.
              Bu bir teşhis değildir.
            </Text>
          </View>

          {/* Cat selector */}
          {cats && cats.length > 0 && (
            <>
              <Text style={styles.label}>Hangi kedi? (opsiyonel)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                <Chip label="Belirtme" active={!catId} onPress={() => setCatId(undefined)} />
                {cats.map((c) => (
                  <Chip key={c.id} label={c.name} active={catId === c.id} onPress={() => setCatId(c.id)} />
                ))}
              </ScrollView>
            </>
          )}

          {/* Symptom input */}
          <Text style={styles.label}>Belirtiler</Text>
          <TextInput
            value={message}
            onChangeText={(t) => { setMessage(t); if (result || error) reset(); }}
            placeholder="Örn. 2 gündür yemek yemiyor, halsiz ve çok su içiyor..."
            placeholderTextColor={colors.mutedForeground}
            style={styles.input}
            multiline
            textAlignVertical="top"
          />

          {/* Quick symptoms */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {QUICK_SYMPTOMS.map((s) => (
              <TouchableOpacity key={s} onPress={() => appendSymptom(s)} activeOpacity={0.8} style={styles.quickChip}>
                <Text style={styles.quickChipText}>+ {s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Button
            title="Değerlendir"
            onPress={onSubmit}
            loading={isPending}
            disabled={!message.trim()}
            icon={!isPending ? <Stethoscope size={20} color={colors.primaryForeground} strokeWidth={2.2} /> : undefined}
            style={styles.submit}
          />

          {/* Error */}
          {errorMessage && !isPending && (
            <Card style={styles.errorCard}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </Card>
          )}

          {/* Result */}
          {result && !isPending && <ResultView result={result} />}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const Chip = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[styles.chip, active ? styles.chipActive : styles.chipIdle]}>
    <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>{label}</Text>
  </TouchableOpacity>
);

const ResultView = ({ result }: { result: SymptomCheckResult }) => {
  const u = URGENCY[result.urgency] ?? URGENCY.izle;
  return (
    <View style={styles.result}>
      {/* Urgency banner */}
      <View style={[styles.urgency, { backgroundColor: u.tint, borderColor: u.color }]}>
        <AlertTriangle size={20} color={u.color} strokeWidth={2.3} />
        <Text style={[styles.urgencyText, { color: u.color }]}>{u.label}</Text>
      </View>

      {!!result.summary && <Text style={styles.summary}>{result.summary}</Text>}

      <Section icon={ListChecks} title="Olası nedenler" items={result.possibleCauses} color={colors.primary} />
      <Section icon={ClipboardList} title="Öneriler" items={result.recommendations} color={colors.secondary} />
      <Section icon={Stethoscope} title="Veterinere sorabilecekleriniz" items={result.vetQuestions} color={colors.accent} />

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Info size={16} color={colors.mutedForeground} strokeWidth={2.2} />
        <Text style={styles.disclaimerText}>{result.disclaimer}</Text>
      </View>
    </View>
  );
};

const Section = ({
  icon: Icon, title, items, color,
}: { icon: typeof ListChecks; title: string; items: string[]; color: string }) => {
  if (!items || items.length === 0) return null;
  return (
    <Card style={styles.section}>
      <View style={styles.sectionHead}>
        <Icon size={18} color={color} strokeWidth={2.3} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {items.map((it, i) => (
        <View key={i} style={styles.bulletRow}>
          <View style={[styles.bullet, { backgroundColor: color }]} />
          <Text style={styles.bulletText}>{it}</Text>
        </View>
      ))}
    </Card>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 24, paddingTop: spacing.sm, paddingBottom: spacing['3xl'], gap: spacing.sm },

  introRow: {
    flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start',
    backgroundColor: colors.primaryTint, borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.sm,
  },
  introIcon: {
    width: 40, height: 40, borderRadius: radius.lg, backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center',
  },
  introText: { flex: 1, fontFamily: fonts.sans, fontSize: 14, lineHeight: 20, color: colors.foreground },

  label: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.mutedForeground, marginTop: spacing.md, marginBottom: spacing.xs, marginLeft: 4 },

  chips: { gap: spacing.sm, paddingVertical: 2 },
  chip: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full, maxWidth: 160 },
  chipActive: { backgroundColor: colors.primary },
  chipIdle: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  chipText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.foreground },
  chipTextActive: { color: colors.primaryForeground },

  input: {
    minHeight: 110, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: spacing.lg, fontFamily: fonts.sans, fontSize: 16, lineHeight: 23, color: colors.foreground,
  },
  quickChip: {
    backgroundColor: colors.muted, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  quickChipText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.mutedForeground },

  submit: { marginTop: spacing.lg },

  errorCard: { marginTop: spacing.lg, backgroundColor: colors.destructiveTint, borderColor: 'rgba(217,79,61,0.25)' },
  errorText: { fontFamily: fonts.sans, fontSize: 14, color: colors.destructive, lineHeight: 20 },

  result: { marginTop: spacing.xl, gap: spacing.md },
  urgency: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    borderRadius: radius.lg, borderLeftWidth: 4, padding: spacing.lg,
  },
  urgencyText: { flex: 1, fontFamily: fonts.sansBold, fontSize: 15 },
  summary: { fontFamily: fonts.sans, fontSize: 16, lineHeight: 24, color: colors.foreground },

  section: { gap: spacing.sm },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 2 },
  sectionTitle: { fontFamily: fonts.serifSemi, fontSize: 17, color: colors.foreground },
  bulletRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 8 },
  bulletText: { flex: 1, fontFamily: fonts.sans, fontSize: 15, lineHeight: 22, color: colors.foreground },

  disclaimer: {
    flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start',
    backgroundColor: colors.muted, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.xs,
  },
  disclaimerText: { flex: 1, fontFamily: fonts.sans, fontSize: 12, lineHeight: 18, color: colors.mutedForeground },
});
