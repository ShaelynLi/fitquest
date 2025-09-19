# app/api/scanner.py
from typing import Optional, Dict, Any, Tuple, Union
import time
import httpx

from fastapi import APIRouter, Depends, HTTPException, Query
from firebase_admin import firestore as fs

from app.core.firebase import db
from app.core.settings import settings
from app.dependencies.auth import get_current_user
from app.schemas.meals import Macro
from app.schemas.scanner import FoodOut, FoodLookupOut

router = APIRouter(prefix="/scanner", tags=["scanner"])

# FatSecret OAuth2 (client credentials) 
_TOKEN_CACHE = {"value": None, "exp": 0.0}

async def _fatsecret_token() -> str:
    """Get (and cache) FatSecret access_token via client_credentials."""
    now = time.time()
    if _TOKEN_CACHE["value"] and now < (_TOKEN_CACHE["exp"] - 60):
        return _TOKEN_CACHE["value"]

    cid = settings.FATSECRET_CLIENT_ID
    sec = settings.FATSECRET_CLIENT_SECRET
    if not cid or not sec:
        raise HTTPException(status_code=500, detail="FatSecret credentials not configured")

    url = "https://oauth.fatsecret.com/connect/token"
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(
            url,
            data={"grant_type": "client_credentials", "scope": "basic"},
            auth=(cid, sec),
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail="FatSecret token request failed")

    data = resp.json()
    _TOKEN_CACHE["value"] = data.get("access_token")
    _TOKEN_CACHE["exp"] = now + float(data.get("expires_in", 3600))
    if not _TOKEN_CACHE["value"]:
        raise HTTPException(status_code=502, detail="FatSecret token missing")
    return _TOKEN_CACHE["value"]


async def _fatsecret_request(params: Dict[str, Any]) -> Dict[str, Any]:
    """Call FatSecret REST gateway (server.api)."""
    token = await _fatsecret_token()
    url = "https://platform.fatsecret.com/rest/server.api"
    q = {"format": "json", **params}
    async with httpx.AsyncClient(timeout=12) as client:
        r = await client.get(url, params=q, headers={"Authorization": f"Bearer {token}"})
    if r.status_code != 200:
        raise HTTPException(status_code=502, detail="FatSecret API error")
    return r.json() or {}

# Firestore helpers 
def _macro_round(m: Dict[str, float]) -> Dict[str, float]:
    return {
        "calories": round(float(m.get("calories") or 0.0), 2),
        "protein":  round(float(m.get("protein")  or 0.0), 2),
        "carbs":    round(float(m.get("carbs")    or 0.0), 2),
        "fat":      round(float(m.get("fat")      or 0.0), 2),
    }

def _scale_macro(per100g: Dict[str, float], grams: float, servings: float) -> Dict[str, float]:
    factor = (grams or 100.0) / 100.0 * (servings or 1.0)
    return _macro_round({
        "calories": per100g.get("calories", 0) * factor,
        "protein":  per100g.get("protein", 0)  * factor,
        "carbs":    per100g.get("carbs", 0)    * factor,
        "fat":      per100g.get("fat", 0)      * factor,
    })

def _foods_doc(barcode: str):
    return db.collection("foods").document(barcode)

def _to_foodout(doc_id: str, data: Dict[str, Any]) -> FoodOut:
    payload = dict(data)
    payload["id"] = doc_id
    return FoodOut(**payload)

# FatSecret parsing 
def _to_float(v: Union[str, float, int, None]) -> Optional[float]:
    if v is None: return None
    try:
        return float(v)
    except Exception:
        return None

def _choose_serving(servings: Any) -> Optional[Dict[str, Any]]:
    """
    Choose a serving entry; prefer metric unit grams and closest to 100 g.
    FatSecret returns dict or list under food.servings.serving.
    """
    if not servings:
        return None
    if isinstance(servings, dict):
        candidates = [servings]
    else:
        candidates = list(servings)

    best = None
    best_delta = 1e9
    for s in candidates:
        grams = None
        # prefer metric g
        unit = (s.get("metric_serving_unit") or "").lower()
        if unit == "g":
            grams = _to_float(s.get("metric_serving_amount"))
        # fallback by explicit grams field if present
        if grams is None:
            grams = _to_float(s.get("serving_weight_grams"))

        if grams and grams > 0:
            delta = abs(grams - 100.0)
            if delta < best_delta:
                best = s
                best_delta = delta
    return best

