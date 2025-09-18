export const typography = {
  // Modern Helvetica-style font stack
  heading: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  mono: 'SF Mono, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',

  // Font sizes
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 32,
    xxxl: 48,
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

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
};

// Clean Colorful Theme (inspired by reference)
export const colors = {
  // Core backgrounds (Light theme)
  background: '#f3f4f6',        // Light gray app background
  surface: '#ffffff',           // White surfaces
  cardBg: '#ffffff',            // White card background

  // Color palette inspired by reference
  black: '#000000',             // Pure black
  white: '#ffffff',             // Pure white

  // Soft color palette
  yellow: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
  },
  blue: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
  },
  green: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
  },
  purple: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
  },
  pink: {
    50: '#fdf2f8',
    100: '#fce7f3',
    200: '#fbcfe8',
    300: '#f9a8d4',
    400: '#f472b6',
    500: '#ec4899',
  },
  orange: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',
  },

  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  // Primary colors
  primary: '#000000',           // Black primary
  secondary: '#6b7280',         // Gray secondary
  accent: '#f59e0b',            // Yellow accent

  // Text colors
  textPrimary: '#000000',       // Primary text on light
  textSecondary: '#6b7280',     // Secondary text on light
  textTertiary: '#9ca3af',      // Tertiary text on light
  textInverse: '#ffffff',       // Inverse (for dark chips)

  // UI elements
  border: '#e5e7eb',            // Light border
  borderDark: '#000000',        // Black border
  separator: '#f3f4f6',         // Subtle separator
  divider: '#e5e7eb',           // Section divider

  // Status colors
  success: '#22c55e',           // Green success
  warning: '#f59e0b',           // Yellow warning
  error: '#ef4444',             // Red error
  info: '#3b82f6',              // Blue info

  // Status meter colors
  energyColor: '#f59e0b',       // Yellow for energy
  healthColor: '#ef4444',       // Red for health
  happinessColor: '#3b82f6',    // Blue for happiness
};

/**
 * Global Design System Styles
 *
 * This file defines the complete design system for the FitQuest app.
 * All components should use these tokens for consistent styling.
 *
 * Usage:
 * import { colors, spacing, typography, globalStyles } from '../theme';
 */

// Global Clean Styles - Black & White Theme
export const globalStyles = {
  // Section header
  sectionHeader: {
    fontSize: typography.sizes.xl,
    fontFamily: typography.heading,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    marginTop: spacing.xl,
  },

  // Section subheader
  sectionSubheader: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.heading,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },

  // Body text
  bodyText: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    fontWeight: typography.weights.normal,
    color: colors.textPrimary,
    lineHeight: 24,
  },

  // Secondary text
  secondaryText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    fontWeight: typography.weights.normal,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  // Large number display
  largeNumber: {
    fontSize: typography.sizes.xxxl,
    fontFamily: typography.heading,
    fontWeight: typography.weights.heavy,
    color: colors.textPrimary,
  },

  // Medium number display
  mediumNumber: {
    fontSize: typography.sizes.xxl,
    fontFamily: typography.heading,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },

  // Clean rounded card (no shadow)
  card: {
    backgroundColor: colors.cardBg,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.black,
  },

  // Section separator
  separator: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.lg,
  },

  // Button - primary
  buttonPrimary: {
    backgroundColor: colors.black,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Button text - primary
  buttonTextPrimary: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },

  // Button - secondary
  buttonSecondary: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.black,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Button text - secondary
  buttonTextSecondary: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    fontWeight: typography.weights.semibold,
    color: colors.black,
  },

  // Progress bar
  progressBar: {
    height: 4,
    backgroundColor: colors.gray[200],
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: colors.black,
  },

  // Tab bar (clean, no shadow)
  tabBar: {
    backgroundColor: colors.white,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: colors.border,
    paddingBottom: 8,
    paddingTop: 8,
    height: 60,
  },
};

// Default export for backward compatibility
export default { typography, spacing, colors, globalStyles };

