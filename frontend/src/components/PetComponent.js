import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Animated } from 'react-native';

const PetComponent = ({ petData, onInteraction }) => {
  const [animationState, setAnimationState] = useState('idle');
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showXpGain, setShowXpGain] = useState(false);
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const xpGainAnim = useRef(new Animated.Value(0)).current;

  // Use cinderburrow assets; support size variants: small | medium | large
  const size = (petData?.size || 'medium').toLowerCase();
  // IMPORTANT: React Native requires static paths in require(), so we pre-map them
  const spriteMap = {
    small: {
      idle1: require('../../assets/pets/cinderburrow/cinderburrow_small_idle1.png'),
      idle2: require('../../assets/pets/cinderburrow/cinderburrow_small_idle2.png'),
      sleep: require('../../assets/pets/cinderburrow/cinderburrow_small_sleep.png'),
    },
    medium: {
      idle1: require('../../assets/pets/cinderburrow/cinderburrow_medium_idle1.png'),
      idle2: require('../../assets/pets/cinderburrow/cinderburrow_medium_idle2.png'),
      sleep: require('../../assets/pets/cinderburrow/cinderburrow_medium_sleep.png'),
    },
    large: {
      idle1: require('../../assets/pets/cinderburrow/cinderburrow_large_idle1.png'),
      idle2: require('../../assets/pets/cinderburrow/cinderburrow_large_idle2.png'),
      sleep: require('../../assets/pets/cinderburrow/cinderburrow_large_sleep.png'),
    },
  };

  const sprites = spriteMap[size] || spriteMap.medium;

  const animationFrames = {
    idle: [sprites.idle1, sprites.idle2],
    // Fallback to idle frames for states without dedicated sprites yet
    happy: [sprites.idle1, sprites.idle2],
    walk: [sprites.idle1, sprites.idle2],
    sleep: [sprites.sleep, sprites.sleep],
    eat: [sprites.idle1, sprites.idle2],
  };

  // Animation timing for each state
  const animationTiming = {
    idle: 600,
    happy: 300,
    walk: 300,
    sleep: 1200,
    eat: 400,
  };

  // Handle touch interaction
  const handleTouch = () => {
    if (isAnimating) return;
    
    setAnimationState('happy');
    setIsAnimating(true);
    setShowXpGain(true);
    
    // Bounce animation
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(bounceAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // XP gain animation
    Animated.sequence([
      Animated.timing(xpGainAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(xpGainAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowXpGain(false);
    });

    // Call interaction callback
    onInteraction?.();

    // Reset to idle after happy animation
    setTimeout(() => {
      setAnimationState('idle');
      setIsAnimating(false);
    }, 1500);
  };

  // Animation loop
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isAnimating) {
        setCurrentFrame(prev => {
          const frames = animationFrames[animationState];
          return (prev + 1) % frames.length;
        });
      }
    }, animationTiming[animationState]);

    return () => clearInterval(interval);
  }, [animationState, isAnimating]);

  // Get current frame image
  const getCurrentImage = () => {
    const frames = animationFrames[animationState];
    return frames[currentFrame] || frames[0];
  };

  return (
    <TouchableOpacity onPress={handleTouch} activeOpacity={0.8} style={styles.container}>
      <View style={styles.petContainer}>
        <Animated.View style={[styles.petImageContainer, { transform: [{ scale: bounceAnim }] }]}>
          <Image 
            source={getCurrentImage()} 
            style={styles.petImage}
            resizeMode="contain"
          />
        </Animated.View>
        
        {showXpGain && (
          <Animated.View 
            style={[
              styles.xpGainContainer,
              {
                opacity: xpGainAnim,
                transform: [
                  {
                    translateY: xpGainAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -30],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.xpGainText}>+10 XP!</Text>
          </Animated.View>
        )}
        
        <View style={styles.petInfo}>
          <Text style={styles.petName}>{petData.name}</Text>
          <Text style={styles.petLevel}>Level {petData.level}</Text>
          <Text style={styles.petMood}>{petData.mood}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  petContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  petImageContainer: {
    marginBottom: 16,
  },
  petImage: {
    width: 64,
    height: 64,
  },
  xpGainContainer: {
    position: 'absolute',
    top: -20,
    left: '50%',
    marginLeft: -30,
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  xpGainText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  petInfo: {
    alignItems: 'center',
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
});

export default PetComponent;
