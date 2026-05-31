import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';
import { fonts, spacing } from '../../constants/typography';
import { Button } from './Button';

interface EmptyStateProps {
  emoji?: string;
  /** Watercolor illustration; takes precedence over `emoji` when provided. */
  image?: ImageSourcePropType;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  emoji = '🐾',
  image,
  title,
  description,
  actionLabel,
  onAction,
}) => (
  <View style={styles.container}>
    {image ? (
      <Image source={image} style={styles.image} resizeMode="contain" />
    ) : (
      <Text style={styles.emoji}>{emoji}</Text>
    )}
    <Text style={styles.title}>{title}</Text>
    {description ? <Text style={styles.description}>{description}</Text> : null}
    {actionLabel && onAction ? (
      <Button title={actionLabel} onPress={onAction} style={styles.button} />
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing['3xl'],
    gap: spacing.md,
  },
  image: { width: 200, height: 200, marginBottom: spacing.sm },
  emoji: { fontSize: 56 },
  title: {
    fontFamily: fonts.serif,
    fontSize: 20,
    color: colors.foreground,
    textAlign: 'center',
  },
  description: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 20,
  },
  button: { marginTop: spacing.md, alignSelf: 'stretch' },
});
