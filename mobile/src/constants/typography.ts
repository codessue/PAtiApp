import { TextStyle } from 'react-native';

// Font family names loaded by `useFonts` in App.tsx. Use these strings in
// StyleSheet objects rather than hardcoding the font name elsewhere.
//
// Spec: UI_REDESIGN_1.md §1 — Headings → Fraunces (serif), body → DM Sans.
export const fonts = {
  serif:       'Fraunces_700Bold',   // headings (bold)
  serifSemi:   'Fraunces_600SemiBold',
  serifRegular:'Fraunces_400Regular',
  sans:        'DMSans_400Regular',
  sansMedium:  'DMSans_500Medium',
  sansBold:    'DMSans_700Bold',
  sansLight:   'DMSans_300Light',
} as const;

export const typography: Record<string, TextStyle> = {
  // Display / hero (e.g. weight number on Weight Chart).
  display:   { fontFamily: fonts.serif,       fontSize: 48, letterSpacing: -1.0 },
  // Page H2 (e.g. "Giriş Yap").
  pageTitle: { fontFamily: fonts.serif,       fontSize: 30, letterSpacing: -0.6 },
  // Screen titles in the Header bar.
  h1:        { fontFamily: fonts.serif,       fontSize: 22, letterSpacing: -0.4 },
  // Big section headers ("Yaklaşan Aşılar", "Bugünkü İlaçlar").
  h2:        { fontFamily: fonts.serif,       fontSize: 20, letterSpacing: -0.3 },
  // Sub-section / card headings.
  h3:        { fontFamily: fonts.serifSemi,   fontSize: 18 },
  // Body & form labels.
  body:      { fontFamily: fonts.sans,        fontSize: 16, lineHeight: 24 },
  bodySmall: { fontFamily: fonts.sans,        fontSize: 14, lineHeight: 20 },
  label:     { fontFamily: fonts.sansMedium,  fontSize: 15 },
  caption:   { fontFamily: fonts.sans,        fontSize: 13, lineHeight: 18 },
  micro:     { fontFamily: fonts.sansMedium,  fontSize: 10, letterSpacing: 0.2 },
  button:    { fontFamily: fonts.sansBold,    fontSize: 17 },
};

export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, '2xl': 32, '3xl': 48,
} as const;

// Radius scale — sm 4 · md 8 · lg 12 · xl/card 16 · 3xl 24 · pill 9999.
export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '3xl': 24,
  full: 9999,
} as const;

// Card shadow preset — soft, matches the design's
// `shadow-[0_4px_20px_rgba(28,26,24,0.03)]`.
export const shadow = {
  card: {
    shadowColor: '#1C1A18',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
};
