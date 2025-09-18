import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated } from 'react-native';
import { typography, spacing, colors, globalStyles } from '../theme';
import { useAuth } from '../context/AuthContext';
import PetComponent from '../components/PetComponent';

/**
 * HomeScreen Component - Main Dashboard
 *
 * The primary hub where users interact with their virtual pet and view daily progress.
 * Features:
 * - Virtual pet display with Pokemon evolution system
 * - Pet interaction (feed, play, clean) affects stats and XP
 * - Daily progress stats (steps, calories, distance, meals)
 * - Collection progress overview
 *
 * Pet Evolution System:
 * - Starts as Bulbasaur (level 1)
 * - Evolves to Ivysaur at level 10
 * - Evolves to Venusaur at level 20
 * - XP gained through interactions and activities
 *
 * Navigation: Provides access to Pokedex via PetComponent
 */
export default function HomeScreen({ navigation }) {
  const { user } = useAuth();

  // TEMPORARY: Mock pet status data - will be replaced with real data from backend
  const [happiness, setHappiness] = useState(85);
  const [energy, setEnergy] = useState(72);
  const [health, setHealth] = useState(90);

  // Pet data with Pokemon evolution system
  // NOTE: pokemonId should be '1' for Bulbasaur, currently shows Ivysaur (ID '2')
  const [petData, setPetData] = useState({
    name: 'BULBASAUR',
    level: 50, // High level for demo purposes
    xp: 1,
    maxXp: 1000,
    stage: 'young', // Evolution stages: young -> adult -> ultimate
    species: 'grass',
    pokemonId: '1', // Bulbasaur ID (fixed from previous value)
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
      {/* MAIN STAGE: Pet's Environment (Now includes all status info) */}
      <PetComponent
        pet={petData}
        onPlay={handlePetPlay}
        statusMeters={{ energy, health, happiness }}
        navigation={navigation}
      />

      {/* STATS SECTION - TEMPORARY: Mock data for demonstration */}
      <View style={styles.section}>
        <Text style={globalStyles.sectionHeader}>Today's Progress</Text>
        <View style={styles.statsGrid}>
          {/* Distance Card */}
          <View style={[styles.statCard, { backgroundColor: colors.yellow[100] }]}>
            <Text style={globalStyles.largeNumber}>2.3</Text>
            <Text style={globalStyles.secondaryText}>km walked</Text>
          </View>
          {/* Calories Card */}
          <View style={[styles.statCard, { backgroundColor: colors.blue[100] }]}>
            <Text style={globalStyles.largeNumber}>420</Text>
            <Text style={globalStyles.secondaryText}>calories</Text>
          </View>
        </View>
        <View style={styles.statsGrid}>
          {/* Steps Card */}
          <View style={[styles.statCard, { backgroundColor: colors.green[100] }]}>
            <Text style={globalStyles.largeNumber}>1,240</Text>
            <Text style={globalStyles.secondaryText}>steps</Text>
          </View>
          {/* Meals Card */}
          <View style={[styles.statCard, { backgroundColor: colors.purple[100] }]}>
            <Text style={globalStyles.largeNumber}>3</Text>
            <Text style={globalStyles.secondaryText}>meals logged</Text>
          </View>
        </View>
      </View>

      <View style={globalStyles.separator} />


      {/* COLLECTION SECTION */}
      <View style={styles.section}>
        <Text style={globalStyles.sectionHeader}>Collection</Text>
        <View style={[styles.collectionCard, { backgroundColor: colors.pink[100] }]}>
          <View style={styles.collectionStats}>
            <Text style={globalStyles.mediumNumber}>8</Text>
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
    paddingTop: 60, // Add top padding for status bar
    paddingBottom: 100, // Add bottom padding for floating tab bar
  },

  // Section styling
  section: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },

  // Stats Grid
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
    borderWidth: 1,
    borderColor: colors.black,
  },

  // Collection card
  collectionCard: {
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.black,
  },


  // Collection styles
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


