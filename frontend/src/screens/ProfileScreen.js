import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
  Image,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, globalStyles } from '../theme';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dataSharing, setDataSharing] = useState(false);

  // Mock user data
  const userStats = {
    totalRuns: 42,
    totalDistance: 186.5, // km
    totalCaloriesBurned: 8420,
    joinDate: 'January 2024',
    currentStreak: 7,
    longestStreak: 14,
  };


  // Generate activity data for GitHub-style heatmap (last 52 weeks)
  const generateActivityData = () => {
    const weeks = [];
    const today = new Date();

    for (let week = 0; week < 52; week++) {
      const days = [];
      for (let day = 0; day < 7; day++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (week * 7 + day));

        // Random activity level (0-4) with some realistic patterns
        const activityLevel = Math.random() > 0.3 ? Math.floor(Math.random() * 5) : 0;

        days.push({
          date: date.toISOString().split('T')[0],
          level: activityLevel,
        });
      }
      weeks.push(days);
    }
    return weeks.reverse();
  };

  const activityData = generateActivityData();

  const getActivityColor = (level) => {
    const colors = [
      '#ebedf0', // level 0 - no activity
      '#9be9a8', // level 1 - low
      '#40c463', // level 2 - medium
      '#30a14e', // level 3 - high
      '#216e39', // level 4 - very high
    ];
    return colors[level] || colors[0];
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const StatCard = ({ icon, value, label, unit = '' }) => (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={24} color={colors.textPrimary} />
      <Text style={globalStyles.mediumNumber}>{value}{unit}</Text>
      <Text style={globalStyles.secondaryText}>{label}</Text>
    </View>
  );


  return (
    <View style={globalStyles.screenContainer}>
      {/* Header with Settings Button */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={globalStyles.pageTitle}>Profile</Text>
        </View>
        <TouchableOpacity
          style={globalStyles.buttonPrimary}
          onPress={() => setSettingsModalVisible(true)}
        >
          <Ionicons name="settings-outline" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* User Information */}
        <View style={globalStyles.cardLarge}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color={colors.textSecondary} />
            </View>
          </View>
          <Text style={globalStyles.sectionHeader}>{user?.email?.split('@')[0] || 'FitQuest User'}</Text>
          <Text style={globalStyles.secondaryText}>Member since {userStats.joinDate}</Text>

          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.quickStat}>
              <Text style={globalStyles.mediumNumber}>{userStats.currentStreak}</Text>
              <Text style={globalStyles.secondaryText}>Day Streak</Text>
            </View>
            <View style={styles.quickStat}>
              <Text style={globalStyles.mediumNumber}>{userStats.totalRuns}</Text>
              <Text style={globalStyles.secondaryText}>Total Runs</Text>
            </View>
            <View style={styles.quickStat}>
              <Text style={globalStyles.mediumNumber}>{userStats.totalDistance}km</Text>
              <Text style={globalStyles.secondaryText}>Distance</Text>
            </View>
          </View>
        </View>


        {/* Activity Heatmap */}
        <View style={[globalStyles.card, { backgroundColor: colors.aurora.teal + '15' }]}>
          <Text style={globalStyles.sectionHeader}>Activity Overview</Text>
          <Text style={globalStyles.secondaryText}>Your workout activity over the past year</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.heatmapScroll}>
            <View style={styles.heatmap}>
              {activityData.map((week, weekIndex) => (
                <View key={weekIndex} style={styles.heatmapWeek}>
                  {week.map((day, dayIndex) => (
                    <View
                      key={dayIndex}
                      style={[
                        styles.heatmapDay,
                        { backgroundColor: getActivityColor(day.level) }
                      ]}
                    />
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={styles.heatmapLegend}>
            <Text style={styles.legendText}>Less</Text>
            {[0, 1, 2, 3, 4].map((level) => (
              <View
                key={level}
                style={[
                  styles.legendSquare,
                  { backgroundColor: getActivityColor(level) }
                ]}
              />
            ))}
            <Text style={styles.legendText}>More</Text>
          </View>
        </View>

        {/* Detailed Stats */}
        <View style={[globalStyles.card, { backgroundColor: colors.aurora.green + '15' }]}>
          <Text style={globalStyles.sectionHeader}>Lifetime Stats</Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon="walk"
              value={userStats.totalDistance}
              label="Total Distance"
              unit="km"
            />
            <StatCard
              icon="flame"
              value={userStats.totalCaloriesBurned.toLocaleString()}
              label="Calories Burned"
            />
            <StatCard
              icon="time"
              value={userStats.longestStreak}
              label="Longest Streak"
              unit=" days"
            />
            <StatCard
              icon="trophy"
              value={42}
              label="Achievements"
            />
          </View>
        </View>
      </ScrollView>

      {/* Settings Modal */}
      <Modal
        visible={settingsModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSettingsModalVisible(false)}>
              <Text style={styles.cancelButton}>Done</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Settings</Text>
            <View style={{ width: 50 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Account Section */}
            <View style={styles.settingsSection}>
              <Text style={styles.settingsHeader}>Account</Text>
              <TouchableOpacity style={styles.settingsItem}>
                <Ionicons name="person-outline" size={20} color={colors.textPrimary} />
                <Text style={styles.settingsItemText}>Edit Profile</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.settingsItem}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.textPrimary} />
                <Text style={styles.settingsItemText}>Privacy & Security</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Preferences Section */}
            <View style={styles.settingsSection}>
              <Text style={styles.settingsHeader}>Preferences</Text>
              <View style={styles.settingsItem}>
                <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
                <Text style={styles.settingsItemText}>Push Notifications</Text>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: colors.gray[300], true: colors.black }}
                />
              </View>
              <View style={styles.settingsItem}>
                <Ionicons name="share-outline" size={20} color={colors.textPrimary} />
                <Text style={styles.settingsItemText}>Data Sharing</Text>
                <Switch
                  value={dataSharing}
                  onValueChange={setDataSharing}
                  trackColor={{ false: colors.gray[300], true: colors.black }}
                />
              </View>
            </View>

            {/* Support Section */}
            <View style={styles.settingsSection}>
              <Text style={styles.settingsHeader}>Support</Text>
              <TouchableOpacity style={styles.settingsItem}>
                <Ionicons name="help-circle-outline" size={20} color={colors.textPrimary} />
                <Text style={styles.settingsItemText}>Help & FAQ</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.settingsItem}>
                <Ionicons name="mail-outline" size={20} color={colors.textPrimary} />
                <Text style={styles.settingsItemText}>Contact Support</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.settingsItem}>
                <Ionicons name="information-circle-outline" size={20} color={colors.textPrimary} />
                <Text style={styles.settingsItemText}>About FitQuest</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color={colors.error} />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    marginBottom: spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  avatarContainer: {
    marginBottom: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  quickStat: {
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: typography.sizes.xxl,
    fontFamily: typography.heading,
    fontWeight: typography.weights.heavy,
    color: colors.textPrimary,
  },
  quickStatLabel: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.xl,
    fontFamily: typography.heading,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  activitySection: {
    backgroundColor: colors.blue[100],
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.black,
  },
  activitySubtitle: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  heatmapScroll: {
    marginBottom: spacing.md,
  },
  heatmap: {
    flexDirection: 'row',
    gap: 2,
  },
  heatmapWeek: {
    gap: 2,
  },
  heatmapDay: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  heatmapLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
  },
  legendText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.body,
    color: colors.textSecondary,
  },
  legendSquare: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  statsSection: {
    backgroundColor: colors.green[100],
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.black,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.black,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: typography.sizes.xl,
    fontFamily: typography.heading,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginVertical: spacing.xs,
  },
  statLabel: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    backgroundColor: colors.background,
  },
  cancelButton: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    fontWeight: typography.weights.medium,
    color: colors.black,
  },
  modalTitle: {
    fontSize: typography.sizes.xl,
    fontFamily: typography.heading,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  modalContent: {
    flex: 1,
    padding: spacing.md,
  },
  settingsSection: {
    marginBottom: spacing.xl,
  },
  settingsHeader: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.heading,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  settingsItemText: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    color: colors.textPrimary,
    flex: 1,
    marginLeft: spacing.md,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },
  logoutText: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    fontWeight: typography.weights.semibold,
    color: colors.error,
    marginLeft: spacing.sm,
  },
});


