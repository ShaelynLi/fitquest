import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { typography, spacing, colors, card } from '../theme';
import { useAuth } from '../context/AuthContext';
import PetComponent from '../components/PetComponent';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  
  // Mock data - will be replaced with real data from API
  const petData = {
    name: "Cinderburrow",
    level: 5,
    xp: 750,
    maxXp: 1000,
    mood: "Happy",
    size: 'large',
  };
  
  const nutritionData = {
    calories: 1250,
    targetCalories: 2000,
    protein: 85,
    carbs: 120,
    fat: 45,
    proteinTarget: 150,
    carbsTarget: 200,
    fatTarget: 80
  };
  
  const runningData = {
    monthlyDistance: 45.2,
    dailySteps: 8500,
    weeklyRuns: 3,
    totalRuns: 28
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back!</Text>
          <Text style={styles.userName}>{user?.email?.split('@')[0] || 'User'}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Pet Section */}
      <View style={styles.petSection}>
        <Text style={styles.sectionTitle}>Your Pet Companion</Text>
        <View style={styles.petCard}>
          <PetComponent 
            petData={petData}
            onInteraction={() => {
              // Handle pet interaction (XP gain, sound, etc.)
              console.log('Pet interacted! +10 XP');
            }}
          />
          <View style={styles.xpSection}>
            <Text style={styles.xpLabel}>XP Progress</Text>
            <View style={styles.xpBarContainer}>
              <View style={[styles.xpBar, { width: `${(petData.xp / petData.maxXp) * 100}%` }]} />
            </View>
            <Text style={styles.xpText}>{petData.xp} / {petData.maxXp} XP</Text>
          </View>
        </View>
      </View>

      {/* Nutrition Section */}
      <View style={styles.nutritionSection}>
        <Text style={styles.sectionTitle}>Today's Nutrition</Text>
        <View style={styles.nutritionCard}>
          <View style={styles.caloriesSection}>
            <Text style={styles.caloriesNumber}>{nutritionData.calories}</Text>
            <Text style={styles.caloriesLabel}>calories</Text>
            <Text style={styles.caloriesTarget}>of {nutritionData.targetCalories} goal</Text>
          </View>
          <View style={styles.macrosSection}>
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Protein</Text>
              <Text style={styles.macroValue}>{nutritionData.protein}g</Text>
              <Text style={styles.macroTarget}>/ {nutritionData.proteinTarget}g</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Carbs</Text>
              <Text style={styles.macroValue}>{nutritionData.carbs}g</Text>
              <Text style={styles.macroTarget}>/ {nutritionData.carbsTarget}g</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Fat</Text>
              <Text style={styles.macroValue}>{nutritionData.fat}g</Text>
              <Text style={styles.macroTarget}>/ {nutritionData.fatTarget}g</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Running Metrics Section */}
      <View style={styles.runningSection}>
        <Text style={styles.sectionTitle}>Running Stats</Text>
        <View style={styles.runningCard}>
          <View style={styles.metricRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{runningData.monthlyDistance}km</Text>
              <Text style={styles.metricLabel}>This Month</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{runningData.dailySteps.toLocaleString()}</Text>
              <Text style={styles.metricLabel}>Steps Today</Text>
            </View>
          </View>
          <View style={styles.metricRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{runningData.weeklyRuns}</Text>
              <Text style={styles.metricLabel}>Runs This Week</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{runningData.totalRuns}</Text>
              <Text style={styles.metricLabel}>Total Runs</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: 60,
    backgroundColor: colors.surface,
  },
  greeting: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.textSecondary,
  },
  userName: {
    fontFamily: typography.heading,
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 22,
    marginTop: spacing.xs,
  },
  logoutButton: {
    backgroundColor: colors.danger,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 6,
  },
  logoutText: {
    color: 'white',
    fontFamily: typography.bodyBold,
    fontSize: 12,
  },
  sectionTitle: {
    fontFamily: typography.heading,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  petSection: {
    padding: spacing.lg,
  },
  petCard: card.container,
  petInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  petImage: {
    fontSize: 48,
    marginRight: 16,
  },
  petDetails: {
    flex: 1,
  },
  petName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
  },
  petLevel: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 2,
  },
  petMood: {
    fontSize: 14,
    color: '#10b981',
    marginTop: 4,
  },
  xpSection: {
    marginTop: 8,
  },
  xpLabel: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  xpBarContainer: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpBar: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 4,
  },
  xpText: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  nutritionSection: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  nutritionCard: card.container,
  caloriesSection: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  caloriesNumber: {
    fontFamily: typography.bodyBold,
    fontSize: 32,
    color: colors.textPrimary,
  },
  caloriesLabel: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  caloriesTarget: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  macrosSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroLabel: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  macroValue: {
    fontFamily: typography.bodyBold,
    fontSize: 18,
    color: colors.textPrimary,
  },
  macroTarget: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  runningSection: {
    padding: spacing.lg,
    paddingTop: 0,
    paddingBottom: spacing.xl,
  },
  runningCard: card.container,
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontFamily: typography.bodyBold,
    fontSize: 22,
    color: colors.textPrimary,
  },
  metricLabel: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});


