"""
Food API Schemas

Pydantic models for food search and nutrition data endpoints.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class FoodItem(BaseModel):
    """Individual food item with nutrition information"""
    id: str = Field(..., description="Unique food identifier")
    name: str = Field(..., description="Food name")
    brand: str = Field(..., description="Brand name")
    category: str = Field(..., description="Food category")
    calories: float = Field(..., description="Calories per serving")
    protein: float = Field(..., description="Protein in grams")
    carbs: float = Field(..., description="Carbohydrates in grams")
    fat: float = Field(..., description="Fat in grams")
    fiber: float = Field(0, description="Fiber in grams")
    sugar: float = Field(0, description="Sugar in grams")
    serving_size: str = Field(..., description="Serving size description")
    serving_unit: str = Field(..., description="Serving unit")
    verified: bool = Field(False, description="Whether nutrition data is verified")
    fatsecret_id: Optional[str] = Field(None, description="FatSecret food ID")
    serving: Optional[Dict[str, Any]] = Field(None, description="Selected serving information with serving_id")


class FoodSearchResponse(BaseModel):
    """Response model for food search endpoint"""
    success: bool = Field(..., description="Whether the search was successful")
    foods: List[FoodItem] = Field(..., description="List of found foods")
    total_results: int = Field(..., description="Total number of results available")
    page_number: int = Field(..., description="Current page number")
    query: str = Field(..., description="Search query used")
    page: int = Field(..., description="Requested page number")
    limit: int = Field(..., description="Results per page limit")


class FoodCategory(BaseModel):
    """Food category for filtering"""
    id: str = Field(..., description="Category identifier")
    name: str = Field(..., description="Category display name")
    icon: str = Field(..., description="Icon name for UI")


class FoodCategoriesResponse(BaseModel):
    """Response model for food categories endpoint"""
    success: bool = Field(..., description="Whether the request was successful")
    data: List[FoodCategory] = Field(..., description="List of available categories")


class HealthCheckResponse(BaseModel):
    """Response model for health check endpoint"""
    status: str = Field(..., description="Service status")
    service: str = Field(..., description="Service name")
    fatsecret_configured: str = Field(..., description="Whether FatSecret is configured")
    fatsecret_status: str = Field(..., description="FatSecret API status")
    fatsecret_error: Optional[str] = Field(None, description="FatSecret error message if any")
    test_search_results: Dict[str, Any] = Field(..., description="Test search results")