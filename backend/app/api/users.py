# app/api/users.py
from fastapi import APIRouter, Depends, HTTPException, status
from firebase_admin import auth as firebase_auth, firestore
from app.core.firebase import db
from app.dependencies.auth import get_current_user
from app.schemas.users import ProfileUpdate, OnboardingRequest, OnboardingResponse, DailyGoalProgressResponse
import httpx
from app.core.settings import settings
from datetime import date as date_type, datetime

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
            
            # Send verification email
            oob_url = f"https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key={settings.FIREBASE_WEB_API_KEY}"
            oob_payload = {"requestType": "VERIFY_EMAIL", "idToken": id_token}
            oob_resp = httpx.post(oob_url, json=oob_payload, timeout=10.0)
            
            # Log email sending status for debugging
            print(f"📧 Email verification request status: {oob_resp.status_code}")
            if oob_resp.status_code != 200:
                error_detail = oob_resp.json().get("error", {}) if oob_resp.content else {}
                print(f"❌ Email sending failed: {error_detail}")
                detail = error_detail.get("message", "SEND_VERIFY_EMAIL_FAILED")
                raise HTTPException(status_code=400, detail=detail)
            else:
                print(f"✅ Verification email sent successfully to {req.email}")
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to authenticate user: {e}")
        
        return OnboardingResponse(
            success=True,
            message="User registration completed successfully. Please check your email for verification.",
            user_id=user.uid,
            daily_calories=req.dailyCalories,
            temp_token=id_token  # Return temp token for verification flow
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

# Get daily goal progress (for pet mood)
@router.get("/daily-progress", response_model=DailyGoalProgressResponse)
def get_daily_progress(user=Depends(get_current_user)):
    """
    Get today's goal completion progress
    
    Calculates:
    - User's daily goal distance (from petRewardGoal, default 5000m)
    - Today's completed distance (from workouts)
    - Completion percentage (0-100%)
    - Pet mood based on percentage:
      - 0-33%: upset
      - 34-67%: happy
      - 68-100%: cheerful
    """
    try:
        uid = user.get("uid")
        
        # Get user's daily goal
        user_doc = db.collection("users").document(uid).get()
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_data = user_doc.to_dict()
        
        # Get daily goal in meters (petRewardGoal is in km, default 5km)
        pet_reward_goal_km = user_data.get("petRewardGoal", 5)
        goal_distance_meters = pet_reward_goal_km * 1000
        
        # Get today's date
        today = date_type.today()
        today_str = today.isoformat()
        
        # Get today's workouts
        workouts_ref = db.collection("users").document(uid).collection("workouts")
        
        # Query workouts for today
        # Workouts have start_time.date field in YYYY-MM-DD format
        today_workouts = []
        for workout_doc in workouts_ref.stream():
            workout_data = workout_doc.to_dict()
            
            # Check if workout is from today
            start_time = workout_data.get("start_time", {})
            workout_date = start_time.get("date")
            
            if workout_date == today_str and workout_data.get("status") == "completed":
                today_workouts.append(workout_data)
        
        # Calculate total distance for today
        completed_distance_meters = 0
        for workout in today_workouts:
            distance = workout.get("distance_meters", 0)
            completed_distance_meters += distance
        
        # Calculate completion percentage
        if goal_distance_meters > 0:
            completion_percentage = min((completed_distance_meters / goal_distance_meters) * 100, 100)
        else:
            completion_percentage = 0
        
        # Determine pet mood based on completion percentage
        if completion_percentage <= 33:
            pet_mood = "upset"
        elif completion_percentage <= 67:
            pet_mood = "happy"
        else:
            pet_mood = "cheerful"
        
        return DailyGoalProgressResponse(
            success=True,
            date=today,
            goal_distance_meters=goal_distance_meters,
            completed_distance_meters=completed_distance_meters,
            completion_percentage=round(completion_percentage, 2),
            pet_mood=pet_mood,
            message=f"Today's progress: {completed_distance_meters}m / {goal_distance_meters}m"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get daily progress: {str(e)}"
        )

# Health check
@router.get("/health")
def health():
    return {"status": "ok", "service": "users"}