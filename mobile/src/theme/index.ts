export * from './colors';

export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32,
};

export const radii = {
  sm: 6, md: 10, lg: 14, xl: 20, full: 9999,
};

export const typography = {
  displayXl: { fontSize: 36, fontWeight: '800' as const, lineHeight: 44 },
  displayLg: { fontSize: 28, fontWeight: '700' as const, lineHeight: 36 },
  displayMd: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32 },
  headingLg: { fontSize: 20, fontWeight: '700' as const, lineHeight: 28 },
  headingMd: { fontSize: 17, fontWeight: '600' as const, lineHeight: 24 },
  headingSm: { fontSize: 15, fontWeight: '600' as const, lineHeight: 22 },
  bodyLg:    { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodyMd:    { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  bodySm:    { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  caption:   { fontSize: 11, fontWeight: '500' as const, lineHeight: 16 },
  label:     { fontSize: 13, fontWeight: '500' as const, lineHeight: 18 },
};

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 8,
  },
};
