import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { PawPrint } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import { illustrations } from '../../constants/illustrations';

// §4.1 Splash. Shown as the loading fallback while fonts/auth bootstrap.
export const Splash = () => (
  <View style={styles.container}>
    <LinearGradient
      colors={['transparent', 'rgba(212,165,160,0.30)']}
      style={styles.bottomGlow}
      pointerEvents="none"
    />

    <View style={styles.center}>
      <View style={styles.pawTile}>
        <PawPrint size={48} color={colors.primary} fill={colors.primary} />
      </View>
      <Text style={styles.title}>Pati</Text>
      <Text style={styles.tagline}>Dostunuzun sağlığı, elinizde.</Text>
      <Image
        source={illustrations.dostlar.source}
        style={[styles.friends, { aspectRatio: illustrations.dostlar.ratio }]}
        contentFit="contain"
        autoplay
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  bottomGlow: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 300 },
  center: { alignItems: 'center', gap: 16 },
  pawTile: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-8deg' }],
    shadowColor: '#1C1A18',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  title: { fontFamily: fonts.serif, fontSize: 48, color: colors.primary, marginTop: 8, letterSpacing: -1 },
  tagline: { fontFamily: fonts.sans, fontSize: 18, color: colors.mutedForeground },
  // Yürüyen kedi, köpek ve uçan kuş (hareketli).
  friends: {
    width: 280,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: colors.card,
    backgroundColor: colors.card,
    marginTop: 16,
  },
});
