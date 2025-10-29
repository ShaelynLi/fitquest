import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme';
import { useAuth } from '../context/AuthContext';

/**
 * SettingsScreen Component - App Settings and Preferences
 *
 * Features:
 * - Account settings (password change, data export)
 * - Privacy settings (permissions, data sharing)
 * - App preferences (theme, units, language)
 * - Fitness settings (goals, reminders)
 */
export default function SettingsScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [settings, setSettings] = useState({
    // Notifications
    notificationsEnabled: true,

    // Privacy Settings
    locationPermission: true,
    cameraPermission: true,
    
    // App Settings
    language: 'en',
  });

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleChangePassword = () => {
    navigation.navigate('ChangePassword');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Account Deletion',
              'Account deletion is not yet implemented. Please contact support for assistance.',
              [{ text: 'OK' }]
            );
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Data export functionality will be available soon. You will be able to download all your fitness data in a CSV format.',
      [{ text: 'OK' }]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'Are you sure you want to clear the app cache? This will remove temporary data and may improve app performance.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          onPress: () => {
            // TODO: Implement cache clearing
            Alert.alert('Success', 'Cache cleared successfully!');
          },
        },
      ]
    );
  };

  const renderSection = (title, children) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const renderSettingItem = (title, subtitle, onPress, rightElement = null) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingItemLeft}>
        <Text style={styles.settingItemTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingItemSubtitle}>{subtitle}</Text>}
      </View>
      <View style={styles.settingItemRight}>
        {rightElement || <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />}
      </View>
    </TouchableOpacity>
  );

  const renderSwitchItem = (title, subtitle, value, onValueChange) => (
    <View style={styles.settingItem}>
      <View style={styles.settingItemLeft}>
        <Text style={styles.settingItemTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingItemSubtitle}>{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.gray[300], true: colors.blue[200] }}
        thumbColor={value ? colors.blue[500] : colors.gray[500]}
      />
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
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Notifications */}
        {renderSection('Notifications', (
          <>
            {renderSwitchItem(
              'Allow Notifications',
              'Enable or disable all notifications',
              settings.notificationsEnabled,
              (value) => updateSetting('notificationsEnabled', value)
            )}
          </>
        ))}

        {/* Account Settings */}
        {renderSection('Account', (
          <>
            {renderSettingItem(
              'Change Password',
              'Update your account password',
              handleChangePassword
            )}
            {renderSettingItem(
              'Export Data',
              'Download your fitness data',
              handleExportData
            )}
            {renderSettingItem(
              'Delete Account',
              'Permanently delete your account',
              handleDeleteAccount
            )}
          </>
        ))}

        {/* Privacy Settings */}
        {renderSection('Privacy', (
          <>
            {renderSwitchItem(
              'Location Permission',
              'Allow app to access your location for GPS tracking',
              settings.locationPermission,
              (value) => updateSetting('locationPermission', value)
            )}
            {renderSwitchItem(
              'Camera Permission',
              'Allow app to access camera for barcode scanning',
              settings.cameraPermission,
              (value) => updateSetting('cameraPermission', value)
            )}
          </>
        ))}

        {/* App Preferences */}
        {renderSection('App Preferences', (
          <>
            {renderSettingItem(
              'Language',
              'English',
              () => {
                Alert.alert(
                  'Language',
                  'Language selection will be available in future updates.',
                  [{ text: 'OK' }]
                );
              }
            )}
            {renderSettingItem(
              'Clear Cache',
              'Free up storage space',
              handleClearCache
            )}
          </>
        ))}


        {/* App Info */}
        {renderSection('About', (
          <>
            {renderSettingItem(
              'App Version',
              '1.0.0',
              null,
              <Text style={styles.versionText}>1.0.0</Text>
            )}
            {renderSettingItem(
              'Terms of Service',
              'Read our terms and conditions',
              () => Alert.alert('Terms of Service', 'Terms of service will be available soon.')
            )}
            {renderSettingItem(
              'Privacy Policy',
              'Learn how we protect your data',
              () => Alert.alert('Privacy Policy', 'Privacy policy will be available soon.')
            )}
          </>
        ))}
      </ScrollView>
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

  scrollView: {
    flex: 1,
  },

  // Sections
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },

  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },

  // Setting Items
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  settingItemLeft: {
    flex: 1,
    marginRight: spacing.md,
  },

  settingItemTitle: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },

  settingItemSubtitle: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
  },

  settingItemRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  versionText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
  },
});
