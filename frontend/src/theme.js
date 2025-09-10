export const typography = {
  heading: 'PressStart2P_400Regular',
  body: 'Montserrat_400Regular',
  bodyBold: 'Montserrat_700Bold',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const colors = {
  background: '#f8f9fa',
  surface: '#ffffff',
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  border: '#e5e7eb',
  accent: '#3b82f6',
  success: '#10b981',
  danger: '#ef4444',
};

export const card = {
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
};

export default { typography, spacing, colors, card };

