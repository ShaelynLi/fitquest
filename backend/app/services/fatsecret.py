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
            print("⚠️ FatSecret API credentials not configured - food search will be disabled")
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
        if not barcode or len(barcode.strip()) < 8:
            return {"food_id": None, "error": "Invalid barcode format"}

        # Use the barcode endpoint
        barcode_url = "https://platform.fatsecret.com/rest/food/barcode/find-by-id/v1"
        await self._ensure_valid_token()

        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
        }

        params = {
            "barcode": barcode.strip(),
            "format": "json",
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(barcode_url, headers=headers, params=params)
                response.raise_for_status()
                json_response = response.json()

                # Check for FatSecret API errors
                if "error" in json_response:
                    error_code = json_response["error"].get("code")
                    error_message = json_response["error"].get("message", "Unknown error")
                    return {"food_id": None, "error": f"FatSecret API Error {error_code}: {error_message}"}

                # Extract food_id from response
                food_id_data = json_response.get("food_id", {})
                if isinstance(food_id_data, dict):
                    food_id = food_id_data.get("value")
                else:
                    food_id = food_id_data

                if food_id:
                    # Get detailed food information using the food_id
                    food_details = await self.get_food_details(str(food_id))
                    return {"food_id": food_id, "food": food_details}
                else:
                    return {"food_id": None, "error": "No food found for this barcode"}

            except httpx.HTTPStatusError as e:
                if e.response.status_code == 404:
                    return {"food_id": None, "error": "Barcode not found in database"}
                else:
                    return {"food_id": None, "error": f"HTTP Error {e.response.status_code}"}
            except Exception as e:
                return {"food_id": None, "error": f"Request failed: {str(e)}"}

    async def get_food_details(self, food_id: str) -> Dict[str, Any]:
        """Get detailed information for a specific food"""
        # Use different endpoint for food details
        detail_url = "https://platform.fatsecret.com/rest/food/v4"
        await self._ensure_valid_token()

        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
        }

        params = {
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

    def _transform_search_response(self, response: Dict[str, Any]) -> Dict[str, Any]:
        """Transform FatSecret search response to our app format"""
        foods_search = response.get("foods_search", {})
        results = foods_search.get("results", {})
        food_list = results.get("food", [])

        # Handle single food result (not in array)
        if isinstance(food_list, dict):
            food_list = [food_list]
        elif not isinstance(food_list, list):
            food_list = []

        transformed_foods = [self._transform_food_item(food) for food in food_list]

        return {
            "foods": transformed_foods,
            "total_results": int(foods_search.get("total_results", 0)),
            "page_number": int(foods_search.get("page_number", 0)),
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

        # Get nutrition from first serving if available
        servings = food.get("servings", {})
        serving_list = servings.get("serving", [])

        # Handle single serving (not in array)
        if isinstance(serving_list, dict):
            serving_list = [serving_list]
        elif not isinstance(serving_list, list):
            serving_list = []

        # Use first serving for nutrition data
        primary_serving = serving_list[0] if serving_list else {}

        # Extract nutrition values from serving
        calories = float(primary_serving.get("calories", 0))
        protein = float(primary_serving.get("protein", 0))
        carbs = float(primary_serving.get("carbohydrate", 0))
        fat = float(primary_serving.get("fat", 0))
        fiber = float(primary_serving.get("fiber", 0))
        sugar = float(primary_serving.get("sugar", 0))

        # Get serving description
        serving_desc = primary_serving.get("serving_description", "100g")

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
        return self._transform_food_item(food)

    async def search_food_by_barcode(self, barcode: str) -> Dict[str, Any]:
        """
        Search for a food by barcode using FatSecret API
        
        Args:
            barcode: 13-digit GTIN-13 barcode (UPC-A, EAN-13, EAN-8 supported)
            
        Returns:
            Dictionary containing food information or error message
        """
        try:
            # Validate barcode format
            if not barcode or len(barcode) < 8 or len(barcode) > 13:
                return {
                    "success": False,
                    "error": "Invalid barcode format. Please provide a valid UPC-A, EAN-13, or EAN-8 barcode."
                }
            
            # FatSecret doesn't have direct barcode search, so we'll search by barcode as text
            # This is a limitation - FatSecret API doesn't support barcode lookup directly
            params = {
                "method": "foods.search",
                "search_expression": barcode,
                "page_number": 0,
                "max_results": 5,
                "format": "json",
            }
            
            response = await self._make_request(params)
            search_results = self._transform_search_response(response)
            
            # Look for exact barcode match in food names or descriptions
            foods = search_results.get("foods", [])
            matching_food = None
            
            for food in foods:
                food_name = food.get("name", "").lower()
                food_brand = food.get("brand", "").lower()
                barcode_lower = barcode.lower()
                
                # Check if barcode appears in food name or brand
                if (barcode_lower in food_name or 
                    barcode_lower in food_brand or
                    barcode in food.get("fatsecret_id", "")):
                    matching_food = food
                    break
            
            if matching_food:
                return {
                    "success": True,
                    "food_id": matching_food.get("id"),
                    "food": matching_food,
                    "barcode": barcode
                }
            else:
                return {
                    "success": False,
                    "error": f"No food found for barcode {barcode}. This barcode is not in our database.",
                    "barcode": barcode
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"Barcode search failed: {str(e)}",
                "barcode": barcode
            }


# Singleton instance
fatsecret_service = FatSecretService()