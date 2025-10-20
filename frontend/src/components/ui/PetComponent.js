import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';
import { getMoodConfig } from '../../utils/petMood';

/**
 * PetComponent - Interactive Virtual Pet Display
 *
 * Core component that displays the user's virtual Pokemon pet with interactive features.
 * Handles pet animations, interactions, and navigation to the collection screen.
 *
 * Props:
 * @param {Object} pet - Pet data object containing:
 *   - name: Pet's name (e.g., "BULBASAUR")
 *   - level: Current level
 *   - xp: Current experience points
 *   - maxXp: Experience points needed for next level
 *   - pokemonId: Pokemon sprite ID for API calls
 *   - pokemonVariant: Sprite variant (e.g., "showdown")
 * @param {Function} onPlay - Callback for pet interactions (feed, play, clean)
 * @param {Object} statusMeters - Pet status with energy, health, happiness values
 * @param {Object} navigation - React Navigation object for screen navigation
 * @param {number} moodPercentage - Daily goal completion percentage for pet mood (0-100)
 *
 * Features:
 * - Animated Pokemon sprites from PokeAPI
 * - Breathing animation for liveliness
 * - Particle effects on interaction
 * - Collection button to navigate to Pokedex
 * - XP progress bar
 * - Pixel art aesthetic with grid background
 *
 * NOTE: GIF animations may not work on all platforms due to React Native limitations.
 * Consider using react-native-fast-image for better GIF support if needed.
 */
