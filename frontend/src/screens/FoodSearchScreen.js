import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, globalStyles } from '../theme';

/**
 * FoodSearchScreen Component - Food Database Search & Selection
 *
 * Dedicated screen for searching and selecting foods to add to meals.
 * Features comprehensive food database with nutrition information.
 *
 * Props:
 * @param {Object} navigation - React Navigation object
 * @param {Object} route - Route params containing:
 *   - mealType: The meal category (breakfast, lunch, dinner, snacks)
 *   - onFoodSelected: Callback function to handle food selection
 *
 * Features:
 * - Real-time search with debouncing
 * - Comprehensive food database (mock data initially)
 * - Nutrition information display
 * - Quick portion size selection
 * - Category filtering
 * - Recent/popular foods
 *
 * TODO Future Enhancements:
 * - Integration with USDA Food Database API
 * - Barcode scanning
 * - Custom food creation
 * - Nutrition label parsing
 * - Favorite foods
 */
export default function FoodSearchScreen({ navigation, route }) {
  const { mealType = 'breakfast', onFoodSelected } = route.params || {};

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  // TEMPORARY: Mock food database - will be replaced with real API
  const mockFoodDatabase = [
    {
      id: '1',
      name: 'Banana',
      brand: 'Generic',
      category: 'fruits',
      calories: 105,
      protein: 1.3,
      carbs: 27,
      fat: 0.4,
      fiber: 3.1,
      sugar: 14.4,
      servingSize: '1 medium (118g)',
      servingUnit: 'piece',
      verified: true,
    },
    {
      id: '2',
      name: 'Chicken Breast',
      brand: 'Generic',
      category: 'meat',
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
      fiber: 0,
      sugar: 0,
      servingSize: '100g',
      servingUnit: 'grams',
      verified: true,
    },
    {
      id: '3',
      name: 'Brown Rice',
      brand: 'Generic',
      category: 'grains',
      calories: 123,
      protein: 2.6,
      carbs: 23,
      fat: 0.9,
      fiber: 1.8,
      sugar: 0.4,
      servingSize: '100g cooked',
      servingUnit: 'grams',
      verified: true,
    },
    {
      id: '4',
      name: 'Greek Yogurt',
      brand: 'Chobani',
      category: 'dairy',
      calories: 100,
      protein: 15,
      carbs: 6,
      fat: 0,
      fiber: 0,
      sugar: 4,
      servingSize: '150g',
      servingUnit: 'container',
      verified: true,
    },
    {
      id: '5',
      name: 'Almonds',
      brand: 'Generic',
      category: 'nuts',
      calories: 161,
      protein: 6,
      carbs: 6,
      fat: 14,
      fiber: 3.5,
      sugar: 1.2,
      servingSize: '28g (about 23 nuts)',
      servingUnit: 'ounce',
      verified: true,
    },
    {
      id: '6',
      name: 'Avocado',
      brand: 'Generic',
      category: 'fruits',
      calories: 160,
      protein: 2,
      carbs: 8.5,
      fat: 14.7,
      fiber: 6.7,
      sugar: 0.7,
      servingSize: '1/2 medium (75g)',
      servingUnit: 'piece',
      verified: true,
    },
    {
      id: '7',
      name: 'Oatmeal',
      brand: 'Quaker',
      category: 'grains',
      calories: 150,
      protein: 5,
      carbs: 27,
      fat: 3,
      fiber: 4,
      sugar: 1,
      servingSize: '40g dry',
      servingUnit: 'grams',
      verified: true,
    },
    {
      id: '8',
      name: 'Salmon Fillet',
      brand: 'Generic',
      category: 'fish',
      calories: 206,
      protein: 22,
      carbs: 0,
      fat: 12,
      fiber: 0,
      sugar: 0,
      servingSize: '100g',
      servingUnit: 'grams',
      verified: true,
    },
  ];

  const categories = [
    { id: 'all', name: 'All', icon: 'grid' },
    { id: 'fruits', name: 'Fruits', icon: 'leaf' },
    { id: 'vegetables', name: 'Vegetables', icon: 'nutrition' },
    { id: 'meat', name: 'Meat', icon: 'restaurant' },
    { id: 'fish', name: 'Fish', icon: 'fish' },
    { id: 'dairy', name: 'Dairy', icon: 'water' },
    { id: 'grains', name: 'Grains', icon: 'library' },
    { id: 'nuts', name: 'Nuts', icon: 'ellipse' },
  ];

  // Search functionality with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

  const performSearch = () => {
    setIsLoading(true);

    // TEMPORARY: Mock search implementation
    let results = mockFoodDatabase;

    // Filter by category
    if (selectedCategory !== 'all') {
      results = results.filter(food => food.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(food =>
        food.name.toLowerCase().includes(query) ||
        food.brand.toLowerCase().includes(query)
      );
    }

    setSearchResults(results);
    setIsLoading(false);
  };

  const handleFoodSelect = (food) => {
    // Navigate back with selected food data
    if (onFoodSelected) {
      onFoodSelected(food, mealType);
    }
    navigation.goBack();
  };

  const renderFoodItem = ({ item }) => (
    <TouchableOpacity
      style={styles.foodItem}
      onPress={() => handleFoodSelect(item)}
    >
      <View style={styles.foodInfo}>
        <View style={styles.foodHeader}>
          <Text style={styles.foodName}>{item.name}</Text>
          {item.verified && (
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          )}
        </View>
        <Text style={styles.foodBrand}>{item.brand}</Text>
        <Text style={styles.foodServing}>{item.servingSize}</Text>

        <View style={styles.nutritionPreview}>
          <Text style={styles.caloriesBadge}>{item.calories} cal</Text>
          <Text style={styles.macroText}>P: {item.protein}g</Text>
          <Text style={styles.macroText}>C: {item.carbs}g</Text>
          <Text style={styles.macroText}>F: {item.fat}g</Text>
        </View>
      </View>

      <Ionicons name="add-circle" size={24} color={colors.accent} />
    </TouchableOpacity>
  );

  const renderCategoryFilter = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        selectedCategory === item.id && styles.categoryButtonActive
      ]}
      onPress={() => setSelectedCategory(item.id)}
    >
      <Ionicons
        name={item.icon}
        size={20}
        color={selectedCategory === item.id ? colors.white : colors.textSecondary}
      />
      <Text
        style={[
          styles.categoryText,
          selectedCategory === item.id && styles.categoryTextActive
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit={true}
        minimumFontScale={0.8}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Add to {mealType}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search foods..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.textSecondary}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Filters */}
      <View style={styles.categoriesWrapper}>
        <FlatList
          data={categories}
          renderItem={renderCategoryFilter}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        />
      </View>

      {/* Search Results */}
      <FlatList
        data={searchResults}
        renderItem={renderFoodItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.resultsContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="search" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyStateText}>
              {searchQuery ? 'No foods found' : 'Start typing to search foods'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Base Layout
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header Section
  header: {
    ...globalStyles.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    marginHorizontal: 0,
    marginVertical: 0,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...globalStyles.sectionHeader,
    marginBottom: 0,
    marginTop: 0,
    textTransform: 'capitalize',
  },
  headerSpacer: {
    width: 44,
  },

  // Search Section
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  searchBar: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...globalStyles.bodyText,
    lineHeight: undefined,
  },

  // Category Filters
  categoriesWrapper: {
    marginBottom: spacing.md,
  },
  categoriesContainer: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  categoryButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    minWidth: 70,
    maxWidth: 120,
    height: 36,
    justifyContent: 'center',
  },
  categoryButtonActive: {
    backgroundColor: colors.black,
    borderColor: colors.black,
  },
  categoryText: {
    ...globalStyles.secondaryText,
    fontWeight: typography.weights.medium,
    textAlign: 'center',
    lineHeight: undefined,
  },
  categoryTextActive: {
    color: colors.white,
  },

  // Results Section
  resultsContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  foodItem: {
    ...globalStyles.card,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
    marginHorizontal: 0,
    marginVertical: 0,
  },
  foodInfo: {
    flex: 1,
  },
  foodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  foodName: {
    fontSize: typography.sizes.md,
    fontFamily: typography.heading,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  foodBrand: {
    ...globalStyles.secondaryText,
    marginBottom: spacing.xs,
    lineHeight: undefined,
  },
  foodServing: {
    ...globalStyles.secondaryText,
    marginBottom: spacing.sm,
    lineHeight: undefined,
  },
  nutritionPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  caloriesBadge: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    fontWeight: typography.weights.semibold,
    color: colors.blue[400],
    backgroundColor: colors.blue[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  macroText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.body,
    color: colors.textSecondary,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyStateText: {
    ...globalStyles.bodyText,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});