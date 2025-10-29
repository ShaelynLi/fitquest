# app/api/users.py
from fastapi import APIRouter, Depends, HTTPException, status
from firebase_admin import auth as firebase_auth, firestore
from app.core.firebase import db
from app.dependencies.auth import get_current_user
from app.schemas.users import ProfileUpdate, OnboardingRequest, OnboardingResponse, PasswordChangeRequest, PasswordChangeResponse
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
        "firstName": data.get("firstName"),
        "lastName": data.get("lastName"),
        "emailVerified": data.get("emailVerified", False),
        "gender": data.get("gender"),
        "birthDate": data.get("birthDate"),
        "heightCm": data.get("heightCm"),
        "weightKg": data.get("weightKg"),
        "activityLevel": data.get("activityLevel"),
        "primaryGoal": data.get("primaryGoal"),
        "targetWeight": data.get("targetWeight"),
        "weeklyRunGoal": data.get("weeklyRunGoal"),
        "petRewardGoal": data.get("petRewardGoal"),
        "units": data.get("units"),
        "notifications": data.get("notifications"),
        "dailyCalories": data.get("dailyCalories"),
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
    
    # Basic Information
    if payload.display_name is not None:
        update_map["displayName"] = payload.display_name
    if payload.gender is not None:
        update_map["gender"] = payload.gender
    if payload.birth_date is not None:
        update_map["birthDate"] = payload.birth_date.isoformat()
    
    # Health Metrics
    if payload.height_cm is not None:
        update_map["heightCm"] = float(payload.height_cm)
    if payload.weight_kg is not None:
        update_map["weightKg"] = float(payload.weight_kg)
    if payload.activity_level is not None:
        update_map["activityLevel"] = payload.activity_level
    
    # Fitness Goals
    if payload.primary_goal is not None:
        update_map["primaryGoal"] = payload.primary_goal
    if payload.target_weight_kg is not None:
        update_map["targetWeight"] = float(payload.target_weight_kg)
    if payload.weekly_run_goal is not None:
        update_map["weeklyRunGoal"] = payload.weekly_run_goal
    if payload.pet_reward_goal is not None:
        update_map["petRewardGoal"] = payload.pet_reward_goal
    
    # Preferences
    if payload.units is not None:
        update_map["units"] = payload.units
    if payload.notifications is not None:
        update_map["notifications"] = payload.notifications

    if not update_map:
        return {"updated": False, "message": "No valid fields provided"}

    update_map["updatedAt"] = firestore.SERVER_TIMESTAMP  # type: ignore[name-defined]

    try:
        db.collection("users").document(uid).set(update_map, merge=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update profile: {e}")

    return {"updated": True}

# Password change endpoint
@router.post("/change-password", response_model=PasswordChangeResponse)
def change_password(payload: PasswordChangeRequest, user=Depends(get_current_user)):
    """
    Change user password
    """
    uid = user.get("uid")
    email = user.get("email")
    
    try:
        # First, verify the current password by attempting to sign in
        verify_url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={settings.FIREBASE_WEB_API_KEY}"
        verify_payload = {
            "email": email,
            "password": payload.current_password,
            "returnSecureToken": True
        }
        
        verify_response = httpx.post(verify_url, json=verify_payload, timeout=10.0)
        
        if verify_response.status_code != 200:
            return PasswordChangeResponse(
                success=False,
                message="Current password is incorrect"
            )
        
        # If current password is correct, update to new password using Firebase Admin SDK
        firebase_auth.update_user(uid, password=payload.new_password)
        
        return PasswordChangeResponse(
            success=True,
            message="Password changed successfully"
        )
        
    except firebase_auth.UserNotFoundError:
        return PasswordChangeResponse(
            success=False,
            message="User not found"
        )
    except Exception as e:
        print(f"❌ Password change error: {e}")
        return PasswordChangeResponse(
            success=False,
            message=f"Failed to change password: {str(e)}"
        )

# Health check
@router.get("/health")
def health():
    return {"status": "ok", "service": "users"}