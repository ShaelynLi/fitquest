# app/api/users.py
from fastapi import APIRouter, Depends, HTTPException, status
from firebase_admin import auth as firebase_auth, firestore
from app.core.firebase import db
from app.dependencies.auth import get_current_user
from app.schemas.users import ProfileUpdate, OnboardingRequest, OnboardingResponse
import httpx
from app.core.settings import settings

router = APIRouter()

# User Registration (formerly onboarding)
@router.post("/register", response_model=OnboardingResponse)
def register_user(req: OnboardingRequest):
    """
    Complete user registration with comprehensive profile setup
    """
    try:
        # Check if user already exists
        try:
            firebase_auth.get_user_by_email(req.email)
            raise HTTPException(status_code=409, detail="Email address already registered")
        except firebase_auth.UserNotFoundError:
            pass  # User doesn't exist, continue with registration
        
        # Create Firebase user
        try:
            user = firebase_auth.create_user(
                email=req.email,
                password=req.password,
                display_name=f"{req.firstName} {req.lastName}",
                disabled=False,
            )
            # Auto-verify email for development/testing
            firebase_auth.update_user(user.uid, email_verified=True)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to create user: {e}")
        
        # Save comprehensive user data to Firestore
        try:
            user_data = {
                # Basic Information
                "email": req.email,
                "displayName": f"{req.firstName} {req.lastName}",
                "firstName": req.firstName,
                "lastName": req.lastName,
                "emailVerified": False,
                "gender": req.gender,
                "birthDate": req.dateOfBirth.isoformat(),
                
                # Health Metrics
                "heightCm": float(req.height_cm),
                "weightKg": float(req.weight_kg),
                "activityLevel": req.activityLevel,
                
                # Fitness Goals
                "primaryGoal": req.primaryGoal,
                "targetWeight": float(req.target_weight_kg) if req.target_weight_kg else None,
                "weeklyRunGoal": req.weeklyRunGoal,
                "petRewardGoal": req.petRewardGoal,
                
                # Preferences
                "units": req.units,
                "notifications": req.notifications,
                "healthKit": req.healthKit,
                
                # Calculated Fields
                "dailyCalories": req.dailyCalories,
                
                # Metadata
                "createdAt": firestore.SERVER_TIMESTAMP,
                "onboardingCompleted": True,
            }
            
            db.collection("users").document(user.uid).set(user_data, merge=True)
            
        except Exception as e:
            # If Firestore save fails, clean up the Firebase user
            try:
                firebase_auth.delete_user(user.uid)
            except:
                pass
            raise HTTPException(status_code=500, detail=f"Failed to save user data: {e}")
        
        # Get authentication token
        try:
            signin_url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={settings.FIREBASE_WEB_API_KEY}"
            signin_payload = {
                "email": req.email, 
                "password": req.password, 
                "returnSecureToken": True
            }
            r = httpx.post(signin_url, json=signin_payload, timeout=10.0)
            if r.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to authenticate user")
            
            data = r.json()
            id_token = data["idToken"]
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to authenticate user: {e}")
        
        return OnboardingResponse(
            success=True,
            message="User registration completed successfully",
            user_id=user.uid,
            daily_calories=req.dailyCalories
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"User registration failed: {e}")

# User Profile Management
@router.get("/profile")
def get_profile(user=Depends(get_current_user)):
    """
    Get user profile information
    """
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

@router.patch("/profile")
def update_profile(payload: ProfileUpdate, user=Depends(get_current_user)):
    """
    Update user profile information
    """
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

# Health check
@router.get("/health")
def health():
    return {"status": "ok", "service": "users"}