import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated, Image, RefreshControl, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, colors, globalStyles } from '../theme';
import { useAuth } from '../context/AuthContext';
import { useGamification } from '../context/GamificationContext';
import { useDailyStats } from '../context/DailyStatsContext';
import { useDailyFood } from '../context/DailyFoodContext';
import BlindBoxModal from '../components/gamification/BlindBoxModal';
import { api } from '../services';
import { getMoodConfig } from '../utils/petMood';

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
  const { user, refreshUser, token } = useAuth();
  const {
    activeCompanion,
    blindBoxes,
    runningGoals,
    getCollectionStats,
    getBlindBoxProgress,
    syncTotalDistanceFromBackend,
    totalRunDistance,
    isLoading
  } = useGamification();
  const {
    dailyStats,
    getFormattedDistance,
    getFormattedDuration,
    getLastActivityText,
    loadDailyStats,
    isLoading: statsLoading
  } = useDailyStats();
  const {
    dailyFood,
    getFormattedNutrition,
    getDailyGoals,
    getCalorieProgress,
    getLastMealText,
    refreshDailyFood,
    isLoading: foodLoading
  } = useDailyFood();

  // Modal state
  const [showBlindBoxModal, setShowBlindBoxModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Pet mood state
  const [moodPercentage, setMoodPercentage] = useState(0);
  const [moodLoading, setMoodLoading] = useState(false);
  const [dailyGoalData, setDailyGoalData] = useState(null);
  
  // Edit goal state
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [newGoalValue, setNewGoalValue] = useState('');

  // Load daily progress for pet mood
  useEffect(() => {
    if (token) {
      loadDailyProgress();
    }
  }, [token]);

  const loadDailyProgress = async () => {
    if (!token) return;
    
    try {
      setMoodLoading(true);
      const response = await api.getDailyProgress(token);
      if (response && response.success) {
        setMoodPercentage(response.completion_percentage || 0);
        setDailyGoalData(response);
        console.log('📊 Pet mood percentage:', response.completion_percentage + '%');
        console.log('📊 Daily goal:', response.goal_distance_meters + 'm, Completed:', response.completed_distance_meters + 'm');
      }
    } catch (error) {
      console.error('❌ Failed to load daily progress:', error);
      // Default to 0% on error
      setMoodPercentage(0);
    } finally {
      setMoodLoading(false);
    }
  };

  const handleEditGoal = () => {
    if (dailyGoalData) {
      setNewGoalValue(String(dailyGoalData.goal_distance_meters / 1000));
    }
    setIsEditingGoal(true);
  };

  const handleSaveGoal = async () => {
    if (!token || !newGoalValue) return;
    
    const goalKm = parseFloat(newGoalValue);
    if (isNaN(goalKm) || goalKm < 1 || goalKm > 50) {
      Alert.alert('Invalid Goal', 'Please enter a goal between 1 and 50 km');
      return;
    }
    
    try {
      console.log('💾 Saving new daily goal:', goalKm + 'km');
      await api.updateUserProfile(token, { dailyRunGoal: Math.round(goalKm) });
      

      const newGoalMeters = Math.round(goalKm) * 1000;
      const currentCompleted = dailyGoalData?.completed_distance_meters || 0;
      const newPercentage = (currentCompleted / newGoalMeters) * 100;
      
      setDailyGoalData({
        ...dailyGoalData,
        goal_distance_meters: newGoalMeters,
        completion_percentage: newPercentage,
      });
      setMoodPercentage(newPercentage);
      
      setIsEditingGoal(false);
      console.log('✅ Daily goal updated locally:', goalKm + 'km, new percentage:', newPercentage.toFixed(2) + '%');
    } catch (error) {
      console.error('❌ Failed to update goal:', error);
      Alert.alert('Error', 'Failed to update goal. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setIsEditingGoal(false);
    setNewGoalValue('');
  };

  // Get real intake data from daily food stats
  const nutrition = getFormattedNutrition();
  const goals = getDailyGoals();
  const intake = {
    consumed: nutrition.calories,
    remaining: Math.max(goals.calories - nutrition.calories, 0),
    total: goals.calories,
    percentage: getCalorieProgress()
  };

  // Get real activity data from daily stats
  const activity = {
    distance: getFormattedDistance(),
    duration: getFormattedDuration(),
    calories: dailyStats.totalCalories,
    lastActivity: getLastActivityText(),
    workoutCount: dailyStats.workoutCount
  };

  // Show loading state if data is still loading
  if (statsLoading || foodLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your stats...</Text>
        </View>
      </View>
    );
  }

  const stats = getCollectionStats();
  const blindBoxProgress = getBlindBoxProgress();

  const handleNavigateToCollection = () => {
    navigation.navigate('PetCollection');
  };

  const handleOpenBlindBox = () => {
    setShowBlindBoxModal(true);
  };

  // Render milestone achievements
  const renderMilestones = (totalKm) => {
    const km = parseFloat(totalKm);
    const milestones = [
      { distance: 10, label: '10', icon: 'walk', color: colors.aurora.green },
      { distance: 50, label: '50', icon: 'bicycle', color: colors.aurora.blue },
      { distance: 100, label: '100', icon: 'fitness', color: colors.aurora.violet },
      { distance: 200, label: '200', icon: 'rocket', color: colors.aurora.pink },
      { distance: 500, label: '500', icon: 'trophy', color: colors.aurora.gold },
    ];

    return (
      <View style={styles.milestonesRow}>
        {milestones.map((milestone, index) => {
          const achieved = km >= milestone.distance;
          return (
            <View key={index} style={styles.milestoneItem}>
              <View style={[
                styles.milestoneIcon,
                achieved && { backgroundColor: milestone.color + '15', borderColor: milestone.color }
              ]}>
                <Ionicons 
                  name={milestone.icon} 
                  size={18} 
                  color={achieved ? milestone.color : colors.gray[300]} 
                />
              </View>
              <Text style={[
                styles.milestoneLabel,
                achieved && { color: colors.textPrimary, fontWeight: typography.weights.medium }
              ]}>
                {milestone.label}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      console.log('🔄 Refreshing home page data...');
      
      // Run all refresh operations in parallel for better performance
      await Promise.all([
        // Refresh user data (including petRewardGoal)
        refreshUser ? refreshUser() : Promise.resolve(),
        
        // Sync total running distance from backend
        syncTotalDistanceFromBackend ? syncTotalDistanceFromBackend() : Promise.resolve(),
        
        // Refresh daily stats (workouts)
        loadDailyStats ? loadDailyStats() : Promise.resolve(),
        
        // Refresh daily food data
        refreshDailyFood ? refreshDailyFood() : Promise.resolve(),
        
        // Refresh pet mood (daily progress)
        loadDailyProgress(),
      ]);
      
      console.log('✅ Home page data refreshed');
    } catch (error) {
      console.error('❌ Failed to refresh home page:', error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.blue[500]}
          colors={[colors.blue[500]]}
        />
      }
    >
      {/* Intake and Activity Cards */}
      <View style={styles.metricsGrid}>
        {/* Intake Card */}
        <View style={styles.metricCard}>
          <Text style={styles.cardLabel}>Intake</Text>
          <View style={styles.cardContent}>
            <View style={styles.mainMetric}>
              <Text style={styles.mainNumber}>{intake.consumed}</Text>
              <Text style={styles.unitText}>kcal</Text>
            </View>
            <Text style={styles.remainingText}>{intake.remaining.toLocaleString()} remaining</Text>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressLabels}>
                <Text style={styles.progressLabel}>0</Text>
                <Text style={styles.progressLabel}>{intake.total.toLocaleString()}</Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${intake.percentage}%` }
                  ]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Activity Card */}
        <View style={styles.metricCard}>
          <Text style={styles.cardLabel}>Activity</Text>
          <View style={styles.cardContent}>
            <View style={styles.mainMetric}>
              <Text style={[styles.mainNumber, { color: colors.aurora.green }]}>
                {activity.distance.km.toFixed(2)}
              </Text>
              <Text style={styles.unitText}>km</Text>
            </View>

            <View style={styles.activityDetails}>
              <Text style={styles.activityDetailText}>
                {activity.duration} • {activity.workoutCount} runs
              </Text>
            </View>

            <View style={styles.activityStatus}>
              <View style={styles.activityIndicator}>
                <View style={styles.activityDot} />
              </View>
              <Text style={styles.activityText}>{activity.lastActivity}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Companion Window */}
      <View style={styles.companionCard}>
        <View style={styles.companionHeader}>
          <Text style={styles.cardLabel}>Your Companion</Text>
          <TouchableOpacity
            style={styles.collectionButton}
            onPress={handleNavigateToCollection}
          >
            <Ionicons name="grid" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.companionContent}>
          {/* Pet Image */}
          <View style={styles.companionImageContainer}>
            <Image
              source={{ uri: activeCompanion?.image || 'https://images.unsplash.com/photo-1610157618459-52f28baed018?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXRlJTIwY2FydG9vbiUyMHBldCUyMGNvbXBhbmlvbiUyMG1hc2NvdHxlbnwxfHx8fDE3NTg5NDg0MjB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' }}
              style={styles.companionImage}
              resizeMode="cover"
            />
          </View>

          {/* Pet Info */}
          <View style={styles.companionInfo}>
            <Text style={styles.companionName}>{activeCompanion?.name || 'Sparky'}</Text>

            {/* Pet Mood */}
            {!moodLoading && (
              <View style={[styles.moodBadge, { backgroundColor: getMoodConfig(moodPercentage).backgroundColor }]}>
                <Text style={styles.moodEmoji}>{getMoodConfig(moodPercentage).emoji}</Text>
                <Text style={[styles.moodText, { color: getMoodConfig(moodPercentage).color }]}>
                  {getMoodConfig(moodPercentage).name}
                </Text>
                <Text style={styles.moodPercentage}>({Math.round(moodPercentage)}%)</Text>
              </View>
            )}

            {/* Daily Goal Progress */}
            {dailyGoalData && (
              <View style={styles.goalContainer}>
                <View style={styles.goalHeader}>
                  <Text style={styles.goalLabel}>Today's Goal</Text>
                  <TouchableOpacity onPress={handleEditGoal} style={styles.editButton}>
                    <Ionicons name="create-outline" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                
                {!isEditingGoal ? (
                  <>
                    <View style={styles.goalProgress}>
                      <Text style={styles.goalDistance}>
                        {(dailyGoalData.completed_distance_meters / 1000).toFixed(2)} km
                      </Text>
                      <Text style={styles.goalSeparator}>/</Text>
                      <Text style={styles.goalTarget}>
                        {(dailyGoalData.goal_distance_meters / 1000).toFixed(0)} km
                      </Text>
                    </View>
                    <View style={styles.goalBar}>
                      <View
                        style={[
                          styles.goalFill,
                          { width: `${Math.min(moodPercentage, 100)}%`, backgroundColor: getMoodConfig(moodPercentage).color }
                        ]}
                      />
                    </View>
                  </>
                ) : (
                  <View style={styles.editGoalContainer}>
                    <TextInput
                      style={styles.goalInput}
                      value={newGoalValue}
                      onChangeText={setNewGoalValue}
                      keyboardType="numeric"
                      placeholder="Enter goal (km)"
                      placeholderTextColor={colors.textTertiary}
                    />
                    <View style={styles.editActions}>
                      <TouchableOpacity onPress={handleCancelEdit} style={styles.cancelButton}>
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleSaveGoal} style={styles.saveButton}>
                        <Text style={styles.saveButtonText}>Save</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Collection Progress */}
            <View style={styles.energyContainer}>
              <View style={styles.energyHeader}>
                <Text style={styles.energyLabel}>Collection</Text>
                <Text style={styles.energyPercentage}>{stats.completionRate}%</Text>
              </View>
              <View style={styles.energyBar}>
                <View
                  style={[
                    styles.energyFill,
                    { width: `${stats.completionRate}%` }
                  ]}
                />
              </View>
              <Text style={styles.collectionText}>
                {stats.ownedPets} of {stats.totalPets} collected
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Rewards & Call to Action */}
      <View style={styles.rewardsCard}>
        <Text style={styles.cardLabel}>Your Rewards</Text>
        
        {/* Blind Box Count */}
        <View style={styles.rewardsContent}>
          <View style={styles.rewardsInfo}>
            <View style={styles.rewardsIcon}>
              <View style={styles.rewardsIconInner} />
            </View>
            <View style={styles.rewardsText}>
              <Text style={styles.rewardsTitle}>{blindBoxes} Blind Boxes</Text>
              <Text style={styles.rewardsSubtitle}>
                {blindBoxes > 0 ? 'Ready to open' : 'Keep running to earn more!'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.openBoxButton, blindBoxes === 0 && styles.openBoxButtonDisabled]}
            onPress={handleOpenBlindBox}
            disabled={blindBoxes === 0}
          >
            <Text style={styles.openBoxButtonText}>Open</Text>
          </TouchableOpacity>
        </View>

        {/* Progress to Next Box */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progress to Next Box</Text>
            <Text style={styles.progressDistance}>
              {blindBoxProgress.remainingDistance}m remaining
            </Text>
          </View>
          
          {/* Progress Bar */}
          <View style={styles.boxProgressBar}>
            <View
              style={[
                styles.boxProgressFill,
                { width: `${blindBoxProgress.progressPercentage}%` }
              ]}
            />
          </View>
          
          <View style={styles.progressFooter}>
            <Text style={styles.progressInfo}>
              {blindBoxProgress.progressToNextBox}m / {blindBoxProgress.metersPerBox}m
            </Text>
            <Text style={styles.progressPercentage}>
              {blindBoxProgress.progressPercentage}%
            </Text>
          </View>
        </View>
      </View>

      {/* Total Distance Lifetime Stats */}
      <View style={styles.lifetimeCard}>
        <Text style={styles.cardLabel}>Lifetime Distance</Text>
        <View style={styles.cardContent}>
          <View style={styles.mainMetric}>
            <Text style={[styles.mainNumber, { color: colors.aurora.gold }]}>
              {(totalRunDistance / 1000).toFixed(2)}
            </Text>
            <Text style={styles.unitText}>km</Text>
          </View>
          
          <Text style={styles.lifetimeSubtext}>
            Total distance since you started
          </Text>

          {/* Achievement Milestones */}
          <View style={styles.milestonesContainer}>
            {renderMilestones((totalRunDistance / 1000).toFixed(2))}
          </View>
        </View>
      </View>

      {/* Blind Box Modal */}
      <BlindBoxModal
        visible={showBlindBoxModal}
        onClose={() => setShowBlindBoxModal(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },

  // Metrics Grid (Intake & Activity)
  metricsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },

  metricCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  cardLabel: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },

  cardContent: {
    gap: spacing.sm,
  },

  mainMetric: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },

  mainNumber: {
    fontSize: 32,
    fontFamily: typography.heading,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },

  unitText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
  },

  remainingText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
  },

  // Progress Bar
  progressContainer: {
    marginTop: spacing.md,
  },

  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },

  progressLabel: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.body,
    color: colors.textSecondary,
  },

  progressBar: {
    height: 6,
    backgroundColor: colors.gray[100],
    borderRadius: 3,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: colors.green[500],
    borderRadius: 3,
  },

  // Activity Status
  activityStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },

  activityIndicator: {
    width: 16,
    height: 16,
    backgroundColor: colors.blue[100],
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  activityDot: {
    width: 8,
    height: 8,
    backgroundColor: colors.blue[500],
    borderRadius: 4,
  },

  activityText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
  },

  activityDetails: {
    marginTop: spacing.xs,
  },

  activityDetailText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.body,
    color: colors.textTertiary,
    textAlign: 'center',
  },

  // Companion Card
  companionCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  companionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },

  collectionButton: {
    padding: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.gray[50],
  },

  companionContent: {
    alignItems: 'center',
    gap: spacing.md,
  },

  companionImageContainer: {
    width: 128,
    height: 128,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.blue[50],
  },

  companionImage: {
    width: '100%',
    height: '100%',
  },

  companionInfo: {
    width: '100%',
    alignItems: 'center',
  },

  companionName: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.heading,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },

  // Pet Mood Badge
  moodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  moodEmoji: {
    fontSize: typography.sizes.md,
  },
  moodText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    fontWeight: typography.weights.bold,
  },
  moodPercentage: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.body,
    color: colors.textSecondary,
  },

  // Daily Goal Progress
  goalContainer: {
    width: '100%',
    maxWidth: 240,
    marginBottom: spacing.md,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  goalLabel: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  editButton: {
    padding: spacing.xs,
  },
  goalProgress: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  goalDistance: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.body,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  goalSeparator: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    color: colors.textSecondary,
    marginHorizontal: spacing.xs,
  },
  goalTarget: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    color: colors.textSecondary,
  },
  goalBar: {
    height: 8,
    backgroundColor: colors.gray[100],
    borderRadius: 4,
    overflow: 'hidden',
  },
  goalFill: {
    height: '100%',
    borderRadius: 4,
  },
  editGoalContainer: {
    gap: spacing.sm,
  },
  goalInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    color: colors.textPrimary,
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.aurora.blue,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },

  // Energy Progress
  energyContainer: {
    width: '100%',
    maxWidth: 240,
  },

  energyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },

  energyLabel: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
  },

  energyPercentage: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    fontWeight: typography.weights.semibold,
    color: colors.green[600],
  },

  energyBar: {
    height: 8,
    backgroundColor: colors.gray[100],
    borderRadius: 4,
    overflow: 'hidden',
  },

  energyFill: {
    height: '100%',
    backgroundColor: colors.green[500],
    borderRadius: 4,
  },

  collectionText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  // Rewards Card
  rewardsCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  rewardsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  rewardsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },

  rewardsIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.purple[50],
    alignItems: 'center',
    justifyContent: 'center',
  },

  rewardsIconInner: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: colors.purple[500],
  },

  rewardsText: {
    flex: 1,
  },

  rewardsTitle: {
    fontSize: typography.sizes.md,
    fontFamily: typography.heading,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },

  rewardsSubtitle: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
  },

  openBoxButton: {
    backgroundColor: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 12,
  },

  openBoxButtonDisabled: {
    backgroundColor: colors.gray[300],
    opacity: 0.6,
  },

  openBoxButtonText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },

  // Progress Section
  progressSection: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },

  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },

  progressLabel: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
  },

  progressDistance: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    fontWeight: typography.weights.semibold,
    color: colors.purple[600],
  },

  boxProgressBar: {
    height: 8,
    backgroundColor: colors.gray[100],
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },

  boxProgressFill: {
    height: '100%',
    backgroundColor: colors.purple[500],
    borderRadius: 4,
  },

  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  progressInfo: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.body,
    color: colors.textSecondary,
  },

  progressPercentage: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.body,
    fontWeight: typography.weights.bold,
    color: colors.purple[600],
  },

  // Lifetime Stats Card (matches other cards style)
  lifetimeCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  lifetimeSubtext: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },

  milestonesContainer: {
    marginTop: spacing.sm,
  },

  milestonesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.xs,
  },

  milestoneItem: {
    flex: 1,
    alignItems: 'center',
  },

  milestoneIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray[100],
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },

  milestoneLabel: {
    fontSize: 10,
    fontFamily: typography.body,
    color: colors.textTertiary,
  },

  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },

  loadingText: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    color: colors.textSecondary,
  },
});