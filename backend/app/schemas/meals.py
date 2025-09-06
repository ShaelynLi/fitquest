# Meals Model
"""
- Macro: aggregated macronutrients
- MealItem: one food entry inside a meal
- MealBase / MealCreate / MealUpdate / MealOut: meal payloads and responses
"""

from pydantic import BaseModel, Field, validator
from typing import Literal, Optional, List 
from datetime import datetime

# Type alias for the four supported meal categories.
MealType = Literal["breakfast", "lunch", "dinner", "snack"]

class Macro(BaseModel):
    """Aggregated macronutrient values for a meal or a day.
    All values are non-negative floats and represent total amounts
    (not per 100 g): calories (kcal), protein (g), carbs (g), fat (g).
    """
    calories: float = 0
    protein: float = 0
    carbs: float = 0
    fat: float = 0

    # Ensure macros are never negative; treat None as 0 for robustness.
    @validator("calories", "protein", "carbs", "fat")
    def non_negative(cls, v):
        if v is None:
            return 0
        if v < 0:
            raise ValueError("macro values must be >= 0")
        return float(v)

class MealItem(BaseModel):
    """One food entry within a meal.

    Includes optional barcode for traceability, brand/name metadata,
    the consumed amount (grams and number of servings), and the
    macronutrients for THIS entry (already scaled to the eaten amount).
    When enrich_barcode is enabled server-side, missing macros can be
    back-filled from a foods database using the barcode.
    """
    name: Optional[str] = None
    brand: Optional[str] = None
    barcode: Optional[str] = None
    servingSizeGram: Optional[float] = Field(
        default=None, description="Grams consumed. If left blank and nutrition is provided per 100 g, values are scaled from 100 g."
    )
    servings: float = 1.0

    # Frontend may omit these; if enrich_barcode is enabled, the backend can fill them in
    calories: Optional[float] = None
    protein: Optional[float] = None
    carbs: Optional[float] = None
    fat: Optional[float] = None

    @validator("servings")
    def servings_positive(cls, v):
        if v is None or v <= 0:
            raise ValueError("servings must be > 0")
        return float(v)

class MealBase(BaseModel):
    """Common fields shared by meal payloads.

    - date: UTC timestamp when the meal was consumed.
    - mealType: breakfast/lunch/dinner/snack.
    - items: list of MealItem entries.
    - totals: optional on input; server will recompute and overwrite.
    - source: how the meal was recorded (barcode/manual).
    """

    date: datetime                        # UTC timestamp
    mealType: MealType
    items: List[MealItem]
    # Client may omit or send imprecise totals; the backend will recompute and overwrite
    totals: Optional[Macro] = None
    source: Optional[Literal["barcode", "manual"]] = "manual"

class MealCreate(MealBase):
    pass

class MealUpdate(BaseModel):
    """Partial update payload for a meal.

    All fields are optional; only provided fields will be updated.
    If items are changed, totals will be recomputed server-side.
    """
    date: Optional[datetime] = None
    mealType: Optional[MealType] = None
    items: Optional[List[MealItem]] = None
    totals: Optional[Macro] = None
    source: Optional[Literal["barcode", "manual"]] = None

class MealOut(MealBase):
    """Response model returned by the Meals API.

    Extends MealBase with server-managed fields:
    - id: Firestore document id for this meal.
    - createdAt / updatedAt: server timestamps.
    - totals: always present in responses (server-computed).
    """
    id: str
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None
    totals: Macro                         # Always present in responses
