import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, spacing, typography, globalStyles } from '../theme';
import { useAuth } from '../context/AuthContext';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Camera } from 'expo-camera';

const { width, height } = Dimensions.get('window');

/**
 * OnboardingScreen Component
 * 
 * Complete user onboarding flow for fitness app with modern design:
 * 1. Personal information collection
 * 2. Health metrics setup
 * 3. Fitness goals setting
 * 4. Permissions request
 * 5. Daily calorie calculation
 */

export default function OnboardingScreen({ navigation }) {
  const { completeOnboarding } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // User information
  const [userData, setUserData] = useState({
    // Step 1: Basic Info
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    gender: '',
    
    // Step 2: Health Metrics
    height_cm: '',
    weight_kg: '',
    activityLevel: '',
    
    // Step 3: Fitness Goals
    primaryGoal: '',
    target_weight_kg: '',
    weeklyRunGoal: '',
    petRewardGoal: '',
    
    // Step 4: Preferences
    units: 'metric',
    notifications: false,
    healthKit: false,
    camera: false,
  });

  // Local Date object state for inline calendar
  const [dobDate, setDobDate] = useState(new Date());

  const totalSteps = 4;

  const updateUserData = (field, value) => {
    setUserData(prev => ({ ...prev, [field]: value }));
  };

  const handlePermissionToggle = async (permissionType) => {
    let granted = false;
    
    switch (permissionType) {
      case 'notifications':
        granted = await requestNotificationPermission();
        break;
      case 'healthKit':
        granted = await requestLocationPermission();
        break;
      case 'camera':
        granted = await requestCameraPermission();
        break;
      default:
        return;
    }
    
    // Update the permission state based on actual system permission
    updateUserData(permissionType, granted);
  };

  const formatDateYYYYMMDD = (dateObj) => {
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleDobChange = (event, selectedDate) => {
    const currentDate = selectedDate || dobDate;
    setDobDate(currentDate);
    updateUserData('dateOfBirth', formatDateYYYYMMDD(currentDate));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const calculateDailyCalories = () => {
    const { height_cm, weight_kg, activityLevel, gender, dateOfBirth } = userData;
    
    if (!height_cm || !weight_kg || !activityLevel || !gender || !dateOfBirth) {
      return null;
    }

    // Calculate age
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    const age = today.getFullYear() - birthDate.getFullYear();
    
    // BMR calculation (Mifflin-St Jeor Equation)
    let bmr;
    if (gender === 'male') {
      bmr = 10 * parseFloat(weight_kg) + 6.25 * parseFloat(height_cm) - 5 * age + 5;
    } else {
      bmr = 10 * parseFloat(weight_kg) + 6.25 * parseFloat(height_cm) - 5 * age - 161;
    }
    
    // Activity multipliers
    const activityMultipliers = {
      'sedentary': 1.2,
      'light': 1.375,
      'moderate': 1.55,
      'active': 1.725,
      'very_active': 1.9
    };
    
    const tdee = bmr * activityMultipliers[activityLevel];
    return Math.round(tdee);
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Location permission is needed for GPS tracking during runs. You can enable it later in Settings.',
          [{ text: 'OK' }]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  };

  const requestNotificationPermission = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Notification Permission Required',
          'Notification permission is needed to send you reminders and updates. You can enable it later in Settings.',
          [{ text: 'OK' }]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const requestCameraPermission = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'Camera permission is needed to scan food barcodes. You can enable it later in Settings.',
          [{ text: 'OK' }]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return false;
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Request location permission
      const locationGranted = await requestLocationPermission();
      
      // Calculate daily calories
      const dailyCalories = calculateDailyCalories();
      
      const onboardingData = {
        ...userData,
        dailyCalories,
        healthKit: locationGranted
      };

      // Complete onboarding (creates user and sends verification email)
      const result = await completeOnboarding(onboardingData);
      
      // Navigate to email verification screen instead of main app
      navigation.navigate('EmailVerification', {
        email: userData.email,
        password: userData.password,
        tempToken: result.tempToken || result.id_token, // Use temp token if available
      });
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {Array.from({ length: totalSteps }, (_, index) => (
        <View
          key={index}
          style={[
            styles.stepDot,
            index < currentStep ? styles.stepDotActive : styles.stepDotInactive
          ]}
        />
      ))}
    </View>
  );

  const renderInput = (label, field, placeholder, keyboardType = 'default', secureTextEntry = false, containerStyle = null) => (
    <View style={[styles.inputGroup, containerStyle]}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={userData[field]}
        onChangeText={(value) => updateUserData(field, value)}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
      />
    </View>
  );

  const renderSelectButton = (label, field, value, options) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.selectContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.selectButton,
              userData[field] === option.value && styles.selectButtonActive
            ]}
            onPress={() => updateUserData(field, option.value)}
          >
            <Text style={[
              styles.selectButtonText,
              userData[field] === option.value && styles.selectButtonTextActive
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.header}>
        <Text style={styles.stepTitle}>Let's get to know you</Text>
        <Text style={styles.stepSubtitle}>Tell us a bit about yourself</Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.nameRow}>
          {renderInput('First Name', 'firstName', 'Enter your first name', 'default', false, styles.nameField)}
          {renderInput('Last Name', 'lastName', 'Enter your last name', 'default', false, styles.nameField)}
        </View>

        {renderInput('Email', 'email', 'Enter your email', 'email-address')}
        
        {renderInput('Password', 'password', 'Create a password', 'default', true)}
        {renderInput('Confirm Password', 'confirmPassword', 'Confirm your password', 'default', true)}

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Date of Birth</Text>
          <View style={styles.inlinePickerContainer}>
            <DateTimePicker
              testID="dobPicker"
              value={dobDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
              maximumDate={new Date()}
              onChange={handleDobChange}
            />
          </View>
          {!!userData.dateOfBirth && (
            <Text style={styles.helperText}>Selected: {userData.dateOfBirth}</Text>
          )}
        </View>

        {renderSelectButton('Gender', 'gender', userData.gender, [
          { value: 'male', label: 'Male' },
          { value: 'female', label: 'Female' },
          { value: 'other', label: 'Other' },
          { value: 'prefer_not_to_say', label: 'Prefer not to say' }
        ])}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.header}>
        <Text style={styles.stepTitle}>Health metrics</Text>
        <Text style={styles.stepSubtitle}>Help us personalize your experience</Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.metricsRow}>
          {renderInput('Height (cm)', 'height_cm', '170', 'numeric', false, styles.metricsField)}
          {renderInput('Weight (kg)', 'weight_kg', '70', 'numeric', false, styles.metricsField)}
        </View>

        {renderSelectButton('Activity Level', 'activityLevel', userData.activityLevel, [
          { value: 'sedentary', label: 'Sedentary' },
          { value: 'light', label: 'Light' },
          { value: 'moderate', label: 'Moderate' },
          { value: 'active', label: 'Active' },
          { value: 'very_active', label: 'Very Active' }
        ])}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.header}>
        <Text style={styles.stepTitle}>Your fitness goals</Text>
        <Text style={styles.stepSubtitle}>What do you want to achieve?</Text>
      </View>

      <View style={styles.formContainer}>
        {renderSelectButton('Primary Goal', 'primaryGoal', userData.primaryGoal, [
          { value: 'weight_loss', label: 'Weight Loss' },
          { value: 'muscle_gain', label: 'Muscle Gain' },
          { value: 'endurance', label: 'Endurance' },
          { value: 'general_fitness', label: 'General Fitness' }
        ])}

        {renderInput('Target Weight (kg)', 'target_weight_kg', '65', 'numeric')}
        {renderInput('Weekly Run Goal (km)', 'weeklyRunGoal', '10', 'numeric')}
        {renderInput('Pet Reward Goal (km)', 'petRewardGoal', '5', 'numeric')}
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.header}>
        <Text style={styles.stepTitle}>Almost there!</Text>
        <Text style={styles.stepSubtitle}>Final preferences and permissions</Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.preferencesContainer}>
          <View style={styles.preferenceItem}>
            <Ionicons name="notifications" size={24} color={colors.aurora.blue} />
            <View style={styles.preferenceContent}>
              <Text style={styles.preferenceTitle}>Push Notifications</Text>
              <Text style={styles.preferenceDescription}>Get reminders and updates</Text>
            </View>
            <TouchableOpacity
              style={[styles.toggle, userData.notifications && styles.toggleActive]}
              onPress={() => handlePermissionToggle('notifications')}
            >
              <View style={[styles.toggleThumb, userData.notifications && styles.toggleThumbActive]} />
            </TouchableOpacity>
          </View>

          <View style={styles.preferenceItem}>
            <Ionicons name="location" size={24} color={colors.aurora.green} />
            <View style={styles.preferenceContent}>
              <Text style={styles.preferenceTitle}>Location Services</Text>
              <Text style={styles.preferenceDescription}>For GPS tracking during runs</Text>
            </View>
            <TouchableOpacity
              style={[styles.toggle, userData.healthKit && styles.toggleActive]}
              onPress={() => handlePermissionToggle('healthKit')}
            >
              <View style={[styles.toggleThumb, userData.healthKit && styles.toggleThumbActive]} />
            </TouchableOpacity>
          </View>

          <View style={styles.preferenceItem}>
            <Ionicons name="camera" size={24} color={colors.aurora.purple} />
            <View style={styles.preferenceContent}>
              <Text style={styles.preferenceTitle}>Camera Access</Text>
              <Text style={styles.preferenceDescription}>For scanning food barcodes</Text>
            </View>
            <TouchableOpacity
              style={[styles.toggle, userData.camera && styles.toggleActive]}
              onPress={() => handlePermissionToggle('camera')}
            >
              <View style={[styles.toggleThumb, userData.camera && styles.toggleThumbActive]} />
            </TouchableOpacity>
          </View>
        </View>

        {calculateDailyCalories() && (
          <View style={styles.caloriesCard}>
            <Text style={styles.caloriesTitle}>Your Daily Calorie Goal</Text>
            <Text style={styles.caloriesValue}>{calculateDailyCalories()}</Text>
            <Text style={styles.caloriesSubtitle}>calories per day</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return renderStep1();
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderStepIndicator()}
        {renderCurrentStep()}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.buttonContainer}>
          {currentStep > 1 && (
            <TouchableOpacity style={styles.backButton} onPress={prevStep}>
              <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.nextButton, currentStep === 1 && styles.nextButtonFull]}
            onPress={currentStep === totalSteps ? handleComplete : nextStep}
            disabled={loading}
          >
            <Text style={styles.nextButtonText}>
              {loading ? 'Setting up...' : currentStep === totalSteps ? 'Complete Setup' : 'Continue'}
            </Text>
            {currentStep < totalSteps && (
              <Ionicons name="chevron-forward" size={20} color={colors.white} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
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
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  stepDotActive: {
    backgroundColor: colors.aurora.blue,
  },
  stepDotInactive: {
    backgroundColor: colors.gray[300],
  },
  stepContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: typography.sizes.xxl,
    fontFamily: typography.heading,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  stepSubtitle: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  formContainer: {
    gap: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    color: colors.textPrimary,
  },
  nameRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  nameField: {
    flex: 1,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metricsField: {
    flex: 1,
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  selectButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 80,
    alignItems: 'center',
  },
  selectButtonActive: {
    backgroundColor: colors.aurora.blue,
    borderColor: colors.aurora.blue,
  },
  selectButtonText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
  },
  selectButtonTextActive: {
    color: colors.white,
  },
  preferencesContainer: {
    gap: spacing.lg,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  preferenceContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  preferenceTitle: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  preferenceDescription: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.gray[300],
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: colors.aurora.blue,
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.white,
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  caloriesCard: {
    backgroundColor: colors.aurora.blue,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  caloriesTitle: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    fontWeight: typography.weights.medium,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  caloriesValue: {
    fontSize: typography.sizes.display,
    fontFamily: typography.body,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  caloriesSubtitle: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.white,
    opacity: 0.8,
  },
  footer: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: spacing.xl,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  backButtonText: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  nextButton: {
    flex: 1,
    backgroundColor: colors.aurora.blue,
    borderRadius: 25,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.aurora.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonText: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    fontWeight: typography.weights.semibold,
    color: colors.white,
    marginRight: spacing.xs,
  },
});