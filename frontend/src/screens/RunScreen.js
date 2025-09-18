import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme';

/**
 * RunScreen Component - Running Activity Tracker
 *
 * ⚠️ TEMPORARY PLACEHOLDER SCREEN ⚠️
 *
 * TODO: Implement full running functionality:
 * - Pre-run setup (distance goal, route planning)
 * - Live tracking (GPS, pace, distance, time)
 * - Post-run summary (stats, map, achievements)
 * - Integration with pet evolution (XP gain from exercise)
 *
 * Future Features:
 * - Route history and favorites
 * - Training plans and challenges
 * - Social features (sharing runs)
 * - Weather integration
 * - Music/podcast integration
 */
export default function RunScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏃‍♂️ Run Tracker</Text>
      <Text style={styles.subtitle}>Coming Soon</Text>
      <Text style={styles.description}>
        Pre-Run / Live Tracking / Summary flow will be implemented here.
      </Text>

      {/* TEMPORARY: Development notes */}
      <View style={styles.devNotes}>
        <Text style={styles.devNotesTitle}>Development Plan:</Text>
        <Text style={styles.devNotesText}>
          • GPS tracking and route mapping{'\n'}
          • Real-time stats (pace, distance, time){'\n'}
          • Pet XP integration for motivation{'\n'}
          • Achievement system{'\n'}
          • Run history and analytics
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: typography.sizes.xxxl,
    fontFamily: typography.heading,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizes.xl,
    fontFamily: typography.heading,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  description: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xxl,
  },
  devNotes: {
    backgroundColor: colors.yellow[50],
    borderWidth: 1,
    borderColor: colors.yellow[200],
    borderRadius: 12,
    padding: spacing.lg,
    maxWidth: '100%',
  },
  devNotesTitle: {
    fontSize: typography.sizes.md,
    fontFamily: typography.heading,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  devNotesText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});


