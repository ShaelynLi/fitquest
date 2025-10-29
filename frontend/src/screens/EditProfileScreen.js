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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
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
  const [selectedDate, setSelectedDate] = useState(new Date());

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
          setSelectedDate(date);
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

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setSelectedDate(selectedDate);
      const dateString = selectedDate.toISOString().split('T')[0];
      updateProfileData('birthDate', dateString);
    }
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
        weekly_run_goal: profileData.weeklyRunGoal ? parseInt(profileData.weeklyRunGoal) : null,
        pet_reward_goal: profileData.petRewardGoal ? parseInt(profileData.petRewardGoal) : null,
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
          {value || 'Select date'}
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
            
            {renderInput('Height (cm)', 'heightCm', 'Enter your height', 'numeric')}
            {renderInput('Weight (kg)', 'weightKg', 'Enter your weight', 'numeric')}
            
            {renderSelectButton('Activity Level', 'activityLevel', profileData.activityLevel, [
              { label: 'Sedentary', value: 'sedentary' },
              { label: 'Lightly Active', value: 'lightly_active' },
              { label: 'Moderately Active', value: 'moderately_active' },
              { label: 'Very Active', value: 'very_active' },
              { label: 'Extremely Active', value: 'extremely_active' },
            ])}
          </View>

          {/* Fitness Goals */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fitness Goals</Text>
            
            {renderSelectButton('Primary Goal', 'primaryGoal', profileData.primaryGoal, [
              { label: 'Weight Loss', value: 'weight_loss' },
              { label: 'Weight Gain', value: 'weight_gain' },
              { label: 'Maintain Weight', value: 'maintain_weight' },
              { label: 'Build Muscle', value: 'build_muscle' },
              { label: 'Improve Fitness', value: 'improve_fitness' },
            ])}
            
            {renderInput('Target Weight (kg)', 'targetWeight', 'Enter target weight', 'numeric')}
            {renderInput('Weekly Run Goal (km)', 'weeklyRunGoal', 'Enter weekly run goal', 'numeric')}
            {renderInput('Pet Reward Goal (km)', 'petRewardGoal', 'Enter pet reward goal', 'numeric')}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}
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
});
