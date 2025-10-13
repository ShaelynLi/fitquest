"""
FatSecret API Service for Backend

Handles OAuth 2.0 authentication and food search requests to FatSecret Platform API.
This service runs on the backend server where IP restrictions can be managed properly.
"""

import httpx
import base64
import time
from typing import Dict, List, Optional, Any
from app.core.settings import settings


class FatSecretService:
    def __init__(self):
        self.access_token: Optional[str] = None
        self.token_expiry: float = 0
        self.client_id = settings.FATSECRET_CLIENT_ID
        self.client_secret = settings.FATSECRET_CLIENT_SECRET
        self.base_url = "https://platform.fatsecret.com/rest/foods/search/v3"
        self.token_url = "https://oauth.fatsecret.com/connect/token"

        if not self.client_id or not self.client_secret:
            print("Warning: FatSecret API credentials not configured. Food search will be unavailable.")
            self.enabled = False
        else:
            self.enabled = True

    async def _authenticate(self) -> str:
        """Obtain OAuth 2.0 access token"""
        credentials = base64.b64encode(
            f"{self.client_id}:{self.client_secret}".encode()
        ).decode()

        headers = {
            "Authorization": f"Basic {credentials}",
            "Content-Type": "application/x-www-form-urlencoded",
        }

        data = "grant_type=client_credentials"

        async with httpx.AsyncClient() as client:
            response = await client.post(self.token_url, headers=headers, data=data)
            response.raise_for_status()

            token_data = response.json()
            self.access_token = token_data["access_token"]
            # Set expiry with 5-minute buffer
            self.token_expiry = time.time() + token_data.get("expires_in", 3600) - 300

            return self.access_token

    async def _ensure_valid_token(self) -> str:
        """Ensure we have a valid access token"""
        if not self.access_token or time.time() >= self.token_expiry:
            await self._authenticate()
        return self.access_token

    async def _make_request(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Make authenticated request to FatSecret API"""
        await self._ensure_valid_token()

        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient() as client:
            response = await client.get(self.base_url, headers=headers, params=params)
            response.raise_for_status()

            json_response = response.json()

            # Print the raw response for debugging
            print("=" * 80)
            print("🔍 RAW FATSECRET API RESPONSE:")
            print("=" * 80)
            import json
            print(json.dumps(json_response, indent=2))
            print("=" * 80)

            # Check for FatSecret API errors
            if "error" in json_response:
                error_code = json_response["error"].get("code")
                error_message = json_response["error"].get("message", "Unknown error")
                raise Exception(f"FatSecret API Error {error_code}: {error_message}")

            return json_response

    async def search_foods(
        self,
        query: str,
        page_number: int = 0,
        max_results: int = 20
    ) -> Dict[str, Any]:
        """
        Search for foods using FatSecret API

        Args:
            query: Search term for foods
            page_number: Page number for pagination (0-based)
            max_results: Maximum results per page

        Returns:
            Dictionary containing search results and metadata
        """
        if not self.enabled:
            return {
                "foods": {"food": []},
                "error": "FatSecret API not configured"
            }
            
        if not query or len(query.strip()) < 2:
            return {"foods": [], "total_results": 0, "page_number": 0}

        params = {
            "search_expression": query.strip(),
            "page_number": page_number,
            "max_results": max_results,
            "format": "json",
        }

        response = await self._make_request(params)
        return self._transform_search_response(response)

    async def search_food_by_barcode(self, barcode: str) -> Dict[str, Any]:
        """
        Search for food by barcode using FatSecret API

        Args:
            barcode: 13-digit GTIN-13 barcode

        Returns:
            Dictionary containing food_id if found, None if not found
        """
        # Reduced logging to prevent duplicates

        if not barcode or len(barcode.strip()) < 8:
            return {
                "food_id": None, 
                "error": "Invalid barcode format",
                "success": False,
                "barcode": barcode
            }

        # Use the correct FatSecret API endpoint with method parameter
        barcode_url = "https://platform.fatsecret.com/rest/server.api"
        await self._ensure_valid_token()

        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
        }

        params = {
            "method": "food.find_id_for_barcode",
            "barcode": barcode.strip(),
            "format": "json",
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(barcode_url, headers=headers, params=params)
                response.raise_for_status()
                json_response = response.json()

                # Debug: Log successful response

                # Check for FatSecret API errors
                if "error" in json_response:
                    error_data = json_response["error"]
                    error_code = error_data.get("code", "unknown") if isinstance(error_data, dict) else "unknown"
                    error_message = error_data.get("message", "Unknown error") if isinstance(error_data, dict) else str(error_data)
                    print(f"FatSecret API Error: {error_code} - {error_message}")

                    # Handle specific error codes that indicate "not found"
                    if error_code in ["2", "3", "4"]:  # Common FatSecret "not found" error codes
                        return {
                            "food_id": None, 
                            "error": "This barcode is not in our food database",
                            "success": False,
                            "barcode": barcode
                        }
                    else:
                        return {
                            "food_id": None, 
                            "error": f"Food database error: {error_message}",
                            "success": False,
                            "barcode": barcode
                        }

                # Extract food_id from response - FatSecret might return different formats
                food_id = None
                if "food_id" in json_response:
                    food_id_data = json_response["food_id"]
                    if isinstance(food_id_data, dict):
                        food_id = food_id_data.get("value")
                    else:
                        food_id = food_id_data
                elif "food" in json_response:
                    # Sometimes the response might contain food data directly
                    food_data = json_response["food"]
                    if isinstance(food_data, dict):
                        food_id = food_data.get("food_id")

                # Extracted food_id for processing

                if food_id:
                    # Get detailed food information using the food_id
                    food_details = await self.get_food_details(str(food_id))
                    return {
                        "food_id": food_id, 
                        "food": food_details,
                        "success": True,
                        "barcode": barcode
                    }
                else:
                    # No error but no food_id means the barcode wasn't found
                    return {
                        "food_id": None, 
                        "error": "This barcode is not in our food database",
                        "success": False,
                        "barcode": barcode
                    }

            except httpx.HTTPStatusError as e:
                print(f"HTTP Status Error: {e.response.status_code}")
                if e.response.status_code == 404:
                    return {
                        "food_id": None, 
                        "error": "This barcode is not in our food database",
                        "success": False,
                        "barcode": barcode
                    }
                elif e.response.status_code == 400:
                    return {
                        "food_id": None, 
                        "error": "Invalid barcode format",
                        "success": False,
                        "barcode": barcode
                    }
                else:
                    return {
                        "food_id": None, 
                        "error": "Food database temporarily unavailable",
                        "success": False,
                        "barcode": barcode
                    }
            except Exception as e:
                print(f"Exception in barcode search: {type(e).__name__}: {str(e)}")
                return {
                    "food_id": None, 
                    "error": "Food database temporarily unavailable",
                    "success": False,
                    "barcode": barcode
                }

    async def get_food_details(self, food_id: str) -> Dict[str, Any]:
        """Get detailed information for a specific food"""
        # Use the method-based endpoint for food details
        detail_url = "https://platform.fatsecret.com/rest/server.api"
        await self._ensure_valid_token()

        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
        }

        params = {
            "method": "food.get",
            "food_id": food_id,
            "format": "json",
        }

        async with httpx.AsyncClient() as client:
            response = await client.get(detail_url, headers=headers, params=params)
            response.raise_for_status()
            json_response = response.json()

            # Check for FatSecret API errors
            if "error" in json_response:
                error_code = json_response["error"].get("code")
                error_message = json_response["error"].get("message", "Unknown error")
                raise Exception(f"FatSecret API Error {error_code}: {error_message}")

            return self._transform_food_details(json_response)

    async def get_food_image(self, food_id: str) -> Optional[str]:
        """Get food image URL for a specific food ID"""
        try:
            food_details = await self.get_food_details(food_id)
            image_url = food_details.get("image_url")
            return image_url
        except Exception as e:
            return None

    def _transform_search_response(self, response: Dict[str, Any]) -> Dict[str, Any]:
        """Transform FatSecret search response to our app format"""
        if not response:
            return {"foods": [], "total_results": 0, "page_number": 0}
            
        foods_search = response.get("foods_search", {})
        if not foods_search:
            return {"foods": [], "total_results": 0, "page_number": 0}
            
        results = foods_search.get("results", {})
        food_list = results.get("food", [])

        # Handle single food result (not in array)
        if isinstance(food_list, dict):
            food_list = [food_list]
        elif not isinstance(food_list, list):
            food_list = []


        transformed_foods = [self._transform_food_item(food) for food in food_list]

        # Safely convert to int, handling None values
        total_results = foods_search.get("total_results", 0)
        page_number = foods_search.get("page_number", 0)
        
        try:
            total_results = int(total_results) if total_results is not None else 0
        except (ValueError, TypeError):
            total_results = 0
            
        try:
            page_number = int(page_number) if page_number is not None else 0
        except (ValueError, TypeError):
            page_number = 0

        return {
            "foods": transformed_foods,
            "total_results": total_results,
            "page_number": page_number,
        }

    def _transform_food_item(self, food: Dict[str, Any]) -> Dict[str, Any]:
        """Transform individual food item from v3 API to our app format"""
        # Extract basic food information
        food_name = food.get("food_name", "Unknown Food")
        food_id = str(food.get("food_id", ""))

        # Extract brand information from food name
        brand_match = food_name.split(", ")
        if len(brand_match) >= 2:
            name = brand_match[0].strip()
            brand = brand_match[1].strip()
        else:
            name = food_name
            brand = "Generic"

        # Get all serving options
        servings = food.get("servings", {})
        serving_list = servings.get("serving", [])

        # Handle single serving (not in array)
        if isinstance(serving_list, dict):
            serving_list = [serving_list]
        elif not isinstance(serving_list, list):
            serving_list = []

        # Find the best serving to use (prefer 100g, then any gram-based serving, then first)
        best_serving = None
        hundred_gram_serving = None
        gram_servings = []
        
        for serving in serving_list:
            metric_amount = float(serving.get("metric_serving_amount", 0))
            metric_unit = serving.get("metric_serving_unit", "").lower()
            
            if metric_unit == "g":
                if metric_amount == 100:
                    hundred_gram_serving = serving
                else:
                    gram_servings.append(serving)
        
        # Choose the best serving: 100g > any gram serving > first serving
        if hundred_gram_serving:
            best_serving = hundred_gram_serving
        elif gram_servings:
            best_serving = gram_servings[0]
        elif serving_list:
            best_serving = serving_list[0]
        
        # Transform the best serving
        if best_serving:
            serving_data = {
                "serving_id": best_serving.get("serving_id"),
                "description": best_serving.get("serving_description", "1 serving"),
                "metric_amount": float(best_serving.get("metric_serving_amount", 100)),
                "metric_unit": best_serving.get("metric_serving_unit", "g"),
                "number_of_units": float(best_serving.get("number_of_units", 1)),
                "measurement_description": best_serving.get("measurement_description", "serving"),
                "calories": float(best_serving.get("calories", 0)),
                "protein": float(best_serving.get("protein", 0)),
                "carbs": float(best_serving.get("carbohydrate", 0)),
                "fat": float(best_serving.get("fat", 0)),
                "fiber": float(best_serving.get("fiber", 0)),
                "sugar": float(best_serving.get("sugar", 0)),
                "saturated_fat": float(best_serving.get("saturated_fat", 0)),
                "sodium": float(best_serving.get("sodium", 0)),
                "cholesterol": float(best_serving.get("cholesterol", 0)),
                "potassium": float(best_serving.get("potassium", 0)),
            }
            
            # Use the best serving for primary nutrition data
            calories = serving_data["calories"]
            protein = serving_data["protein"]
            carbs = serving_data["carbs"]
            fat = serving_data["fat"]
            fiber = serving_data["fiber"]
            sugar = serving_data["sugar"]
            serving_desc = serving_data["description"]
        else:
            # Fallback if no servings available
            serving_data = {
                "serving_id": None,
                "description": "100g",
                "metric_amount": 100.0,
                "metric_unit": "g",
                "number_of_units": 1.0,
                "measurement_description": "100 grams",
                "calories": 0.0,
                "protein": 0.0,
                "carbs": 0.0,
                "fat": 0.0,
                "fiber": 0.0,
                "sugar": 0.0,
                "saturated_fat": 0.0,
                "sodium": 0.0,
                "cholesterol": 0.0,
                "potassium": 0.0,
            }
            calories = protein = carbs = fat = fiber = sugar = 0.0
            serving_desc = "100g"

        # Get food images if available
        food_images = food.get("food_images", {})
        image_list = food_images.get("food_image", [])
        if isinstance(image_list, dict):
            image_list = [image_list]
        
        # Get the first available image (image_type "1" is the standard image)
        food_image_url = None
        for img in image_list:
            if img.get("image_type") == "1":  # "1" is the standard image type
                food_image_url = img.get("image_url")
                break
        
        # If no type "1" image, get any available image
        if not food_image_url and image_list:
            food_image_url = image_list[0].get("image_url")

        return {
            "id": food_id,
            "name": name,
            "brand": brand,
            "category": self._categorize_food(food_name),
            "calories": calories,
            "protein": protein,
            "carbs": carbs,
            "fat": fat,
            "fiber": fiber,
            "sugar": sugar,
            "serving_size": serving_desc,
            "serving_unit": "grams",
            "verified": True,
            "fatsecret_id": food.get("food_id"),
            "food_type": food.get("food_type", "Generic"),
            "food_url": food.get("food_url"),
            "image_url": food_image_url,
            "serving": serving_data,  # Single best serving
        }


    def _categorize_food(self, food_name: str) -> str:
        """Categorize food based on name patterns"""
        name = food_name.lower()

        # Category mapping
        categories = {
            "fruits": [
                "fruit", "apple", "banana", "orange", "grape", "berry",
                "melon", "peach", "pear", "plum", "cherry", "strawberry"
            ],
            "vegetables": [
                "vegetable", "carrot", "broccoli", "spinach", "tomato",
                "pepper", "onion", "lettuce", "corn", "potato"
            ],
            "meat": [
                "meat", "beef", "pork", "chicken", "turkey", "lamb", "ham"
            ],
            "fish": [
                "fish", "salmon", "tuna", "cod", "shrimp", "crab", "lobster"
            ],
            "dairy": [
                "milk", "cheese", "yogurt", "butter", "cream", "dairy"
            ],
            "grains": [
                "bread", "rice", "pasta", "cereal", "oat", "wheat", "grain"
            ],
            "nuts": [
                "nut", "almond", "walnut", "peanut", "cashew", "seed"
            ],
        }

        for category, keywords in categories.items():
            if any(keyword in name for keyword in keywords):
                return category

        return "all"

    def _transform_food_details(self, response: Dict[str, Any]) -> Dict[str, Any]:
        """Transform detailed food response to our app format"""
        food = response.get("food", {})
        transformed = self._transform_food_item(food)
        return transformed



# Singleton instance
fatsecret_service = FatSecretService()