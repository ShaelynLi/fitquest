import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';
import { useGamification } from '../../context/GamificationContext';
import { RARITY_CONFIG } from '../../data/pets';

/**
 * BlindBoxModal Component
 *
 * Handles the exciting blind box opening experience with animations
 * and reveals the new pet with rarity effects.
 */
export default function BlindBoxModal({ visible, onClose }) {
  const { blindBoxes, openBlindBox } = useGamification();
  const [isOpening, setIsOpening] = useState(false);
  const [revealedPet, setRevealedPet] = useState(null);
  const [showReveal, setShowReveal] = useState(false);

  // Animation values
  const [shakeAnimation] = useState(new Animated.Value(0));
  const [scaleAnimation] = useState(new Animated.Value(1));
  const [fadeAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      resetAnimations();
    }
  }, [visible]);

  const resetAnimations = () => {
    setIsOpening(false);
    setRevealedPet(null);
    setShowReveal(false);
    shakeAnimation.setValue(0);
    scaleAnimation.setValue(1);
    fadeAnimation.setValue(0);
  };

  const startBoxShakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0.5,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -0.5,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const startRevealAnimation = () => {
    Animated.parallel([
      Animated.timing(scaleAnimation, {
        toValue: 1.2,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleOpenBox = async () => {
    if (blindBoxes <= 0) {
      Alert.alert('No Blind Boxes', 'You need to complete running goals to earn blind boxes!');
      return;
    }

    setIsOpening(true);

    // Start shake animation
    startBoxShakeAnimation();

    try {
      // Wait for animation to complete
      setTimeout(async () => {
        const result = await openBlindBox();
        setRevealedPet(result);

        // Show reveal with animation
        setShowReveal(true);
        startRevealAnimation();
      }, 600);

    } catch (error) {
      console.error('Failed to open blind box:', error);
      Alert.alert('Error', 'Failed to open blind box. Please try again.');
      setIsOpening(false);
    }
  };

  const handleClose = () => {
    resetAnimations();
    onClose();
  };

  const getRarityGlow = (rarity) => {
    const rarityConfig = RARITY_CONFIG[rarity];
    return {
      shadowColor: rarityConfig.color,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 20,
      elevation: 10,
    };
  };

  const renderBlindBox = () => (
    <Animated.View
      style={[
        styles.blindBoxContainer,
        {
          transform: [
            {
              translateX: shakeAnimation.interpolate({
                inputRange: [-1, 1],
                outputRange: [-10, 10],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.blindBox}>
        <Text style={styles.blindBoxText}>?</Text>
        <View style={styles.blindBoxSparkles}>
          <Text style={styles.sparkle}>✨</Text>
          <Text style={[styles.sparkle, { top: 20, right: 10 }]}>✨</Text>
          <Text style={[styles.sparkle, { bottom: 15, left: 5 }]}>✨</Text>
        </View>
      </View>
    </Animated.View>
  );

  const renderRevealedPet = () => {
    if (!revealedPet) return null;

    const { pet, isNew } = revealedPet;
    const rarityConfig = RARITY_CONFIG[pet.rarity];

    return (
      <Animated.View
        style={[
          styles.revealContainer,
          {
            opacity: fadeAnimation,
            transform: [{ scale: scaleAnimation }],
          },
        ]}
      >
        <View style={[styles.petRevealCard, getRarityGlow(pet.rarity)]}>
          {/* Rarity Banner */}
          <View style={[styles.rarityBanner, { backgroundColor: rarityConfig.color }]}>
            <Text style={styles.rarityText}>{rarityConfig.name.toUpperCase()}</Text>
            <View style={styles.raritySparkles}>
              {[...Array(rarityConfig.sparkles)].map((_, i) => (
                <Text key={i} style={styles.raritySparkle}>✨</Text>
              ))}
            </View>
          </View>

          {/* Pet Image */}
          <Image source={{ uri: pet.image }} style={styles.petImage} />

          {/* Pet Info */}
          <View style={styles.petInfo}>
            <Text style={styles.petName}>{pet.name}</Text>
            <Text style={styles.petSeries}>{pet.series.toUpperCase()}</Text>
            <Text style={styles.petDescription}>{pet.description}</Text>

            {/* New/Duplicate Badge */}
            <View style={[
              styles.statusBadge,
              { backgroundColor: isNew ? colors.green[500] : colors.yellow[500] }
            ]}>
              <Text style={styles.statusText}>
                {isNew ? 'NEW!' : 'DUPLICATE'}
              </Text>
            </View>
          </View>
        </View>

        {/* Close Button */}
        <TouchableOpacity
          style={styles.revealCloseButton}
          onPress={handleClose}
        >
          <Text style={styles.revealCloseText}>Continue</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color={colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Mystery Box</Text>
            <View style={styles.boxCounter}>
              <Text style={styles.boxCountText}>{blindBoxes}</Text>
            </View>
          </View>

          {/* Main Content */}
          <View style={styles.content}>
            {!showReveal && (
              <>
                <Text style={styles.instructionText}>
                  Tap the mystery box to reveal your new companion!
                </Text>

                <TouchableOpacity
                  style={styles.boxTouchArea}
                  onPress={handleOpenBox}
                  disabled={isOpening || blindBoxes <= 0}
                >
                  {renderBlindBox()}
                </TouchableOpacity>

                <Text style={styles.hintText}>
                  {blindBoxes > 0
                    ? 'Boxes available: ' + blindBoxes
                    : 'Complete running goals to earn more boxes!'}
                </Text>
              </>
            )}

            {showReveal && renderRevealedPet()}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContainer: {
    flex: 1,
    width: '100%',
    paddingTop: 60,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },

  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    fontSize: typography.sizes.xl,
    fontFamily: typography.heading,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },

  boxCounter: {
    backgroundColor: colors.purple[500],
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },

  boxCountText: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },

  // Content
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },

  instructionText: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.body,
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.xxxl,
  },

  // Blind Box
  boxTouchArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  blindBoxContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  blindBox: {
    width: 150,
    height: 150,
    backgroundColor: colors.purple[500],
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: colors.purple[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },

  blindBoxText: {
    fontSize: 60,
    fontFamily: typography.heading,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },

  blindBoxSparkles: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },

  sparkle: {
    position: 'absolute',
    fontSize: 20,
    top: 10,
    left: 10,
  },

  hintText: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    color: colors.gray[300],
    textAlign: 'center',
    marginTop: spacing.xl,
  },

  // Reveal
  revealContainer: {
    alignItems: 'center',
    width: '100%',
  },

  petRevealCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: spacing.lg,
    alignItems: 'center',
    width: '90%',
    maxWidth: 300,
  },

  rarityBanner: {
    borderRadius: 15,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  rarityText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },

  raritySparkles: {
    flexDirection: 'row',
  },

  raritySparkle: {
    fontSize: 12,
  },

  petImage: {
    width: 120,
    height: 120,
    borderRadius: 15,
    marginBottom: spacing.md,
  },

  petInfo: {
    alignItems: 'center',
    width: '100%',
  },

  petName: {
    fontSize: typography.sizes.xl,
    fontFamily: typography.heading,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },

  petSeries: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },

  petDescription: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },

  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },

  statusText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },

  revealCloseButton: {
    backgroundColor: colors.purple[500],
    borderRadius: 25,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    marginTop: spacing.xl,
  },

  revealCloseText: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.body,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },
});