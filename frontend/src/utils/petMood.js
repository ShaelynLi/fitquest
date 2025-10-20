/**
 * Pet Mood Utility Functions
 * 
 * Calculates pet mood based on user's daily goal completion percentage
 */

/**
 * Pet mood types
 */
export const PET_MOOD = {
  UPSET: 'upset',
  HAPPY: 'happy',
  CHEERFUL: 'cheerful',
};

/**
 * Pet mood configuration with colors and emojis
 */
export const PET_MOOD_CONFIG = {
  [PET_MOOD.UPSET]: {
    name: 'Upset',
    emoji: '😢',
    color: '#EF4444', // Red
    backgroundColor: '#FEE2E2', // Light red
    message: 'Your pet is feeling upset. Complete your goal to cheer them up!',
    range: '0-33%',
  },
  [PET_MOOD.HAPPY]: {
    name: 'Happy',
    emoji: '😊',
    color: '#F59E0B', // Amber/Orange
    backgroundColor: '#FEF3C7', // Light amber
    message: 'Your pet is happy! Keep going to make them cheerful!',
    range: '34-67%',
  },
  [PET_MOOD.CHEERFUL]: {
    name: 'Cheerful',
    emoji: '🎉',
    color: '#10B981', // Green
    backgroundColor: '#D1FAE5', // Light green
    message: 'Your pet is cheerful! Great job completing your goal!',
    range: '68-100%',
  },
};

/**
 * Calculate pet mood based on completion percentage
 * 
 * @param {number} percentage - Completion percentage (0-100)
 * @returns {string} Pet mood: 'upset', 'happy', or 'cheerful'
 */
export const calculatePetMood = (percentage) => {
  if (percentage <= 33) {
    return PET_MOOD.UPSET;
  } else if (percentage <= 67) {
    return PET_MOOD.HAPPY;
  } else {
    return PET_MOOD.CHEERFUL;
  }
};

/**
 * Get mood configuration for a given percentage
 * 
 * @param {number} percentage - Completion percentage (0-100)
 * @returns {Object} Mood configuration object
 */
export const getMoodConfig = (percentage) => {
  const mood = calculatePetMood(percentage);
  return PET_MOOD_CONFIG[mood];
};

/**
 * Get mood color for a given percentage
 * 
 * @param {number} percentage - Completion percentage (0-100)
 * @returns {string} Hex color code
 */
export const getMoodColor = (percentage) => {
  const config = getMoodConfig(percentage);
  return config.color;
};

/**
 * Get mood emoji for a given percentage
 * 
 * @param {number} percentage - Completion percentage (0-100)
 * @returns {string} Emoji
 */
export const getMoodEmoji = (percentage) => {
  const config = getMoodConfig(percentage);
  return config.emoji;
};

/**
 * Get mood message for a given percentage
 * 
 * @param {number} percentage - Completion percentage (0-100)
 * @returns {string} Mood message
 */
export const getMoodMessage = (percentage) => {
  const config = getMoodConfig(percentage);
  return config.message;
};

/**
 * Format percentage for display
 * 
 * @param {number} percentage - Completion percentage (0-100)
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (percentage) => {
  return `${Math.round(percentage)}%`;
};

