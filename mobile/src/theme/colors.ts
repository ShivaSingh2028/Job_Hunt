export const palette = {
  // Brand Violet
  violet50:  '#f5f3ff',
  violet100: '#ede9fe',
  violet200: '#ddd6fe',
  violet300: '#c4b5fd',
  violet400: '#a78bfa',
  violet500: '#8b5cf6',
  violet600: '#7c3aed',
  violet700: '#6d28d9',
  violet800: '#5b21b6',
  violet900: '#4c1d95',
  violet950: '#2e1065',

  // Accent Amber
  amber50:  '#fffbeb',
  amber100: '#fef3c7',
  amber200: '#fde68a',
  amber300: '#fcd34d',
  amber400: '#fbbf24',
  amber500: '#f59e0b',
  amber600: '#d97706',
  amber700: '#b45309',

  // Emerald / Success
  emerald50:  '#ecfdf5',
  emerald100: '#d1fae5',
  emerald200: '#a7f3d0',
  emerald400: '#34d399',
  emerald500: '#10b981',
  emerald600: '#059669',
  emerald700: '#047857',

  // Red / Danger
  red50:  '#fef2f2',
  red100: '#fee2e2',
  red200: '#fecaca',
  red400: '#f87171',
  red500: '#ef4444',
  red600: '#dc2626',
  red700: '#b91c1c',

  // Sky / Info
  blue50:  '#eff6ff',
  blue100: '#dbeafe',
  blue200: '#bfdbfe',
  blue400: '#60a5fa',
  blue500: '#3b82f6',
  blue600: '#2563eb',
  blue700: '#1d4ed8',

  // Slate Neutrals
  slate50:  '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate300: '#cbd5e1',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1e293b',
  slate900: '#0f172a',
  slate950: '#020617',

  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
};

export const light = {
  bg:              palette.slate50,
  bgSecondary:     palette.white,
  bgTertiary:      palette.slate100,
  surface:         palette.white,
  surfaceSecondary: palette.slate100,
  surfaceElevated: palette.white,
  card:            palette.white,
  border:          palette.slate200,
  borderSubtle:    palette.slate100,
  text:            palette.slate900,
  textSecondary:   palette.slate600,
  textMuted:       palette.slate400,
  textInverse:     palette.white,

  // Brand
  primary:         palette.violet600,
  primaryLight:    palette.violet100,
  primaryDark:     palette.violet700,
  primaryBg:       palette.violet50,
  accent:          palette.amber500,
  accentLight:     palette.amber100,

  // Semantics & Status (soft tint + high contrast text)
  success:         palette.emerald700,
  successBg:       palette.emerald50,
  successBorder:   palette.emerald200,
  successText:     palette.emerald700,

  warning:         palette.amber700,
  warningBg:       palette.amber50,
  warningBorder:   palette.amber200,
  warningText:     palette.amber700,

  error:           palette.red700,
  danger:          palette.red700,
  dangerBg:        palette.red50,
  dangerBorder:    palette.red200,
  dangerText:      palette.red700,

  info:            palette.blue700,
  infoBg:          palette.blue50,
  infoBorder:      palette.blue200,
  infoText:        palette.blue700,

  neutralBg:       palette.slate100,
  neutralBorder:   palette.slate200,
  neutralText:     palette.slate700,
};

export const dark = {
  bg:              palette.slate950,
  bgSecondary:     palette.slate900,
  bgTertiary:      palette.slate800,
  surface:         palette.slate900,
  surfaceSecondary: palette.slate800,
  surfaceElevated: palette.slate800,
  card:            palette.slate900,
  border:          palette.slate700,
  borderSubtle:    palette.slate800,
  text:            palette.slate50,
  textSecondary:   palette.slate400,
  textMuted:       palette.slate500,
  textInverse:     palette.slate900,

  // Brand
  primary:         palette.violet500,
  primaryLight:    palette.violet950,
  primaryDark:     palette.violet400,
  primaryBg:       'rgba(139, 92, 246, 0.15)',
  accent:          palette.amber400,
  accentLight:     'rgba(245, 158, 11, 0.15)',

  // Semantics & Status
  success:         palette.emerald400,
  successBg:       'rgba(16, 185, 129, 0.15)',
  successBorder:   'rgba(16, 185, 129, 0.3)',
  successText:     palette.emerald400,

  warning:         palette.amber400,
  warningBg:       'rgba(245, 158, 11, 0.15)',
  warningBorder:   'rgba(245, 158, 11, 0.3)',
  warningText:     palette.amber400,

  error:           palette.red400,
  danger:          palette.red400,
  dangerBg:        'rgba(239, 68, 68, 0.15)',
  dangerBorder:    'rgba(239, 68, 68, 0.3)',
  dangerText:      palette.red400,

  info:            palette.blue400,
  infoBg:          'rgba(59, 130, 246, 0.15)',
  infoBorder:      'rgba(59, 130, 246, 0.3)',
  infoText:        palette.blue400,

  neutralBg:       palette.slate800,
  neutralBorder:   palette.slate700,
  neutralText:     palette.slate300,
};

export type ColorScheme = typeof light;