const PetScreen = ({ pet, onPlay, statusMeters = {}, navigation, moodPercentage = 0 }) => {
  const [animatedValue] = useState(new Animated.Value(1));
  const [particles, setParticles] = useState([]);

  // Extract status meters with defaults
  const { energy = 72, health = 90, happiness = 85 } = statusMeters;
  
  // Get mood configuration based on completion percentage
  const moodConfig = getMoodConfig(moodPercentage);

  // Simple breathing animation for the pet
  useEffect(() => {
    const breathingAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    breathingAnimation.start();

    return () => breathingAnimation.stop();
  }, []);

  // Handle tap interaction - play with pet
  const handlePetTap = () => {
    // Create heart particles
    const newParticles = Array.from({ length: 3 }, (_, i) => ({
      id: Date.now() + i,
      x: 120 + (Math.random() - 0.5) * 80,
      y: 120 + (Math.random() - 0.5) * 40,
    }));

    setParticles(newParticles);

    // Remove particles after animation
    setTimeout(() => {
      setParticles([]);
    }, 2000);

    // Call parent handler
    if (onPlay) {
      onPlay();
    }
  };

  // Handle Tamagotchi actions
  const handleAction = (action) => {
    const actionParticles = {
      feed: { emoji: '🍎', count: 2 },
      play: { emoji: '⭐', count: 4 },
      clean: { emoji: '✨', count: 3 },
    };

    const { emoji, count } = actionParticles[action] || { emoji: '❤️', count: 3 };

    // Create action-specific particles
    const newParticles = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      x: 120 + (Math.random() - 0.5) * 80,
      y: 120 + (Math.random() - 0.5) * 40,
      emoji,
    }));

    setParticles(newParticles);

    // Remove particles after animation
    setTimeout(() => {
      setParticles([]);
    }, 2000);

    // Call parent handler with action type
    if (onPlay) {
      onPlay(action);
    }
  };

  // Handle collection button press
  const handleCollectionPress = () => {
    if (navigation) {
      navigation.navigate('PetCollection');
    }
  };

  // Grid removed for cleaner pet area

  /**
   * Pokemon Sprite URL Generator
   *
   * Builds the appropriate sprite URL based on pet data and variant.
   * Uses PokeAPI sprite repository for consistent Pokemon images.
   *
   * IMPORTANT: React Native Image component limitations:
   * - Android: Does NOT support animated GIFs from remote URLs by default
   * - iOS: Only supports animated GIFs for local files, not remote URLs
   * - For full GIF animation support, consider using 'react-native-fast-image'
   *
   * Current behavior: Shows first frame of GIF on most platforms
   *
   * @returns {Object|null} Image source object or null if no valid ID
   */
  const getPetSprite = () => {
    // Use custom sprite URI if provided
    if (pet?.spriteUri) return { uri: pet.spriteUri };

    // Validate Pokemon ID
    const id = String(pet?.pokemonId || '').trim();
    if (!id) return null;

    // Determine sprite variant
    const variant = (pet?.pokemonVariant || 'official-artwork').toLowerCase();
    const base = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

    // Sprite variant handling
    if (variant === 'showdown') {
      // Generation V Black/White animated sprites (pixelated style)
      return { uri: `${base}/versions/generation-v/black-white/animated/${id}.gif` };
    }
    if (variant === 'dream-world') {
      // Note: RN Image does not support SVG natively; fallback to PNG
      return { uri: `${base}/other/official-artwork/${id}.png` };
    }
    // Default: High-quality official artwork (PNG)
    return { uri: `${base}/other/official-artwork/${id}.png` };
  };


  // Render pet based on stage
  const renderPet = () => {
    return (
      <Animated.View
        style={[
          styles.petContainer,
          {
            transform: [{ scale: animatedValue }],
          },
        ]}
      >
        {/* Display mock pet sprite */}
        <View style={styles.petSprite}>
          {getPetSprite() ? (
            <Image
              source={getPetSprite()}
              style={styles.petImage}
              resizeMode="contain"
              onError={(error) => console.log('Image error:', error)}
            />
          ) : (
            <Text style={styles.fallbackText}>🐱</Text>
          )}
        </View>

        {/* Pet shadow/outline effect */}
        <View style={styles.petShadow} />
      </Animated.View>
    );
  };

  // Render floating particles
  const renderParticles = () => {
    return particles.map((particle) => (
      <Animated.View
        key={particle.id}
        style={[
          styles.particle,
          {
            left: particle.x,
            top: particle.y,
          },
        ]}
      >
        <Text style={styles.particleText}>{particle.emoji || '❤️'}</Text>
      </Animated.View>
    ));
  };

  return (
    <View style={styles.screenContainer}>
      {/* Main Pixel Screen */}
      <View style={styles.pixelScreen}>

        {/* Collection Button - Top Right */}
        <TouchableOpacity style={styles.collectionButton} onPress={handleCollectionPress}>
          <Ionicons name="library" size={20} color={colors.white} />
        </TouchableOpacity>

        {/* Main Pet Area - Vertical Layout */}
        <TouchableOpacity
          style={styles.petMainArea}
          onPress={handlePetTap}
          activeOpacity={0.8}
        >
          {/* Pet Sprite */}
          {renderPet()}

          {/* Pet Name */}
          <Text style={styles.petName}>{pet.name}</Text>

          {/* Pet Mood */}
          <View style={[styles.moodBadge, { backgroundColor: moodConfig.backgroundColor }]}>
            <Text style={styles.moodEmoji}>{moodConfig.emoji}</Text>
            <Text style={[styles.moodText, { color: moodConfig.color }]}>
              {moodConfig.name}
            </Text>
          </View>

          {/* Level */}
          <Text style={styles.petLevel}>Level {pet.level}</Text>

          {/* XP Bar */}
          <View style={styles.xpSection}>
            <View style={styles.xpBarContainer}>
              <View
                style={[
                  styles.xpBarFill,
                  { width: `${(pet.xp / pet.maxXp) * 100}%` }
                ]}
              />
            </View>
            <Text style={styles.xpText}>{pet.xp}/{pet.maxXp} XP</Text>
          </View>

          {/* Floating Particles */}
          {renderParticles()}
        </TouchableOpacity>

        {/* Screen Border Effects */}
        <View style={styles.screenGlow} />
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    width: '100%',
    alignItems: 'center',
  },
  pixelScreen: {
    width: '100%',
    height: 400,
    backgroundColor: colors.gray[50],
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    position: 'relative',
    overflow: 'hidden',
  },

  // Pixel Grid Pattern
  pixelGridContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  pixelSquare: {
    position: 'absolute',
    borderWidth: 0.3,
    borderColor: colors.border, // Subtle grid lines
    opacity: 0.2,
  },

  // Collection Button
  collectionButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 40,
    height: 40,
    backgroundColor: colors.black,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: colors.black,
  },

  // Main Pet Area - Vertical Layout
  petMainArea: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    bottom: 80,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },

  // Pet Name
  petName: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.heading,
    color: colors.textPrimary,
    fontWeight: typography.weights.bold,
    marginTop: spacing.md,
    textAlign: 'center',
  },

  // Pet Level
  petLevel: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
    marginTop: spacing.xs,
    textAlign: 'center',
  },

  // XP Section
  xpSection: {
    alignItems: 'center',
    marginTop: spacing.md,
    width: '100%',
  },
  petContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  petSprite: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  petImage: {
    width: '100%',
    height: '100%',
  },
  fallbackText: {
    fontSize: 48,
    textAlign: 'center',
  },

  petShadow: {
    position: 'absolute',
    bottom: -5,
    width: 48,
    height: 8,
    backgroundColor: '#8B956D',
    borderRadius: 24,
    opacity: 0.3,
    zIndex: -1,
  },


  // Particles
  particle: {
    position: 'absolute',
    zIndex: 15,
  },
  particleText: {
    fontSize: 16,
  },

  // XP Bar (centered)
  xpBarContainer: {
    width: 200,
    height: 8,
    backgroundColor: colors.gray[200],
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 4,
    marginBottom: spacing.xs,
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: colors.black,
    borderRadius: 4,
  },
  xpText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
    textAlign: 'center',
  },

  // Screen Effects - Remove glow for cleaner pixel look
  screenGlow: {
    display: 'none',
  },

  // Pet Mood Badge
  moodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  moodEmoji: {
    fontSize: typography.sizes.md,
  },
  moodText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    fontWeight: typography.weights.semibold,
  },
});

export default PetScreen;