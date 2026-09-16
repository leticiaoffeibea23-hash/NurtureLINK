// AmaliTech Unified Experience Design System — React Native tokens

export const colors = {
  // Primary — Dark Blue
  primary: '#08283B',
  primaryHover: '#072436',
  primaryActive: '#061C2A',
  primarySoft: '#E6EAEB',

  // Accent — Orange
  accent: '#FF5A00',
  accentHover: '#E85200',
  accentLight: '#FFEFE6',
  accentMid: '#FF7B33',

  // Neutrals
  gray50: '#ECECEB',
  gray100: '#C3C3C2',
  gray200: '#A6A6A4',
  gray300: '#7E7D7B',
  gray400: '#656461',
  gray500: '#3E3D3A',

  white: '#FDFDFD',
  black: '#000000',

  // App surfaces
  bg: '#F2F4F5',
  bgSubtle: '#F9FAFB',
  surface: '#FDFDFD',
  border: '#E5E7EB',
  borderStrong: '#D1D5DB',
  borderSubtle: '#F0F1F3',
  divider: '#E6EAEB',

  // Text
  fg1: '#08283B',
  fg2: '#374151',
  fg3: '#6B7280',
  fg4: '#9CA3AF',

  // Light Blue
  lightBlue50: '#EFF7FE',
  lightBlue100: '#CDE6FC',
  lightBlue200: '#B4DAFB',
  lightBlue300: '#92C9F9',
  lightBlue700: '#427CAF',

  // Semantic — Success (green)
  success: '#057A55',
  successBg: '#F3FAF7',
  successBorder: '#BCF0DA',
  successLight: '#DEF7EC',
  successDark: '#046C4E',

  // Semantic — Warning (yellow)
  warning: '#B48700',
  warningBg: '#FFF9E6',
  warningBorder: '#FFE18A',
  warningLight: '#FFEBB0',
  warningDark: '#8C6900',

  // Semantic — Error (red)
  error: '#C81E1E',
  errorBg: '#FDF2F2',
  errorBorder: '#FBD5D5',
  errorDark: '#9B1C1C',
  errorLight: '#FDE8E8',

  // Semantic — Info (light blue)
  info: '#427CAF',
  infoBg: '#EFF7FE',
  infoBorder: '#B4DAFB',

  // High-priority badge
  highPriority: '#B54000',
  highPriorityBg: '#FFEFE6',

  // Dark header surface
  darkHeader: '#08283B',
  darkHeaderText: '#8D9CA5',
  darkHeaderSub: '#5A6F7C',
  darkHeaderAccent: '#92C9F9',
};

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
};

export const radii = {
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  '3xl': 24,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
};

// Typography — Inter primary, Open Sans fallback
// Use these constants with fontFamily in StyleSheet to render Inter.
// If Inter fails to load (offline install, first launch), the OS falls back to its system sans-serif.
export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  // Open Sans — loaded as fallback; use when Inter weight doesn't map cleanly
  fallbackRegular: 'OpenSans_400Regular',
  fallbackSemiBold: 'OpenSans_600SemiBold',
  fallbackBold: 'OpenSans_700Bold',
};

// Minimum tap target — 48dp per WCAG
export const TAP_TARGET = 48;
