import React, { forwardRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { colors } from '../../constants/colors';
import { fonts, radius, spacing } from '../../constants/typography';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  /** Rendered absolutely at the right edge of the field. */
  trailingIcon?: React.ReactNode;
}

// Spec: UI_REDESIGN_1.md §3 — Input.
export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, hint, trailingIcon, style, onFocus, onBlur, ...props }, ref) => {
    const [focused, setFocused] = useState(false);

    // Event types are intentionally inferred — RN's `TextInput` focus/blur
    // signatures differ between SDK versions, so let TS pick them up from the
    // `TextInputProps` we forward.
    const handleFocus: NonNullable<TextInputProps['onFocus']> = (e) => {
      setFocused(true);
      onFocus?.(e);
    };
    const handleBlur: NonNullable<TextInputProps['onBlur']> = (e) => {
      setFocused(false);
      onBlur?.(e);
    };

    return (
      <View style={styles.container}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        <View style={styles.fieldWrap}>
          <TextInput
            ref={ref}
            style={[
              styles.input,
              focused && styles.inputFocused,
              error && styles.inputError,
              trailingIcon ? styles.inputWithTrailing : null,
              style,
            ]}
            placeholderTextColor={colors.mutedForeground}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />
          {trailingIcon ? <View style={styles.trailing}>{trailingIcon}</View> : null}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {hint && !error ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    color: colors.foreground,
    marginLeft: 4,
    marginBottom: 8,
  },
  fieldWrap: { position: 'relative', justifyContent: 'center' },
  input: {
    height: 52,
    backgroundColor: colors.card,
    borderRadius: radius.lg, // 12
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.foreground,
  },
  inputWithTrailing: { paddingRight: 48 },
  inputFocused: { borderColor: colors.primary },
  inputError: { borderColor: colors.destructive },
  trailing: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  error: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.destructive,
    marginTop: 6,
    marginLeft: 4,
  },
  hint: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.mutedForeground,
    marginTop: 6,
    marginLeft: 4,
  },
});
