import { Platform } from 'react-native';

/**
 * Aura Health Design System - Typography
 *
 * Dual-Font System:
 * - Serif fonts for headings (editorial feel)
 * - Sans-serif fonts for UI and data (modern clarity)
 */
export const typography = {
  // Font 1: Serif for major headings and editorial content
  heading: Platform.select({
    ios: 'New York',
    android: 'serif',
    default: 'Lora, Merriweather, "Times New Roman", serif'
  }),

  // Font 2: Sans-serif for UI, data, and body text
  body: Platform.select({
    ios: 'SF Pro Text',
    android: 'Roboto',
    default: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif'
  }),

  // Monospace for code/technical content
  mono: 'SF Mono, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',

  // Font sizes - refined scale
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 28,
    xxxl: 34,
    display: 42,
  },

  // Font weights
  weights: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    heavy: '800',
  },
};

/**
 * Aura Health Design System - Spacing
 *
 * Card-based layout with generous spacing:
 * - Inter-card margins: 16-24px
 * - Intra-card padding: 16-20px
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,    // Standard card margin/padding
  lg: 20,    // Large card padding
  xl: 24,    // Inter-card spacing
  xxl: 32,
  xxxl: 48,
  display: 64,
};

/**
 * Updated Design System - Based on Modern Design Tokens
 *
 * Matches the provided CSS custom properties with refined color palette
 * Using OKLCH color space values converted to hex for React Native compatibility
 */
export const colors = {
  // Base Palette (Light Mode) - Matching CSS custom properties
  background: '#DCDEE2',        // --background
  surface: '#ffffff',           // --card
  cardBg: '#ffffff',            // Same as surface

  // Essential UI Colors
  black: '#030213',             // --primary (dark blue-black)
  white: '#ffffff',             // Pure white

  // Text Colors (From design tokens)
  textPrimary: '#030213',       // --foreground (dark blue-black)
  textSecondary: '#717182',     // --muted-foreground (medium grey)
  textTertiary: '#cbced4',      // Lighter grey for placeholders
  textInverse: '#ffffff',       // White text for dark backgrounds

  // Aurora Gradient Palette (For charts, graphs, progress bars)
  aurora: {
    blue: '#007AFF',            // Vibrant Blue
    violet: '#AF52DE',          // Soft Violet
    teal: '#5AC8FA',            // Bright Teal
    pink: '#FF2D55',            // Warm Red/Pink
    green: '#34C759',           // Energetic Green
    orange: '#FF9500',          // Warm Orange
  },

  // Extended Color Palette (Soft, mesh-like gradients)
  blue: {
    50: '#F0F8FF',
    100: '#E6F3FF',
    200: '#BAE6FD',
    300: '#7DD3FC',
    400: '#38BDF8',
    500: '#007AFF',
    600: '#0369A1',
    700: '#0C4A6E',
  },

  green: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#34C759',
    600: '#16A34A',
    700: '#15803D',
  },

  purple: {
    50: '#FAF5FF',
    100: '#F3E8FF',
    200: '#E9D5FF',
    300: '#D8B4FE',
    400: '#C084FC',
    500: '#AF52DE',
    600: '#9333EA',
    700: '#7C3AED',
  },

  pink: {
    50: '#FDF2F8',
    100: '#FCE7F3',
    200: '#FBCFE8',
    300: '#F9A8D4',
    400: '#F472B6',
    500: '#FF2D55',
    600: '#EC4899',
    700: '#BE185D',
  },

  teal: {
    50: '#F0FDFA',
    100: '#CCFBF1',
    200: '#99F6E4',
    300: '#5EEAD4',
    400: '#2DD4BF',
    500: '#5AC8FA',
    600: '#0D9488',
    700: '#0F766E',
  },

  yellow: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#FF9500',
    600: '#D97706',
    700: '#A16207',
  },

  // Updated Design Token Colors
  primary: '#030213',           // --primary
  primaryForeground: '#ffffff', // --primary-foreground
  secondary: '#f0f0f3',         // --secondary (OKLCH to hex approximation)
  secondaryForeground: '#030213', // --secondary-foreground
  muted: '#ececf0',             // --muted
  mutedForeground: '#717182',   // --muted-foreground
  accent: '#e9ebef',            // --accent
  accentForeground: '#030213',  // --accent-foreground

  // Neutral Greys (Updated to match design tokens)
  gray: {
    50: '#f9f9fb',
    100: '#f3f3f5',              // --input-background
    200: '#ececf0',              // --muted
    300: '#e9ebef',              // --accent
    400: '#cbced4',              // --switch-background
    500: '#717182',              // --muted-foreground
    600: '#5a5a6b',
    700: '#404051',
    800: '#2a2a3a',
    900: '#030213',              // --primary
  },

  // Semantic Colors (Updated)
  success: '#22c55e',           // Modern green
  warning: '#f59e0b',           // Modern amber
  error: '#d4183d',             // --destructive
  info: '#3b82f6',              // Modern blue

  // UI Elements (Updated to match design tokens)
  border: 'rgba(0, 0, 0, 0.1)', // --border
  borderStrong: '#717182',      // Stronger border
  separator: '#f3f3f5',         // Subtle separator
  divider: 'rgba(0, 0, 0, 0.1)', // Section divider

  // Status Meter Colors (Pet system)
  energyColor: '#FF9500',       // Orange for energy
  healthColor: '#FF2D55',       // Pink for health
  happinessColor: '#007AFF',    // Blue for happiness
};

