# app/schemas/scanner.py
from typing import Optional, List, Literal
from datetime import datetime
from pydantic import BaseModel, Field
from app.schemas.meals import Macro  # reuse Macro: calories/protein/carbs/fat


class FoodBase(BaseModel):
    """Normalized/cached food record backed by FatSecret."""
    name: Optional[str] = None
    brand: Optional[str] = None
    # Nutrition normalized to per 100 g for easy scaling
    per100g: Macro = Field(default_factory=Macro, description="Nutrition per 100 g")
    # We cache by barcode; sometimes a product has multiple barcodes
    barcodes: List[str] = Field(default_factory=list, description="EAN/UPC list")
    # Data provenance
    source: Optional[Literal["fatsecret", "manual"]] = "fatsecret"
    # FatSecret food_id so we can refresh/update the cache later
    provider_food_id: Optional[str] = Field(
        default=None, description="FatSecret food_id used to refresh this record"
    )


class FoodOut(FoodBase):
    """Food doc returned from Firestore or fetched then cached."""
    # We store under foods/{barcode}; this is that barcode key
    id: str
    updatedAt: Optional[datetime] = None


class FoodLookupOut(BaseModel):
    """Response for /api/scanner/lookup and similar endpoints."""
    barcode: str
    food: FoodOut
    servings: float = 1.0
    # grams used for scaling; if None, scale from 100 g by servings
    servingSizeGram: Optional[float] = None
    # per100g scaled to grams * servings
    scaled: Macro = Field(default_factory=Macro)
