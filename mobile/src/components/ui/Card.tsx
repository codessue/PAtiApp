import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { colors } from '../../constants/colors';
import { radius, shadow, spacing } from '../../constants/typography';

interface CardProps extends ViewProps {
  padding?: number;
}

export const Card: React.FC<CardProps> = ({ style, padding = spacing.lg, children, ...props }) => (
  <View style={[styles.card, { padding }, style]} {...props}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
});