def _per100_from_serving(s: Dict[str, Any]) -> Tuple[Dict[str, float], float]:
    """Compute per-100g macros using the chosen serving."""
    # grams per serving
    grams = None
    if (s.get("metric_serving_unit") or "").lower() == "g":
        grams = _to_float(s.get("metric_serving_amount"))
    if grams is None:
        grams = _to_float(s.get("serving_weight_grams"))
    if not grams or grams <= 0:
        grams = 100.0  # last resort

    cals = _to_float(s.get("calories")) or 0.0
    prot = _to_float(s.get("protein")) or 0.0
    carbs = _to_float(s.get("carbohydrate") or s.get("carbohydrates")) or 0.0
    fat  = _to_float(s.get("fat")) or 0.0

    factor = 100.0 / grams
    per100 = _macro_round({
        "calories": cals * factor,
        "protein":  prot * factor,
        "carbs":    carbs * factor,
        "fat":      fat  * factor,
    })
    return per100, grams

#  Fetch from FatSecret and cache 
async def _fetch_from_fatsecret(barcode: str) -> Optional[Dict[str, Any]]:
    """
    1) food.find_id_for_barcode -> food_id
    2) food.get.v4 -> food details + servings
    3) normalize to per100g
    """
    # 1) barcode -> food_id
    res_id = await _fatsecret_request({"method": "food.find_id_for_barcode", "barcode": barcode})
    food_id = None
    # schema tolerance
    if isinstance(res_id.get("food"), dict) and res_id["food"].get("food_id"):
        food_id = res_id["food"]["food_id"]
    elif res_id.get("food_id"):
        food_id = res_id["food_id"]
    if not food_id:
        return None

    # 2) details
    res = await _fatsecret_request({"method": "food.get.v4", "food_id": food_id})
    food = res.get("food") or {}
    name = food.get("food_name") or None
    brand = food.get("brand_name") or None

    servings = (food.get("servings") or {}).get("serving")
    chosen = _choose_serving(servings)
    if not chosen:
        return None

    per100g, _grams = _per100_from_serving(chosen)

    return {
        "name": name,
        "brand": brand,
        "per100g": per100g,
        "barcodes": [barcode],
        "source": "fatsecret",
        "provider_food_id": str(food_id),
    }

async def _get_or_fetch_food(barcode: str) -> FoodOut:
    """Read from Firestore cache; if missing, fetch from FatSecret then cache."""
    ref = _foods_doc(barcode)
    snap = ref.get()
    if snap.exists:
        return _to_foodout(snap.id, snap.to_dict() or {})

    fetched = await _fetch_from_fatsecret(barcode)
    if not fetched or sum(fetched["per100g"].values()) == 0:
        raise HTTPException(status_code=404, detail="Food not found for this barcode")

    fetched["updatedAt"] = fs.SERVER_TIMESTAMP
    ref.set(fetched, merge=True)
    saved = ref.get().to_dict() or {}
    return _to_foodout(barcode, saved)

# endpoints 
@router.get("/lookup", response_model=FoodLookupOut)
async def lookup_food(
    barcode: str = Query(..., min_length=5, max_length=32, description="EAN/UPC code"),
    grams: Optional[float] = Query(None, ge=0, description="Serving size in grams to scale from per100g"),
    servings: float = Query(1.0, gt=0, description="Number of servings"),
    user=Depends(get_current_user),
):
    """
    Scan/lookup a food by barcode using FatSecret.
    Flow:
      1) Try Firestore cache at 'foods/{barcode}'.
      2) If missing, fetch via FatSecret (food.find_id_for_barcode -> food.get.v4) and cache.
      3) If 'grams' is provided, also return macros scaled from per-100g.
    """
    food = await _get_or_fetch_food(barcode)
    grams_to_use = grams if grams is not None else 100.0
    scaled_dict = _scale_macro(dict(food.per100g), grams_to_use, servings)

    return FoodLookupOut(
        barcode=barcode,
        food=food,
        servings=servings,
        servingSizeGram=grams,
        scaled=Macro(**scaled_dict),
    )
