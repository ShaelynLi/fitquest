import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
  Dimensions,
  RefreshControl,
  Alert,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme';
import { useAuth } from '../context/AuthContext';
import { useDailyStats } from '../context/DailyStatsContext';
import { useDailyFood } from '../context/DailyFoodContext';
import { api } from '../services';

const { width } = Dimensions.get('window');

/**
 * SummaryScreen Component - Enhanced Activity History and Calendar View
 * 
 * Features:
 * - Real-time activity logging (food and exercise)
 * - Calendar view with activity indicators
 * - Daily activity timeline with timestamps
 * - Integration with DailyStats and DailyFood contexts
 * - Backend data synchronization
 */
export default function SummaryScreen({ navigation }) {
  const { token } = useAuth();
  const { dailyStats, getFormattedDistance, getFormattedDuration, getLastActivityText } = useDailyStats();
  const { dailyFood, getFormattedNutrition, getLastMealText } = useDailyFood();

  const currentDate = new Date();
  const today = {
    date: currentDate.getDate(),
    month: currentDate.getMonth(),
    year: currentDate.getFullYear()
  };

  const [selectedDate, setSelectedDate] = useState(today.date);
  const [selectedMonth, setSelectedMonth] = useState(today.month);
  const [selectedYear, setSelectedYear] = useState(today.year);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastLoadedDate, setLastLoadedDate] = useState(null);
  const loadTimeoutRef = useRef(null);

  // Load activities for selected date
  const loadActivitiesForDate = async (targetDate) => {
    if (!token) return;
    
    // Prevent duplicate API calls for the same date
    if (lastLoadedDate === targetDate && !refreshing) {
      console.log('📅 Activities already loaded for date:', targetDate);
      return;
    }

    try {
      setIsLoading(true);
      setLastLoadedDate(targetDate);
      console.log('📅 Loading activities for date:', targetDate);

      // Get workout activities for the date
      const workoutResponse = await api.getActivitiesForDate(targetDate, token);
      const workouts = workoutResponse.workouts || [];

      // Get food data for the date
      const foodResponse = await api.getMeals(targetDate, token);
      const foodLogs = foodResponse.meals || {};

      // Combine and format activities
      const combinedActivities = [];

      // Add workout activities
      workouts.forEach(workout => {
        combinedActivities.push({
          id: `workout_${workout.id}`,
          type: 'exercise',
          time: formatTimeFromISO(workout.created_at),
          title: `${workout.workout_type} Workout`,
          subtitle: `${(workout.distance_meters / 1000).toFixed(2)} km • ${workout.duration_formatted}`,
          calories: `${Math.round(workout.calories_burned)} kcal`,
          icon: '🏃‍♀️',
          color: colors.blue[500],
          data: workout
        });
      });

      // Add food activities
      Object.entries(foodLogs).forEach(([mealType, foods]) => {
        foods.forEach(food => {
          if (food.date === targetDate) {
            combinedActivities.push({
              id: `food_${food.id}`,
              type: 'food',
              time: formatTimeFromISO(food.loggedAt),
              title: food.name,
              subtitle: `${mealType} • ${food.servingSize}`,
              calories: `${Math.round(food.calories)} kcal`,
              icon: getMealIcon(mealType),
              color: colors.green[500],
              data: food
            });
          }
        });
      });

      // Sort by time
      combinedActivities.sort((a, b) => {
        const timeA = new Date(a.data.loggedAt || a.data.created_at);
        const timeB = new Date(b.data.loggedAt || b.data.created_at);
        return timeA - timeB;
      });

      setActivities(combinedActivities);
      console.log(`📊 Loaded ${combinedActivities.length} activities for ${targetDate}`);

    } catch (error) {
      console.error('❌ Failed to load activities:', error);
      Alert.alert('Error', 'Failed to load activities. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Format time from ISO string
  const formatTimeFromISO = (isoString) => {
    if (!isoString) return 'Unknown time';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Get meal icon based on meal type
  const getMealIcon = (mealType) => {
    const icons = {
      breakfast: '🍳',
      lunch: '🥗',
      dinner: '🍽️',
      snacks: '🍎'
    };
    return icons[mealType] || '🍎';
  };

  // Format selected date for display
  const getFormattedDate = () => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const selectedDateObj = new Date(selectedYear, selectedMonth, selectedDate);
    const todayDate = new Date(today.year, today.month, today.date);

    if (selectedDateObj.toDateString() === todayDate.toDateString()) {
      return `Today, ${selectedDate.toString().padStart(2, '0')} ${months[selectedMonth]} ${selectedYear}`;
    } else {
      return `${selectedDate.toString().padStart(2, '0')} ${months[selectedMonth]} ${selectedYear}`;
    }
  };

  // Check if a date has activities
  const hasActivities = (day, month, year) => {
    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    // This would need to be implemented with actual data checking
    return false; // Placeholder
  };

  // Generate current week dates
  const generateCurrentWeek = () => {
    const today = new Date();
    const currentDate = new Date(selectedYear, selectedMonth, selectedDate);
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const week = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      week.push({
        date: date.getDate(),
        month: date.getMonth(),
        year: date.getFullYear(),
        isCurrentMonth: date.getMonth() === selectedMonth,
        isToday: date.toDateString() === new Date().toDateString(),
        hasActivities: hasActivities(date.getDate(), date.getMonth(), date.getFullYear())
      });
    }
    return week;
  };

  // Generate calendar weeks for a specific month (for full calendar modal)
  const generateCalendarWeeks = (year, month) => {
    const weeks = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    for (let i = 0; i < 6; i++) {
      const week = [];
      for (let j = 0; j < 7; j++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + (i * 7) + j);
        week.push({
          date: date.getDate(),
          month: date.getMonth(),
          year: date.getFullYear(),
          isCurrentMonth: date.getMonth() === month,
          isToday: date.toDateString() === new Date().toDateString(),
          hasActivities: hasActivities(date.getDate(), date.getMonth(), date.getFullYear())
        });
      }
      weeks.push({ dates: week });
    }
    return weeks;
  };

  // Navigate to previous week
  const goToPreviousWeek = () => {
    const currentDate = new Date(selectedYear, selectedMonth, selectedDate);
    currentDate.setDate(currentDate.getDate() - 7);
    setSelectedYear(currentDate.getFullYear());
    setSelectedMonth(currentDate.getMonth());
    setSelectedDate(currentDate.getDate());
    
    // Load activities for the new date
    const dateStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`;
    loadActivitiesForDate(dateStr);
  };

  // Navigate to next week
  const goToNextWeek = () => {
    const currentDate = new Date(selectedYear, selectedMonth, selectedDate);
    currentDate.setDate(currentDate.getDate() + 7);
    setSelectedYear(currentDate.getFullYear());
    setSelectedMonth(currentDate.getMonth());
    setSelectedDate(currentDate.getDate());
    
    // Load activities for the new date
    const dateStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`;
    loadActivitiesForDate(dateStr);
  };

  // Pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 20;
      },
      onPanResponderMove: (evt, gestureState) => {
        // Optional: Add visual feedback during swipe
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (Math.abs(gestureState.dx) > 50) {
          if (gestureState.dx > 0) {
            // Swipe right - go to previous week
            goToPreviousWeek();
          } else {
            // Swipe left - go to next week
            goToNextWeek();
          }
        }
      },
    })
  ).current;

  // Navigate to previous month (for full calendar)
  const goToPreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  // Navigate to next month (for full calendar)
  const goToNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  // Render calendar date
  const renderCalendarDate = (dateObj, weekIndex, dateIndex) => {
    const isSelected = dateObj.date === selectedDate && 
                      dateObj.month === selectedMonth && 
                      dateObj.year === selectedYear;
    const isToday = dateObj.isToday;
    const isCurrentMonth = dateObj.isCurrentMonth;
    const hasActivities = dateObj.hasActivities;
    
    // Create unique key combining week and date indices
    const uniqueKey = `date-${weekIndex}-${dateIndex}-${dateObj.date}-${dateObj.month}-${dateObj.year}`;

    return (
      <TouchableOpacity
        key={uniqueKey}
        style={[
          styles.calendarDateContainer,
          isSelected && styles.calendarDateSelected,
          isToday && styles.calendarDateToday,
        ]}
        onPress={() => {
          if (isCurrentMonth) {
            setSelectedDate(dateObj.date);
            setSelectedMonth(dateObj.month);
            setSelectedYear(dateObj.year);
            const dateStr = `${dateObj.year}-${(dateObj.month + 1).toString().padStart(2, '0')}-${dateObj.date.toString().padStart(2, '0')}`;
            loadActivitiesForDate(dateStr);
          }
        }}
      >
        <Text
          style={[
            styles.calendarDateText,
            !isCurrentMonth && styles.calendarDateTextInactive,
            isSelected && styles.calendarDateTextSelected,
            isToday && styles.calendarDateTextToday,
          ]}
        >
          {dateObj.date}
        </Text>
        {hasActivities && <View style={styles.activityIndicator} />}
      </TouchableOpacity>
    );
  };

  // Render activity item
  const renderActivityItem = (activity, index) => (
    <View key={`${activity.type}-${activity.id || index}`} style={styles.activityItem}>
      <View style={styles.activityTimeContainer}>
        <Text style={styles.activityTime}>{activity.time}</Text>
      </View>
      <View style={styles.activityContent}>
        <View style={styles.activityHeader}>
          <Text style={styles.activityIcon}>{activity.icon}</Text>
          <View style={styles.activityTextContainer}>
            <Text style={styles.activityTitle}>{activity.title}</Text>
            <Text style={styles.activitySubtitle}>{activity.subtitle}</Text>
          </View>
          <View style={styles.activityCaloriesContainer}>
            <Text style={[styles.activityCalories, { color: activity.color }]}>
              {activity.calories}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  // Render full calendar modal
  const renderFullCalendar = () => {
    const weeks = generateCalendarWeeks(selectedYear, selectedMonth);
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return (
      <View style={styles.fullCalendarContainer}>
        {/* Month Navigation */}
        <View style={styles.fullCalendarMonthHeader}>
          <TouchableOpacity 
            style={styles.fullCalendarNavButton}
            onPress={goToPreviousMonth}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          
          <Text style={styles.fullCalendarTitle}>
            {monthNames[selectedMonth]} {selectedYear}
          </Text>
          
          <TouchableOpacity 
            style={styles.fullCalendarNavButton}
            onPress={goToNextMonth}
          >
            <Ionicons name="chevron-forward" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Calendar Grid */}
        <View style={styles.fullCalendarGrid}>
          {/* Day Headers */}
          <View style={styles.fullCalendarDayHeaders}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
              <Text key={`full-day-${index}`} style={styles.fullCalendarDayHeader}>{day}</Text>
            ))}
          </View>
          
          {/* Calendar Dates */}
          {weeks.map((week, weekIndex) => (
            <View key={`full-week-${weekIndex}`} style={styles.fullCalendarWeek}>
              {week.dates.map((dateObj, dateIndex) => 
                renderCalendarDate(dateObj, weekIndex, dateIndex)
              )}
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    const dateStr = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, '0')}-${selectedDate.toString().padStart(2, '0')}`;
    await loadActivitiesForDate(dateStr);
    setRefreshing(false);
  };

  // Load activities on mount and when date changes with debouncing
  useEffect(() => {
    // Clear any existing timeout
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
    
    // Set a new timeout to debounce the API call
    loadTimeoutRef.current = setTimeout(() => {
      const dateStr = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, '0')}-${selectedDate.toString().padStart(2, '0')}`;
      loadActivitiesForDate(dateStr);
    }, 300); // 300ms debounce
    
    // Cleanup timeout on unmount
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [selectedDate, selectedMonth, selectedYear, token]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={20} color={colors.textSecondary} />
            </View>
            <Text style={styles.userName}>Activity Summary</Text>
          </View>
        </View>

        {/* Date Section */}
        <View style={styles.dateSection}>
          <View style={styles.dateHeader}>
            <Text style={styles.dateTitle}>{getFormattedDate()}</Text>
            <TouchableOpacity
              style={styles.calendarButton}
              onPress={() => setShowCalendarModal(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={colors.blue[500]} />
            </TouchableOpacity>
          </View>

          {/* Week Calendar */}
          <View style={styles.weekCalendar} {...panResponder.panHandlers}>
            {/* Week Navigation */}
            <View style={styles.weekCalendarHeader}>
              <TouchableOpacity 
                style={styles.weekNavButton}
                onPress={goToPreviousWeek}
              >
                <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
              
              <Text style={styles.weekCalendarTitle}>
                {getFormattedDate()}
              </Text>
              
              <TouchableOpacity 
                style={styles.weekNavButton}
                onPress={goToNextWeek}
              >
                <Ionicons name="chevron-forward" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Week Dates */}
            <View style={styles.weekDates}>
              {generateCurrentWeek().map((dateObj, dateIndex) => 
                renderCalendarDate(dateObj, 0, dateIndex)
              )}
            </View>
          </View>
        </View>

        {/* Daily Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Daily Summary</Text>
          <View style={styles.summaryCards}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryCardTitle}>Exercise</Text>
              <Text style={styles.summaryCardValue}>{getFormattedDistance().display}</Text>
              <Text style={styles.summaryCardSubtitle}>{getFormattedDuration()}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryCardTitle}>Food</Text>
              <Text style={styles.summaryCardValue}>{Math.round(dailyFood.totalCalories)} kcal</Text>
              <Text style={styles.summaryCardSubtitle}>{Object.values(dailyFood.meals).flat().length} items</Text>
            </View>
          </View>
        </View>

        {/* Activity List */}
        <View style={styles.activitiesSection}>
          <Text style={styles.activitiesTitle}>Activity Timeline</Text>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading activities...</Text>
            </View>
          ) : activities.length > 0 ? (
            activities.map(renderActivityItem)
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No activities recorded for this date</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Full Calendar Modal */}
      <Modal
        visible={showCalendarModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCalendarModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCalendarModal(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Date</Text>
            <View style={{ width: 50 }} />
          </View>
          {renderFullCalendar()}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scrollView: {
    flex: 1,
  },

  // Header Section
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },

  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
  },

  userName: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.body,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },

  // Date Section
  dateSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },

  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },

  dateTitle: {
    fontSize: typography.sizes.xl,
    fontFamily: typography.heading,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },

  calendarButton: {
    padding: spacing.sm,
    backgroundColor: colors.blue[50],
    borderRadius: 8,
  },

  // Week Calendar
  weekCalendar: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Week Navigation
  weekCalendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  weekNavButton: {
    padding: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.gray[100],
  },

  weekCalendarTitle: {
    fontSize: typography.sizes.md,
    fontFamily: typography.heading,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    textAlign: 'center',
    flex: 1,
  },

  // Week Dates
  weekDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  calendarDateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    position: 'relative',
  },

  calendarDateText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textPrimary,
  },

  calendarDateTextInactive: {
    color: colors.textSecondary,
  },

  calendarDateTextSelected: {
    color: colors.blue[500],
    fontWeight: typography.weights.semibold,
  },

  calendarDateTextToday: {
    color: colors.blue[500],
    fontWeight: typography.weights.semibold,
  },

  calendarDateSelected: {
    backgroundColor: colors.blue[50],
    borderWidth: 2,
    borderColor: colors.blue[500],
  },

  calendarDateToday: {
    borderWidth: 2,
    borderColor: colors.blue[500],
  },

  activityIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.blue[500],
  },

  // Summary Section
  summarySection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },

  summaryTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.heading,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },

  summaryCards: {
    flexDirection: 'row',
    gap: spacing.md,
  },

  summaryCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },

  summaryCardTitle: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },

  summaryCardValue: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.heading,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },

  summaryCardSubtitle: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
  },

  // Activities Section
  activitiesSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },

  activitiesTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.heading,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },

  activityItem: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
  },

  activityTimeContainer: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },

  activityTime: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  activityContent: {
    flex: 1,
    marginLeft: spacing.md,
  },

  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  activityIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },

  activityTextContainer: {
    flex: 1,
  },

  activityTitle: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },

  activitySubtitle: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
  },

  activityCaloriesContainer: {
    alignItems: 'flex-end',
  },

  activityCalories: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    fontWeight: typography.weights.semibold,
  },

  // Loading and Empty States
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },

  loadingText: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    color: colors.textSecondary,
  },

  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },

  emptyText: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    color: colors.textSecondary,
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },

  modalCloseText: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    color: colors.blue[500],
  },

  modalTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.heading,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },

  // Full Calendar
  fullCalendarContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },

  // Full Calendar Month Navigation
  fullCalendarMonthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },

  fullCalendarNavButton: {
    padding: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.gray[100],
  },

  fullCalendarTitle: {
    fontSize: typography.sizes.xl,
    fontFamily: typography.heading,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },

  // Full Calendar Grid
  fullCalendarGrid: {
    flex: 1,
    paddingTop: spacing.md,
  },

  fullCalendarDayHeaders: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },

  fullCalendarDayHeader: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    width: 40,
    fontWeight: typography.weights.medium,
  },

  fullCalendarWeek: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
});
