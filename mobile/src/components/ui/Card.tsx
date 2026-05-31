import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { colors } from '../../constants/colors';
import { radius, shadow } from '../../constants/typography';

interface CardProps extends ViewProps {
  /** Override the default 20px padding. */
  padding?: number;
  /** List cards (e.g. medication rows) need their inner rows to control padding. */
  noPadding?: boolean;
}

// Spec: UI_REDESIGN_1.md §3 — Card.
export const Card: React.FC<CardProps> = ({
  style,
  padding = 20,
  noPadding = false,
  children,
  ...props
}) => (
  <View
    style={[styles.card, { padding: noPadding ? 0 : padding }, style]}
    {...props}
  >
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl, // 16
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
});
