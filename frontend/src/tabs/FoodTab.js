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
 * FoodTab Component - Food Diary & Nutrition Tracking
 *
 * Complete food logging and nutrition tracking interface.
 * Updated with Aura Health design system - card-based layout with sophisticated styling.
 *
 * Key Features:
 * - Circular pie chart showing daily calorie progress
 * - Horizontal progress bars for macronutrients (Fat, Protein, Carbs)
 * - Meal logging by category (Breakfast, Lunch, Dinner, Snacks)
 * - Modal interface for adding foods with nutrition data
 * - Daily nutrition goals and progress tracking
 *
 * Part of the nested tab navigation within HomeScreen.
 */
export default function FoodTab({ navigation, route }) {
  const [selectedDate, setSelectedDate] = useState(new Date());

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
   * CaloriePieChart Component - Updated with Aura Health styling
   */
  const CaloriePieChart = ({ current, goal }) => {
    const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
    const isOverGoal = current > goal;

    return (
      <View style={styles.pieChartContainer}>
        <View style={styles.pieChart}>
          {/* Background circle */}
          <View style={styles.pieBackground}>
            {/* Progress indicator using border */}
            <View style={[
              styles.pieProgress,
              {
                borderColor: colors.gray[200],
                borderTopColor: isOverGoal ? colors.aurora.pink : colors.aurora.blue,
                transform: [{ rotate: `${(percentage * 3.6) - 90}deg` }]
              }
            ]} />
          </View>
          {/* Center content */}
          <View style={styles.pieCenter}>
            <Text style={globalStyles.mediumNumber}>
              {Math.round(current)}
            </Text>
            <Text style={globalStyles.captionText}>kcal</Text>
          </View>
        </View>
        <Text style={globalStyles.captionText}>
          Goal: {goal} kcal
        </Text>
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

  // Meal section component - Updated with Aura Health styling
  const MealSection = ({ mealType, foods, icon }) => {
    const mealCalories = foods.reduce((sum, food) => sum + food.calories, 0);

    return (
      <View style={globalStyles.card}>
        <View style={styles.mealHeader}>
          <View style={styles.mealTitleContainer}>
            <Ionicons name={icon} size={20} color={colors.textPrimary} />
            <Text style={globalStyles.sectionSubheader}>
              {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
            </Text>
            <Text style={globalStyles.secondaryText}>{mealCalories} cal</Text>
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

        {foods.length === 0 && (
          <Text style={styles.emptyMeal}>No foods added yet</Text>
        )}
      </View>
    );
  };

  return (
    <View style={globalStyles.screenContainer}>
      <ScrollView style={styles.scrollView}>
        {/* Daily Nutrition Overview - Updated with Aura Health styling */}
        <View style={globalStyles.cardLarge}>
          <Text style={globalStyles.sectionHeader}>Daily Nutrition</Text>
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
                color={colors.aurora.orange}
              />
              <MacroBar
                label="Protein"
                current={dailyTotals.protein}
                goal={dailyGoals.protein}
                color={colors.aurora.green}
              />
              <MacroBar
                label="Carbs"
                current={dailyTotals.carbs}
                goal={dailyGoals.carbs}
                color={colors.aurora.violet}
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
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },

  // Nutrition Overview
  nutritionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // Pie Chart Styles - Updated
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
    borderRadius: 60,
    width: 120,
    height: 120,
  },
  pieProgress: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 12,
  },
  pieCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Macro Bars Styles - Updated
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
  macroProgressContainer: {
    height: 6,
    width: '100%',
    backgroundColor: colors.gray[200],
    borderRadius: 3,
    overflow: 'hidden',
  },
  macroProgress: {
    height: '100%',
    borderRadius: 3,
  },

  // Meal Section Styles - Updated
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
  addButton: {
    backgroundColor: colors.textPrimary,
    borderRadius: 20,
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
    marginBottom: spacing.sm,
  },
  foodItemInfo: {
    flex: 1,
  },
  emptyMeal: {
    ...globalStyles.secondaryText,
    textAlign: 'center',
    paddingVertical: spacing.lg,
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