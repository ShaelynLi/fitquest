import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated } from 'react-native';
import { typography, spacing, colors, globalStyles } from '../theme';
import { useAuth } from '../context/AuthContext';
import { PetComponent } from '../components';

/**
 * OverviewTab Component - Pet Dashboard & Daily Stats
 *
 * The main hub where users interact with their virtual pet and view daily progress.
 * Features:
 * - Virtual pet display with Pokemon evolution system
 * - Pet interaction (feed, play, clean) affects stats and XP
 * - Daily progress stats (steps, calories, distance, meals)
 * - Collection progress overview
 *
 * Part of the nested tab navigation within HomeScreen.
 * Uses the new Aura Health design system with card-based layout.
 */
export default function OverviewTab({ navigation }) {
  const { user } = useAuth();

  // TEMPORARY: Mock pet status data - will be replaced with real data from backend
  const [happiness, setHappiness] = useState(85);
  const [energy, setEnergy] = useState(72);
  const [health, setHealth] = useState(90);

  // Pet data with Pokemon evolution system
  const [petData, setPetData] = useState({
    name: 'BULBASAUR',
    level: 50, // High level for demo purposes
    xp: 1,
    maxXp: 1000,
    stage: 'young', // Evolution stages: young -> adult -> ultimate
    species: 'grass',
    pokemonId: '1', // Bulbasaur ID
    pokemonVariant: 'showdown', // Uses generation-v animated sprites
    needsAttention: false,
  });

  // Handle pet interaction with different actions
  const handlePetPlay = (action = 'play') => {
    // Different actions affect different stats
    const actionEffects = {
      feed: { energy: 10, health: 5, happiness: 3, xp: 15 },
      play: { energy: -5, health: 2, happiness: 10, xp: 10 },
      clean: { energy: 0, health: 8, happiness: 5, xp: 5 },
    };

    const effects = actionEffects[action] || actionEffects.play;

    // Update status meters
    setEnergy(prev => Math.max(0, Math.min(100, prev + effects.energy)));
    setHealth(prev => Math.max(0, Math.min(100, prev + effects.health)));
    setHappiness(prev => Math.max(0, Math.min(100, prev + effects.happiness)));

    // Add XP for interaction
    setPetData(prev => {
      const newXp = prev.xp + effects.xp;
      let newLevel = prev.level;
      let newStage = prev.stage;
      let newName = prev.name;
      let newPokemonId = prev.pokemonId;

      // Level up logic
      if (newXp >= prev.maxXp) {
        newLevel += 1;
        // Evolution logic - Bulbasaur line progression
        if (newLevel >= 10 && prev.stage === 'young') {
          newStage = 'adult';
          newName = 'IVYSAUR';
          newPokemonId = '2';
        } else if (newLevel >= 20 && prev.stage === 'adult') {
          newStage = 'ultimate';
          newName = 'VENUSAUR';
          newPokemonId = '3';
        }
      }

      return {
        ...prev,
        xp: newXp >= prev.maxXp ? newXp - prev.maxXp : newXp,
        level: newLevel,
        stage: newStage,
        name: newName,
        pokemonId: newPokemonId,
        maxXp: newLevel * 100, // Increase XP requirement
      };
    });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* MAIN STAGE: Pet's Environment */}
      <PetComponent
        pet={petData}
        onPlay={handlePetPlay}
        statusMeters={{ energy, health, happiness }}
        navigation={navigation}
      />

      {/* TODAY'S PROGRESS - Updated with Aura Health design */}
      <View style={globalStyles.card}>
        <Text style={globalStyles.sectionHeader}>Today's Progress</Text>

        <View style={styles.statsGrid}>
          {/* Distance Card */}
          <View style={[styles.statCard, { backgroundColor: colors.aurora.teal + '20' }]}>
            <Text style={globalStyles.mediumNumber}>2.3</Text>
            <Text style={globalStyles.secondaryText}>km walked</Text>
          </View>
          {/* Calories Card */}
          <View style={[styles.statCard, { backgroundColor: colors.aurora.blue + '20' }]}>
            <Text style={globalStyles.mediumNumber}>420</Text>
            <Text style={globalStyles.secondaryText}>calories</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          {/* Steps Card */}
          <View style={[styles.statCard, { backgroundColor: colors.aurora.green + '20' }]}>
            <Text style={globalStyles.mediumNumber}>1,240</Text>
            <Text style={globalStyles.secondaryText}>steps</Text>
          </View>
          {/* Meals Card */}
          <View style={[styles.statCard, { backgroundColor: colors.aurora.violet + '20' }]}>
            <Text style={globalStyles.mediumNumber}>3</Text>
            <Text style={globalStyles.secondaryText}>meals logged</Text>
          </View>
        </View>
      </View>

      {/* COLLECTION PROGRESS - Updated with Aura Health design */}
      <View style={globalStyles.card}>
        <Text style={globalStyles.sectionHeader}>Collection</Text>
        <View style={[styles.collectionCard, { backgroundColor: colors.aurora.pink + '15' }]}>
          <View style={styles.collectionStats}>
            <Text style={globalStyles.largeNumber}>8</Text>
            <Text style={globalStyles.secondaryText}>of 25 collected</Text>
          </View>
          <View style={styles.recentCollection}>
            <Text style={globalStyles.bodyText}>Recent discoveries</Text>
            <Text style={styles.recentPets}>🐶 🐱 🐦</Text>
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

  // Stats Grid with improved spacing
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },

  statCard: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
    padding: spacing.lg,
    borderRadius: 16,
    // Subtle shadow for depth
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },

  // Collection card with improved styling
  collectionCard: {
    padding: spacing.xl,
    borderRadius: 16,
    marginTop: spacing.md,
  },

  collectionStats: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },

  recentCollection: {
    alignItems: 'center',
  },

  recentPets: {
    fontSize: typography.sizes.xl,
    marginTop: spacing.sm,
  },
});