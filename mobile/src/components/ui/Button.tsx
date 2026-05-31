import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  ViewStyle,
} from 'react-native';
import { colors } from '../../constants/colors';
import { fonts, radius, spacing } from '../../constants/typography';

type Variant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
type Size = 'sm' | 'md';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: Variant;
  /** `md` (default) = 52px tall per spec. `sm` = compact 36px used in inline toolbars. */
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  style,
  disabled,
  ...props
}) => {
  const isDisabled = disabled || loading;
  const v = VARIANTS[variant];
  const s = SIZES[size];

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={isDisabled}
      style={[styles.base, v.container, s.container, isDisabled && styles.disabled, style]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={v.text.color as string} size="small" />
      ) : (
        <View style={styles.row}>
          {icon ? <View style={styles.icon}>{icon}</View> : null}
          <Text style={[styles.text, v.text, s.text]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// --- variants ---------------------------------------------------------------
// Spec: UI_REDESIGN_1.md §3 — Button.
const VARIANTS: Record<Variant, { container: ViewStyle; text: TextStyle }> = {
  primary: {
    container: {
      backgroundColor: colors.primary,
      // soft primary-tinted shadow
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 3,
    },
    text: { color: colors.primaryForeground },
  },
  secondary: {
    container: { backgroundColor: colors.secondary },
    text: { color: colors.secondaryForeground },
  },
  outline: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: colors.border,
    },
    text: { color: colors.foreground },
  },
  danger: {
    container: {
      backgroundColor: 'rgba(217,79,61,0.08)',
      borderWidth: 2,
      borderColor: 'rgba(217,79,61,0.15)',
    },
    text: { color: colors.destructive },
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    text: { color: colors.mutedForeground },
  },
};

const SIZES: Record<Size, { container: ViewStyle; text: TextStyle }> = {
  md: {
    container: { height: 52, paddingHorizontal: spacing.xl, borderRadius: radius.lg },
    text: { fontSize: 17 },
  },
  sm: {
    container: { height: 36, paddingHorizontal: spacing.md, borderRadius: radius.md },
    text: { fontSize: 14 },
  },
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch', // full-width by default per spec
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: spacing.sm },
  text: { fontFamily: fonts.sansBold },
  disabled: { opacity: 0.5 },
});
