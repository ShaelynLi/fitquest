import React, { useState } from 'react';
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
import { colors, spacing, typography } from '../theme';
import { useAuth } from '../context/AuthContext';

/**
 * ChangePasswordScreen Component - Password Change Interface
 *
 * Features:
 * - Current password verification
 * - New password input with validation
 * - Password strength requirements
 * - Success/error feedback
 */
export default function ChangePasswordScreen({ navigation }) {
  const { changePassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const validatePassword = (password) => {
    const minLength = password.length >= 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    
    return {
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers,
      requirements: {
        minLength,
        hasUpperCase,
        hasLowerCase,
        hasNumbers,
      },
    };
  };

  const handleChangePassword = async () => {
    // Validation
    if (!formData.currentPassword) {
      Alert.alert('Error', 'Please enter your current password');
      return;
    }

    if (!formData.newPassword) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    const passwordValidation = validatePassword(formData.newPassword);
    if (!passwordValidation.isValid) {
      Alert.alert(
        'Password Requirements',
        'Password must be at least 6 characters long and contain:\n• At least one uppercase letter\n• At least one lowercase letter\n• At least one number'
      );
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      Alert.alert('Error', 'New password must be different from current password');
      return;
    }

    try {
      setLoading(true);
      
      const response = await changePassword(formData.currentPassword, formData.newPassword);
      
      Alert.alert(
        'Success',
        'Password changed successfully! You will need to use your new password for future logins.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Clear form
              setFormData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
              });
              // Navigate back
              navigation.goBack();
            },
          },
        ]
      );
      
    } catch (error) {
      console.error('Password change error:', error);
      Alert.alert('Error', error.message || 'Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderPasswordInput = (label, field, placeholder, showPassword) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.passwordInputContainer}>
        <TextInput
          style={styles.passwordInput}
          value={formData[field]}
          onChangeText={(value) => updateFormData(field, value)}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={() => togglePasswordVisibility(field)}
        >
          <Ionicons
            name={showPassword ? 'eye-off' : 'eye'}
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  const passwordValidation = validatePassword(formData.newPassword);

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
        <Text style={styles.headerTitle}>Change Password</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsText}>
              For security reasons, please enter your current password and choose a new strong password.
            </Text>
          </View>

          {/* Current Password */}
          {renderPasswordInput(
            'Current Password',
            'currentPassword',
            'Enter your current password',
            showPasswords.current
          )}

          {/* New Password */}
          {renderPasswordInput(
            'New Password',
            'newPassword',
            'Enter your new password',
            showPasswords.new
          )}

          {/* Password Requirements */}
          {formData.newPassword && (
            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementsTitle}>Password Requirements:</Text>
              <View style={styles.requirementItem}>
                <Ionicons
                  name={passwordValidation.requirements.minLength ? 'checkmark-circle' : 'close-circle'}
                  size={16}
                  color={passwordValidation.requirements.minLength ? colors.success : colors.error}
                />
                <Text style={[
                  styles.requirementText,
                  passwordValidation.requirements.minLength ? styles.requirementMet : styles.requirementNotMet
                ]}>
                  At least 6 characters
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <Ionicons
                  name={passwordValidation.requirements.hasUpperCase ? 'checkmark-circle' : 'close-circle'}
                  size={16}
                  color={passwordValidation.requirements.hasUpperCase ? colors.success : colors.error}
                />
                <Text style={[
                  styles.requirementText,
                  passwordValidation.requirements.hasUpperCase ? styles.requirementMet : styles.requirementNotMet
                ]}>
                  At least one uppercase letter
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <Ionicons
                  name={passwordValidation.requirements.hasLowerCase ? 'checkmark-circle' : 'close-circle'}
                  size={16}
                  color={passwordValidation.requirements.hasLowerCase ? colors.success : colors.error}
                />
                <Text style={[
                  styles.requirementText,
                  passwordValidation.requirements.hasLowerCase ? styles.requirementMet : styles.requirementNotMet
                ]}>
                  At least one lowercase letter
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <Ionicons
                  name={passwordValidation.requirements.hasNumbers ? 'checkmark-circle' : 'close-circle'}
                  size={16}
                  color={passwordValidation.requirements.hasNumbers ? colors.success : colors.error}
                />
                <Text style={[
                  styles.requirementText,
                  passwordValidation.requirements.hasNumbers ? styles.requirementMet : styles.requirementNotMet
                ]}>
                  At least one number
                </Text>
              </View>
            </View>
          )}

          {/* Confirm Password */}
          {renderPasswordInput(
            'Confirm New Password',
            'confirmPassword',
            'Confirm your new password',
            showPasswords.confirm
          )}

          {/* Password Match Indicator */}
          {formData.newPassword && formData.confirmPassword && (
            <View style={styles.matchIndicator}>
              <Ionicons
                name={formData.newPassword === formData.confirmPassword ? 'checkmark-circle' : 'close-circle'}
                size={16}
                color={formData.newPassword === formData.confirmPassword ? colors.success : colors.error}
              />
              <Text style={[
                styles.matchText,
                formData.newPassword === formData.confirmPassword ? styles.matchSuccess : styles.matchError
              ]}>
                {formData.newPassword === formData.confirmPassword ? 'Passwords match' : 'Passwords do not match'}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword || loading) && styles.saveButtonDisabled
            ]}
            onPress={handleChangePassword}
            disabled={!formData.currentPassword || !formData.newPassword || !formData.confirmPassword || loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Changing Password...' : 'Change Password'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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

  placeholder: {
    width: 40,
  },

  content: {
    flex: 1,
  },

  scrollView: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },

  // Instructions
  instructionsContainer: {
    backgroundColor: colors.blue[50],
    borderRadius: 12,
    padding: spacing.lg,
    marginVertical: spacing.lg,
  },

  instructionsText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.blue[700],
    lineHeight: 20,
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

  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },

  passwordInput: {
    flex: 1,
    padding: spacing.lg,
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    color: colors.textPrimary,
  },

  eyeButton: {
    padding: spacing.lg,
  },

  // Requirements
  requirementsContainer: {
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },

  requirementsTitle: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },

  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },

  requirementText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    marginLeft: spacing.sm,
  },

  requirementMet: {
    color: colors.success,
  },

  requirementNotMet: {
    color: colors.error,
  },

  // Match Indicator
  matchIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },

  matchText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    marginLeft: spacing.sm,
  },

  matchSuccess: {
    color: colors.success,
  },

  matchError: {
    color: colors.error,
  },

  // Button
  buttonContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  saveButton: {
    backgroundColor: colors.blue[500],
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  saveButtonDisabled: {
    backgroundColor: colors.gray[300],
  },

  saveButtonText: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },
});
