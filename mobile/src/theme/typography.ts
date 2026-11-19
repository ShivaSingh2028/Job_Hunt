import { TextStyle } from 'react-native';

export const fontFamilies = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

export const tabularNumbers: TextStyle = {
  fontVariant: ['tabular-nums'],
};

export const typography = {
  // New standardized scale
  display: {
    fontFamily: fontFamilies.bold,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700' as const,
  },
  title: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600' as const,
  },
  heading: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600' as const,
  },
  body: {
    fontFamily: fontFamilies.regular,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  secondary: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
  },
  caption: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
  },

  // Backwards compatibility aliases
  displayXl: {
    fontFamily: fontFamilies.bold,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700' as const,
  },
  displayLg: {
    fontFamily: fontFamilies.bold,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700' as const,
  },
  displayMd: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600' as const,
  },
  headingLg: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600' as const,
  },
  headingMd: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600' as const,
  },
  headingSm: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600' as const,
  },
  bodyLg: {
    fontFamily: fontFamilies.regular,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  bodyMd: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
  },
  bodySm: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as const,
  },
  label: {
    fontFamily: fontFamilies.medium,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500' as const,
  },
};
