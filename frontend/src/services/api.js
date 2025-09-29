/**
 * Backend API Service
 *
 * Handles API calls to our own FastAPI backend which proxies FatSecret requests.
 * This approach solves IP whitelisting issues and provides better security.
 */

// Backend API Configuration
// 在移动设备上测试时，即使在开发模式也使用生产API
const BACKEND_BASE_URL = __DEV__
  ? 'https://comp90018-t8-g2.web.app'  // Development: Use production API for mobile testing
  : 'https://comp90018-t8-g2.web.app';  // Production: Firebase Hosting with reverse proxy

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
   * Search for food by barcode
   *
   * @param {string} barcode - Barcode to search for
   * @returns {Promise<Object>} Search result with food information
   */
  async searchFoodByBarcode(barcode) {
    if (!barcode || barcode.trim().length < 8) {
      throw new Error('Invalid barcode format');
    }

    const response = await this.makeRequest(`/foods/barcode/${barcode.trim()}`);
    return response;
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

    const response = await this.makeRequest(`/foods/barcode/${barcode.trim()}`);

    if (response.success) {
      return {
        success: true,
        food: this.transformFoodItem(response.food),
        barcode: response.barcode
      };
    } else {
      return {
        success: false,
        error: response.error,
        barcode: response.barcode
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
    return {
      id: food.id,
      name: food.name,
      brand: food.brand,
      category: food.category,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      fiber: food.fiber,
      sugar: food.sugar,
      servingSize: food.serving_size,
      servingUnit: food.serving_unit,
      verified: food.verified,
      fatSecretId: food.fatsecret_id,
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
}

// Create singleton instance
const backendApi = new BackendApiService();

export default backendApi;