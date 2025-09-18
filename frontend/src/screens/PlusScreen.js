import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, globalStyles } from '../theme';

/**
 * PlusScreen Component - Quick Actions Hub
 *
 * TEMPORARY: This is a placeholder screen for quick action buttons.
 * TODO: Implement actual navigation to relevant screens when they are ready.
 * TODO: Add functionality to log meals and weight tracking.
 * TODO: Connect "Start Run" action to RunScreen flow.
 *
 * Purpose: Provides quick access to common user actions from the center tab.
 */
export default function PlusScreen() {
  // TEMPORARY: Placeholder handlers - will be replaced with real navigation
  const handleStartRun = () => {
    console.log('TODO: Navigate to Run flow');
  };

  const handleLogMeal = () => {
    console.log('TODO: Open meal logging modal or navigate to Food screen');
  };

  const handleLogWeight = () => {
    console.log('TODO: Open weight logging modal');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Actions</Text>
      <Text style={styles.subtitle}>
        Access your most common tasks quickly
      </Text>

      <View style={styles.actions}>
        {/* Start Run Action */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleStartRun}
        >
          <Ionicons name="walk" size={24} color={colors.white} />
          <Text style={styles.actionText}>Start Run</Text>
        </TouchableOpacity>

        {/* Log Meal Action */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleLogMeal}
        >
          <Ionicons name="restaurant" size={24} color={colors.white} />
          <Text style={styles.actionText}>Log Meal</Text>
        </TouchableOpacity>

        {/* Log Weight Action - TEMPORARY placeholder */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleLogWeight}
        >
          <Ionicons name="fitness" size={24} color={colors.white} />
          <Text style={styles.actionText}>Log Weight</Text>
        </TouchableOpacity>
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
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  actions: {
    gap: spacing.lg,
    width: '100%',
    maxWidth: 280,
  },
  actionButton: {
    ...globalStyles.buttonPrimary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  actionText: {
    ...globalStyles.buttonTextPrimary,
    fontSize: typography.sizes.lg,
  },
});
