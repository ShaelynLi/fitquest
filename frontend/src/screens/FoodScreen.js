import React, { useState, useEffect } from 'react';
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
 * FoodScreen Component - Food Diary & Nutrition Tracking
 *
 * Complete food logging and nutrition tracking interface.
 * Features a modern design with pie chart calories display and horizontal macro bars.
 *
 * Key Features:
 * - Circular pie chart showing daily calorie progress
 * - Horizontal progress bars for macronutrients (Fat, Protein, Carbs)
 * - Meal logging by category (Breakfast, Lunch, Dinner, Snacks)
 * - Modal interface for adding foods with nutrition data
 * - Daily nutrition goals and progress tracking
 *
 * Design Implementation:
 * - Left: Pie chart visualization for calories
 * - Right: Stacked horizontal bars for macros
 * - Color-coded progress indicators
 * - Clean card-based layout
 *
 * TODO Future Enhancements:
 * - Food database integration for auto-complete
 * - Barcode scanning for packaged foods
 * - Meal photo capture
 * - Nutrition insights and recommendations
 * - Weekly/monthly nutrition analytics
 */
export default function FoodScreen({ navigation }) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Generate array of dates for calendar slider (7 days before and after today)
  const generateDateRange = () => {
    const dates = [];
    const today = new Date();

    for (let i = -7; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }

    return dates;
  };

  const dateRange = generateDateRange();
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

  // Date formatting and utilities
  const formatDateSlider = (date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return { label: 'Today', day: date.getDate(), weekday: 'Today' };
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return { label: 'Tomorrow', day: date.getDate(), weekday: 'Tom' };
    } else if (date.toDateString() === yesterday.toDateString()) {
      return { label: 'Yesterday', day: date.getDate(), weekday: 'Yest' };
    } else {
      return {
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        day: date.getDate(),
        weekday: date.toLocaleDateString('en-US', { weekday: 'short' })
      };
    }
  };

  const isSameDate = (date1, date2) => {
    return date1.toDateString() === date2.toDateString();
  };

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
      onFoodSelected: handleFoodSelected,
    });
  };

  // LEGACY: Old add meal function (keeping for manual entry fallback)
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
   * CaloriePieChart Component
   *
   * Custom circular progress indicator for calorie tracking.
   * Shows current calories consumed vs daily goal in a visual pie chart format.
   *
   * Implementation uses React Native border styling to create circular progress.
   * Alternative: Could use SVG or react-native-svg for more advanced charting.
   *
   * @param {number} current - Current calories consumed
   * @param {number} goal - Daily calorie goal
   */
  const CaloriePieChart = ({ current, goal }) => {
    const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
    const radius = 60;
    const strokeWidth = 12;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (circumference * percentage) / 100;

    return (
      <View style={styles.pieChartContainer}>
        <View style={styles.pieChart}>
          {/* Background circle */}
          <View style={[styles.pieBackground, { width: (radius * 2) + strokeWidth, height: (radius * 2) + strokeWidth }]}>
            {/* Progress indicator using border */}
            <View style={[
              styles.pieProgress,
              {
                width: radius * 2,
                height: radius * 2,
                borderRadius: radius,
                borderWidth: strokeWidth,
                borderColor: colors.gray[200],
                borderTopColor: current <= goal ? colors.blue[400] : colors.error,
                transform: [{ rotate: `${(percentage * 3.6) - 90}deg` }]
              }
            ]} />
          </View>
          {/* Center content */}
          <View style={styles.pieCenter}>
            <Text style={styles.pieCaloriesText}>
              {Math.round(current)}
            </Text>
            <Text style={styles.pieCaloriesUnit}>kcal</Text>
          </View>
        </View>
        <Text style={styles.pieGoalText}>
          Goal: {goal} kcal
        </Text>
      </View>
    );
  };

  /**
   * MacroBar Component
   *
   * Horizontal progress bar for displaying macronutrient progress.
   * Shows label, current/goal values, and visual progress indicator.
   *
   * Design matches the reference image with:
   * - Color dot indicator
   * - Label and values on same line
   * - Horizontal progress bar below
   *
   * @param {string} label - Nutrient name (Fat, Protein, Carbs)
   * @param {number} current - Current amount consumed
   * @param {number} goal - Daily goal amount
   * @param {string} color - Progress bar color
   * @param {string} unit - Unit of measurement (default: 'g')
   */
  const MacroBar = ({ label, current, goal, color, unit = 'g' }) => {
    const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
    return (
      <View style={styles.macroBar}>
        <View style={styles.macroHeader}>
          <View style={styles.macroLabelContainer}>
            <View style={[styles.macroColorDot, { backgroundColor: color }]} />
            <Text style={styles.macroLabel}>{label}</Text>
          </View>
          <Text style={styles.macroValue}>
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

  // Meal section component
  const MealSection = ({ mealType, foods, icon }) => {
    const mealCalories = foods.reduce((sum, food) => sum + food.calories, 0);

    return (
      <View style={styles.mealSection}>
        <View style={styles.mealHeader}>
          <View style={styles.mealTitleContainer}>
            <Ionicons name={icon} size={20} color={colors.textPrimary} />
            <Text style={styles.mealTitle}>
              {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
            </Text>
            <Text style={styles.mealCalories}>{mealCalories} cal</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => openFoodSearch(mealType)}
          >
            <Ionicons name="add" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>

        {foods.map((food) => (
          <View key={food.id} style={styles.foodItem}>
            <View style={styles.foodItemInfo}>
              <Text style={styles.foodName}>
                {food.brand ? `${food.name} (${food.brand})` : food.name}
              </Text>
              {food.servingSize && (
                <Text style={styles.foodServing}>{food.servingSize}</Text>
              )}
            </View>
            <Text style={styles.foodCalories}>{food.calories} cal</Text>
          </View>
        ))}

        {foods.length === 0 && (
          <Text style={styles.emptyMeal}>No foods added yet</Text>
        )}
      </View>
    );
  };

  // Date slider component
  const renderDateItem = ({ item }) => {
    const dateInfo = formatDateSlider(item);
    const isSelected = isSameDate(item, selectedDate);

    return (
      <TouchableOpacity
        style={[styles.dateItem, isSelected && styles.dateItemSelected]}
        onPress={() => setSelectedDate(item)}
      >
        <Text style={[styles.dateWeekday, isSelected && styles.dateTextSelected]}>
          {dateInfo.weekday}
        </Text>
        <Text style={[styles.dateDay, isSelected && styles.dateTextSelected]}>
          {dateInfo.day}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Food Diary</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Nutrition Overview */}
        <View style={styles.nutritionOverview}>
          <Text style={styles.sectionTitle}>Daily Nutrition</Text>
          <View style={styles.nutritionContent}>
            {/* Left: Pie Chart */}
            <CaloriePieChart
              current={dailyTotals.calories}
              goal={dailyGoals.calories}
            />

            {/* Right: Macro Bars */}
            <View style={styles.macrosContainer}>
              <MacroBar
                label="Fat"
                current={dailyTotals.fat}
                goal={dailyGoals.fat}
                color={colors.yellow[400]}
              />
              <MacroBar
                label="Protein"
                current={dailyTotals.protein}
                goal={dailyGoals.protein}
                color={colors.green[400]}
              />
              <MacroBar
                label="Carbs"
                current={dailyTotals.carbs}
                goal={dailyGoals.carbs}
                color={colors.purple[400]}
              />
            </View>
          </View>
        </View>

        {/* Meals */}
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
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setAddMealModalVisible(false)}
            >
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Food</Text>
            <TouchableOpacity onPress={addMeal}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Food Name</Text>
              <TextInput
                style={styles.textInput}
                value={foodName}
                onChangeText={setFoodName}
                placeholder="Enter food name"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Calories</Text>
              <TextInput
                style={styles.textInput}
                value={calories}
                onChangeText={setCalories}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.macroInputs}>
              <View style={styles.macroInput}>
                <Text style={styles.inputLabel}>Protein (g)</Text>
                <TextInput
                  style={styles.textInput}
                  value={protein}
                  onChangeText={setProtein}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              <View style={styles.macroInput}>
                <Text style={styles.inputLabel}>Carbs (g)</Text>
                <TextInput
                  style={styles.textInput}
                  value={carbs}
                  onChangeText={setCarbs}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              <View style={styles.macroInput}>
                <Text style={styles.inputLabel}>Fat (g)</Text>
                <TextInput
                  style={styles.textInput}
                  value={fat}
                  onChangeText={setFat}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontFamily: typography.heading,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  nutritionOverview: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.black,
  },
  sectionTitle: {
    fontSize: typography.sizes.xl,
    fontFamily: typography.heading,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  nutritionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // Pie Chart Styles
  pieChartContainer: {
    alignItems: 'center',
    flex: 1,
  },
  pieChart: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  pieBackground: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: 100,
  },
  pieProgress: {
    position: 'absolute',
  },
  pieCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieCaloriesText: {
    fontSize: typography.sizes.xxl,
    fontFamily: typography.heading,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  pieCaloriesUnit: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
  },
  pieGoalText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  // Macro Bars Styles
  macrosContainer: {
    flexDirection: 'column',
    flex: 1,
    paddingLeft: spacing.lg,
  },
  macroBar: {
    marginBottom: spacing.md,
  },
  macroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  macroLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  macroColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  macroLabel: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
  },
  macroProgressContainer: {
    height: 8,
    width: '100%',
    backgroundColor: colors.gray[200],
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.black,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  macroProgress: {
    height: '100%',
    borderRadius: 4,
  },
  macroValue: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.body,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  mealSection: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.black,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  mealTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mealTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.heading,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  mealCalories: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  addButton: {
    backgroundColor: colors.black,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.black,
    padding: spacing.sm,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.black,
    marginBottom: spacing.sm,
  },
  foodItemInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  foodServing: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.body,
    color: colors.textSecondary,
  },
  foodCalories: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
  },
  emptyMeal: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    paddingTop: 60,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  cancelButton: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
  modalTitle: {
    fontSize: typography.sizes.xl,
    fontFamily: typography.heading,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  saveButton: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    fontWeight: typography.weights.semibold,
    color: colors.black,
  },
  modalContent: {
    flex: 1,
    padding: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  textInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.black,
    borderRadius: 12,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    color: colors.textPrimary,
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
