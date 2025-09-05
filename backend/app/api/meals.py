# app/api/meals.py
from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta

# Firestore client singleton and server timestamp constant
from firebase_admin import firestore as fs
from app.core.firebase import db

# Schemas & auth dependency
from app.schemas.meals import MealCreate, MealUpdate, MealOut
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/meals", tags=["meals"])

# === helpers ===
def _uid(user) -> str:
    """Extract Firebase UID from the dependency result (dict or object)."""
    return user["uid"] if isinstance(user, dict) else getattr(user, "uid", "")

def _col(uid: str):
    """Return collection ref: users/{uid}/meals."""
    return db.collection("users").document(uid).collection("meals")

def _to_utc(dt: datetime) -> datetime:
    """Normalize any datetime to timezone-aware UTC."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)

def _compute_totals(items: List[Dict[str, Any]]) -> Dict[str, float]:
    """Sum macros from items; ignore any client-sent totals."""
    t = {"calories": 0.0, "protein": 0.0, "carbs": 0.0, "fat": 0.0}
    for it in items:
        t["calories"] += float(it.get("calories") or 0)
        t["protein"]  += float(it.get("protein") or 0)
        t["carbs"]    += float(it.get("carbs") or 0)
        t["fat"]      += float(it.get("fat") or 0)
    return {k: round(v, 2) for k, v in t.items()}

@router.get("", response_model=List[MealOut])
def list_meals(
    date: Optional[str] = Query(None, description="Filter by date: YYYY-MM-DD (UTC)"),
    user=Depends(get_current_user),
):
    """List meals for the current user. Optionally filter by a UTC day."""
    uid = _uid(user)
    q = _col(uid)

    # Optional daily filter
    if date:
        try:
            start = datetime.fromisoformat(date).replace(
                tzinfo=timezone.utc, hour=0, minute=0, second=0, microsecond=0
            )
        except Exception:
            raise HTTPException(status_code=422, detail="Invalid date. Use YYYY-MM-DD")
        end = start + timedelta(days=1) - timedelta(microseconds=1)
        q = q.where("date", ">=", start).where("date", "<=", end)
        docs = q.stream()  # Range query doesn't require extra ordering
    else:
        docs = q.order_by("date").stream()  # Order by time for the full list

    out: List[MealOut] = []
    for d in docs:
        data = d.to_dict() or {}
        data["id"] = d.id
        out.append(MealOut(**data))
    return out

@router.get("/{meal_id}", response_model=MealOut)
def get_meal(meal_id: str, user=Depends(get_current_user)):
    """Get a single meal by id for the current user."""
    uid = _uid(user)
    snap = _col(uid).document(meal_id).get()
    if not snap.exists:
        raise HTTPException(status_code=404, detail="Meal not found")
    data = snap.to_dict() or {}
    data["id"] = meal_id
    return MealOut(**data)

@router.post("", response_model=MealOut, status_code=status.HTTP_201_CREATED)
def create_meal(payload: MealCreate, user=Depends(get_current_user)):
    """Create a new meal; server recalculates totals and timestamps."""
    uid = _uid(user)
    data = payload.dict(exclude_none=True)

    # Normalize time and recompute totals
    data["date"] = _to_utc(data["date"])
    items = [dict(it) for it in data.get("items", [])]
    data["items"] = items
    data["totals"] = _compute_totals(items)

    # Server timestamps
    data["createdAt"] = fs.SERVER_TIMESTAMP
    data["updatedAt"] = fs.SERVER_TIMESTAMP

    # Auto-generated document id
    ref = _col(uid).document()
    ref.set(data)

    saved = ref.get().to_dict() or {}
    saved["id"] = ref.id
    return MealOut(**saved)

@router.patch("/{meal_id}", response_model=MealOut)
def update_meal(meal_id: str, payload: MealUpdate, user=Depends(get_current_user)):
    """Partially update a meal; items change triggers totals recompute."""
    uid = _uid(user)
    ref = _col(uid).document(meal_id)
    snap = ref.get()
    if not snap.exists:
        raise HTTPException(status_code=404, detail="Meal not found")

    before = snap.to_dict() or {}
    update: Dict[str, Any] = payload.dict(exclude_unset=True, exclude_none=True)

    # Decide final items and recompute totals
    items = update.get("items", before.get("items", []))
    items = [dict(it) for it in items]
    update["items"] = items
    update["totals"] = _compute_totals(items)

    # Normalize date if provided
    if "date" in update:
        update["date"] = _to_utc(update["date"])

    update["updatedAt"] = fs.SERVER_TIMESTAMP
    ref.update(update)

    fresh = ref.get().to_dict() or {}
    fresh["id"] = meal_id
    return MealOut(**fresh)

@router.delete("/{meal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meal(meal_id: str, user=Depends(get_current_user)):
    """Delete a meal by id for the current user."""
    uid = _uid(user)
    ref = _col(uid).document(meal_id)
    if not ref.get().exists:
        raise HTTPException(status_code=404, detail="Meal not found")
    ref.delete()
    return None
