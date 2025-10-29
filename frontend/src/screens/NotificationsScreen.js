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
 * NotificationsScreen Component - Notification Settings and Preferences
 *
 * Features:
 * - Push notification settings
 * - Email notification preferences
 * - Reminder time settings
 * - Notification categories
 */
export default function NotificationsScreen({ navigation }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState({
    // Push Notifications
    pushEnabled: true,
    workoutReminders: true,
    achievementNotifications: true,
    blindBoxNotifications: true,
    weeklyReports: true,
    
    // Email Notifications
    emailEnabled: true,
    weeklyEmailReports: true,
    monthlyEmailReports: false,
    importantUpdates: true,
    
    // Timing Settings
    dailyReminderTime: '18:00',
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    
  });

  const updateNotification = (key, value) => {
    setNotifications(prev => {
      const newState = { ...prev, [key]: value };
      
      // If "All Notifications" is turned off, disable all other notifications
      if (key === 'pushEnabled' && !value) {
        newState.workoutReminders = false;
        newState.achievementNotifications = false;
        newState.blindBoxNotifications = false;
        newState.weeklyReports = false;
        newState.emailEnabled = false;
        newState.weeklyEmailReports = false;
        newState.monthlyEmailReports = false;
        newState.importantUpdates = false;
      }
      
      return newState;
    });
  };

  const handleTimePicker = (field, currentTime) => {
    Alert.alert(
      'Select Time',
      'Time picker will be implemented with a proper time picker component.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Set Time',
          onPress: () => {
            // TODO: Implement time picker
            Alert.alert('Time Set', `Time will be set to ${currentTime}`);
          },
        },
      ]
    );
  };

  const handleTestNotification = () => {
    Alert.alert(
      'Test Notification',
      'This is a test notification! If you received this, your notifications are working properly.',
      [{ text: 'OK' }]
    );
  };

  const renderSection = (title, children) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const renderNotificationItem = (title, subtitle, onPress, rightElement = null) => (
    <TouchableOpacity style={styles.notificationItem} onPress={onPress}>
      <View style={styles.notificationItemLeft}>
        <Text style={styles.notificationItemTitle}>{title}</Text>
        {subtitle && <Text style={styles.notificationItemSubtitle}>{subtitle}</Text>}
      </View>
      <View style={styles.notificationItemRight}>
        {rightElement || <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />}
      </View>
    </TouchableOpacity>
  );

  const renderSwitchItem = (title, subtitle, value, onValueChange, disabled = false) => (
    <View style={[styles.notificationItem, disabled && styles.notificationItemDisabled]}>
      <View style={styles.notificationItemLeft}>
        <Text style={[styles.notificationItemTitle, disabled && styles.notificationItemTitleDisabled]}>{title}</Text>
        {subtitle && <Text style={[styles.notificationItemSubtitle, disabled && styles.notificationItemSubtitleDisabled]}>{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={disabled ? undefined : onValueChange}
        trackColor={{ false: colors.gray[300], true: colors.blue[200] }}
        thumbColor={value ? colors.blue[500] : colors.gray[500]}
        disabled={disabled}
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
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Master Switch */}
        <View style={styles.masterSection}>
          <View style={styles.masterSwitch}>
            <View style={styles.masterSwitchLeft}>
              <Ionicons name="notifications" size={24} color={colors.blue[500]} />
              <View style={styles.masterSwitchText}>
                <Text style={styles.masterSwitchTitle}>All Notifications</Text>
                <Text style={styles.masterSwitchSubtitle}>Enable or disable all notifications</Text>
              </View>
            </View>
            <Switch
              value={notifications.pushEnabled}
              onValueChange={(value) => updateNotification('pushEnabled', value)}
              trackColor={{ false: colors.gray[300], true: colors.blue[200] }}
              thumbColor={notifications.pushEnabled ? colors.blue[500] : colors.gray[500]}
            />
          </View>
        </View>

        {/* Push Notifications */}
        {renderSection('Push Notifications', (
          <>
            {renderSwitchItem(
              'Workout Reminders',
              'Get reminded about your daily workout goals',
              notifications.workoutReminders,
              (value) => updateNotification('workoutReminders', value),
              !notifications.pushEnabled
            )}
            {renderSwitchItem(
              'Achievement Notifications',
              'Celebrate when you reach fitness milestones',
              notifications.achievementNotifications,
              (value) => updateNotification('achievementNotifications', value),
              !notifications.pushEnabled
            )}
            {renderSwitchItem(
              'Blind Box Notifications',
              'Get notified when you earn new pet rewards',
              notifications.blindBoxNotifications,
              (value) => updateNotification('blindBoxNotifications', value),
              !notifications.pushEnabled
            )}
            {renderSwitchItem(
              'Weekly Reports',
              'Receive weekly fitness summaries',
              notifications.weeklyReports,
              (value) => updateNotification('weeklyReports', value),
              !notifications.pushEnabled
            )}
            {renderNotificationItem(
              'Test Notification',
              'Send a test notification to verify settings',
              handleTestNotification
            )}
          </>
        ))}

        {/* Email Notifications */}
        {renderSection('Email Notifications', (
          <>
            {renderSwitchItem(
              'Email Notifications',
              'Receive notifications via email',
              notifications.emailEnabled,
              (value) => updateNotification('emailEnabled', value),
              !notifications.pushEnabled
            )}
            {renderSwitchItem(
              'Weekly Email Reports',
              'Get detailed weekly summaries via email',
              notifications.weeklyEmailReports,
              (value) => updateNotification('weeklyEmailReports', value),
              !notifications.pushEnabled
            )}
            {renderSwitchItem(
              'Monthly Email Reports',
              'Receive comprehensive monthly progress reports',
              notifications.monthlyEmailReports,
              (value) => updateNotification('monthlyEmailReports', value),
              !notifications.pushEnabled
            )}
            {renderSwitchItem(
              'Important Updates',
              'Get notified about app updates and important news',
              notifications.importantUpdates,
              (value) => updateNotification('importantUpdates', value),
              !notifications.pushEnabled
            )}
          </>
        ))}

        {/* Timing Settings */}
        {renderSection('Timing', (
          <>
            {renderNotificationItem(
              'Daily Reminder Time',
              `Currently set to ${notifications.dailyReminderTime}`,
              () => handleTimePicker('dailyReminderTime', notifications.dailyReminderTime)
            )}
            {renderSwitchItem(
              'Quiet Hours',
              'Disable notifications during specified hours',
              notifications.quietHoursEnabled,
              (value) => updateNotification('quietHoursEnabled', value)
            )}
            {notifications.quietHoursEnabled && (
              <>
                {renderNotificationItem(
                  'Quiet Hours Start',
                  `Currently set to ${notifications.quietHoursStart}`,
                  () => handleTimePicker('quietHoursStart', notifications.quietHoursStart)
                )}
                {renderNotificationItem(
                  'Quiet Hours End',
                  `Currently set to ${notifications.quietHoursEnd}`,
                  () => handleTimePicker('quietHoursEnd', notifications.quietHoursEnd)
                )}
              </>
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

  // Master Switch
  masterSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.white,
    marginBottom: spacing.lg,
  },

  masterSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: spacing.lg,
  },

  masterSwitchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  masterSwitchText: {
    marginLeft: spacing.md,
    flex: 1,
  },

  masterSwitchTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.heading,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },

  masterSwitchSubtitle: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
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

  // Notification Items
  notificationItem: {
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

  notificationItemLeft: {
    flex: 1,
    marginRight: spacing.md,
  },

  notificationItemTitle: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },

  notificationItemSubtitle: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
  },

  notificationItemRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Disabled states
  notificationItemDisabled: {
    opacity: 0.5,
  },

  notificationItemTitleDisabled: {
    color: colors.textTertiary,
  },

  notificationItemSubtitleDisabled: {
    color: colors.textTertiary,
  },
});
