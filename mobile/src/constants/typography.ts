import { TextStyle } from 'react-native';

export const typography: Record<string, TextStyle> = {
  h1:        { fontFamily: 'Fraunces_700Bold',   fontSize: 32, letterSpacing: -0.8 },
  h2:        { fontFamily: 'Fraunces_700Bold',   fontSize: 24, letterSpacing: -0.5 },
  h3:        { fontFamily: 'Fraunces_600SemiBold', fontSize: 18 },
  body:      { fontFamily: 'DMSans_400Regular',  fontSize: 15, lineHeight: 22 },
  bodySmall: { fontFamily: 'DMSans_400Regular',  fontSize: 13, lineHeight: 20 },
  caption:   { fontFamily: 'DMSans_300Light',    fontSize: 11, letterSpacing: 0.3 },
  label:     { fontFamily: 'DMSans_500Medium',   fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase' },
  button:    { fontFamily: 'DMSans_500Medium',   fontSize: 15 },
};

export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, '2xl': 32, '3xl': 48,
} as const;

export const radius = {
  sm: 8, md: 12, lg: 16, xl: 24, full: 9999,
} as const;

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
};
