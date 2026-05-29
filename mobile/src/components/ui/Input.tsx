import React, { forwardRef } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/typography';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, hint, style, ...props }, ref) => (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        ref={ref}
        style={[styles.input, error && styles.inputError, style]}
        placeholderTextColor={colors.textLight}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
    </View>
  )
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    height: 48,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: colors.text,
  },
  inputError: { borderColor: colors.danger },
  error: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: colors.danger,
    marginTop: spacing.xs,
  },
  hint: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
