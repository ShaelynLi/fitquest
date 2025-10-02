import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme';

/**
 * HistoryScreen Component - Activity History and Calendar View
 *
 * Matches the reference design with:
 * - User avatar and profile info at top
 * - Monthly calendar with activity indicators
 * - Daily activity log with time stamps
 * - Activity cards showing exercise and food entries
 * - Bottom tab navigation
 */
export default function HistoryScreen({ navigation }) {
  const currentDate = new Date();
  const today = {
    date: currentDate.getDate(),
    month: currentDate.getMonth(),
    year: currentDate.getFullYear()
  };

  const [selectedDate, setSelectedDate] = useState(today.date);
  const [activeTab, setActiveTab] = useState('DAY');
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(today.month);
  const [selectedYear, setSelectedYear] = useState(today.year);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(10); // Start at middle (week 10 of 20)
  const calendarScrollRef = useRef(null);

  // Check if a date is in the future
  const isFutureDate = (day, month, year) => {
    const dateToCheck = new Date(year, month, day);
    const todayDate = new Date(today.year, today.month, today.date);
    return dateToCheck > todayDate;
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

  // Mock data for activities
  const activities = [
    {
      id: 1,
      time: '10:59 AM',
      type: 'Cycling',
      icon: '🚴‍♀️',
      calories: '59 kcal',
      color: colors.pink[500],
    },
    {
      id: 2,
      time: '11:19 AM',
      type: 'Running',
      icon: '🏃‍♀️',
      calories: '638 kcal',
      color: colors.pink[500],
    },
    {
      id: 3,
      time: '1:57 PM',
      type: 'Steak Sandwich on Roll',
      icon: '🍎',
      calories: '344 kcal',
      color: colors.green[500],
    },
  ];

  // Generate consecutive weeks for sliding calendar
  const generateSlidingCalendarData = () => {
    const daysOfWeek = ['M', 'Tu', 'W', 'Th', 'F', 'Sa', 'Su'];
    const weeks = [];

    // Find the Monday of the week containing today's date
    const todayDate = new Date(today.year, today.month, today.date);
    const todayDayOfWeek = todayDate.getDay();
    const daysFromMonday = todayDayOfWeek === 0 ? 6 : todayDayOfWeek - 1;

    const todayMondayDate = new Date(todayDate);
    todayMondayDate.setDate(todayDate.getDate() - daysFromMonday);

    // Generate 20 weeks: 10 weeks before today's week + today's week + 9 weeks after (including future weeks)
    for (let weekOffset = -10; weekOffset <= 9; weekOffset++) {
      const weekDates = [];

      // Calculate the Monday of this week
      const weekMondayDate = new Date(todayMondayDate);
      weekMondayDate.setDate(todayMondayDate.getDate() + (weekOffset * 7));

      // Generate 7 days for this week
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const currentDate = new Date(weekMondayDate);
        currentDate.setDate(weekMondayDate.getDate() + dayIndex);

        const isSelectedDate = currentDate.getDate() === selectedDate &&
                              currentDate.getMonth() === selectedMonth &&
                              currentDate.getFullYear() === selectedYear;

        weekDates.push({
          date: currentDate.getDate(),
          month: currentDate.getMonth(),
          year: currentDate.getFullYear(),
          hasActivity: currentDate.getDate() <= today.date && currentDate.getMonth() === today.month && currentDate.getFullYear() === today.year,
          isSelected: isSelectedDate,
        });
      }

      weeks.push({
        weekIndex: weekOffset + 10, // Convert to 0-19 index
        dates: weekDates
      });
    }

    return { daysOfWeek, weeks };
  };

  const { daysOfWeek, weeks } = generateSlidingCalendarData();

  // Effect to scroll calendar when week index changes
  useEffect(() => {
    if (calendarScrollRef.current && currentWeekIndex >= 0 && currentWeekIndex < 20) {
      const pageWidth = Dimensions.get('window').width - (spacing.lg * 2);
      calendarScrollRef.current.scrollTo({
        x: currentWeekIndex * pageWidth,
        animated: true
      });
    }
  }, [currentWeekIndex]);

  const renderCalendarDate = (dateObj, index) => {
    const isSelected = dateObj.isSelected;
    const isToday = dateObj.date === today.date && dateObj.month === today.month && dateObj.year === today.year;
    const isFuture = isFutureDate(dateObj.date, dateObj.month, dateObj.year);
    const isPast = !isToday && !isFuture;

    return (
      <View key={index} style={styles.calendarDateContainer}>
        <TouchableOpacity
          style={[
            styles.calendarDate,
            isToday && styles.calendarDateToday,
            isSelected && !isToday && styles.calendarDateSelected,
            isFuture && styles.calendarDateDisabled,
            isPast && styles.calendarDatePast,
          ]}
          onPress={() => {
            if (!isFuture) {
              setSelectedDate(dateObj.date);
              setSelectedMonth(dateObj.month);
              setSelectedYear(dateObj.year);
            }
          }}
          disabled={isFuture}
        >
          <Text
            style={[
              styles.calendarDateText,
              isToday && styles.calendarDateTextToday,
              isSelected && !isToday && styles.calendarDateTextSelected,
              isFuture && styles.calendarDateTextDisabled,
              isPast && styles.calendarDateTextPast,
            ]}
          >
            {dateObj.date}
          </Text>
        </TouchableOpacity>
        {dateObj.hasActivity && (
          <View style={styles.activityIndicator} />
        )}
      </View>
    );
  };

  const renderActivityItem = (activity) => (
    <View key={activity.id} style={styles.activityItem}>
      <Text style={styles.activityTime}>{activity.time}</Text>
      <View style={styles.activityCard}>
        <View style={styles.activityInfo}>
          <View style={[styles.activityIcon, { backgroundColor: activity.color + '20' }]}>
            <Text style={styles.activityEmoji}>{activity.icon}</Text>
          </View>
          <Text style={styles.activityName}>{activity.type}</Text>
        </View>
        <Text style={styles.activityCalories}>{activity.calories}</Text>
      </View>
    </View>
  );

  // Generate full calendar for modal
  const generateFullCalendar = () => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay();
    const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Adjust for Monday start

    const weeks = [];
    let currentWeek = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < adjustedFirstDay; i++) {
      currentWeek.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(day);

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // Add remaining empty cells
    while (currentWeek.length < 7 && currentWeek.length > 0) {
      currentWeek.push(null);
    }
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks;
  };

  const renderFullCalendar = () => {
    const weeks = generateFullCalendar();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return (
      <ScrollView style={styles.fullCalendar}>
        <View style={styles.monthHeader}>
          <TouchableOpacity
            onPress={() => {
              if (selectedMonth === 0) {
                setSelectedMonth(11);
                setSelectedYear(selectedYear - 1);
              } else {
                setSelectedMonth(selectedMonth - 1);
              }
            }}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>
            {monthNames[selectedMonth]} {selectedYear}
          </Text>
          <TouchableOpacity
            onPress={() => {
              // Don't allow navigation to future months
              const nextMonth = selectedMonth === 11 ? 0 : selectedMonth + 1;
              const nextYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear;

              // Check if next month would be in the future
              const nextMonthDate = new Date(nextYear, nextMonth, 1);
              const currentDate = new Date(today.year, today.month, today.date);

              if (nextMonthDate <= currentDate) {
                setSelectedMonth(nextMonth);
                setSelectedYear(nextYear);
              }
            }}
            disabled={(() => {
              const nextMonth = selectedMonth === 11 ? 0 : selectedMonth + 1;
              const nextYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear;
              const nextMonthDate = new Date(nextYear, nextMonth, 1);
              const currentDate = new Date(today.year, today.month, today.date);
              return nextMonthDate > currentDate;
            })()}
            style={{ opacity: (() => {
              const nextMonth = selectedMonth === 11 ? 0 : selectedMonth + 1;
              const nextYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear;
              const nextMonthDate = new Date(nextYear, nextMonth, 1);
              const currentDate = new Date(today.year, today.month, today.date);
              return nextMonthDate > currentDate ? 0.3 : 1;
            })() }}
          >
            <Ionicons name="chevron-forward" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Days of week header */}
        <View style={styles.fullCalendarHeader}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
            <Text key={index} style={styles.fullCalendarDayHeader}>{day}</Text>
          ))}
        </View>

        {/* Calendar weeks */}
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.fullCalendarWeek}>
            {week.map((day, dayIndex) => {
              const isToday = day === today.date && selectedMonth === today.month && selectedYear === today.year;
              const isSelected = day === selectedDate && selectedMonth === selectedMonth && selectedYear === selectedYear;
              const isFuture = day && isFutureDate(day, selectedMonth, selectedYear);

              return (
                <TouchableOpacity
                  key={dayIndex}
                  style={[
                    styles.fullCalendarDay,
                    isToday && styles.fullCalendarDayToday,
                    isSelected && !isToday && styles.fullCalendarDaySelected,
                    isFuture && styles.fullCalendarDayDisabled,
                  ]}
                  onPress={() => {
                    if (day && !isFutureDate(day, selectedMonth, selectedYear)) {
                      setSelectedDate(day);
                      setSelectedMonth(selectedMonth);
                      setSelectedYear(selectedYear);

                      // Calculate which week index this date falls into for the sliding calendar
                      const selectedDateObj = new Date(selectedYear, selectedMonth, day);
                      const todayDate = new Date(today.year, today.month, today.date);
                      const todayDayOfWeek = todayDate.getDay();
                      const daysFromMonday = todayDayOfWeek === 0 ? 6 : todayDayOfWeek - 1;
                      const todayMondayDate = new Date(todayDate);
                      todayMondayDate.setDate(todayDate.getDate() - daysFromMonday);

                      // Find which week offset this date belongs to
                      const selectedDayOfWeek = selectedDateObj.getDay();
                      const selectedDaysFromMonday = selectedDayOfWeek === 0 ? 6 : selectedDayOfWeek - 1;
                      const selectedMondayDate = new Date(selectedDateObj);
                      selectedMondayDate.setDate(selectedDateObj.getDate() - selectedDaysFromMonday);

                      const daysDifference = Math.floor((selectedMondayDate - todayMondayDate) / (1000 * 60 * 60 * 24));
                      const weekOffset = Math.floor(daysDifference / 7);
                      const newWeekIndex = 10 + weekOffset; // 10 is the middle (today's week)

                      // Update the current week index
                      setCurrentWeekIndex(newWeekIndex);

                      setShowCalendarModal(false);
                    }
                  }}
                  disabled={!day || isFutureDate(day, selectedMonth, selectedYear)}
                >
                  <Text
                    style={[
                      styles.fullCalendarDayText,
                      isToday && styles.fullCalendarDayTextToday,
                      isSelected && !isToday && styles.fullCalendarDayTextSelected,
                      !day && styles.fullCalendarDayTextHidden,
                      isFuture && styles.fullCalendarDayTextDisabled,
                    ]}
                  >
                    {day || ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header with user info */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.userInfo}
            onPress={() => {
              console.log('Avatar clicked, navigating to Profile...');
              // Use getParent() to access the Stack navigator
              navigation.getParent()?.navigate('Profile');
            }}
          >
            <View style={styles.avatar}>
              <Ionicons name="person" size={24} color={colors.white} />
            </View>
            <Text style={styles.userName}>YU</Text>
          </TouchableOpacity>
        </View>

        {/* Date and Calendar */}
        <View style={styles.dateSection}>
          <View style={styles.dateHeader}>
            <Text style={styles.dateTitle}>{getFormattedDate()}</Text>
            <TouchableOpacity
              style={styles.calendarButton}
              onPress={() => setShowCalendarModal(true)}
            >
              <Ionicons name="calendar" size={20} color={colors.blue[500]} />
            </TouchableOpacity>
          </View>

          {/* Calendar Week View */}
          <View style={styles.calendar}>
            <View style={styles.calendarHeader}>
              {daysOfWeek.map((day, index) => (
                <Text key={index} style={styles.dayLabel}>{day}</Text>
              ))}
            </View>

            <ScrollView
              ref={calendarScrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={styles.calendarScrollView}
              contentContainerStyle={styles.calendarScrollContent}
              onMomentumScrollEnd={(event) => {
                const offsetX = event.nativeEvent.contentOffset.x;
                const pageWidth = event.nativeEvent.layoutMeasurement.width;
                const newWeekIndex = Math.round(offsetX / pageWidth);

                setCurrentWeekIndex(newWeekIndex);

                const selectedWeek = weeks[newWeekIndex];
                if (selectedWeek && selectedWeek.dates.length > 0) {
                  // Check if current selection is in this week
                  const currentWeekHasSelected = selectedWeek.dates.some(d => d.isSelected);

                  if (!currentWeekHasSelected) {
                    // Find the best date to select in this week (prefer today if in this week, otherwise last valid date)
                    let dateToSelect = null;

                    // First, check if today is in this week
                    const todayInWeek = selectedWeek.dates.find(d =>
                      d.date === today.date && d.month === today.month && d.year === today.year
                    );

                    if (todayInWeek) {
                      dateToSelect = todayInWeek;
                    } else {
                      // Find last non-future date in this week (work backwards from Sunday)
                      for (let i = selectedWeek.dates.length - 1; i >= 0; i--) {
                        const date = selectedWeek.dates[i];
                        if (!isFutureDate(date.date, date.month, date.year)) {
                          dateToSelect = date;
                          break;
                        }
                      }
                    }

                    if (dateToSelect) {
                      setSelectedDate(dateToSelect.date);
                      setSelectedMonth(dateToSelect.month);
                      setSelectedYear(dateToSelect.year);
                    }
                  }
                }
              }}
            >
              {weeks.map((week, weekIndex) => (
                <View key={weekIndex} style={styles.calendarWeekContainer}>
                  {week.dates.map((dateObj, dateIndex) => renderCalendarDate(dateObj, `${weekIndex}-${dateIndex}`))}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabNavigation}>
          <View style={styles.leftTabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'DAY' && styles.tabActive]}
              onPress={() => setActiveTab('DAY')}
            >
              <Text style={[styles.tabText, activeTab === 'DAY' && styles.tabTextActive]}>
                DAY
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.filtersButton}>
            <Text style={styles.filtersText}>FILTERS</Text>
            <Ionicons name="filter" size={16} color={colors.blue[500]} />
          </TouchableOpacity>
        </View>

        {/* Activity List */}
        <View style={styles.activitiesSection}>
          {activities.map(renderActivityItem)}
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
    backgroundColor: colors.gray[500],
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

  // Calendar
  calendar: {
    gap: spacing.sm,
  },

  calendarScrollView: {
    height: 60,
  },

  calendarScrollContent: {
    alignItems: 'flex-start',
  },

  calendarWeekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: Dimensions.get('window').width - (spacing.lg * 2),
    paddingHorizontal: spacing.sm,
  },

  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.sm,
  },

  dayLabel: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    width: 40,
  },

  calendarDates: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.sm,
  },

  calendarDateContainer: {
    alignItems: 'center',
    gap: spacing.xs,
  },

  calendarDate: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  calendarDateToday: {
    backgroundColor: colors.green[500],
  },

  calendarDateSelected: {
    borderWidth: 2,
    borderColor: colors.green[500],
  },

  calendarDatePast: {
    // No background color for past dates
  },

  calendarDateDisabled: {
    // No background color for future dates, just gray text
  },

  calendarDateText: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
  },

  calendarDateTextInactive: {
    color: colors.textSecondary,
  },

  calendarDateTextToday: {
    color: colors.white,
    fontWeight: typography.weights.bold,
  },

  calendarDateTextSelected: {
    color: colors.green[500],
    fontWeight: typography.weights.bold,
  },

  calendarDateTextPast: {
    color: colors.textPrimary,
    fontWeight: typography.weights.medium,
  },

  calendarDateTextDisabled: {
    color: colors.gray[500],
  },

  activityIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textPrimary,
  },

  // Tab Navigation
  tabNavigation: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    width: '100%',
    gap: spacing.xl,
  },

  leftTabs: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  tab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },

  tabActive: {
    backgroundColor: colors.aurora.teal,
  },

  tabText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },

  tabTextActive: {
    color: colors.white,
  },

  filtersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.blue[50],
    borderRadius: 20,
  },

  filtersText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    fontWeight: typography.weights.semibold,
    color: colors.blue[500],
  },

  // Activities Section
  activitiesSection: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },

  activityItem: {
    gap: spacing.sm,
  },

  activityTime: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },

  activityCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    minHeight: 72,
  },

  activityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },

  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  activityEmoji: {
    fontSize: 20,
  },

  activityName: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
    flex: 1,
  },

  activityCalories: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },

  // Modal Styles
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
    borderBottomColor: colors.border,
  },

  modalCloseText: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    color: colors.blue[500],
    fontWeight: typography.weights.semibold,
  },

  modalTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.heading,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },

  // Full Calendar Styles
  fullCalendar: {
    flex: 1,
    padding: spacing.lg,
  },

  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },

  monthTitle: {
    fontSize: typography.sizes.xl,
    fontFamily: typography.heading,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },

  fullCalendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },

  fullCalendarDayHeader: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    width: 40,
    fontWeight: typography.weights.semibold,
  },

  fullCalendarWeek: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.sm,
  },

  fullCalendarDay: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  fullCalendarDayToday: {
    backgroundColor: colors.green[500],
  },

  fullCalendarDaySelected: {
    borderWidth: 2,
    borderColor: colors.green[500],
  },

  fullCalendarDayDisabled: {
    // No background color for future dates, just gray text
  },

  fullCalendarDayText: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
  },

  fullCalendarDayTextToday: {
    color: colors.white,
    fontWeight: typography.weights.bold,
  },

  fullCalendarDayTextSelected: {
    color: colors.green[500],
    fontWeight: typography.weights.bold,
  },

  fullCalendarDayTextPast: {
    color: colors.textPrimary,
    fontWeight: typography.weights.medium,
  },

  fullCalendarDayTextDisabled: {
    color: colors.gray[500],
  },

  fullCalendarDayTextHidden: {
    opacity: 0,
  },
});