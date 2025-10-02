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
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, globalStyles } from '../theme';
import { api } from '../services';
import { BarcodeScanner } from '../components';
import { searchMockFoods, getMockCategories } from '../utils/mockData';
import { useAuth } from '../context/AuthContext';

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
  const { mealType = 'breakfast', showBarcodeScanner: initialShowScanner = false } = route?.params || {};
  const { token } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(initialShowScanner);
  
  // Food detail modal state
  const [selectedFood, setSelectedFood] = useState(null);
  const [showFoodDetail, setShowFoodDetail] = useState(false);
  const [servingAmount, setServingAmount] = useState('1');
  const [customServingSize, setCustomServingSize] = useState('');


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
      const searchResponse = await api.searchFoods(searchQuery.trim(), 0, 20);
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
      setSearchResults(mockResults?.foods || []);
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
      console.log('Searching for barcode:', barcode);
      const result = await api.searchFoodByBarcode(barcode);
      console.log('Barcode search result:', result);

      if (result && result.success) {
        // Found food, add it to search results
        setSearchResults([result.food]);
        setSearchQuery(''); // Clear search query to prevent triggering search API
        setHasSearched(true);
        setSelectedCategory('all');
        console.log('Food found for barcode:', result.food.name);
      } else {
        // No food found for this barcode
        const errorMessage = result?.error || 'This barcode is not in our food database. Try searching by name instead.';
        console.log('Barcode not found:', errorMessage);

        Alert.alert(
          'Barcode Not Found',
          errorMessage,
          [{ text: 'OK' }]
        );
        setSearchResults([]);
        setHasSearched(true);
      }
    } catch (error) {
      console.error('Barcode search error:', error);
      Alert.alert(
        'Search Error',
        `Failed to search for barcode: ${error.message || 'Please try again.'}`,
        [{ text: 'OK' }]
      );
      setError('Barcode search failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFoodSelect = (food) => {
    setSelectedFood(food);
    setServingAmount('1');
    setCustomServingSize('');
    setShowFoodDetail(true);
  };

  const handleAddFoodToMeal = async () => {
    if (!token) {
      Alert.alert('Error', 'Please log in to save food logs.');
      return;
    }

    try {
      const amount = parseFloat(servingAmount) || 1;
      const foodToAdd = {
        ...selectedFood,
        servingAmount: amount,
        totalCalories: Math.round(selectedFood.calories * amount),
        totalProtein: Math.round(selectedFood.protein * amount * 10) / 10,
        totalCarbs: Math.round(selectedFood.carbs * amount * 10) / 10,
        totalFat: Math.round(selectedFood.fat * amount * 10) / 10,
      };

      console.log('🍎 Saving food to Firebase:', foodToAdd);
      
      const foodLogData = {
        name: selectedFood.name,
        brand: selectedFood.brand || '',
        calories: foodToAdd.totalCalories,
        protein: foodToAdd.totalProtein,
        carbs: foodToAdd.totalCarbs,
        fat: foodToAdd.totalFat,
        servingSize: `${amount} ${selectedFood.servingSize || 'serving'}`,
        mealType: mealType,
        date: new Date().toISOString().split('T')[0]
      };

      const response = await api.logFood(foodLogData, token);
      console.log('✅ Food saved to Firebase:', response);

      if (response.success) {
        setShowFoodDetail(false);
        navigation.goBack();
        Alert.alert('Success', 'Food logged successfully!');
      }
    } catch (error) {
      console.error('❌ Failed to save food:', error);
      Alert.alert('Error', 'Failed to save food. Please try again.');
    }
  };

  const renderFoodItem = ({ item }) => (
    <TouchableOpacity
      style={styles.foodItem}
      onPress={() => handleFoodSelect(item)}
    >
      <View style={styles.foodContent}>
        {/* Top Row: Name and Macros */}
        <View style={styles.topRow}>
          <Text style={styles.foodName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.macroRow}>
            <Text style={styles.macroText}>C {Math.round(item.carbs)}</Text>
            <Text style={styles.macroText}>P {Math.round(item.protein)}</Text>
            <Text style={styles.macroText}>F {Math.round(item.fat)}</Text>
          </View>
        </View>
        
        {/* Bottom Row: Calories and Serving Size */}
        <View style={styles.bottomRow}>
          <Text style={styles.caloriesSize}>
            {item.calories} kcal/{item.servingSize || 'serving'}
          </Text>
          {item.verified && (
            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
          )}
        </View>
      </View>
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
      {/* Simplified Header with Back Button */}
      <View style={styles.simpleHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Food</Text>
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
            autoFocus={true}
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
      <BarcodeScanner
        isVisible={showBarcodeScanner}
        onBarcodeScanned={handleBarcodeScanned}
        onClose={() => setShowBarcodeScanner(false)}
      />

      {/* Food Detail Modal */}
      <Modal
        visible={showFoodDetail}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFoodDetail(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowFoodDetail(false)}
            >
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Food Details</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddFoodToMeal}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          {selectedFood && (
            <ScrollView style={styles.modalContent}>
              {/* Food Info */}
              <View style={styles.foodInfoCard}>
                <Text style={styles.modalFoodName}>{selectedFood.name}</Text>
                {selectedFood.brand && (
                  <Text style={styles.modalFoodBrand}>{selectedFood.brand}</Text>
                )}
                <Text style={styles.modalFoodServing}>{selectedFood.servingSize}</Text>
              </View>

              {/* Serving Amount */}
              <View style={styles.servingCard}>
                <Text style={styles.cardTitle}>Serving Amount</Text>
                <View style={styles.servingControls}>
                  <TouchableOpacity
                    style={styles.servingButton}
                    onPress={() => setServingAmount(Math.max(0.1, parseFloat(servingAmount) - 0.5).toString())}
                  >
                    <Ionicons name="remove" size={20} color={colors.textPrimary} />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.servingInput}
                    value={servingAmount}
                    onChangeText={setServingAmount}
                    keyboardType="decimal-pad"
                    textAlign="center"
                  />
                  <TouchableOpacity
                    style={styles.servingButton}
                    onPress={() => setServingAmount((parseFloat(servingAmount) + 0.5).toString())}
                  >
                    <Ionicons name="add" size={20} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.servingHint}>servings</Text>
              </View>

              {/* Nutrition Summary */}
              <View style={styles.nutritionCard}>
                <Text style={styles.cardTitle}>Nutrition Summary</Text>
                <View style={styles.nutritionGrid}>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>
                      {Math.round(selectedFood.calories * (parseFloat(servingAmount) || 1))}
                    </Text>
                    <Text style={styles.nutritionLabel}>Calories</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>
                      {Math.round(selectedFood.carbs * (parseFloat(servingAmount) || 1) * 10) / 10}g
                    </Text>
                    <Text style={styles.nutritionLabel}>Carbs</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>
                      {Math.round(selectedFood.protein * (parseFloat(servingAmount) || 1) * 10) / 10}g
                    </Text>
                    <Text style={styles.nutritionLabel}>Protein</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>
                      {Math.round(selectedFood.fat * (parseFloat(servingAmount) || 1) * 10) / 10}g
                    </Text>
                    <Text style={styles.nutritionLabel}>Fat</Text>
                  </View>
                </View>
              </View>

              {/* Additional Nutrition Info */}
              {(selectedFood.fiber || selectedFood.sugar) && (
                <View style={styles.additionalNutritionCard}>
                  <Text style={styles.cardTitle}>Additional Info</Text>
                  <View style={styles.additionalNutritionList}>
                    {selectedFood.fiber && (
                      <View style={styles.nutritionRow}>
                        <Text style={styles.nutritionRowLabel}>Fiber</Text>
                        <Text style={styles.nutritionRowValue}>
                          {Math.round(selectedFood.fiber * (parseFloat(servingAmount) || 1) * 10) / 10}g
                        </Text>
                      </View>
                    )}
                    {selectedFood.sugar && (
                      <View style={styles.nutritionRow}>
                        <Text style={styles.nutritionRowLabel}>Sugar</Text>
                        <Text style={styles.nutritionRowValue}>
                          {Math.round(selectedFood.sugar * (parseFloat(servingAmount) || 1) * 10) / 10}g
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Base Layout
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Simplified Header Section
  simpleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.heading,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
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


  // Results Section
  resultsContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  foodItem: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    // Subtle shadow
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  foodContent: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  foodName: {
    flex: 1,
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  macroText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 28,
    textAlign: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  caloriesSize: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
    flex: 1,
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

  // Food Detail Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.heading,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  addButton: {
    backgroundColor: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  addButtonText: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    fontWeight: typography.weights.semibold,
  },
  modalContent: {
    flex: 1,
    padding: spacing.md,
  },

  // Food Info Card
  foodInfoCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  modalFoodName: {
    fontSize: typography.sizes.xl,
    fontFamily: typography.heading,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  modalFoodBrand: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  modalFoodServing: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },

  // Serving Controls
  servingCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.heading,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  servingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  servingButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servingInput: {
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.textPrimary,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.lg,
    fontFamily: typography.body,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    minWidth: 80,
  },
  servingHint: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },

  // Nutrition Cards
  nutritionCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  nutritionItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: 8,
    padding: spacing.md,
  },
  nutritionValue: {
    fontSize: typography.sizes.xl,
    fontFamily: typography.body,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  nutritionLabel: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Additional Nutrition
  additionalNutritionCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  additionalNutritionList: {
    gap: spacing.sm,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  nutritionRowLabel: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    color: colors.textPrimary,
  },
  nutritionRowValue: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
});