import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { fonts, radius, spacing } from '../../constants/typography';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retrying?: boolean;
}

// Shown instead of a misleading empty state when a data request fails
// (backend down, no network, wrong API URL...).
export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Sunucuya ulaşılamadı',
  description = 'İnternet bağlantını kontrol et. Sorun sürerse sunucu geçici olarak kapalı olabilir.',
  onRetry,
  retrying = false,
}) => (
  <View style={styles.container}>
    <View style={styles.iconCircle}>
      <WifiOff size={26} color={colors.destructive} strokeWidth={2.2} />
    </View>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.description}>{description}</Text>
    {onRetry ? (
      <Button title="Tekrar Dene" variant="outline" onPress={onRetry} loading={retrying} style={styles.button} />
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing['2xl'],
    gap: spacing.sm,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.destructiveTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
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
  button: { marginTop: spacing.md, alignSelf: 'stretch', borderRadius: radius.lg },
});
