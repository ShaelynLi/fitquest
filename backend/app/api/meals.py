"""
Meals API - Food Logging and Nutrition Tracking

Provides endpoints for logging meals, tracking daily nutrition, and managing food entries.
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from datetime import datetime, date
from pydantic import BaseModel, Field
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/meals", tags=["meals"])


# Request/Response Models
class MealFoodItem(BaseModel):
    """Individual food item in a meal"""
    name: str
    brand: str | None = None
    fatsecret_id: str | None = None
    calories: float
    protein: float
    carbs: float
    fat: float
    fiber: float | None = 0
    sugar: float | None = 0
    saturated_fat: float | None = 0
    sodium: float | None = 0
    cholesterol: float | None = 0
    potassium: float | None = 0
    serving_amount: float
    serving_unit: str = "g"
    measurement_mode: str = "gram"


class LogMealRequest(BaseModel):
    """Request to log a meal"""
    meal_type: str = Field(..., description="breakfast, lunch, dinner, or snacks")
    date: str = Field(..., description="Date in YYYY-MM-DD format")
    food: MealFoodItem


class MealEntry(BaseModel):
    """Complete meal entry with metadata"""
    id: str
    meal_type: str
    date: str
    food: MealFoodItem
    logged_at: str
    user_id: str


class DailyNutritionSummary(BaseModel):
    """Daily nutrition totals"""
    date: str
    total_calories: float
    total_protein: float
    total_carbs: float
    total_fat: float
    total_fiber: float
    total_sugar: float
    meals: Dict[str, List[MealEntry]]


# In-memory storage (replace with Firestore in production)
meals_db: Dict[str, List[Dict]] = {}


@router.post("/log", response_model=Dict[str, Any])
async def log_meal(
    meal_request: LogMealRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Log a food item to a meal

    Args:
        meal_request: Meal logging request with food details
        current_user: Authenticated user from JWT token

    Returns:
        Logged meal entry with ID
    """
    try:
        user_id = current_user.get("uid", "default_user")

        # Create meal entry
        meal_entry = {
            "id": f"{user_id}_{meal_request.date}_{meal_request.meal_type}_{datetime.now().timestamp()}",
            "user_id": user_id,
            "meal_type": meal_request.meal_type,
            "date": meal_request.date,
            "food": meal_request.food.model_dump(),
            "logged_at": datetime.now().isoformat()
        }

        # Store in memory (replace with Firestore)
        user_key = f"{user_id}_{meal_request.date}"
        if user_key not in meals_db:
            meals_db[user_key] = []
        meals_db[user_key].append(meal_entry)

        return {
            "success": True,
            "message": "Meal logged successfully",
            "data": meal_entry
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to log meal: {str(e)}"
        )


@router.get("/daily/{date}", response_model=DailyNutritionSummary)
async def get_daily_meals(
    date: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get all meals for a specific date

    Args:
        date: Date in YYYY-MM-DD format
        current_user: Authenticated user from JWT token

    Returns:
        Daily nutrition summary with all meals
    """
    try:
        user_id = current_user.get("uid", "default_user")
        user_key = f"{user_id}_{date}"

        # Get meals from storage
        meals = meals_db.get(user_key, [])

        # Organize meals by type
        meals_by_type = {
            "breakfast": [],
            "lunch": [],
            "dinner": [],
            "snacks": []
        }

        total_calories = 0
        total_protein = 0
        total_carbs = 0
        total_fat = 0
        total_fiber = 0
        total_sugar = 0

        for meal in meals:
            meal_type = meal["meal_type"]
            if meal_type in meals_by_type:
                meals_by_type[meal_type].append(meal)

                # Sum nutrition
                food = meal["food"]
                total_calories += food.get("calories", 0)
                total_protein += food.get("protein", 0)
                total_carbs += food.get("carbs", 0)
                total_fat += food.get("fat", 0)
                total_fiber += food.get("fiber", 0)
                total_sugar += food.get("sugar", 0)

        return DailyNutritionSummary(
            date=date,
            total_calories=round(total_calories, 1),
            total_protein=round(total_protein, 1),
            total_carbs=round(total_carbs, 1),
            total_fat=round(total_fat, 1),
            total_fiber=round(total_fiber, 1),
            total_sugar=round(total_sugar, 1),
            meals=meals_by_type
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get daily meals: {str(e)}"
        )


@router.delete("/{meal_id}")
async def delete_meal(
    meal_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a logged meal

    Args:
        meal_id: ID of the meal to delete
        current_user: Authenticated user from JWT token

    Returns:
        Success confirmation
    """
    try:
        user_id = current_user.get("uid", "default_user")

        # Find and remove meal (simplified for in-memory storage)
        for user_key in meals_db:
            if user_key.startswith(user_id):
                meals_db[user_key] = [
                    m for m in meals_db[user_key] if m["id"] != meal_id
                ]

        return {
            "success": True,
            "message": "Meal deleted successfully"
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete meal: {str(e)}"
        )
