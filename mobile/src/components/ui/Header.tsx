import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/typography';

interface HeaderProps {
  title: string;
  /** Show a circular back button on the left and call this when tapped. */
  onBack?: () => void;
  /** Optional right-slot element (typically a `Plus` icon button). */
  right?: React.ReactNode;
  style?: ViewStyle;
}

// Spec: UI_REDESIGN_1.md §3 — Header.
//
// Row, paddingHorizontal 24, paddingVertical 16, bg `background`.
// Left slot (width 40) holds an optional circular back button.
// Center: title, Fraunces bold 22, centered, flex 1.
// Right slot (width 40): optional icon.
export const Header: React.FC<HeaderProps> = ({ title, onBack, right, style }) => (
  <View style={[styles.container, style]}>
    <View style={styles.slot}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.75}>
          <ChevronLeft size={28} color={colors.foreground} />
        </TouchableOpacity>
      ) : null}
    </View>

    <Text style={styles.title} numberOfLines={1}>
      {title}
    </Text>

    <View style={[styles.slot, styles.slotRight]}>{right}</View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: colors.background,
  },
  slot: { width: 40, alignItems: 'flex-start', justifyContent: 'center' },
  slotRight: { alignItems: 'flex-end' },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    flex: 1,
    fontFamily: fonts.serif,
    fontSize: 22,
    color: colors.foreground,
    textAlign: 'center',
  },
});
