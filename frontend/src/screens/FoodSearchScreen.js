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
  Image,
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
  const [measurementMode, setMeasurementMode] = useState('serving'); // 'serving' or 'gram'
  const [selectedServing, setSelectedServing] = useState(null);
  const [foodImages, setFoodImages] = useState({}); // Cache for food images (no longer used for display)
  // Type and time removed per request
  // UI-only: daily calorie intake progress (placeholder values)
  const [currentCalories, setCurrentCalories] = useState(0);
  const [targetCalories] = useState(2000);


  const categories = getMockCategories();

  // Get the serving data from the API response (backend now returns single serving)
  const getServingData = (food) => {
    // Backend now returns a single 'serving' field instead of 'all_servings'
    return food?.serving || null;
  };

  // Compute nutrition per 100 g given any gram-based serving
  const computePer100g = (serving) => {
    if (!serving) return null;
    const unit = (serving.metric_unit || '').toLowerCase();
    const amt = parseFloat(serving.metric_amount);
    if (unit !== 'g' || !amt || isNaN(amt) || amt <= 0) return null;
    const factor = 100 / amt;
    const to1dp = (v) => Math.round((parseFloat(v || 0) * factor) * 10) / 10;
    return {
      calories: Math.round((parseFloat(serving.calories || 0) * factor)),
      carbs: to1dp(serving.carbs),
      protein: to1dp(serving.protein),
      fat: to1dp(serving.fat),
    };
  };

  // Function to fetch missing images for food items
  const fetchMissingImages = async (foods) => {
    const foodsNeedingImages = foods.filter(food => !food.image_url && food.fatsecret_id);
    
    const imagePromises = foodsNeedingImages.map(async (food) => {
      try {
        const imageUrl = await api.getFoodImage(food.fatsecret_id);
        
        if (imageUrl) {
          setFoodImages(prev => ({
            ...prev,
            [food.fatsecret_id]: imageUrl
          }));
        }
      } catch (error) {
        // Silently handle image fetch errors
      }
    });

    // Execute all image requests in parallel
    await Promise.all(imagePromises);
  };

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
      const searchResponse = await api.searchFoods(searchQuery.trim(), 0, 10);
      let results = searchResponse.foods || [];

      // Filter by category if not 'all'
      if (selectedCategory !== 'all') {
        results = results.filter(food => food.category === selectedCategory);
      }

          setSearchResults(results);
          setError(null); // Clear any previous errors
      
      // Fetch images for foods that don't have them
      fetchMissingImages(results);
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
          const mockResults = searchMockFoods(searchQuery.trim(), selectedCategory, 0, 20);
      setSearchResults(mockResults?.foods || []);
      setError(`API Error: ${errorMessage} (Using mock data fallback)`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBarcodeScanned = async (barcode) => {
    setShowBarcodeScanner(false);
    setIsLoading(true);
    setError(null);

    try {
      const result = await api.searchFoodByBarcode(barcode);

      if (result && result.success) {
        // Found food, add it to search results
        setSearchResults([result.food]);
        setSearchQuery(''); // Clear search query to prevent triggering search API
        setHasSearched(true);
        setSelectedCategory('all');
      } else {
        // No food found for this barcode
        const errorMessage = result?.error || 'This barcode is not in our food database. Try searching by name instead.';

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
    setServingAmount('100');
    setCustomServingSize('');
    setMeasurementMode('gram');
    // Prefer gram-based serving by default
    setSelectedServing(getServingData(food) || null);
    setShowFoodDetail(true);
  };

  // Helper function to calculate nutrition based on current settings
  const calculateNutrition = () => {
    if (!selectedFood || !selectedServing) return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 };
    
    const amount = parseFloat(servingAmount) || 0; // user-entered grams or servings
    const metricAmount = parseFloat(selectedServing.metric_amount) || 0;
    const metricUnit = (selectedServing.metric_unit || '').toLowerCase();

    // If the selected serving is gram-based (e.g., 100 g), scale by amount/metricAmount.
    // Otherwise assume `amount` is number of servings.
    const isGramBased = metricUnit === 'g' && metricAmount > 0;
    const multiplier = isGramBased ? (amount / metricAmount) : (amount || 1);

    const round1 = (v) => Math.round(v * 10) / 10;

    return {
      calories: Math.round((parseFloat(selectedServing.calories || 0)) * multiplier),
      protein: round1((parseFloat(selectedServing.protein || 0)) * multiplier),
      carbs: round1((parseFloat(selectedServing.carbs || 0)) * multiplier),
      fat: round1((parseFloat(selectedServing.fat || 0)) * multiplier),
      fiber: round1((parseFloat(selectedServing.fiber || 0)) * multiplier),
      sugar: round1((parseFloat(selectedServing.sugar || 0)) * multiplier),
      saturated_fat: round1((parseFloat(selectedServing.saturated_fat || 0)) * multiplier),
      sodium: Math.round((parseFloat(selectedServing.sodium || 0)) * multiplier),
      cholesterol: Math.round((parseFloat(selectedServing.cholesterol || 0)) * multiplier),
      potassium: Math.round((parseFloat(selectedServing.potassium || 0)) * multiplier),
    };
  };

  const handleAddFoodToMeal = async () => {
    if (!token) {
      Alert.alert('Error', 'Please log in to save food logs.');
      return;
    }

    try {
      const amount = parseFloat(servingAmount) || 1;
      const nutrition = calculateNutrition();

    const foodToAdd = {
      name: selectedFood.name,
      brand: selectedFood.brand || null,
      fatsecret_id: selectedFood.fatSecretId || null,
      calories: nutrition.calories,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fat: nutrition.fat,
      fiber: nutrition.fiber || 0,
      sugar: nutrition.sugar || 0,
      saturated_fat: nutrition.saturated_fat || 0,
      sodium: nutrition.sodium || 0,
      cholesterol: nutrition.cholesterol || 0,
      potassium: nutrition.potassium || 0,
      serving_amount: amount,
      serving_unit: "g",
      measurement_mode: measurementMode,
    };

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];

      // Log the meal to backend
      const response = await api.logMeal(mealType, today, foodToAdd, token);

      if (response.success) {
        console.log('✅ Meal logged successfully:', response.data);
        setShowFoodDetail(false);

        // Navigate back with success flag to trigger refresh
        navigation.navigate('Main', {
          screen: 'FoodTab',
          params: { mealLogged: true, timestamp: Date.now() }
        });
      } else {
        Alert.alert('Error', 'Failed to log meal. Please try again.');
      }
    } catch (error) {
      console.error('Failed to log meal:', error);
      Alert.alert('Error', `Failed to save meal: ${error.message}`);
    }
  };

  const renderFoodItem = ({ item }) => {
    const servingData = getServingData(item);
    const per100 = computePer100g(servingData);
    const label = '100 g';

    // If no per 100g calculation available, show N/A or use first serving as fallback
    const displayCarbs = per100 ? per100.carbs : 'N/A';
    const displayProtein = per100 ? per100.protein : 'N/A';
    const displayFat = per100 ? per100.fat : 'N/A';
    const displayCalories = per100 ? per100.calories : 'N/A';

    return (
      <TouchableOpacity
        style={styles.foodItem}
        onPress={() => handleFoodSelect(item)}
      >
        <View style={styles.foodContent}>
          {/* Left Letter Avatar */}
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{(item.name || '?').charAt(0)}</Text>
          </View>

          {/* Middle: Info column (Name then Calories) */}
          <View style={styles.infoCol}>
            <View style={styles.nameRow}>
              {item.verified && (
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              )}
              <Text style={styles.foodName} numberOfLines={2}>
                {item.name}
              </Text>
            </View>
            <Text style={styles.caloriesSize}>
              {displayCalories} kcal/{label}
            </Text>
          </View>

          {/* Right: Macros column (three rows) */}
          <View style={styles.macroCol}>
            <Text style={styles.macroLine}>P | {displayProtein}</Text>
            <Text style={styles.macroLine}>C | {displayCarbs}</Text>
            <Text style={styles.macroLine}>F | {displayFat}</Text>
          </View>

          {/* Right Circular Add Button */}
          <TouchableOpacity
            style={styles.addCircleButton}
            onPress={() => handleFoodSelect(item)}
          >
            <Ionicons name="add" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

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
        {/* Calorie Intake Slider (UI only) */}
        <View style={styles.calorieContainer}>
          <View style={styles.calorieHeaderRow}>
            <Text style={styles.calorieNumbers}>
              {currentCalories}/{targetCalories} kcal
            </Text>
            <Text style={styles.calorieLabelText}>Today</Text>
          </View>
          <View style={styles.calorieBarOuter}>
            <View
              style={[
                styles.calorieBarInner,
                { width: `${Math.min(100, (currentCalories / Math.max(1, targetCalories)) * 100)}%` },
              ]}
            />
          </View>
        </View>
        {/* Filters Row (UI only) */}
        <View style={styles.filtersRow}>
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={styles.filterButton} activeOpacity={0.8}>
            <Ionicons name="filter" size={16} color={colors.textPrimary} />
            <Text style={styles.filterButtonText}>Filters</Text>
          </TouchableOpacity>
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

      {/* Food Detail Overlay */}
      {showFoodDetail && (
        <View style={styles.overlayContainer}>
          <View style={styles.overlayContent}>
            {/* Overlay Header */}
            <View style={styles.overlayHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowFoodDetail(false)}
              >
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.overlayTitle}>Add Food</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddFoodToMeal}
              >
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>

            {selectedFood && (
              <ScrollView style={styles.overlayScrollContent} showsVerticalScrollIndicator={false}>
            {/* Food Info Row (flat) */}
            <View style={styles.rowSection}>
              <View style={styles.foodHeader}>
                <View style={styles.avatarContainer}>
                  <Text style={styles.avatarText}>{(selectedFood.name || '?').charAt(0)}</Text>
                </View>
                <View style={styles.foodTextInfo}>
                  <Text style={styles.modalFoodName}>{selectedFood.name}</Text>
                  {selectedFood.brand && selectedFood.brand !== 'Generic' && (
                    <Text style={styles.modalFoodBrand}>{selectedFood.brand}</Text>
                  )}
                </View>
              </View>
            </View>

            {/* Amount Row (label left, numeric input + unit right) */}
            <View style={styles.rowSection}>
              <Text style={styles.rowLabel}>Amount</Text>
              <View style={styles.rowRight}>
                <TextInput
                  style={styles.amountInput}
                  value={servingAmount}
                  onChangeText={setServingAmount}
                  keyboardType="decimal-pad"
                  textAlign="center"
                />
                <View style={styles.amountUnitPill}><Text style={styles.amountUnitPillText}>g</Text></View>
              </View>
            </View>

            {/* Removed Type and Time per request */}

                {/* Nutrition Summary */}
                <View style={styles.nutritionSummaryCard}>
                  <Text style={styles.cardTitle}>Nutrition Summary</Text>
                  {(() => {
                    const nutrition = calculateNutrition();
                    return (
                      <>
                        {/* Main Calorie Display */}
                        <View style={styles.calorieDisplay}>
                          <View style={styles.calorieNumbers}>
                            <Text style={styles.calorieValue}>{nutrition.calories}</Text>
                            <Text style={styles.calorieUnit}>kcal</Text>
                          </View>
                          <Text style={styles.calorieLabel}>Total Calories</Text>
                        </View>

                        {/* Macronutrient Circles */}
                        <View style={styles.macroCircles}>
                          <View style={styles.macroCircle}>
                            <View style={[styles.macroCircleInner, { backgroundColor: colors.purple[500] + '20' }]}>
                              <Text style={styles.macroCircleValue}>{nutrition.carbs}g</Text>
                            </View>
                            <Text style={styles.macroCircleLabel}>Carbs</Text>
                          </View>
                          <View style={styles.macroCircle}>
                            <View style={[styles.macroCircleInner, { backgroundColor: colors.pink[500] + '20' }]}>
                              <Text style={styles.macroCircleValue}>{nutrition.protein}g</Text>
                            </View>
                            <Text style={styles.macroCircleLabel}>Protein</Text>
                          </View>
                          <View style={styles.macroCircle}>
                            <View style={[styles.macroCircleInner, { backgroundColor: colors.yellow[500] + '20' }]}>
                              <Text style={styles.macroCircleValue}>{nutrition.fat}g</Text>
                            </View>
                            <Text style={styles.macroCircleLabel}>Fat</Text>
                          </View>
                        </View>
                      </>
                    );
                  })()}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
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
    justifyContent: 'space-between',
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
    flex: 1,
    marginLeft: spacing.sm,
  },
  closeButtonHeader: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Search Section
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  searchBar: {
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
  },
  // Calorie slider UI
  calorieContainer: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  calorieHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calorieNumbers: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textPrimary,
    fontWeight: typography.weights.medium,
  },
  calorieLabelText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.body,
    color: colors.textSecondary,
  },
  calorieBarOuter: {
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.gray[200],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  calorieBarInner: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.green?.[500] || colors.textPrimary,
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
    backgroundColor: colors.background,
    borderRadius: 0,
    borderWidth: 0,
    borderBottomWidth: 1,
    borderColor: colors.border,
    // Match search bar width by relying on FlatList content padding
    marginBottom: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    // No card shadow for flat list rows
  },
  foodContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    color: colors.textSecondary,
  },
  foodMainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  foodImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.gray[100],
  },
  foodImage: {
    width: '100%',
    height: '100%',
  },
  foodImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodInfo: {
    flex: 1,
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  macroCol: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingLeft: spacing.sm,
  },
  macroLine: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.body,
    color: colors.textSecondary,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  nameRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  foodName: {
    flex: 1,
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginRight: spacing.sm,
    lineHeight: 20,
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 0,
  },
  macroRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  macroText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.body,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
  macroTextPlain: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.body,
    fontWeight: typography.weights.medium,
    color: colors.gray[500],
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomRowMacros: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  addCircleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caloriesSize: {
    fontSize: typography.sizes.md,
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

  // Overlay Styles
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  overlayContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '70%',
  },
  overlayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  overlayTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.heading,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  overlayScrollContent: {
    flex: 1,
    padding: spacing.md,
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

  // Food Info Card with Image
  foodInfoCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  foodHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  foodTextInfo: {
    flex: 1,
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
    marginBottom: spacing.xs,
  },
  modalFoodType: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  foodImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.gray[100],
  },
  foodImage: {
    width: '100%',
    height: '100%',
  },

  // Measurement Toggle
  measurementCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.heading,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  amountCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  measurementToggle: {
    flexDirection: 'row',
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleButtonText: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
  toggleButtonTextActive: {
    color: colors.textPrimary,
    fontWeight: typography.weights.semibold,
  },

  // Flat rows for compact overlay
  rowSection: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabel: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowValuePill: {
    minWidth: 96,
    justifyContent: 'center',
    alignItems: 'center',
  },

      // Serving Info Display
      servingInfoCard: {
        backgroundColor: colors.white,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.lg,
        marginBottom: spacing.md,
        shadowColor: colors.black,
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      },
      servingInfo: {
        alignItems: 'center',
      },
      servingInfoText: {
        fontSize: typography.sizes.md,
        fontFamily: typography.body,
        fontWeight: typography.weights.semibold,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
      },
      servingInfoSubtext: {
        fontSize: typography.sizes.sm,
        fontFamily: typography.body,
        color: colors.textSecondary,
      },
  servingOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  servingOption: {
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 120,
  },
  servingOptionActive: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
  servingOptionText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  servingOptionTextActive: {
    color: colors.white,
  },
  servingOptionCalories: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.body,
    color: colors.textSecondary,
  },
  servingOptionCaloriesActive: {
    color: colors.white,
    opacity: 0.8,
  },

  // Amount Input
  amountCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  amountControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  amountButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountInput: {
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

  amountUnitPill: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  amountUnitPillText: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    color: colors.textSecondary,
  },

  // Nutrition Summary Card (Following FoodTab Design)
  nutritionSummaryCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  calorieDisplay: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  calorieNumbers: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  calorieValue: {
    fontSize: 32,
    fontFamily: typography.heading,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  calorieUnit: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
  },
  calorieLabel: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
  },
  macroCircles: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: spacing.lg,
  },
  macroCircle: {
    alignItems: 'center',
    flex: 1,
  },
  macroCircleInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  macroCircleValue: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  macroCircleLabel: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Detailed Nutrition Card
  detailedNutritionCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  nutritionDetails: {
    gap: spacing.sm,
  },
  nutritionDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  nutritionDetailLabel: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    color: colors.textPrimary,
  },
  nutritionDetailValue: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
});