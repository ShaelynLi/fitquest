/**
 * Backend API Service
 *
 * Handles API calls to our own FastAPI backend which proxies FatSecret requests.
 * This approach solves IP whitelisting issues and provides better security.
 */

// Backend API Configuration
const BACKEND_BASE_URL = __DEV__
  ? 'http://localhost:8000'  // Development: FastAPI default port
  : 'https://your-production-backend.com';  // Production: Replace with your deployed backend URL

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
}

// Create singleton instance
const backendApi = new BackendApiService();

export default backendApi;