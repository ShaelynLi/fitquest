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
    this.tokenRefreshCallback = null;
  }

  /**
   * Set callback for token refresh (called by AuthContext)
   */
  setTokenRefreshCallback(callback) {
    this.tokenRefreshCallback = callback;
  }

  /**
   * Make API request to backend with automatic token refresh on 401
   */
  async makeRequest(endpoint, options = {}, retryCount = 0) {
    const url = `${this.baseUrl}${endpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    };

    const requestOptions = {
      method: options.method || 'GET',
      headers,
      ...options,
      timeout: 15000,
    };

    // Remove headers from options to avoid duplication
    delete requestOptions.headers;
    requestOptions.headers = headers;

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
        
        // Handle 401 Unauthorized - token expired
        if (response.status === 401 && retryCount === 0 && this.tokenRefreshCallback) {
          console.log('🔄 Token expired, attempting to refresh...');
          try {
            // Get fresh token from callback
            const freshToken = await this.tokenRefreshCallback();
            
            if (freshToken) {
              console.log('✅ Got fresh token, retrying request...');
              // Retry the request with fresh token
              const newOptions = {
                ...options,
                headers: {
                  ...options.headers,
                  'Authorization': `Bearer ${freshToken}`,
                },
              };
              return await this.makeRequest(endpoint, newOptions, retryCount + 1);
            }
          } catch (refreshError) {
            console.error('❌ Token refresh failed:', refreshError);
            // Fall through to throw the original 401 error
          }
        }
        
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
   * Resend verification email
   * @param {string} token - Auth token
   * @returns {Promise<Object>} Resend response
   */
  async resendVerificationEmail(token) {
    return await this.makeRequest('/api/auth/resend-verification', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  /**
   * Check email verification status
   * @param {string} email - User email
   * @returns {Promise<Object>} Verification status
   */
  async checkVerificationStatus(email) {
    return await this.makeRequest('/api/auth/check-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
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
   * Start a new workout session (DEPRECATED - use completeWorkout instead)
   * @param {string} workoutType - Type of workout (e.g., 'run')
   * @param {number} startTimeMs - Start timestamp in milliseconds
   * @param {string} token - Auth token (optional, for authenticated users)
   * @returns {Promise<Object>} Workout session response
   */
  async startWorkout(workoutType = 'run', startTimeMs = Date.now(), token = null) {
    console.warn('⚠️ startWorkout is deprecated. Use completeWorkout instead.');
    // This method is kept for backward compatibility but should not be used
    return { success: false, message: 'startWorkout is deprecated. Use completeWorkout instead.' };
  }

  /**
   * Add GPS points to an active workout session with retry mechanism
   * @param {string} sessionId - Workout session ID
   * @param {Array} points - Array of GPS points with lat, lng, t_ms
   * @param {string} token - Auth token (optional, for authenticated users)
   * @returns {Promise<Object>} Response with added points count
   */
  async addWorkoutPoints(sessionId, points, token = null) {
    console.warn('⚠️ addWorkoutPoints is deprecated. Use completeWorkout instead.');
    // This method is kept for backward compatibility but should not be used
    return { success: false, message: 'addWorkoutPoints is deprecated. Use completeWorkout instead.' };
  }

  /**
   * Complete a workout session with full data from frontend
   * @param {Object} workoutData - Complete workout data
   * @param {string} token - Auth token (optional, for authenticated users)
   * @returns {Promise<Object>} Completion response
   */
  async completeWorkout(workoutData, token = null) {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const requestData = {
      method: 'POST',
      headers,
      body: JSON.stringify(workoutData),
    };

    // Retry mechanism for workout completion
    const maxRetries = 3;
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🏁 Attempting to complete workout (attempt ${attempt}/${maxRetries})`);
        console.log(`📊 Workout data: ${workoutData.workout_type}, GPS points: ${workoutData.gps_points?.length || 0}`);
        const result = await this.makeRequest('/api/workouts/complete', requestData);
        console.log(`✅ Workout completed successfully on attempt ${attempt}`);
        return result;
      } catch (error) {
        lastError = error;
        console.log(`❌ Workout completion failed on attempt ${attempt}:`, error.message);
        
        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    console.error(`❌ Workout completion failed after ${maxRetries} attempts`);
    throw lastError;
  }

  /**
   * Finish a workout session with retry mechanism (legacy method)
   * @param {string} sessionId - Workout session ID
   * @param {number} endTimeMs - End timestamp in milliseconds
   * @param {string} token - Auth token (optional, for authenticated users)
   * @returns {Promise<Object>} Final workout session data
   */
  async finishWorkout(sessionId, endTimeMs = Date.now(), token = null) {
    console.warn('⚠️ finishWorkout is deprecated. Use completeWorkout instead.');
    // This method is kept for backward compatibility but should not be used
    return { success: false, message: 'finishWorkout is deprecated. Use completeWorkout instead.' };
  }

  /**
   * Get all workout sessions for the current user
   * @param {string} token - Auth token
   * @returns {Promise<Object>} List of workout sessions
   */
  async getWorkouts(token = null) {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Retry mechanism for getting workouts
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`🏃 Getting workouts (attempt ${attempt}/3)...`);
        const response = await this.makeRequest('/api/workouts/', {
          method: 'GET',
          headers,
        });
        console.log('✅ Workouts retrieved successfully');
        return response;
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ Get workouts attempt ${attempt} failed:`, error.message);
        
        if (attempt < 3) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    console.error('❌ Get workouts failed after 3 attempts');
    throw lastError;
  }

  /**
   * Get a specific workout session by ID
   * @param {string} sessionId - Workout session ID
   * @param {string} token - Auth token
   * @returns {Promise<Object>} Workout session details
   */
  async getWorkout(sessionId, token = null) {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return await this.makeRequest(`/api/workouts/${sessionId}`, {
      method: 'GET',
      headers,
    });
  }

  /**
   * Get activities for a specific date
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {string} token - Auth token
   * @returns {Promise<Object>} Activities for the date
   */
  async getActivitiesForDate(date, token = null) {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Retry mechanism for getting activities
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`📅 Getting activities for ${date} (attempt ${attempt}/3)...`);
        const response = await this.makeRequest(`/api/workouts/activities/${date}`, {
          method: 'GET',
          headers,
        });
        console.log('✅ Activities retrieved successfully');
        return response;
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ Get activities attempt ${attempt} failed:`, error.message);
        
        if (attempt < 3) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    console.error('❌ Get activities failed after 3 attempts');
    throw lastError;
  }

  /**
   * Complete user onboarding
   * @param {Object} userData - Complete user onboarding data
   * @returns {Promise<Object>} Onboarding response
   */
  async completeOnboarding(userData) {
    return await this.makeRequest('/api/users/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  /**
   * Update user profile
   * @param {string} token - Auth token
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} Update response
   */
  async updateUserProfile(token, profileData) {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return await this.makeRequest('/api/users/update_profile', {
      method: 'PATCH',
      headers,
      body: JSON.stringify(profileData),
    });
  }

  /**
   * Get daily goal progress (for pet mood)
   * @param {string} token - Auth token
   * @returns {Promise<Object>} Daily progress response with pet mood
   */
  async getDailyProgress(token) {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Retry mechanism for getting daily progress
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`📊 Getting daily progress (attempt ${attempt}/3)...`);
        const response = await this.makeRequest('/api/users/daily-progress', {
          method: 'GET',
          headers,
        });
        console.log('✅ Daily progress retrieved successfully');
        return response;
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ Get daily progress attempt ${attempt} failed:`, error.message);
        
        if (attempt < 3) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    console.error('❌ Get daily progress failed after 3 attempts');
    throw lastError;
  }

  // ============ FOOD LOGGING API METHODS ============

  /**
   * Log a food item for the current user
   * @param {Object} foodData - Food data to log
   * @param {string} token - Auth token
   * @returns {Promise<Object>} Log response
   */
  async logFood(foodData, token) {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Retry mechanism for food logging
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`🍎 Logging food (attempt ${attempt}/3)...`);
        const response = await this.makeRequest('/api/foods/log', {
          method: 'POST',
          headers,
          body: JSON.stringify(foodData),
        });
        console.log('✅ Food logged successfully');
        return response;
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ Food logging attempt ${attempt} failed:`, error.message);
        
        if (attempt < 3) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    console.error('❌ Food logging failed after 3 attempts');
    throw lastError;
  }


  /**
   * Get meals for a specific date (using foods endpoint)
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {string} token - Auth token
   * @returns {Promise<Object>} Meals response
   */
  async getMeals(date, token) {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Retry mechanism for getting meals
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`📋 Getting meals for ${date} (attempt ${attempt}/3)...`);
        const response = await this.makeRequest(`/api/foods/logs?target_date=${date}`, {
          method: 'GET',
          headers,
        });
        console.log('✅ Meals retrieved successfully');
        return response;
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ Get meals attempt ${attempt} failed:`, error.message);
        
        if (attempt < 3) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    console.error('❌ Get meals failed after 3 attempts');
    throw lastError;
  }

  /**
   * Get daily nutrition summary
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {string} token - Auth token
   * @returns {Promise<Object>} Nutrition summary response
   */
  async getNutritionSummary(date, token) {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return await this.makeRequest(`/api/meals/nutrition?date=${date}`, {
      method: 'GET',
      headers,
    });
  }

  /**
   * Delete a meal entry
   * @param {string} mealId - ID of the meal to delete
   * @param {string} token - Auth token
   * @returns {Promise<Object>} Delete response
   */
  async deleteMeal(mealId, token) {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return await this.makeRequest(`/api/meals/${mealId}`, {
      method: 'DELETE',
      headers,
    });
  }

  /**
   * Get food logs for the current user
   * @param {string} targetDate - Optional date filter (YYYY-MM-DD)
   * @param {string} token - Auth token
   * @returns {Promise<Object>} Food logs response
   */
  async getFoodLogs(targetDate = null, token) {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = targetDate 
      ? `/api/foods/logs?target_date=${targetDate}`
      : '/api/foods/logs';

    return await this.makeRequest(url, {
      method: 'GET',
      headers,
    });
  }

  /**
   * Delete a food log entry
   * @param {string} logId - Food log ID to delete
   * @param {string} token - Auth token
   * @returns {Promise<Object>} Delete response
   */
  async deleteFoodLog(logId, token) {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return await this.makeRequest(`/api/foods/logs/${logId}`, {
      method: 'DELETE',
      headers,
    });
  }

  /**
   * Get nutrition summary for a date range
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @param {string} token - Auth token
   * @returns {Promise<Object>} Nutrition summary
   */
  async getNutritionSummary(startDate = null, endDate = null, token) {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let url = '/api/foods/nutrition-summary';
    const params = [];
    if (startDate) params.push(`start_date=${startDate}`);
    if (endDate) params.push(`end_date=${endDate}`);
    if (params.length > 0) url += `?${params.join('&')}`;

    return await this.makeRequest(url, {
      method: 'GET',
      headers,
    });
  }

  // ============ PET COLLECTION API METHODS ============

  /**
   * Get user's pet collection
   * @param {string} token - Auth token
   * @returns {Promise<Object>} Pet collection response with list of pet IDs
   */
  async getUserPets(token) {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Retry mechanism for getting pets
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`🐾 Getting user pets (attempt ${attempt}/3)...`);
        const response = await this.makeRequest('/api/pets/', {
          method: 'GET',
          headers,
        });
        console.log('✅ User pets retrieved successfully');
        return response;
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ Get pets attempt ${attempt} failed:`, error.message);
        
        if (attempt < 3) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    console.error('❌ Get pets failed after 3 attempts');
    throw lastError;
  }

  /**
   * Update user's complete pet collection
   * @param {Array<string>} pets - Array of pet IDs
   * @param {string} token - Auth token
   * @returns {Promise<Object>} Update response
   */
  async updateUserPets(pets, token) {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Retry mechanism for updating pets
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`🐾 Updating user pets (attempt ${attempt}/3)...`);
        const response = await this.makeRequest('/api/pets/', {
          method: 'POST',
          headers,
          body: JSON.stringify({ pets }),
        });
        console.log('✅ User pets updated successfully');
        return response;
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ Update pets attempt ${attempt} failed:`, error.message);
        
        if (attempt < 3) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    console.error('❌ Update pets failed after 3 attempts');
    throw lastError;
  }

  /**
   * Add a single pet to user's collection
   * @param {string} petId - Pet ID to add
   * @param {string} token - Auth token
   * @returns {Promise<Object>} Update response
   */
  async addPetToCollection(petId, token) {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Retry mechanism for adding pet
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`🎁 Adding pet ${petId} (attempt ${attempt}/3)...`);
        const response = await this.makeRequest('/api/pets/add', {
          method: 'POST',
          headers,
          body: JSON.stringify({ pet_id: petId }),
        });
        console.log('✅ Pet added successfully');
        return response;
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ Add pet attempt ${attempt} failed:`, error.message);
        
        if (attempt < 3) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    console.error('❌ Add pet failed after 3 attempts');
    throw lastError;
  }

  /**
   * Remove a pet from user's collection
   * @param {string} petId - Pet ID to remove
   * @param {string} token - Auth token
   * @returns {Promise<Object>} Update response
   */
  async removePetFromCollection(petId, token) {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return await this.makeRequest(`/api/pets/${petId}`, {
      method: 'DELETE',
      headers,
    });
  }
}

// Create singleton instance
const backendApi = new BackendApiService();

export default backendApi;