/**
 * Aura Health Design System - Global Styles
 *
 * Sophisticated data-driven interface with collectible fun elements.
 * Card-based architecture with generous spacing and elegant typography.
 *
 * Usage:
 * import { colors, spacing, typography, globalStyles } from '../theme';
 */
export const globalStyles = {
  // Typography Styles (using dual-font system)
  // Serif headings for editorial feel
  pageTitle: {
    fontSize: typography.sizes.display,
    fontFamily: typography.heading, // Serif
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xl,
  },

  sectionHeader: {
    fontSize: typography.sizes.xxl,
    fontFamily: typography.heading, // Serif
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },

  sectionSubheader: {
    fontSize: typography.sizes.xl,
    fontFamily: typography.heading, // Serif
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },

  // Sans-serif for UI and data
  bodyText: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body, // Sans-serif
    fontWeight: typography.weights.normal,
    color: colors.textPrimary,
    lineHeight: 22,
  },

  secondaryText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body, // Sans-serif
    fontWeight: typography.weights.normal,
    color: colors.textSecondary,
    lineHeight: 18,
  },

  captionText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.body, // Sans-serif
    fontWeight: typography.weights.normal,
    color: colors.textTertiary,
    lineHeight: 16,
  },

  // Data display (numbers, metrics)
  largeNumber: {
    fontSize: typography.sizes.display,
    fontFamily: typography.body, // Sans-serif for data clarity
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },

  mediumNumber: {
    fontSize: typography.sizes.xxxl,
    fontFamily: typography.body, // Sans-serif for data clarity
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },

  smallNumber: {
    fontSize: typography.sizes.xl,
    fontFamily: typography.body, // Sans-serif for data clarity
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },

  // Card System (16-20px corner radius, subtle shadows)
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    padding: spacing.lg,
    borderRadius: 18, // Significant corner radius
    // Subtle diffuse drop shadow
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2, // Android shadow
  },

  cardLarge: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginVertical: spacing.md,
    padding: spacing.xl,
    borderRadius: 20, // Larger corner radius
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },

  // Buttons (pill-shaped for selected states)
  buttonPrimary: {
    backgroundColor: colors.textPrimary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 25, // Pill-shaped
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  buttonTextPrimary: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },

  buttonSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 25, // Pill-shaped
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonTextSecondary: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },

  // Tab System
  tabContainer: {
    backgroundColor: colors.surface,
    borderRadius: 25,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    paddingVertical: spacing.sm,
    height: 70,
  },

  tabSelected: {
    backgroundColor: colors.textPrimary,
    borderRadius: 20, // Pill-shaped selected state
    marginHorizontal: spacing.xs,
  },

  // Progress and Data Visualization
  progressBar: {
    height: 6,
    backgroundColor: colors.gray[200],
    borderRadius: 3,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Layout Elements
  separator: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.xl,
  },

  screenContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },

  contentContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
};

// Default export for backward compatibility
export default { typography, spacing, colors, globalStyles };

