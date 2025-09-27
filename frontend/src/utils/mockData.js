/**
 * Mock Food Data Service
 * 
 * Provides fallback food data when FatSecret API is not available
 * or when testing without API credentials.
 */

export const mockFoods = [
  {
    id: "1",
    name: "Apple",
    brand: "Generic",
    category: "fruits",
    calories: 52,
    protein: 0.3,
    carbs: 13.8,
    fat: 0.2,
    fiber: 2.4,
    sugar: 10.4,
    serving_size: "100g",
    serving_unit: "grams",
    verified: false,
  },
  {
    id: "2",
    name: "Banana",
    brand: "Generic",
    category: "fruits",
    calories: 89,
    protein: 1.1,
    carbs: 22.8,
    fat: 0.3,
    fiber: 2.6,
    sugar: 12.2,
    serving_size: "100g",
    serving_unit: "grams",
    verified: false,
  },
  {
    id: "3",
    name: "Chicken Breast",
    brand: "Generic",
    category: "meat",
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    fiber: 0,
    sugar: 0,
    serving_size: "100g",
    serving_unit: "grams",
    verified: false,
  },
  {
    id: "4",
    name: "Brown Rice",
    brand: "Generic",
    category: "grains",
    calories: 111,
    protein: 2.6,
    carbs: 23,
    fat: 0.9,
    fiber: 1.8,
    sugar: 0.4,
    serving_size: "100g",
    serving_unit: "grams",
    verified: false,
  },
  {
    id: "5",
    name: "Greek Yogurt",
    brand: "Generic",
    category: "dairy",
    calories: 59,
    protein: 10,
    carbs: 3.6,
    fat: 0.4,
    fiber: 0,
    sugar: 3.6,
    serving_size: "100g",
    serving_unit: "grams",
    verified: false,
  },
  {
    id: "6",
    name: "Almonds",
    brand: "Generic",
    category: "nuts",
    calories: 579,
    protein: 21.2,
    carbs: 21.6,
    fat: 49.9,
    fiber: 12.5,
    sugar: 4.4,
    serving_size: "100g",
    serving_unit: "grams",
    verified: false,
  },
  {
    id: "7",
    name: "Salmon",
    brand: "Generic",
    category: "fish",
    calories: 208,
    protein: 25.4,
    carbs: 0,
    fat: 12.4,
    fiber: 0,
    sugar: 0,
    serving_size: "100g",
    serving_unit: "grams",
    verified: false,
  },
  {
    id: "8",
    name: "Broccoli",
    brand: "Generic",
    category: "vegetables",
    calories: 34,
    protein: 2.8,
    carbs: 6.6,
    fat: 0.4,
    fiber: 2.6,
    sugar: 1.5,
    serving_size: "100g",
    serving_unit: "grams",
    verified: false,
  },
  {
    id: "9",
    name: "Whole Wheat Bread",
    brand: "Generic",
    category: "grains",
    calories: 247,
    protein: 13.4,
    carbs: 41.3,
    fat: 4.2,
    fiber: 6.0,
    sugar: 4.3,
    serving_size: "100g",
    serving_unit: "grams",
    verified: false,
  },
  {
    id: "10",
    name: "Eggs",
    brand: "Generic",
    category: "dairy",
    calories: 155,
    protein: 13,
    carbs: 1.1,
    fat: 11,
    fiber: 0,
    sugar: 1.1,
    serving_size: "100g",
    serving_unit: "grams",
    verified: false,
  },
];

/**
 * Search mock foods by query and category
 */
export function searchMockFoods(query, category = 'all', page = 0, limit = 20) {
  let filteredFoods = mockFoods;
  
  // Filter by category
  if (category !== 'all') {
    filteredFoods = filteredFoods.filter(food => food.category === category);
  }
  
  // Filter by search query
  if (query && query.trim().length > 0) {
    const searchTerm = query.toLowerCase().trim();
    filteredFoods = filteredFoods.filter(food => 
      food.name.toLowerCase().includes(searchTerm) ||
      food.brand.toLowerCase().includes(searchTerm)
    );
  }
  
  // Apply pagination
  const startIndex = page * limit;
  const endIndex = startIndex + limit;
  const paginatedFoods = filteredFoods.slice(startIndex, endIndex);
  
  return {
    foods: paginatedFoods,
    totalResults: filteredFoods.length,
    pageNumber: page,
  };
}

/**
 * Get mock food by ID
 */
export function getMockFoodById(id) {
  return mockFoods.find(food => food.id === id);
}

/**
 * Get mock food categories
 */
export function getMockCategories() {
  return [
    { id: 'all', name: 'All', icon: 'grid' },
    { id: 'fruits', name: 'Fruits', icon: 'leaf' },
    { id: 'vegetables', name: 'Vegetables', icon: 'nutrition' },
    { id: 'meat', name: 'Meat', icon: 'restaurant' },
    { id: 'fish', name: 'Fish', icon: 'fish' },
    { id: 'dairy', name: 'Dairy', icon: 'water' },
    { id: 'grains', name: 'Grains', icon: 'library' },
    { id: 'nuts', name: 'Nuts', icon: 'ellipse' },
  ];
}
