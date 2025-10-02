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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { colors, spacing, typography, globalStyles } from '../theme';
import { api } from '../services';
import { useAuth } from '../context/AuthContext';

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
  const { token } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  
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
        calories: totals.calories + (food.food?.calories || food.calories || 0),
        protein: totals.protein + (food.food?.protein || food.protein || 0),
        carbs: totals.carbs + (food.food?.carbs || food.carbs || 0),
        fat: totals.fat + (food.food?.fat || food.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const dailyTotals = calculateDailyTotals();

  // Load food logs when date changes
  useEffect(() => {
    loadFoodLogs();
  }, [selectedDate, token]);

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

  // Load food logs from Firebase
  const loadFoodLogs = async () => {
    if (!token) return;
    
    try {
      setIsLoading(true);
      const dateStr = selectedDate.toISOString().split('T')[0];
      console.log('🍎 Loading food logs for date:', dateStr);
      
      const response = await api.getFoodLogs(dateStr, token);
      console.log('📊 Food logs response:', response);
      
      if (response.success) {
        setMeals(response.meals);
        console.log('✅ Food logs loaded successfully');
      }
    } catch (error) {
      console.error('❌ Failed to load food logs:', error);
      Alert.alert('Error', 'Failed to load food logs. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle food selection from search screen
  const handleFoodSelected = async (foodData, mealType) => {
    if (!token) {
      Alert.alert('Error', 'Please log in to save food logs.');
      return;
    }

    try {
      console.log('🍎 Saving food to Firebase:', foodData);
      
      const foodLogData = {
        name: foodData.name,
        brand: foodData.brand || '',
        calories: foodData.calories || 0,
        protein: foodData.protein || 0,
        carbs: foodData.carbs || 0,
        fat: foodData.fat || 0,
        servingSize: foodData.servingSize || '1 serving',
        mealType: mealType,
        date: selectedDate.toISOString().split('T')[0]
      };

      const response = await api.logFood(foodLogData, token);
      console.log('✅ Food saved to Firebase:', response);

      if (response.success) {
        // Update local state
        const newFood = {
          id: response.food_log_id,
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

        Alert.alert('Success', 'Food logged successfully!');
      }
    } catch (error) {
      console.error('❌ Failed to save food:', error);
      Alert.alert('Error', 'Failed to save food. Please try again.');
    }
  };

  // Navigate to food search screen
  const openFoodSearch = (mealType) => {
    navigation.navigate('FoodSearch', {
      mealType,
    });
  };

  // Manual entry function
  const addMeal = async () => {
    if (!foodName.trim() || !calories) {
      Alert.alert('Error', 'Please enter food name and calories');
      return;
    }

    if (!token) {
      Alert.alert('Error', 'Please log in to save food logs.');
      return;
    }

    try {
      const foodLogData = {
        name: foodName.trim(),
        brand: '',
        calories: parseInt(calories) || 0,
        protein: parseInt(protein) || 0,
        carbs: parseInt(carbs) || 0,
        fat: parseInt(fat) || 0,
        servingSize: '1 serving',
        mealType: selectedMealType,
        date: selectedDate.toISOString().split('T')[0]
      };

      console.log('🍎 Saving manual food entry to Firebase:', foodLogData);
      const response = await api.logFood(foodLogData, token);
      console.log('✅ Manual food entry saved:', response);

      if (response.success) {
        const newFood = {
          id: response.food_log_id,
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

        Alert.alert('Success', 'Food logged successfully!');
      }
    } catch (error) {
      console.error('❌ Failed to save manual food entry:', error);
      Alert.alert('Error', 'Failed to save food. Please try again.');
    }
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
                backgroundColor: isOverGoal ? colors.error : colors.aurora.blue
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
    const mealCalories = foods.reduce((sum, food) => {
      const cal = food.food?.calories || food.calories || 0;
      return sum + cal;
    }, 0);

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
          <Text style={styles.mealCalories}>{Math.round(mealCalories)} kcal</Text>
        </View>

        {/* Food Items List */}
        {foods.length > 0 ? (
          <View style={styles.foodList}>
            {foods.map((item) => {
              const food = item.food || item;
              return (
                <View key={item.id} style={styles.foodItem}>
                  <View style={styles.foodItemInfo}>
                    <Text style={globalStyles.bodyText}>
                      {food.brand ? `${food.name} (${food.brand})` : food.name}
                    </Text>
                    {food.serving_amount && (
                      <Text style={globalStyles.captionText}>
                        {food.serving_amount}{food.serving_unit || 'g'}
                      </Text>
                    )}
                  </View>
                  <Text style={globalStyles.secondaryText}>{Math.round(food.calories)} cal</Text>
                </View>
              );
            })}
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

  // Create new CircularProgress component
  const CircularProgress = ({ percentage, size = 64, strokeWidth = 6, color, backgroundColor = colors.gray[100] }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size} style={{ position: 'absolute' }}>
          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={backgroundColor}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        {/* Center icon */}
        <View style={{
          width: 20,
          height: 20,
          backgroundColor: color + '20',
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <View style={{
            width: 10,
            height: 10,
            backgroundColor: color,
            borderRadius: 4,
          }} />
        </View>
      </View>
    );
  };

  const MacroCircle = ({ label, current, goal, color }) => {
    const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
    return (
      <View style={styles.macroCircleContainer}>
        <CircularProgress
          percentage={percentage}
          color={color}
          size={64}
          strokeWidth={6}
        />
        <Text style={styles.macroLabel}>{label}</Text>
        <Text style={styles.macroText}>{Math.round(current)} / {Math.round(goal)}g</Text>
      </View>
    );
  };

  const MealCard = ({ title, calories = 0, foods = [], onPress }) => (
    <View style={styles.mealCard}>
      <View style={styles.mealCardHeader}>
        <Text style={styles.mealCardTitle}>{title}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={onPress}
        >
          <Ionicons name="add" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      {foods.length > 0 ? (
        <View style={styles.mealCardContent}>
          {foods.map((item, index) => {
            const food = item.food || item;
            return (
              <View key={item.id || index} style={styles.mealFoodItem}>
                <Text style={styles.mealFoodName} numberOfLines={1}>
                  {food.name}
                </Text>
                <Text style={styles.mealFoodCalories}>
                  {Math.round(food.calories)} cal
                </Text>
              </View>
            );
          })}
          <Text style={styles.mealCardCalories}>{Math.round(calories)} kcal total</Text>
        </View>
      ) : (
        <View style={styles.mealCardContent}>
          <Text style={styles.mealCardEmpty}>No food logged</Text>
          <Text style={styles.mealCardCalories}>{calories} kcal</Text>
        </View>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Intake and Macronutrients Combined Card */}
      <View style={styles.nutritionCard}>
        {/* Intake Section */}
        <View style={styles.intakeSection}>
          <Text style={styles.cardLabel}>Intake</Text>
          <View style={styles.intakeContent}>
            <View style={styles.intakeNumbers}>
              <Text style={styles.mainIntakeNumber}>{dailyTotals.calories}</Text>
              <Text style={styles.intakeUnit}>kcal</Text>
            </View>
            <Text style={styles.remainingText}>
              {Math.max(dailyGoals.calories - dailyTotals.calories, 0).toLocaleString()} remaining
            </Text>

            {/* Progress Bar */}
            <View style={styles.intakeProgressContainer}>
              <View style={styles.intakeProgressLabels}>
                <Text style={styles.progressLabel}>0</Text>
                <Text style={styles.progressLabel}>{dailyGoals.calories.toLocaleString()}</Text>
              </View>
              <View style={styles.intakeProgressBar}>
                <View
                  style={[
                    styles.intakeProgressFill,
                    { width: `${Math.min((dailyTotals.calories / dailyGoals.calories) * 100, 100)}%` }
                  ]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Macronutrients Section */}
        <View style={styles.macronutrientsSection}>
          <MacroCircle
            label="Carbs"
            current={dailyTotals.carbs}
            goal={dailyGoals.carbs}
            color={colors.purple[500]}
          />
          <MacroCircle
            label="Fats"
            current={dailyTotals.fat}
            goal={dailyGoals.fat}
            color={colors.yellow[500]}
          />
          <MacroCircle
            label="Protein"
            current={dailyTotals.protein}
            goal={dailyGoals.protein}
            color={colors.pink[500]}
          />
        </View>
      </View>

      {/* Loading Indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.textPrimary} />
          <Text style={styles.loadingText}>Loading meals...</Text>
        </View>
      )}

      {/* Meal Sections */}
      {!isLoading && (
        <View style={styles.mealSections}>
          <MealCard
            title="Breakfast"
            foods={meals.breakfast}
            calories={meals.breakfast.reduce((sum, item) => {
              const food = item.food || item;
              return sum + (food.calories || 0);
            }, 0)}
            onPress={() => openFoodSearch('breakfast')}
          />
          <MealCard
            title="Lunch"
            foods={meals.lunch}
            calories={meals.lunch.reduce((sum, item) => {
              const food = item.food || item;
              return sum + (food.calories || 0);
            }, 0)}
            onPress={() => openFoodSearch('lunch')}
          />
          <MealCard
            title="Dinner"
            foods={meals.dinner}
            calories={meals.dinner.reduce((sum, item) => {
              const food = item.food || item;
              return sum + (food.calories || 0);
            }, 0)}
            onPress={() => openFoodSearch('dinner')}
          />
        </View>
      )}

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Base Layout
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },

  // Nutrition Card
  nutritionCard: {
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

  // Intake Section
  intakeSection: {
    marginBottom: spacing.lg,
  },

  cardLabel: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },

  intakeContent: {
    gap: spacing.sm,
  },

  intakeNumbers: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },

  mainIntakeNumber: {
    fontSize: 32,
    fontFamily: typography.heading,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },

  intakeUnit: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
  },

  remainingText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
  },

  // Intake Progress Bar
  intakeProgressContainer: {
    marginTop: spacing.md,
  },

  intakeProgressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },

  progressLabel: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.body,
    color: colors.textSecondary,
  },

  intakeProgressBar: {
    height: 6,
    backgroundColor: colors.gray[100],
    borderRadius: 3,
    overflow: 'hidden',
  },

  intakeProgressFill: {
    height: '100%',
    backgroundColor: colors.green[500],
    borderRadius: 3,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: colors.gray[100],
    marginVertical: spacing.lg,
  },

  // Macronutrients Section
  macronutrientsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: spacing.lg,
  },

  macroCircleContainer: {
    alignItems: 'center',
    flex: 1,
  },

  macroLabel: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },

  macroText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textPrimary,
  },

  // Meal Sections
  mealSections: {
    gap: spacing.md,
  },

  mealCard: {
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

  mealCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  mealCardTitle: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    color: colors.textSecondary,
  },

  addButton: {
    padding: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.gray[50],
  },

  mealCardContent: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },

  mealCardEmpty: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },

  mealCardCalories: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },

  // Modal Styles
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

  // Loading Indicator
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },

  loadingText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },

  // Meal Food Items
  mealFoodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },

  mealFoodName: {
    flex: 1,
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },

  mealFoodCalories: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
  },
});