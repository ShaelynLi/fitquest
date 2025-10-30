import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme';
import { useAuth } from '../context/AuthContext';
import { api } from '../services';

/**
 * EditProfileScreen Component - User Profile Editing
 *
 * Features:
 * - Edit all user profile information
 * - Real-time validation
 * - Save changes to Firebase
 * - Navigation back to Profile screen
 */
export default function EditProfileScreen({ navigation }) {
  const { user, token, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    // Basic Information
    firstName: '',
    lastName: '',
    displayName: '',
    email: '',
    gender: '',
    birthDate: '',
    
    // Health Metrics
    heightCm: '',
    weightKg: '',
    activityLevel: '',
    
    // Fitness Goals
    primaryGoal: '',
    targetWeight: '',
    weeklyRunGoal: '',
    petRewardGoal: '',
    
    // Preferences
    notifications: false,
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempSelectedDate, setTempSelectedDate] = useState({
    date: new Date().getDate(),
    month: new Date().getMonth(),
    year: new Date().getFullYear()
  });
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());

  // Load user profile data
  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await api.getProfile(token);
      
      if (response) {
        console.log('📋 Profile data received:', response);
        console.log('🏃 Weekly Run Goal:', response.weeklyRunGoal);
        console.log('🎁 Pet Reward Goal:', response.petRewardGoal);
        
        // Parse birth date
        let birthDate = '';
        if (response.birthDate) {
          const date = new Date(response.birthDate);
          birthDate = date.toISOString().split('T')[0]; // YYYY-MM-DD format
          setTempSelectedDate({
            date: date.getDate(),
            month: date.getMonth(),
            year: date.getFullYear()
          });
          setViewMonth(date.getMonth());
          setViewYear(date.getFullYear());
        }

        setProfileData({
          firstName: response.firstName || '',
          lastName: response.lastName || '',
          displayName: response.displayName || '',
          email: response.email || '',
          gender: response.gender || '',
          birthDate: birthDate,
          heightCm: response.heightCm?.toString() || '',
          weightKg: response.weightKg?.toString() || '',
          activityLevel: response.activityLevel || '',
          primaryGoal: response.primaryGoal || '',
          targetWeight: response.targetWeight?.toString() || '',
          weeklyRunGoal: response.weeklyRunGoal?.toString() || '',
          petRewardGoal: response.petRewardGoal?.toString() || '',
          notifications: response.notifications || false,
        });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const updateProfileData = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateSelect = (dateObj) => {
    // Update temp selected date immediately for visual feedback
    setTempSelectedDate({
      date: dateObj.date,
      month: dateObj.month,
      year: dateObj.year
    });
    console.log('📅 Date being selected:', `${dateObj.year}-${dateObj.month + 1}-${dateObj.date}`);
  };

  const confirmDateSelection = () => {
    // Confirm the date selection
    const dateString = `${tempSelectedDate.year}-${(tempSelectedDate.month + 1).toString().padStart(2, '0')}-${tempSelectedDate.date.toString().padStart(2, '0')}`;
    updateProfileData('birthDate', dateString);
    setShowDatePicker(false);
    console.log('✅ Date confirmed:', dateString);
  };

  const cancelDateSelection = () => {
    // Reset to original date if user cancels
    if (profileData.birthDate) {
      const date = new Date(profileData.birthDate);
      setTempSelectedDate({
        date: date.getDate(),
        month: date.getMonth(),
        year: date.getFullYear()
      });
      setViewMonth(date.getMonth());
      setViewYear(date.getFullYear());
    }
    setShowDatePicker(false);
  };

  // Navigate to previous month
  const goToPreviousMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  // Navigate to next month
  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Generate calendar weeks for a specific month
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
        });
      }
      weeks.push({ dates: week });
    }
    return weeks;
  };

  // Render calendar date
  const renderCalendarDate = (dateObj, weekIndex, dateIndex) => {
    const isSelected = dateObj.date === tempSelectedDate.date && 
                      dateObj.month === tempSelectedDate.month && 
                      dateObj.year === tempSelectedDate.year;
    const isToday = dateObj.isToday;
    const isCurrentMonth = dateObj.isCurrentMonth;
    
    const uniqueKey = `date-${weekIndex}-${dateIndex}-${dateObj.date}-${dateObj.month}-${dateObj.year}`;
    const isTodayAndSelected = isToday && isSelected;
    
    return (
      <TouchableOpacity
        key={uniqueKey}
        style={[
          styles.calendarDateContainer,
          isSelected && !isToday && styles.calendarDateSelected,
          isToday && styles.calendarDateToday,
          isTodayAndSelected && styles.calendarDateTodaySelected,
        ]}
        onPress={() => handleDateSelect(dateObj)}
      >
        <Text
          style={[
            styles.calendarDateText,
            !isCurrentMonth && styles.calendarDateTextInactive,
            isSelected && !isToday && styles.calendarDateTextSelected,
            isToday && styles.calendarDateTextToday,
          ]}
        >
          {dateObj.date}
        </Text>
      </TouchableOpacity>
    );
  };

  const handleSave = async () => {
    if (!token) return;

    try {
      setLoading(true);
      
      // Prepare update data
      const updateData = {
        display_name: profileData.displayName,
        gender: profileData.gender,
        birth_date: profileData.birthDate ? new Date(profileData.birthDate) : null,
        height_cm: profileData.heightCm ? parseFloat(profileData.heightCm) : null,
        weight_kg: profileData.weightKg ? parseFloat(profileData.weightKg) : null,
        activity_level: profileData.activityLevel,
        primary_goal: profileData.primaryGoal,
        target_weight_kg: profileData.targetWeight ? parseFloat(profileData.targetWeight) : null,
        weekly_run_goal: profileData.weeklyRunGoal ? parseFloat(profileData.weeklyRunGoal) : null,  // Changed to parseFloat
        pet_reward_goal: profileData.petRewardGoal ? parseFloat(profileData.petRewardGoal) : null,  // Changed to parseFloat
        notifications: profileData.notifications,
      };

      // Remove null/undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === null || updateData[key] === undefined || updateData[key] === '') {
          delete updateData[key];
        }
      });

      await api.updateProfile(updateData, token);
      
      // Refresh user data
      await refreshUser();
      
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
      
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (label, field, placeholder, keyboardType = 'default', containerStyle = null, disabled = false) => (
    <View style={[styles.inputGroup, containerStyle]}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, disabled && styles.inputDisabled]}
        value={profileData[field]}
        onChangeText={(value) => !disabled && updateProfileData(field, value)}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        keyboardType={keyboardType}
        autoCapitalize="none"
        editable={!disabled}
      />
      {disabled && (
        <Text style={styles.disabledHint}>This field cannot be modified</Text>
      )}
    </View>
  );

  const renderSelectButton = (label, field, value, options) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => {
          Alert.alert(
            label,
            'Select an option',
            options.map(option => ({
              text: option.label,
              onPress: () => updateProfileData(field, option.value),
            }))
          );
        }}
      >
        <Text style={[styles.selectButtonText, !value && styles.selectButtonPlaceholder]}>
          {value ? options.find(opt => opt.value === value)?.label || value : `Select ${label.toLowerCase()}`}
        </Text>
        <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  const renderDateInput = (label, field, value) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={[styles.selectButtonText, !value && styles.selectButtonPlaceholder]}>
          {value ? new Date(value).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }) : 'Select date'}
        </Text>
        <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            {renderInput('First Name', 'firstName', 'Enter your first name')}
            {renderInput('Last Name', 'lastName', 'Enter your last name')}
            {renderInput('Display Name', 'displayName', 'Enter your display name')}
            {renderInput('Email', 'email', 'Enter your email', 'email-address', null, true)}
            
            {renderSelectButton('Gender', 'gender', profileData.gender, [
              { label: 'Male', value: 'male' },
              { label: 'Female', value: 'female' },
              { label: 'Other', value: 'other' },
              { label: 'Prefer not to say', value: 'prefer_not_to_say' },
            ])}
            
            {renderDateInput('Birth Date', 'birthDate', profileData.birthDate)}
          </View>

          {/* Health Metrics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Health Metrics</Text>
            
            {renderInput('Height (cm)', 'heightCm', 'Enter your height', 'decimal-pad')}
            {renderInput('Weight (kg)', 'weightKg', 'Enter your weight', 'decimal-pad')}
            
            {renderSelectButton('Activity Level', 'activityLevel', profileData.activityLevel, [
              { label: 'Sedentary', value: 'sedentary' },
              { label: 'Light', value: 'light' },
              { label: 'Moderate', value: 'moderate' },
              { label: 'Active', value: 'active' },
              { label: 'Very Active', value: 'very_active' },
            ])}
          </View>

          {/* Fitness Goals */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fitness Goals</Text>
            
            {renderSelectButton('Primary Goal', 'primaryGoal', profileData.primaryGoal, [
              { label: 'Weight Loss', value: 'weight_loss' },
              { label: 'Muscle Gain', value: 'muscle_gain' },
              { label: 'Endurance', value: 'endurance' },
              { label: 'General Fitness', value: 'general_fitness' },
            ])}
            
            {renderInput('Target Weight (kg)', 'targetWeight', 'Enter target weight', 'decimal-pad')}
            {renderInput('Weekly Run Goal (km)', 'weeklyRunGoal', 'Enter weekly run goal', 'decimal-pad')}
            {renderInput('Pet Reward Goal (km)', 'petRewardGoal', 'Enter pet reward goal (e.g., 0.2, 1, 5)', 'decimal-pad')}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelDateSelection}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={cancelDateSelection}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={cancelDateSelection}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select Birth Date</Text>
              <TouchableOpacity onPress={confirmDateSelection}>
                <Text style={styles.modalConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>

            {/* Calendar */}
            <View style={styles.calendarContainer}>
              {/* Month Navigation */}
              <View style={styles.calendarMonthHeader}>
                <TouchableOpacity 
                  style={styles.calendarNavButton}
                  onPress={goToPreviousMonth}
                >
                  <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                
                <Text style={styles.calendarMonthTitle}>
                  {['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'][viewMonth]} {viewYear}
                </Text>
                
                <TouchableOpacity 
                  style={styles.calendarNavButton}
                  onPress={goToNextMonth}
                >
                  <Ionicons name="chevron-forward" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* Day Headers */}
              <View style={styles.calendarDayHeaders}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <View key={day} style={styles.calendarDayHeader}>
                    <Text style={styles.calendarDayHeaderText}>{day}</Text>
                  </View>
                ))}
              </View>

              {/* Calendar Grid */}
              <ScrollView style={styles.calendarGrid} showsVerticalScrollIndicator={false}>
                {generateCalendarWeeks(viewYear, viewMonth).map((week, weekIndex) => (
                  <View key={`week-${weekIndex}`} style={styles.calendarWeek}>
                    {week.dates.map((dateObj, dateIndex) => 
                      renderCalendarDate(dateObj, weekIndex, dateIndex)
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* Selected Date Display */}
            <View style={styles.selectedDateDisplay}>
              <Text style={styles.selectedDateLabel}>Selected Date:</Text>
              <Text style={styles.selectedDateText}>
                {new Date(tempSelectedDate.year, tempSelectedDate.month, tempSelectedDate.date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    fontSize: typography.sizes.xl,
    fontFamily: typography.heading,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },

  saveButton: {
    backgroundColor: colors.blue[500],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },

  saveButtonText: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },

  content: {
    flex: 1,
  },

  scrollView: {
    flex: 1,
  },

  // Sections
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },

  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.heading,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },

  // Input Groups
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

  input: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },

  inputDisabled: {
    backgroundColor: colors.gray[100],
    color: colors.textSecondary,
    borderColor: colors.gray[300],
  },

  disabledHint: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.body,
    color: colors.textTertiary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },

  selectButton: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
  },

  selectButtonText: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    color: colors.textPrimary,
    flex: 1,
  },

  selectButtonPlaceholder: {
    color: colors.textTertiary,
  },

  // Date Picker Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },

  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
    }),
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },

  modalTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.heading,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },

  modalCancelText: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },

  modalConfirmText: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    color: colors.blue[500],
    fontWeight: typography.weights.semibold,
  },

  // Calendar Styles
  calendarContainer: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },

  calendarMonthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },

  calendarNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  calendarMonthTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.heading,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },

  calendarDayHeaders: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },

  calendarDayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },

  calendarDayHeaderText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.body,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },

  calendarGrid: {
    maxHeight: 300,
  },

  calendarWeek: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },

  calendarDateContainer: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    margin: 2,
  },

  calendarDateSelected: {
    backgroundColor: colors.blue[500],
  },

  calendarDateToday: {
    backgroundColor: colors.gray[200],
  },

  calendarDateTodaySelected: {
    backgroundColor: colors.blue[500],
  },

  calendarDateText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textPrimary,
  },

  calendarDateTextInactive: {
    color: colors.textTertiary,
  },

  calendarDateTextSelected: {
    color: colors.white,
    fontWeight: typography.weights.semibold,
  },

  calendarDateTextToday: {
    color: colors.textPrimary,
    fontWeight: typography.weights.semibold,
  },

  selectedDateDisplay: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },

  selectedDateLabel: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },

  selectedDateText: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.body,
    fontWeight: typography.weights.semibold,
    color: colors.blue[500],
  },
});
