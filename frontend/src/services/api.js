/**
 * Backend API Service
 *
 * Handles API calls to our own FastAPI backend which proxies FatSecret requests.
 * This approach solves IP whitelisting issues and provides better security.
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Backend API Configuration
// For development: use local backend with FatSecret credentials
// For production: use deployed backend
const getBackendUrl = () => {
  if (__DEV__) {
    // Development: use local backend
    console.log('=== Backend Detection ===');
    console.log('debuggerHost:', Constants.debuggerHost);
    console.log('hostUri:', Constants.hostUri);
    console.log('Platform.OS:', Platform.OS);
    console.log('=========================');

    // Try to detect if running in Expo Go (physical device) vs simulator
    let debuggerHost = null;
    
    // Try multiple methods to detect the development server IP
    if (Constants.manifest2?.extra?.expoGo?.debuggerHost) {
      debuggerHost = Constants.manifest2.extra.expoGo.debuggerHost;
    } else if (Constants.expoConfig?.debuggerHost) {
      debuggerHost = Constants.expoConfig.debuggerHost;
    } else if (Constants.debuggerHost) {
      debuggerHost = Constants.debuggerHost;
    }

    if (debuggerHost) {
      // Extract IP from debuggerHost (works for Expo Go on physical devices)
      const ip = debuggerHost.split(':')[0];
      console.log('Detected backend IP from debuggerHost:', ip);
      return `http://${ip}:8000`;
    }

    // Additional check: if we have a hostUri, extract IP from it
    if (Constants.hostUri) {
      const ip = Constants.hostUri.split(':')[0];
      console.log('Detected backend IP from hostUri:', ip);
      return `http://${ip}:8000`;
    }

    // Fallback based on platform for simulator vs device
    if (Platform.OS === 'ios') {
      console.log('Using localhost for iOS simulator');
      return 'http://localhost:8000';  // iOS Simulator
    } else {
      console.log('Using Android emulator localhost');
      return 'http://10.0.2.2:8000';  // Android Emulator
    }
  }
  // Production: use deployed backend
  return 'https://comp90018-t8-g2.web.app';
};

const BACKEND_BASE_URL = getBackendUrl();

class BackendApiService {
  constructor() {
    this.baseUrl = BACKEND_BASE_URL;
  }

  /**
   * Make API request to backend
   */
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;

    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
      timeout: 15000,
    };

    const requestOptions = { ...defaultOptions, ...options };

    try {
      console.log('Backend API request:', url);
      console.log('Request options:', JSON.stringify(requestOptions, null, 2));

      // Create fetch with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url, {
        ...requestOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend API error response:', errorText);
        throw new Error(`Backend API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Backend API request failed:', error);
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        url: url,
      });

      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please check your internet connection');
      } else if (error.message && error.message.includes('Network request failed')) {
        throw new Error('Network connection failed - please check your internet connection and try again');
      }

      throw error;
    }
  }

  /**
   * Test network connectivity
   */
  async testConnection() {
    try {
      console.log('Testing backend connection...');
      const response = await this.makeRequest('/api/health');
      console.log('Connection test successful:', response);
      return { success: true, data: response };
    } catch (error) {
      console.error('Connection test failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Search for foods using backend proxy
   *
   * @param {string} query - Search query
   * @param {number} page - Page number (0-based)
   * @param {number} limit - Results per page
   * @returns {Promise<Object>} Search results
   */
  async searchFoods(query, page = 0, limit = 20) {
    if (!query || query.trim().length < 2) {
      return { foods: [], total_results: 0, page_number: 0 };
    }

    const params = new URLSearchParams({
      q: query.trim(),
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await this.makeRequest(`/api/foods/search?${params}`);

    if (response.success) {
      return this.transformSearchResponse(response);
    } else {
      throw new Error('Food search failed');
    }
  }

  /**
   * Get detailed food information
   *
   * @param {string} foodId - FatSecret food ID
   * @returns {Promise<Object>} Detailed food information
   */
  async getFoodDetails(foodId) {
    const response = await this.makeRequest(`/foods/details/${foodId}`);

    if (response.success) {
      return response.data;
    } else {
      throw new Error('Failed to get food details');
    }
  }

  /**
   * Get food categories
   *
   * @returns {Promise<Array>} List of food categories
   */
  async getFoodCategories() {
    const response = await this.makeRequest('/api/foods/categories');

    if (response.success) {
      return response.data;
    } else {
      throw new Error('Failed to get food categories');
    }
  }

  /**
   * Get food image URL for a specific food
   *
   * @param {string} foodId - FatSecret food ID
   * @returns {Promise<string|null>} Food image URL or null if not available
   */
  async getFoodImage(foodId) {
    try {
      const response = await this.makeRequest(`/api/foods/image/${foodId}`);
      return response.image_url;
    } catch (error) {
      console.warn(`Failed to get image for food ${foodId}:`, error);
      return null;
    }
  }

  /**
   * Health check for backend connection
   *
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    return await this.makeRequest('/api/foods/health');
  }

  /**
   * Authentication Methods
   */

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Login response with token
   */
  async login(email, password) {
    return await this.makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  /**
   * Register new user
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} displayName - User display name
   * @returns {Promise<Object>} Registration response with token
   */
  async register(email, password, displayName) {
    return await this.makeRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, display_name: displayName }),
    });
  }

  /**
   * Get current user info
   * @param {string} token - Auth token
   * @returns {Promise<Object>} User information
   */
  async me(token) {
    return await this.makeRequest('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  /**
   * Search for food by barcode
   * @param {string} barcode - 13-digit barcode
   * @returns {Promise<Object>} Food information or error
   */
  async searchFoodByBarcode(barcode) {
    if (!barcode || barcode.trim().length < 8) {
      throw new Error('Invalid barcode format');
    }

    try {
      const response = await this.makeRequest(`/api/foods/barcode/${barcode.trim()}`);

      // Handle successful response with food data
      if (response && response.success && response.food) {
        return {
          success: true,
          food: this.transformFoodItem(response.food),
          barcode: response.barcode || barcode
        };
      }
      // Handle failed response (food not found)
      else if (response && response.success === false) {
        return {
          success: false,
          error: response.error || 'Food not found for this barcode',
          barcode: response.barcode || barcode
        };
      }
      // Handle unexpected response format
      else {
        return {
          success: false,
          error: 'Unexpected response format from server',
          barcode: barcode
        };
      }
    } catch (error) {
      // Handle network or other errors
      console.error('Barcode search API error:', error);
      return {
        success: false,
        error: 'Network error occurred while searching for barcode',
        barcode: barcode
      };
    }
  }

  /**
   * Transform search response to match frontend expectations
   */
  transformSearchResponse(data) {
    return {
      foods: (data.foods || []).map(food => this.transformFoodItem(food)),
      totalResults: data.total_results || 0,
      pageNumber: data.page_number || 0,
    };
  }

  /**
   * Transform food item to match frontend format
   */
  transformFoodItem(food) {
    if (!food) {
      throw new Error('Food data is required');
    }

    return {
      id: food.id || 'unknown',
      name: food.name || 'Unknown Food',
      brand: food.brand || 'Unknown Brand',
      category: food.category || 'general',
      calories: Number(food.calories) || 0,
      protein: Number(food.protein) || 0,
      carbs: Number(food.carbs) || 0,
      fat: Number(food.fat) || 0,
      fiber: Number(food.fiber) || 0,
      sugar: Number(food.sugar) || 0,
      servingSize: food.serving_size || '1 serving',
      servingUnit: food.serving_unit || 'serving',
      verified: Boolean(food.verified),
      fatSecretId: food.fatsecret_id || null,
      serving: food.serving || null, // Include the serving data with serving_id
    };
  }

  // ============ WORKOUT API METHODS ============

  /**
   * Start a new workout session
   * @param {string} workoutType - Type of workout (e.g., 'run')
   * @param {number} startTimeMs - Start timestamp in milliseconds
   * @param {string} token - Auth token (optional, for authenticated users)
   * @returns {Promise<Object>} Workout session response
   */
  async startWorkout(workoutType = 'run', startTimeMs = Date.now(), token = null) {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return await this.makeRequest('/api/workouts/start', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        workout_type: workoutType,
        start_time_ms: startTimeMs,
      }),
    });
  }

  /**
   * Add GPS points to an active workout session
   * @param {string} sessionId - Workout session ID
   * @param {Array} points - Array of GPS points with lat, lng, t_ms
   * @param {string} token - Auth token (optional, for authenticated users)
   * @returns {Promise<Object>} Response with added points count
   */
  async addWorkoutPoints(sessionId, points, token = null) {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return await this.makeRequest('/api/workouts/add-points', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        session_id: sessionId,
        points: points,
      }),
    });
  }

  /**
   * Finish a workout session
   * @param {string} sessionId - Workout session ID
   * @param {number} endTimeMs - End timestamp in milliseconds
   * @param {string} token - Auth token (optional, for authenticated users)
   * @returns {Promise<Object>} Final workout session data
   */
  async finishWorkout(sessionId, endTimeMs = Date.now(), token = null) {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return await this.makeRequest('/api/workouts/finish', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        session_id: sessionId,
        end_time_ms: endTimeMs,
      }),
    });
  }

  /**
   * Get all workout sessions for the current user
   * @returns {Promise<Array>} List of workout sessions
   */
  async getWorkouts() {
    return await this.makeRequest('/api/workouts/');
  }

  /**
   * Get a specific workout session by ID
   * @param {string} sessionId - Workout session ID
   * @returns {Promise<Object>} Workout session details
   */
  async getWorkout(sessionId) {
    return await this.makeRequest(`/api/workouts/${sessionId}`);
  }

  // ============ MEALS API METHODS ============

  /**
   * Log a meal/food item
   * @param {string} mealType - Meal type (breakfast, lunch, dinner, snacks)
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {Object} foodData - Food item data with nutrition info
   * @param {string} token - Auth token (optional, for authenticated users)
   * @returns {Promise<Object>} Logged meal entry
   */
  async logMeal(mealType, date, foodData, token = null) {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return await this.makeRequest('/api/meals/log', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        meal_type: mealType,
        date: date,
        food: {
          name: foodData.name,
          brand: foodData.brand || null,
          fatsecret_id: foodData.fatsecret_id || null,
          calories: foodData.calories || 0,
          protein: foodData.protein || 0,
          carbs: foodData.carbs || 0,
          fat: foodData.fat || 0,
          fiber: foodData.fiber || 0,
          sugar: foodData.sugar || 0,
          saturated_fat: foodData.saturated_fat || 0,
          sodium: foodData.sodium || 0,
          cholesterol: foodData.cholesterol || 0,
          potassium: foodData.potassium || 0,
          serving_amount: foodData.servingAmount || 100,
          serving_unit: foodData.measurementMode === 'gram' ? 'g' : 'serving',
          measurement_mode: foodData.measurementMode || 'gram',
        },
      }),
    });
  }

  /**
   * Get all meals for a specific date
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {string} token - Auth token (optional, for authenticated users)
   * @returns {Promise<Object>} Daily nutrition summary with meals
   */
  async getDailyMeals(date, token = null) {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return await this.makeRequest(`/api/meals/daily/${date}`, {
      headers,
    });
  }

  /**
   * Delete a logged meal
   * @param {string} mealId - Meal entry ID
   * @param {string} token - Auth token (optional, for authenticated users)
   * @returns {Promise<Object>} Success confirmation
   */
  async deleteMeal(mealId, token = null) {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return await this.makeRequest(`/api/meals/${mealId}`, {
      method: 'DELETE',
      headers,
    });
  }
}

// Create singleton instance
const backendApi = new BackendApiService();

export default backendApi;