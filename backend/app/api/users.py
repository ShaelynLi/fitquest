# app/api/users.py
from fastapi import APIRouter, Depends, HTTPException, status
from firebase_admin import firestore
from app.core.firebase import db
from app.dependencies.auth import get_current_user
from app.schemas.profile import ProfileUpdate
from app.schemas.goals import HealthGoal

router = APIRouter()

@router.get("/profile")
def get_profile(user=Depends(get_current_user)):
    uid = user.get("uid")
    doc = db.collection("users").document(uid).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="User profile not found")
    data = doc.to_dict() or {}
    return {
        "uid": uid,
        "email": data.get("email"),
        "displayName": data.get("displayName"),
        "emailVerified": data.get("emailVerified", False),
        "gender": data.get("gender"),
        "birthDate": data.get("birthDate"),
        "heightCm": data.get("heightCm"),
        "weightKg": data.get("weightKg"),
        "healthGoal": data.get("healthGoal"),
        "createdAt": data.get("createdAt"),
        "updatedAt": data.get("updatedAt"),
    }

@router.patch("/update_profile")
def update_profile(payload: ProfileUpdate, user=Depends(get_current_user)):
    uid = user.get("uid")
    update_map = {}
    if payload.display_name is not None:
        update_map["displayName"] = payload.display_name
    if payload.gender is not None:
        update_map["gender"] = payload.gender
    if payload.birth_date is not None:
        update_map["birthDate"] = payload.birth_date.isoformat()
    if payload.height_cm is not None:
        update_map["heightCm"] = float(payload.height_cm)
    if payload.weight_kg is not None:
        update_map["weightKg"] = float(payload.weight_kg)

    if not update_map:
        return {"updated": False, "message": "No valid fields provided"}

    update_map["updatedAt"] = firestore.SERVER_TIMESTAMP  # type: ignore[name-defined]

    try:
        db.collection("users").document(uid).set(update_map, merge=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update profile: {e}")

    return {"updated": True}

@router.get("/goals")
def get_health_goal(user=Depends(get_current_user)):
    uid = user.get("uid")
    doc = db.collection("users").document(uid).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="User profile not found")
    data = doc.to_dict() or {}
    goal = data.get("healthGoal")
    if not goal:
        return {"exists": False, "healthGoal": None}
    return {"exists": True, "healthGoal": goal}

@router.put("/update_goals")
def set_health_goal(payload: HealthGoal, user=Depends(get_current_user)):
    uid = user.get("uid")
    write_data = {
        "healthGoal": payload.model_dump(),
        "updatedAt": firestore.SERVER_TIMESTAMP,  # type: ignore[name-defined]
    }
    try:
        db.collection("users").document(uid).set(write_data, merge=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to set health goal: {e}")
    return {"updated": True}
