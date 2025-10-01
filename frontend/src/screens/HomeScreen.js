import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { colors, spacing, typography, globalStyles } from '../theme';
import { OverviewTab, FoodTab, RunTab } from '../tabs';

const TopTab = createMaterialTopTabNavigator();

/**
 * HomeScreen Component - Container for Nested Top Tab Navigator
 *
 * Updated architecture: Now serves as a container for the nested top tab navigation.
 * Contains three main feature tabs:
 * - Overview: Pet dashboard and daily stats summary (former HomeScreen content)
 * - Food: Meal logging interface (former FoodScreen)
 * - Run: GPS tracking interface (former RunScreen)
 *
 * Uses Aura Health design system with sophisticated tab styling.
 */
export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <TopTab.Navigator
        screenOptions={{
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarActiveTintColor: colors.textPrimary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarIndicatorStyle: styles.tabBarIndicator,
          tabBarPressColor: colors.gray[100],
        }}
      >
        <TopTab.Screen
          name="Overview"
          component={OverviewTab}
          options={{
            tabBarLabel: 'Overview',
          }}
        />
        <TopTab.Screen
          name="Food"
          component={FoodTab}
          options={{
            tabBarLabel: 'Food',
          }}
        />
        <TopTab.Screen
          name="Run"
          component={RunTab}
          options={{
            tabBarLabel: 'Run',
          }}
        />
      </TopTab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 60, // Status bar padding
    paddingBottom: 88, // Bottom tab bar padding (match new tab height)
  },

  // Top Tab Navigator Styling (Aura Health design)
  tabBar: {
    backgroundColor: colors.background,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 0,
    paddingHorizontal: spacing.md,
  },

  tabBarLabel: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body, // Sans-serif for UI
    fontWeight: typography.weights.semibold,
    textTransform: 'none', // Preserve original casing
  },

  tabBarIndicator: {
    backgroundColor: colors.textPrimary,
    height: 3,
    borderRadius: 2,
    marginHorizontal: spacing.md,
  },
});


