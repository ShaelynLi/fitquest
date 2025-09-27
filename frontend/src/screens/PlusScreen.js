import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, globalStyles } from '../theme';

/**
 * PlusScreen Component - Quick Actions Hub
 *
 * Updated with Aura Health design system - card-based layout with sophisticated styling.
 * Provides quick access to common user actions from the dedicated Plus tab.
 *
 * Features:
 * - Card-based action buttons with Aurora gradient colors
 * - Elegant typography using dual-font system
 * - Quick access to primary app functions
 */
export default function PlusScreen() {
  // Action handlers - will be connected to navigation
  const handleStartRun = () => {
    console.log('TODO: Navigate to Run tab in Home screen');
  };

  const handleLogMeal = () => {
    console.log('TODO: Navigate to Food tab in Home screen');
  };

  const handleViewCollection = () => {
    console.log('TODO: Navigate to Collection/Pokedex screen');
  };

  const handleViewProgress = () => {
    console.log('TODO: Navigate to Progress/Analytics screen');
  };

  return (
    <View style={globalStyles.screenContainer}>
      <ScrollView style={globalStyles.contentContainer}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={globalStyles.pageTitle}>Quick Actions</Text>
          <Text style={globalStyles.bodyText}>
            Access your most common tasks quickly
          </Text>
        </View>

        {/* Primary Actions */}
        <View style={globalStyles.cardLarge}>
          <Text style={globalStyles.sectionSubheader}>Primary Actions</Text>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.aurora.green }]}
            onPress={handleStartRun}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="walk" size={28} color={colors.white} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Start Run</Text>
              <Text style={styles.actionDescription}>Begin GPS tracking</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.white} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.aurora.blue }]}
            onPress={handleLogMeal}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="restaurant" size={28} color={colors.white} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Log Meal</Text>
              <Text style={styles.actionDescription}>Track nutrition</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Secondary Actions */}
        <View style={globalStyles.card}>
          <Text style={globalStyles.sectionSubheader}>Explore</Text>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.aurora.violet }]}
            onPress={handleViewCollection}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="apps" size={28} color={colors.white} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Pet Collection</Text>
              <Text style={styles.actionDescription}>View your pets</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.white} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.aurora.teal }]}
            onPress={handleViewProgress}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="analytics" size={28} color={colors.white} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Progress</Text>
              <Text style={styles.actionDescription}>View analytics</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={globalStyles.card}>
          <Text style={globalStyles.sectionSubheader}>Today at a Glance</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={globalStyles.mediumNumber}>2.3</Text>
              <Text style={globalStyles.secondaryText}>km walked</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={globalStyles.mediumNumber}>420</Text>
              <Text style={globalStyles.secondaryText}>calories</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={globalStyles.mediumNumber}>3</Text>
              <Text style={globalStyles.secondaryText}>meals</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingTop: spacing.lg,
  },

  // Action Button Styling (Aurora colors)
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: 16,
    marginBottom: spacing.md,
    // Subtle shadow for depth
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },

  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },

  actionContent: {
    flex: 1,
  },

  actionTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.body, // Sans-serif for UI
    fontWeight: typography.weights.semibold,
    color: colors.white,
    marginBottom: spacing.xs,
  },

  actionDescription: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: 'rgba(255, 255, 255, 0.8)',
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.md,
  },

  statItem: {
    alignItems: 'center',
  },
});
