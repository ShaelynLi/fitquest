import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, globalStyles } from '../theme';

/**
 * FoodTab Component - Enhanced Food Log Screen
 *
 * Complete food logging and nutrition tracking interface following the FitQuest design.
 * Refined with Aura Health design system - card-based layout with sophisticated styling.
 *
 * Key Features:
 * - Date selector with horizontal scrolling calendar
 * - Large calorie progress bar with Aurora gradient
 * - Detailed macronutrient breakdown
 * - Meal logging cards (Breakfast, Lunch, Dinner, Snacks)
 * - Enhanced food search integration
 * - Daily nutrition goals and progress tracking
 *
 * Updated UI Structure:
 * A. Header with elegant title and navigation
 * B. Date selector (7-day horizontal scroll)
 * C. Daily nutrition summary card with large progress bar
 * D. Meal logging cards with improved layout
 */
export default function FoodTab({ navigation, route }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Generate dates for the calendar slider (7 days: 3 previous, today, 3 future)
  const generateCalendarDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = -3; i <= 3; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };
  
  const calendarDates = generateCalendarDates();

  const [meals, setMeals] = useState({
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: [],
  });
  const [addMealModalVisible, setAddMealModalVisible] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState('breakfast');
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  // Daily nutrition goals
  const dailyGoals = {
    calories: 2000,
    protein: 150, // grams
    carbs: 250,   // grams
    fat: 65,      // grams
  };

  // Calculate daily totals
  const calculateDailyTotals = () => {
    const allFoods = [
      ...meals.breakfast,
      ...meals.lunch,
      ...meals.dinner,
      ...meals.snacks,
    ];

    return allFoods.reduce(
      (totals, food) => ({
        calories: totals.calories + (food.calories || 0),
        protein: totals.protein + (food.protein || 0),
        carbs: totals.carbs + (food.carbs || 0),
        fat: totals.fat + (food.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const dailyTotals = calculateDailyTotals();

  // Handle food selection result from FoodSearchScreen
  useFocusEffect(
    React.useCallback(() => {
      if (route.params?.selectedFood && route.params?.mealType) {
        const { selectedFood, mealType } = route.params;
        handleFoodSelected(selectedFood, mealType);
        navigation.setParams({ selectedFood: undefined, mealType: undefined });
      }
    }, [route.params?.selectedFood, route.params?.mealType])
  );

  // Handle food selection from search screen
  const handleFoodSelected = (foodData, mealType) => {
    const newFood = {
      id: Date.now().toString(),
      name: foodData.name,
      brand: foodData.brand,
      calories: foodData.calories,
      protein: foodData.protein,
      carbs: foodData.carbs,
      fat: foodData.fat,
      servingSize: foodData.servingSize,
    };

    setMeals(prev => ({
      ...prev,
      [mealType]: [...prev[mealType], newFood],
    }));
  };

  // Navigate to food search screen
  const openFoodSearch = (mealType) => {
    navigation.navigate('FoodSearch', {
      mealType,
    });
  };

  // Manual entry function
  const addMeal = () => {
    if (!foodName.trim() || !calories) {
      Alert.alert('Error', 'Please enter food name and calories');
      return;
    }

    const newFood = {
      id: Date.now().toString(),
      name: foodName.trim(),
      calories: parseInt(calories) || 0,
      protein: parseInt(protein) || 0,
      carbs: parseInt(carbs) || 0,
      fat: parseInt(fat) || 0,
    };

    setMeals(prev => ({
      ...prev,
      [selectedMealType]: [...prev[selectedMealType], newFood],
    }));

    // Reset form
    setFoodName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setAddMealModalVisible(false);
  };

  /**
   * DateSelector Component - Horizontal scrolling calendar
   */
  const DateSelector = () => {
    const formatDate = (date) => {
      const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      return {
        day: days[date.getDay()],
        number: date.getDate(),
        isToday: date.toDateString() === new Date().toDateString(),
        isSelected: date.toDateString() === selectedDate.toDateString()
      };
    };

    return (
      <View style={styles.dateSelector}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateScrollContent}
        >
          {calendarDates.map((date, index) => {
            const dateInfo = formatDate(date);
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dateItem,
                  (dateInfo.isSelected || dateInfo.isToday) && styles.dateItemActive
                ]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[
                  styles.dateDayText,
                  (dateInfo.isSelected || dateInfo.isToday) && styles.dateActiveText
                ]}>
                  {dateInfo.day}
                </Text>
                <Text style={[
                  styles.dateNumberText,
                  (dateInfo.isSelected || dateInfo.isToday) && styles.dateActiveText
                ]}>
                  {dateInfo.number}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  /**
   * CalorieProgressBar Component - Large horizontal progress bar with Aurora gradient
   */
  const CalorieProgressBar = ({ current, goal }) => {
    const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
    const isOverGoal = current > goal;
    const remainingCalories = Math.max(goal - current, 0);

    return (
      <View style={styles.calorieProgressContainer}>
        <View style={styles.calorieHeader}>
          <Text style={globalStyles.sectionSubheader}>
            {Math.round(current)} of {goal} kcal
          </Text>
          <Text style={globalStyles.secondaryText}>
            {remainingCalories > 0 ? `${remainingCalories} remaining` : 'Goal reached!'}
          </Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBarFill,
              { 
                width: `${percentage}%`,
                backgroundColor: isOverGoal ? colors.red[400] : colors.aurora.blue
              }
            ]}
          />
        </View>
      </View>
    );
  };

  /**
   * MacroBar Component - Updated with Aura Health styling
   */
  const MacroBar = ({ label, current, goal, color, unit = 'g' }) => {
    const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
    return (
      <View style={styles.macroBar}>
        <View style={styles.macroHeader}>
          <View style={styles.macroLabelContainer}>
            <View style={[styles.macroColorDot, { backgroundColor: color }]} />
            <Text style={globalStyles.bodyText}>{label}</Text>
          </View>
          <Text style={globalStyles.secondaryText}>
            {Math.round(current)}{unit}/{Math.round(goal)}{unit}
          </Text>
        </View>
        <View style={styles.macroProgressContainer}>
          <View
            style={[
              styles.macroProgress,
              { width: `${percentage}%`, backgroundColor: color },
            ]}
          />
        </View>
      </View>
    );
  };

  // D. Meal Section Component - Enhanced layout with prominent Add Food button
  const MealSection = ({ mealType, foods, icon }) => {
    const mealCalories = foods.reduce((sum, food) => sum + food.calories, 0);

    return (
      <View style={globalStyles.card}>
        {/* Enhanced Meal Header */}
        <View style={styles.mealHeader}>
          <View style={styles.mealTitleContainer}>
            <Ionicons name={icon} size={24} color={colors.textPrimary} />
            <Text style={styles.mealTitle}>
              {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
            </Text>
          </View>
          <Text style={styles.mealCalories}>{mealCalories} kcal</Text>
        </View>

        {/* Food Items List */}
        {foods.length > 0 ? (
          <View style={styles.foodList}>
            {foods.map((food) => (
              <View key={food.id} style={styles.foodItem}>
                <View style={styles.foodItemInfo}>
                  <Text style={globalStyles.bodyText}>
                    {food.brand ? `${food.name} (${food.brand})` : food.name}
                  </Text>
                  {food.servingSize && (
                    <Text style={globalStyles.captionText}>{food.servingSize}</Text>
                  )}
                </View>
                <Text style={globalStyles.secondaryText}>{food.calories} cal</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyMealContainer}>
            <Text style={styles.emptyMeal}>No {mealType} logged yet.</Text>
          </View>
        )}

        {/* Prominent Add Food Button */}
        <TouchableOpacity
          style={styles.addFoodButton}
          onPress={() => openFoodSearch(mealType)}
        >
          <Ionicons name="add" size={20} color={colors.textPrimary} />
          <Text style={styles.addFoodButtonText}>Add Food</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* A. Date Selector */}
      <DateSelector />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* B. Daily Nutrition Summary Card */}
        <View style={globalStyles.cardLarge}>
          <Text style={globalStyles.sectionHeader}>
            {selectedDate.toDateString() === new Date().toDateString() 
              ? "Today's Nutrition" 
              : "Daily Nutrition"}
          </Text>
          
          {/* Large Calorie Progress Bar */}
          <CalorieProgressBar
            current={dailyTotals.calories}
            goal={dailyGoals.calories}
          />

          {/* Macronutrient Breakdown */}
          <View style={styles.macroBreakdown}>
            <Text style={[globalStyles.secondaryText, { marginBottom: spacing.sm }]}>
              Macronutrient Breakdown
            </Text>
            <View style={styles.macroRow}>
              <View style={styles.macroItem}>
                <Text style={globalStyles.bodyText}>Protein</Text>
                <Text style={globalStyles.secondaryText}>
                  {Math.round(dailyTotals.protein)} / {dailyGoals.protein}g
                </Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={globalStyles.bodyText}>Carbs</Text>
                <Text style={globalStyles.secondaryText}>
                  {Math.round(dailyTotals.carbs)} / {dailyGoals.carbs}g
                </Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={globalStyles.bodyText}>Fat</Text>
                <Text style={globalStyles.secondaryText}>
                  {Math.round(dailyTotals.fat)} / {dailyGoals.fat}g
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* C. Meal Logging Cards */}
        <MealSection
          mealType="breakfast"
          foods={meals.breakfast}
          icon="sunny"
        />
        <MealSection
          mealType="lunch"
          foods={meals.lunch}
          icon="partly-sunny"
        />
        <MealSection
          mealType="dinner"
          foods={meals.dinner}
          icon="moon"
        />
        <MealSection
          mealType="snacks"
          foods={meals.snacks}
          icon="cafe"
        />
      </ScrollView>

      {/* Add Meal Modal */}
      <Modal
        visible={addMealModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={globalStyles.screenContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setAddMealModalVisible(false)}
            >
              <Text style={globalStyles.buttonTextSecondary}>Cancel</Text>
            </TouchableOpacity>
            <Text style={globalStyles.sectionSubheader}>Add Food</Text>
            <TouchableOpacity onPress={addMeal}>
              <Text style={globalStyles.buttonTextPrimary}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={globalStyles.contentContainer}>
            <View style={styles.inputGroup}>
              <Text style={globalStyles.bodyText}>Food Name</Text>
              <TextInput
                style={styles.textInput}
                value={foodName}
                onChangeText={setFoodName}
                placeholder="Enter food name"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={globalStyles.bodyText}>Calories</Text>
              <TextInput
                style={styles.textInput}
                value={calories}
                onChangeText={setCalories}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={styles.macroInputs}>
              <View style={styles.macroInput}>
                <Text style={globalStyles.bodyText}>Protein (g)</Text>
                <TextInput
                  style={styles.textInput}
                  value={protein}
                  onChangeText={setProtein}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
              <View style={styles.macroInput}>
                <Text style={globalStyles.bodyText}>Carbs (g)</Text>
                <TextInput
                  style={styles.textInput}
                  value={carbs}
                  onChangeText={setCarbs}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
              <View style={styles.macroInput}>
                <Text style={globalStyles.bodyText}>Fat (g)</Text>
                <TextInput
                  style={styles.textInput}
                  value={fat}
                  onChangeText={setFat}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Base Layout
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },

  // A. Date Selector Styles
  dateSelector: {
    backgroundColor: colors.background,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dateScrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  dateItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 60,
  },
  dateItemActive: {
    backgroundColor: colors.textPrimary,
  },
  dateDayText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.body,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  dateNumberText: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  dateActiveText: {
    color: colors.white,
  },

  // B. Calorie Progress Bar Styles
  calorieProgressContainer: {
    marginVertical: spacing.lg,
  },
  calorieHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: colors.gray[200],
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },

  // Macronutrient Breakdown
  macroBreakdown: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroItem: {
    alignItems: 'center',
    flex: 1,
  },

  // C. Meal Section Styles - Enhanced
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  mealTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  mealTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.heading,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  mealCalories: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
  
  // Food List Styles
  foodList: {
    marginBottom: spacing.md,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  foodItemInfo: {
    flex: 1,
  },
  
  // Empty State
  emptyMealContainer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyMeal: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  // Prominent Add Food Button
  addFoodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.textPrimary,
    borderStyle: 'dashed',
    borderRadius: 12,
    gap: spacing.sm,
  },
  addFoodButtonText: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
  },

  // Modal Styles - Updated
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    paddingTop: 60,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  macroInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroInput: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
});