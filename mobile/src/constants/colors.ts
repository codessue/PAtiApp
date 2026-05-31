// Design tokens — source of truth for the Figma redesign.
// See UI_REDESIGN_1.md §1.
//
// New canonical names come first. Old aliases below are kept as backwards-compat
// shims so screens that haven't been restyled yet still compile. Once every
// screen has been migrated (Execution Order step 4), the legacy block can be
// removed in a single sweep.

export const colors = {
  // --- canonical design tokens ---
  background:          '#FAF6F0', // app background (warm cream)
  foreground:          '#1C1A18', // primary text (near-black)
  card:                '#FFFFFF', // card surface

  primary:             '#C4622D', // terracotta
  primaryForeground:   '#FFFFFF',
  secondary:           '#7A9E7E', // sage green
  secondaryForeground: '#FFFFFF',
  muted:               '#F0EAE1', // muted fill (chips, inactive)
  mutedForeground:     '#8C8078', // secondary text
  accent:              '#D4A5A0', // dusty rose
  accentForeground:    '#FFFFFF',
  destructive:         '#D94F3D', // overdue / danger
  destructiveForeground: '#FFFFFF',
  warning:             '#E6891A', // upcoming soon
  warningForeground:   '#FFFFFF',
  success:             '#3D9A5C', // healthy / done
  successForeground:   '#FFFFFF',

  border:              'rgba(28,26,24,0.08)', // hairline border

  // 10% tints (used a lot for icon tiles, soft fills, left-accents)
  primaryTint:         'rgba(196,98,45,0.10)',
  secondaryTint:       'rgba(122,158,126,0.10)',
  destructiveTint:     'rgba(217,79,61,0.10)',
  warningTint:         'rgba(230,137,26,0.10)',
  successTint:         'rgba(61,154,92,0.10)',

  // --- legacy aliases (DO NOT add new usages; remove during screen sweep) ---
  surface:        '#FFFFFF',          // → use `card`
  surfaceAlt:     '#F0EAE1',          // → use `muted`
  primaryLight:   'rgba(196,98,45,0.10)',  // → use `primaryTint`
  secondaryLight: 'rgba(122,158,126,0.10)',// → use `secondaryTint`
  dangerLight:    'rgba(217,79,61,0.10)',  // → use `destructiveTint`
  warningLight:   'rgba(230,137,26,0.10)', // → use `warningTint`
  successLight:   'rgba(61,154,92,0.10)',  // → use `successTint`
  danger:         '#D94F3D',          // → use `destructive`
  text:           '#1C1A18',          // → use `foreground`
  textMuted:      '#8C8078',          // → use `mutedForeground`
  textLight:      '#B5AFA8',
  borderStrong:   'rgba(28,26,24,0.20)',
  overlay:        'rgba(28,26,24,0.50)',
} as const;
