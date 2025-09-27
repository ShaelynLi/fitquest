/**
 * Backend API Service
 *
 * Handles API calls to our own FastAPI backend which proxies FatSecret requests.
 * This approach solves IP whitelisting issues and provides better security.
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Backend API Configuration
// For physical device testing, use your computer's local IP address
const getBackendUrl = () => {
  if (__DEV__) {
    // Debug: Log backend detection (reduced logging)
    console.log('=== Backend Detection ===');
    console.log('debuggerHost:', Constants.debuggerHost);
    console.log('hostUri:', Constants.hostUri);
    console.log('Platform.OS:', Platform.OS);
    console.log('=========================');
    
    // Try to detect if running in Expo Go (physical device) vs simulator
    // Use the newer Constants.expoConfig for Expo SDK 46+
    const expoConfig = Constants.expoConfig || Constants.manifest;
    const manifest2 = Constants.manifest2;
    
    // Try multiple methods to detect the development server IP
    let debuggerHost = null;
    
    if (manifest2?.extra?.expoGo?.debuggerHost) {
      debuggerHost = manifest2.extra.expoGo.debuggerHost;
    } else if (expoConfig?.debuggerHost) {
      debuggerHost = expoConfig.debuggerHost;
    } else if (Constants.debuggerHost) {
      debuggerHost = Constants.debuggerHost;
    }

    if (debuggerHost) {
      // Extract IP from debuggerHost (works for Expo Go)
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
      return 'http://localhost:8000';
    } else {
      // Android emulator uses 10.0.2.2 to reach host machine
      console.log('Using Android emulator localhost');
      return 'http://10.0.2.2:8000';
    }
  }

  // Production
  return 'https://your-production-backend.com';
};

const BACKEND_BASE_URL = getBackendUrl();
console.log('Backend URL:', BACKEND_BASE_URL);

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
        ...options.headers,
      },
    };

    const requestOptions = { ...defaultOptions, ...options };

    try {
      console.log('Backend API request:', url);
      console.log('Base URL:', this.baseUrl);

      const response = await fetch(url, requestOptions);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Backend API response:', data);

      return data;
    } catch (error) {
      console.error('Backend API request failed:', error);
      throw error;
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

    const response = await this.makeRequest(`/foods/search?${params}`);

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
    const response = await this.makeRequest('/foods/categories');

    if (response.success) {
      return response.data;
    } else {
      throw new Error('Failed to get food categories');
    }
  }

  /**
   * Health check for backend connection
   *
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    return await this.makeRequest('/foods/health');
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
    return await this.makeRequest('/auth/login', {
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
    return await this.makeRequest('/auth/register', {
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
    return await this.makeRequest('/auth/me', {
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
      const response = await this.makeRequest(`/foods/barcode/${barcode.trim()}`);

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
    };
  }
}

// Create singleton instance
const backendApi = new BackendApiService();

export default backendApi;