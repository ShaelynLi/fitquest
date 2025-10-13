import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';

/**
 * BlindBoxSettingsModal Component
 * 
 * Allows users to set their custom blind box reward distance
 * Input must be a multiple of 1000 meters (1km)
 */
export default function BlindBoxSettingsModal({ visible, onClose, currentDistance, onSave }) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Quick preset options
  const presetOptions = [
    { value: 1000, label: '1 km' },
    { value: 3000, label: '3 km' },
    { value: 5000, label: '5 km' },
    { value: 10000, label: '10 km' },
  ];

  useEffect(() => {
    if (visible && currentDistance) {
      setInputValue(currentDistance.toString());
      setError('');
    }
  }, [visible, currentDistance]);

  const validateInput = (value) => {
    // Check if empty
    if (!value || value.trim() === '') {
      return 'Please enter a distance';
    }

    // Check if valid number
    const num = parseInt(value);
    if (isNaN(num)) {
      return 'Please enter a valid number';
    }

    // Check if positive
    if (num <= 0) {
      return 'Distance must be greater than 0';
    }

    // Check if multiple of 1000
    if (num % 1000 !== 0) {
      return 'Distance must be a multiple of 1000 meters (e.g., 1000, 2000, 5000)';
    }

    // Check reasonable range (100m to 50km)
    if (num < 1000) {
      return 'Distance must be at least 1000 meters (1 km)';
    }
    if (num > 50000) {
      return 'Distance must be at most 50000 meters (50 km)';
    }

    return null;
  };

  const handleInputChange = (text) => {
    setInputValue(text);
    setError('');
  };

  const handlePresetSelect = (value) => {
    setInputValue(value.toString());
    setError('');
  };

  const handleSave = async () => {
    // Validate input
    const validationError = validateInput(inputValue);
    if (validationError) {
      setError(validationError);
      return;
    }

    const distance = parseInt(inputValue);

    // Check if changed
    if (distance === currentDistance) {
      onClose();
      return;
    }

    setIsSaving(true);
    try {
      await onSave(distance);
      Alert.alert(
        'Settings Updated',
        `Blind box reward distance set to ${distance} meters (${(distance / 1000).toFixed(1)} km)`,
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update settings. Please try again.');
      setError('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Blind Box Settings</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Info Card */}
            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={24} color={colors.purple[500]} />
              <Text style={styles.infoText}>
                Set how many meters you need to run to earn one blind box. Distance must be a multiple of 1000 meters.
              </Text>
            </View>

            {/* Current Setting */}
            <View style={styles.currentCard}>
              <Text style={styles.currentLabel}>Current Setting:</Text>
              <Text style={styles.currentValue}>
                {currentDistance} meters ({(currentDistance / 1000).toFixed(1)} km)
              </Text>
            </View>

            {/* Input Section */}
            <View style={styles.inputSection}>
              <Text style={styles.sectionTitle}>Enter Distance (in meters)</Text>
              
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, error && styles.inputError]}
                  value={inputValue}
                  onChangeText={handleInputChange}
                  placeholder="e.g., 5000"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <Text style={styles.inputUnit}>meters</Text>
              </View>

              {/* Error Message */}
              {error ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color={colors.red[500]} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* Helper Text */}
              <Text style={styles.helperText}>
                💡 Must be a multiple of 1000 (e.g., 1000, 2000, 5000, 10000)
              </Text>
            </View>

            {/* Quick Presets */}
            <View style={styles.presetsSection}>
              <Text style={styles.sectionTitle}>Quick Presets</Text>
              <View style={styles.presetsGrid}>
                {presetOptions.map((preset) => (
                  <TouchableOpacity
                    key={preset.value}
                    style={[
                      styles.presetButton,
                      inputValue === preset.value.toString() && styles.presetButtonActive
                    ]}
                    onPress={() => handlePresetSelect(preset.value)}
                  >
                    <Text style={[
                      styles.presetButtonText,
                      inputValue === preset.value.toString() && styles.presetButtonTextActive
                    ]}>
                      {preset.label}
                    </Text>
                    <Text style={[
                      styles.presetMeters,
                      inputValue === preset.value.toString() && styles.presetMetersActive
                    ]}>
                      {preset.value}m
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Examples */}
            <View style={styles.examplesSection}>
              <Text style={styles.examplesTitle}>💡 Examples:</Text>
              <Text style={styles.exampleText}>• 1000 = 1 km (very easy)</Text>
              <Text style={styles.exampleText}>• 5000 = 5 km (moderate)</Text>
              <Text style={styles.exampleText}>• 10000 = 10 km (challenging)</Text>
              <Text style={styles.exampleText}>• 15000 = 15 km (hard)</Text>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={isSaving}
            >
              <Text style={styles.saveButtonText}>
                {isSaving ? 'Saving...' : 'Save Settings'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  keyboardView: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.heading,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 40,
  },

  // Content
  content: {
    flex: 1,
    padding: spacing.md,
  },

  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.purple[50],
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.purple[700],
    lineHeight: 20,
  },

  currentCard: {
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentLabel: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
  },
  currentValue: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    fontWeight: typography.weights.bold,
    color: colors.purple[600],
  },

  // Input Section
  inputSection: {
    marginBottom: spacing.lg,
  },

  sectionTitle: {
    fontSize: typography.sizes.md,
    fontFamily: typography.heading,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray[200],
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },

  input: {
    flex: 1,
    fontSize: typography.sizes.xl,
    fontFamily: typography.body,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
  },

  inputError: {
    color: colors.red[500],
  },

  inputUnit: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },

  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },

  errorText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.red[500],
  },

  helperText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
    lineHeight: 18,
  },

  // Presets
  presetsSection: {
    marginBottom: spacing.lg,
  },

  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },

  presetButton: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray[200],
    padding: spacing.md,
    alignItems: 'center',
  },

  presetButtonActive: {
    borderColor: colors.purple[500],
    backgroundColor: colors.purple[50],
  },

  presetButtonText: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },

  presetButtonTextActive: {
    color: colors.purple[700],
  },

  presetMeters: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
  },

  presetMetersActive: {
    color: colors.purple[600],
  },

  // Examples
  examplesSection: {
    backgroundColor: colors.blue[50],
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },

  examplesTitle: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    fontWeight: typography.weights.semibold,
    color: colors.blue[800],
    marginBottom: spacing.xs,
  },

  exampleText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.blue[700],
    marginVertical: 2,
  },

  // Footer
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },

  saveButton: {
    backgroundColor: colors.purple[500],
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },

  saveButtonDisabled: {
    opacity: 0.6,
  },

  saveButtonText: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },
});

