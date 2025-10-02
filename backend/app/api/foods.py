"""
Food API - FatSecret Proxy Endpoints + User Food Logging

Provides food search and nutrition data endpoints that proxy requests to FatSecret API.
Also handles user food logging and nutrition tracking with Firebase storage.
This handles authentication and IP restrictions on the backend.
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Dict, List, Any, Optional
from datetime import datetime, date
from app.services.fatsecret import fatsecret_service
from app.schemas.foods import (
    FoodSearchResponse,
    FoodCategoriesResponse,
    HealthCheckResponse,
    FoodItem
)
from app.core.firebase import db
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/foods", tags=["foods"])


@router.get("/search", response_model=FoodSearchResponse)
async def search_foods(
    q: str = Query(..., min_length=2, description="Search query for foods"),
    page: int = Query(0, ge=0, description="Page number (0-based)"),
    limit: int = Query(20, ge=1, le=50, description="Results per page (max 50)"),
):
    """
    Search for foods using FatSecret database

    Returns paginated list of foods with nutrition information.
    """
    try:
        results = await fatsecret_service.search_foods(
            query=q,
            page_number=page,
            max_results=limit
        )

        return FoodSearchResponse(
            success=True,
            foods=results["foods"],
            total_results=results["total_results"],
            page_number=results["page_number"],
            query=q,
            page=page,
            limit=limit
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Food search failed: {str(e)}"
        )


@router.get("/barcode/{barcode}", response_model=Dict[str, Any])
async def search_food_by_barcode(barcode: str):
    """
    Search for a food by barcode

    Args:
        barcode: 13-digit GTIN-13 barcode (UPC-A, EAN-13, EAN-8 supported)

    Returns:
        Food information if barcode is found, error message if not found
    """
    try:
        result = await fatsecret_service.search_food_by_barcode(barcode)

        # Handle case where result might be None
        if result is None:
            return {
                "success": False,
                "error": "Barcode search returned no result",
                "barcode": barcode
            }

        # The result already contains all the needed fields from the service
        return result

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Barcode search failed: {str(e)}"
        )


@router.get("/details/{food_id}", response_model=Dict[str, Any])
async def get_food_details(food_id: str):
    """
    Get detailed nutrition information for a specific food

    Args:
        food_id: FatSecret food ID

    Returns:
        Detailed food information with complete nutrition data
    """
    try:
        food_details = await fatsecret_service.get_food_details(food_id)
        return {
            "success": True,
            "data": food_details
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get food details: {str(e)}"
        )


@router.get("/categories", response_model=FoodCategoriesResponse)
async def get_food_categories():
    """
    Get list of available food categories for filtering
    """
    categories = [
        {"id": "all", "name": "All", "icon": "grid"},
        {"id": "fruits", "name": "Fruits", "icon": "leaf"},
        {"id": "vegetables", "name": "Vegetables", "icon": "nutrition"},
        {"id": "meat", "name": "Meat", "icon": "restaurant"},
        {"id": "fish", "name": "Fish", "icon": "fish"},
        {"id": "dairy", "name": "Dairy", "icon": "water"},
        {"id": "grains", "name": "Grains", "icon": "library"},
        {"id": "nuts", "name": "Nuts", "icon": "ellipse"},
    ]

    return FoodCategoriesResponse(
        success=True,
        data=categories
    )


@router.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """
    Health check endpoint for the food service
    """
    try:
        # Test a simple search to verify API connectivity
        test_results = await fatsecret_service.search_foods("apple", 0, 1)
        api_status = "connected"
        api_error = None
    except Exception as e:
        api_status = "error"
        api_error = str(e)
        test_results = {"foods": [], "total_results": 0, "page_number": 0}

    return HealthCheckResponse(
        status="healthy",
        service="food-api",
        fatsecret_configured=str(bool(
            fatsecret_service.client_id and fatsecret_service.client_secret
        )),
        fatsecret_status=api_status,
        fatsecret_error=api_error,
        test_search_results=test_results
    )


# ============ USER FOOD LOGGING ENDPOINTS ============

@router.post("/log")
async def log_food(
    food_data: Dict[str, Any],
    user=Depends(get_current_user)
):
    """
    Log a food item for the current user
    
    Expected food_data:
    {
        "name": "Apple",
        "brand": "Generic",
        "calories": 95,
        "protein": 0.5,
        "carbs": 25,
        "fat": 0.3,
        "servingSize": "1 medium",
        "mealType": "breakfast",  # breakfast, lunch, dinner, snacks
        "date": "2025-01-02"  # Optional, defaults to today
    }
    """
    try:
        print(f"🍎 Logging food for user: {user['uid']}")
        print(f"📊 Food data: {food_data}")
        
        # Get date (default to today if not provided)
        log_date = food_data.get("date", date.today().isoformat())
        
        # Create food log document
        food_log = {
            "name": food_data.get("name", "Unknown Food"),
            "brand": food_data.get("brand", ""),
            "calories": float(food_data.get("calories", 0)),
            "protein": float(food_data.get("protein", 0)),
            "carbs": float(food_data.get("carbs", 0)),
            "fat": float(food_data.get("fat", 0)),
            "servingSize": food_data.get("servingSize", "1 serving"),
            "mealType": food_data.get("mealType", "snacks"),
            "date": log_date,
            "loggedAt": datetime.now().isoformat(),
            "userId": user["uid"]
        }
        
        # Save to Firebase
        doc_ref = db.collection("users").document(user["uid"]).collection("food_logs").document()
        doc_ref.set(food_log)
        
        print(f"✅ Food logged successfully with ID: {doc_ref.id}")
        
        return {
            "success": True,
            "message": "Food logged successfully",
            "food_log_id": doc_ref.id,
            "food_data": food_log
        }
        
    except Exception as e:
        print(f"❌ Failed to log food: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to log food: {e}")


@router.get("/logs")
async def get_food_logs(
    target_date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format"),
    user=Depends(get_current_user)
):
    """
    Get food logs for the current user
    
    Args:
        target_date: Optional date filter (YYYY-MM-DD format)
    """
    try:
        print(f"📋 Getting food logs for user: {user['uid']}")
        print(f"📅 Target date: {target_date}")
        
        # Query food logs
        query = db.collection("users").document(user["uid"]).collection("food_logs")
        
        # Add date filter if provided
        if target_date:
            query = query.where("date", "==", target_date)
        
        # Note: We'll sort in Python to avoid index requirements
        
        docs = query.stream()
        food_logs = []
        
        for doc in docs:
            data = doc.to_dict()
            food_logs.append({
                "id": doc.id,
                **data
            })
        
        # Sort by logged time (most recent first)
        food_logs.sort(key=lambda x: x.get("loggedAt", ""), reverse=True)
        
        print(f"📊 Found {len(food_logs)} food logs")
        
        # Group by meal type for easier frontend consumption
        meals = {
            "breakfast": [],
            "lunch": [],
            "dinner": [],
            "snacks": []
        }
        
        for log in food_logs:
            meal_type = log.get("mealType", "snacks")
            if meal_type in meals:
                meals[meal_type].append(log)
        
        # Calculate daily totals
        all_logs = [log for logs in meals.values() for log in logs]
        daily_totals = {
            "calories": sum(log.get("calories", 0) for log in all_logs),
            "protein": sum(log.get("protein", 0) for log in all_logs),
            "carbs": sum(log.get("carbs", 0) for log in all_logs),
            "fat": sum(log.get("fat", 0) for log in all_logs)
        }
        
        return {
            "success": True,
            "date": target_date or date.today().isoformat(),
            "meals": meals,
            "daily_totals": daily_totals,
            "total_logs": len(all_logs)
        }
        
    except Exception as e:
        print(f"❌ Failed to get food logs: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get food logs: {e}")


@router.delete("/logs/{log_id}")
async def delete_food_log(
    log_id: str,
    user=Depends(get_current_user)
):
    """
    Delete a specific food log entry
    """
    try:
        print(f"🗑️ Deleting food log {log_id} for user: {user['uid']}")
        
        # Delete the food log
        doc_ref = db.collection("users").document(user["uid"]).collection("food_logs").document(log_id)
        doc_ref.delete()
        
        print(f"✅ Food log {log_id} deleted successfully")
        
        return {
            "success": True,
            "message": "Food log deleted successfully"
        }
        
    except Exception as e:
        print(f"❌ Failed to delete food log: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete food log: {e}")


@router.get("/nutrition-summary")
async def get_nutrition_summary(
    start_date: Optional[str] = Query(None, description="Start date in YYYY-MM-DD format"),
    end_date: Optional[str] = Query(None, description="End date in YYYY-MM-DD format"),
    user=Depends(get_current_user)
):
    """
    Get nutrition summary for a date range
    """
    try:
        print(f"📊 Getting nutrition summary for user: {user['uid']}")
        print(f"📅 Date range: {start_date} to {end_date}")
        
        # Query food logs
        query = db.collection("users").document(user["uid"]).collection("food_logs")
        
        # Add date range filters if provided
        if start_date:
            query = query.where("date", ">=", start_date)
        if end_date:
            query = query.where("date", "<=", end_date)
        
        docs = query.stream()
        food_logs = []
        
        for doc in docs:
            data = doc.to_dict()
            food_logs.append(data)
        
        # Calculate summary statistics
        total_calories = sum(log.get("calories", 0) for log in food_logs)
        total_protein = sum(log.get("protein", 0) for log in food_logs)
        total_carbs = sum(log.get("carbs", 0) for log in food_logs)
        total_fat = sum(log.get("fat", 0) for log in food_logs)
        
        # Group by date
        daily_summaries = {}
        for log in food_logs:
            log_date = log.get("date")
            if log_date not in daily_summaries:
                daily_summaries[log_date] = {
                    "date": log_date,
                    "calories": 0,
                    "protein": 0,
                    "carbs": 0,
                    "fat": 0,
                    "meal_count": 0
                }
            
            daily_summaries[log_date]["calories"] += log.get("calories", 0)
            daily_summaries[log_date]["protein"] += log.get("protein", 0)
            daily_summaries[log_date]["carbs"] += log.get("carbs", 0)
            daily_summaries[log_date]["fat"] += log.get("fat", 0)
            daily_summaries[log_date]["meal_count"] += 1
        
        return {
            "success": True,
            "date_range": {
                "start_date": start_date,
                "end_date": end_date
            },
            "total_summary": {
                "calories": total_calories,
                "protein": total_protein,
                "carbs": total_carbs,
                "fat": total_fat,
                "total_logs": len(food_logs)
            },
            "daily_summaries": list(daily_summaries.values())
        }
        
    except Exception as e:
        print(f"❌ Failed to get nutrition summary: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get nutrition summary: {e}")


