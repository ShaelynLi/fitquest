import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, globalStyles } from '../theme';
import backendApi from '../services/backendApi';
import BarcodeScanner from '../components/BarcodeScanner';
import { searchMockFoods, getMockCategories } from '../services/mockFoodData';

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
  const { mealType = 'breakfast' } = route?.params || {};

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);


  const categories = getMockCategories();

  // Search functionality with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch();
    }, 500); // Increased debounce time for API calls

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

  const performSearch = async () => {
    // Clear error state
    setError(null);

    // Don't search if query is empty or too short
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsLoading(false);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      // Search using Backend API proxy
      console.log('Searching for:', searchQuery.trim());
      const searchResponse = await backendApi.searchFoods(searchQuery.trim(), 0, 20);
      let results = searchResponse.foods || [];

      // Filter by category if not 'all'
      if (selectedCategory !== 'all') {
        results = results.filter(food => food.category === selectedCategory);
      }

      console.log('Search results:', results.length, 'foods found');
      setSearchResults(results);
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error('Search error:', error);

      // Provide helpful error messages based on error type
      let errorMessage = 'Failed to search foods. Please try again.';

      if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      } else if (error.message.includes('Backend API error')) {
        errorMessage = 'Server error occurred. Please try again later.';
      }

      // Use mock data as fallback when API fails
      console.log('Using fallback mock data due to API error');
      const mockResults = searchMockFoods(searchQuery.trim(), selectedCategory, 0, 20);
      setSearchResults(mockResults.foods);
      setError(`API Error: ${errorMessage} (Using mock data fallback)`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBarcodeScanned = async (barcode) => {
    console.log('Barcode scanned:', barcode);
    setShowBarcodeScanner(false);
    setIsLoading(true);
    setError(null);

    try {
      const result = await backendApi.searchFoodByBarcode(barcode);

      if (result.success) {
        // Found food, add it to search results
        setSearchResults([result.food]);
        setSearchQuery(`Barcode: ${barcode}`);
        setHasSearched(true);
        setSelectedCategory('all');
      } else {
        // No food found for this barcode
        Alert.alert(
          'Barcode Not Found',
          result.error || 'This barcode is not in our food database. Try searching by name instead.',
          [{ text: 'OK' }]
        );
        setSearchResults([]);
        setHasSearched(true);
      }
    } catch (error) {
      console.error('Barcode search error:', error);
      Alert.alert(
        'Search Error',
        'Failed to search for barcode. Please try again.',
        [{ text: 'OK' }]
      );
      setError('Barcode search failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFoodSelect = (food) => {
    // Navigate back with selected food data as params
    navigation.navigate('Food', {
      selectedFood: food,
      mealType: mealType,
    });
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
          {searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setShowBarcodeScanner(true)}>
              <Ionicons name="barcode" size={20} color={colors.textSecondary} />
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
            {isLoading ? (
              <>
                <ActivityIndicator size="large" color={colors.black} />
                <Text style={styles.emptyStateText}>Searching foods...</Text>
              </>
            ) : error ? (
              <>
                <Ionicons name="alert-circle" size={48} color={colors.red[400]} />
                <Text style={styles.emptyStateText}>
                  {error}
                </Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={performSearch}
                >
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </>
            ) : hasSearched && searchResults.length === 0 ? (
              <>
                <Ionicons name="search" size={48} color={colors.textSecondary} />
                <Text style={styles.emptyStateText}>
                  No foods found for "{searchQuery}"
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  Try a different search term or check spelling
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="restaurant" size={48} color={colors.textSecondary} />
                <Text style={styles.emptyStateText}>
                  Search for foods to add to your {mealType}
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  Type at least 2 characters to start searching
                </Text>
              </>
            )}
          </View>
        }
      />

      {/* Barcode Scanner Modal */}
      {showBarcodeScanner && (
        <BarcodeScanner
          isVisible={showBarcodeScanner}
          onBarcodeScanned={handleBarcodeScanned}
          onClose={() => setShowBarcodeScanner(false)}
        />
      )}
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
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
  },
  emptyStateSubtext: {
    ...globalStyles.bodyText,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    fontSize: typography.sizes.sm,
    opacity: 0.7,
  },

  // Error State
  retryButton: {
    backgroundColor: colors.black,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    marginTop: spacing.md,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    textAlign: 'center',
  },
});