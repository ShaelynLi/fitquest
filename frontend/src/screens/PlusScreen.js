import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme';

/**
 * PlusScreen Component - Quick Actions Hub
 *
 * Matches the reference design with simple action buttons.
 * Clean, centered layout with quick access to primary app functions.
 */
export default function PlusScreen({ navigation }) {

  const quickActions = [
    {
      icon: 'barcode-outline',
      title: 'Scan Barcode',
      color: colors.blue[100],
      iconColor: colors.blue[600],
      onPress: () => {
        navigation.navigate('FoodSearch', { 
          mealType: 'snacks',
          showBarcodeScanner: true 
        });
      }
    },
    {
      icon: 'search-outline',
      title: 'Search Food',
      color: colors.purple[100],
      iconColor: colors.purple[600],
      onPress: () => {
        navigation.navigate('FoodSearch');
      }
    },
    {
      icon: 'play-outline',
      title: 'Start Running',
      color: colors.pink[100],
      iconColor: colors.pink[600],
      onPress: () => {
        // Navigate to Home screen's Run tab
        navigation.navigate('Home', { screen: 'Run' });
      }
    }
  ];

  // Organize actions into categories
  const foodActions = quickActions.slice(0, 2); // Scan Barcode, Search Food
  const fitnessActions = quickActions.slice(2, 3); // Start Running

  const renderActionButton = (action, index) => (
    <TouchableOpacity
      key={index}
      style={styles.actionButton}
      onPress={action.onPress}
    >
      <Text style={styles.actionTitle}>{action.title}</Text>
      <View style={[styles.iconContainer, { backgroundColor: action.color }]}>
        <Ionicons
          name={action.icon}
          size={16}
          color={action.iconColor}
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Quick Actions</Text>
          <Text style={styles.headerSubtitle}>Access your most common tasks</Text>
        </View>

        {/* Food & Nutrition Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Food & Nutrition</Text>
          <View style={styles.actionsContainer}>
            {foodActions.map((action, index) => renderActionButton(action, index))}
          </View>
        </View>

        {/* Fitness Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fitness</Text>
          <View style={styles.actionsContainer}>
            {fitnessActions.map((action, index) => renderActionButton(action, index))}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },

  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },

  headerTitle: {
    fontSize: typography.sizes.xxl,
    fontFamily: typography.heading,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },

  headerSubtitle: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  section: {
    marginBottom: spacing.xl,
  },

  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.heading,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    marginLeft: spacing.sm,
  },

  actionsContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: spacing.xs,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginVertical: spacing.xs,
  },

  actionTitle: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
  },

  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});