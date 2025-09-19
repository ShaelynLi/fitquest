"""
Food API - FatSecret Proxy Endpoints

Provides food search and nutrition data endpoints that proxy requests to FatSecret API.
This handles authentication and IP restrictions on the backend.
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Dict, List, Any
from app.services.fatsecret import fatsecret_service
from app.schemas.foods import (
    FoodSearchResponse,
    FoodCategoriesResponse,
    HealthCheckResponse,
    FoodItem
)

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

        if result.get("food_id"):
            return {
                "success": True,
                "food_id": result["food_id"],
                "food": result["food"],
                "barcode": barcode
            }
        else:
            return {
                "success": False,
                "error": result.get("error", "Barcode not found"),
                "barcode": barcode
            }

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


