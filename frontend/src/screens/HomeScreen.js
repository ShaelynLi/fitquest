import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
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
    size: 'medium',
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
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
  },
  greeting: {
    fontSize: 16,
    color: '#6b7280',
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  logoutText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  petSection: {
    padding: 20,
  },
  petCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
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
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  xpBarContainer: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpBar: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  xpText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  nutritionSection: {
    padding: 20,
    paddingTop: 0,
  },
  nutritionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  caloriesSection: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  caloriesNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: '#111827',
  },
  caloriesLabel: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  caloriesTarget: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  macrosSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  macroValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  macroTarget: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  runningSection: {
    padding: 20,
    paddingTop: 0,
    paddingBottom: 40,
  },
  runningCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
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
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
});


