# app/api/auth.py
import httpx
from fastapi import APIRouter, HTTPException, status, Depends, Header
from firebase_admin import firestore
from app.core.firebase import auth_client, db
from app.core.settings import settings
from app.schemas.users import RegisterRequest, LoginRequest, TokenResponse
from app.dependencies.auth import get_current_user

router = APIRouter()

def _firebase_error_to_http(detail: str) -> HTTPException:
    mapping = {
        "EMAIL_EXISTS": ("Email exists", status.HTTP_409_CONFLICT),
        "OPERATION_NOT_ALLOWED": ("Login method not supported", status.HTTP_400_BAD_REQUEST),
        "TOO_MANY_ATTEMPTS_TRY_LATER": ("Too many times, try later", status.HTTP_429_TOO_MANY_REQUESTS),
        "EMAIL_NOT_FOUND": ("Email doesn't exist", status.HTTP_404_NOT_FOUND),
        "INVALID_PASSWORD": ("Password error", status.HTTP_401_UNAUTHORIZED),
        "USER_DISABLED": ("This account is blocked", status.HTTP_403_FORBIDDEN),
    }
    msg, code = mapping.get(detail, (detail or "Firebase credit failed", status.HTTP_400_BAD_REQUEST))
    return HTTPException(status_code=code, detail=msg)

@router.get("/health")
def health():
    return {"status": "ok", "service": "auth"}

@router.get("/firebase-health")
def firebase_health():
    """Active check against Firebase Auth and Firestore.

    Returns status booleans and simple diagnostics to confirm connectivity and credentials.
    """
    auth_ok = False
    firestore_ok = False
    auth_error = None
    firestore_error = None

    # Check Firebase Auth by listing at most one user (requires valid credentials)
    try:
        # list_users returns an iterator; requesting one item forces an authenticated call
        iterator = auth_client.list_users(page_size=1)  # type: ignore[attr-defined]
        # Attempt to advance once (without consuming all)
        next(iterator.iterate_all(), None)
        auth_ok = True
    except Exception as e:  # pragma: no cover - diagnostics endpoint
        auth_error = str(e)

    # Check Firestore by performing a lightweight read
    try:
        if db is not None:
            # Read a non-existent doc to avoid writes; this still validates connectivity/permissions
            _ = db.collection("__health__").document("_ping").get()
            firestore_ok = True
        else:
            firestore_error = "Firestore client is None"
    except Exception as e:  # pragma: no cover - diagnostics endpoint
        firestore_error = str(e)

    overall_ok = auth_ok and firestore_ok
    return {
        "status": "ok" if overall_ok else "degraded",
        "auth_ok": auth_ok,
        "firestore_ok": firestore_ok,
        "auth_error": auth_error,
        "firestore_error": firestore_error,
    }

@router.post("/register", response_model=TokenResponse)
def register(req: RegisterRequest):
    #avoid replecation
    try:
        auth_client.get_user_by_email(req.email)
        raise HTTPException(status_code=409, detail="Email address has been registered")
    except auth_client.UserNotFoundError:  # type: ignore[attr-defined]
        pass

    #create firebase user
    try:
        user = auth_client.create_user(
            email=req.email,
            password=req.password,
            display_name=req.display_name or "",
            disabled=False,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create the user: {e}")

    #save user information
    try:
        db.collection("users").document(user.uid).set({
            "email": req.email,
            "displayName": req.display_name or "",
            "emailVerified": False,
            "gender": req.gender,
            "birthDate": req.birth_date.isoformat(),
            "heightCm": req.height_cm,
            "weightKg": req.weight_kg,
            "createdAt": firestore.SERVER_TIMESTAMP,  # type: ignore[name-defined]
        }, merge=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"failed to create user data: {e}")

    #using user's passwork to get token -- to send email
    signin_url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={settings.FIREBASE_WEB_API_KEY}"
    signin_payload = {"email": req.email, "password": req.password, "returnSecureToken": True}
    r = httpx.post(signin_url, json=signin_payload, timeout=10.0)
    if r.status_code != 200:
        detail = (r.json().get("error", {}) or {}).get("message", "REGISTER_LOGIN_FAILED")
        raise _firebase_error_to_http(detail)
    data = r.json()
    id_token = data["idToken"]

    #ensure email is sent
    oob_url = f"https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key={settings.FIREBASE_WEB_API_KEY}"
    oob_payload = {"requestType": "VERIFY_EMAIL", "idToken": id_token}
    oob = httpx.post(oob_url, json=oob_payload, timeout=10.0)
    if oob.status_code != 200:
        detail = (oob.json().get("error", {}) or {}).get("message", "SEND_VERIFY_EMAIL_FAILED")
        raise _firebase_error_to_http(detail)

    #return token response
    return TokenResponse(
        id_token=id_token,
        refresh_token=data["refreshToken"],
        expires_in=int(data["expiresIn"]),
        local_id=data["localId"],
    )

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest):
    #verify password
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={settings.FIREBASE_WEB_API_KEY}"
    payload = {"email": req.email, "password": req.password, "returnSecureToken": True}
    r = httpx.post(url, json=payload, timeout=10.0)
    if r.status_code != 200:
        detail = (r.json().get("error", {}) or {}).get("message", "LOGIN_FAILED")
        raise _firebase_error_to_http(detail)

    data = r.json()
    uid = data["localId"]

    #only allows users who verified their emails to login
    try:
        user_record = auth_client.get_user(uid)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid user")

    if not user_record.email_verified:
        #resend email for people who didn't verify
        try:
            oob_url = f"https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key={settings.FIREBASE_WEB_API_KEY}"
            httpx.post(oob_url, json={"requestType": "VERIFY_EMAIL", "idToken": data["idToken"]}, timeout=10.0)
        except Exception:
            pass
        raise HTTPException(status_code=403, detail="Email not verified. Verification email sent, please check your inbox.")
    
    # Sync Firestore emailVerified status when user logs in
    try:
        db.collection("users").document(uid).update({
            "emailVerified": True,
            "emailVerifiedAt": firestore.SERVER_TIMESTAMP
        })
        print(f"✅ Updated emailVerified status for {req.email}")
    except Exception as e:
        print(f"⚠️ Failed to update emailVerified status: {e}")

    #return token
    return TokenResponse(
        id_token=data["idToken"],
        refresh_token=data["refreshToken"],
        expires_in=int(data["expiresIn"]),
        local_id=uid,
    )

@router.post("/auth/resend-verification")
def resend_verification_email(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="lack of Bearer tokens")
    id_token = authorization.split(" ", 1)[1].strip()

    try:
        decoded = auth_client.verify_id_token(id_token)
    except Exception:
        raise HTTPException(status_code=401, detail="token expired")

    uid = decoded.get("uid")
    if not uid:
        raise HTTPException(status_code=401, detail="invalid token payload")

    # if have verified email, then skip
    try:
        user_record = auth_client.get_user(uid)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid user")

    if user_record.email_verified:
        raise HTTPException(status_code=409, detail="Email already verified")

    oob_url = f"https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key={settings.FIREBASE_WEB_API_KEY}"
    payload = {"requestType": "VERIFY_EMAIL", "idToken": id_token}

    r = httpx.post(oob_url, json=payload, timeout=10.0)
    if r.status_code != 200:
        detail = (r.json().get("error", {}) or {}).get("message", "SEND_VERIFY_EMAIL_FAILED")
        raise HTTPException(status_code=400, detail=detail)

    return {
        "message": "Verification email re-sent. Please check your inbox (and spam).",
        "email": user_record.email,
    }

@router.get("/me")
def me(user=Depends(get_current_user)):
    """Get current user information including profile data from Firestore"""
    try:
        # Get basic user info from Firebase Auth
        basic_info = {
            "uid": user.get("uid"),
            "email": user.get("email"),
            "name": user.get("name"),
            "provider": user.get("firebase", {}).get("sign_in_provider"),
        }
        
        # Try to get additional profile data from Firestore
        try:
            user_doc = db.collection("users").document(user["uid"]).get()
            if user_doc.exists:
                user_data = user_doc.to_dict()
                # Add important profile fields
                basic_info["petRewardGoal"] = user_data.get("petRewardGoal")
                basic_info["weeklyRunGoal"] = user_data.get("weeklyRunGoal")
                basic_info["primaryGoal"] = user_data.get("primaryGoal")
                basic_info["units"] = user_data.get("units")
                # Add any other fields that might be useful
                basic_info["displayName"] = user_data.get("displayName")
                basic_info["dateOfBirth"] = user_data.get("dateOfBirth")
                basic_info["gender"] = user_data.get("gender")
        except Exception as e:
            print(f"⚠️ Could not load user profile from Firestore: {e}")
            # Continue with basic info only
        
        return basic_info
        
    except Exception as e:
        print(f"❌ Error in /me endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get user info: {e}")

@router.get("/email-status/{email}")
def check_email_status(email: str):
    """Check if email verification was sent and user verification status"""
    try:
        user_record = auth_client.get_user_by_email(email)
        
        # Sync Firestore emailVerified with Firebase Auth status
        if user_record.email_verified:
            try:
                db.collection("users").document(user_record.uid).update({
                    "emailVerified": True,
                    "emailVerifiedAt": firestore.SERVER_TIMESTAMP
                })
                print(f"✅ Synced emailVerified status for {email}")
            except Exception as e:
                print(f"⚠️ Failed to sync emailVerified status: {e}")
        
        return {
            "email": email,
            "email_verified": user_record.email_verified,
            "user_exists": True,
            "created_at": user_record.user_metadata.get("creation_time"),
            "last_sign_in": user_record.user_metadata.get("last_sign_in_time"),
        }
    except auth_client.UserNotFoundError:
        return {
            "email": email,
            "email_verified": False,
            "user_exists": False,
            "error": "User not found"
        }
    except Exception as e:
        return {
            "email": email,
            "error": str(e)
        }

@router.post("/sync-email-verification")
def sync_all_email_verification():
    """Sync all users' emailVerified status in Firestore with Firebase Auth"""
    try:
        # Get all users from Firestore
        users_ref = db.collection("users")
        docs = users_ref.stream()
        
        synced_count = 0
        error_count = 0
        
        for doc in docs:
            try:
                user_data = doc.to_dict()
                email = user_data.get("email")
                uid = doc.id
                
                if not email:
                    continue
                
                # Get Firebase Auth user record
                user_record = auth_client.get_user(uid)
                
                # Update Firestore if status differs
                firestore_verified = user_data.get("emailVerified", False)
                auth_verified = user_record.email_verified
                
                if firestore_verified != auth_verified:
                    doc.reference.update({
                        "emailVerified": auth_verified,
                        "emailVerifiedAt": firestore.SERVER_TIMESTAMP if auth_verified else None
                    })
                    synced_count += 1
                    print(f"✅ Synced {email}: {firestore_verified} → {auth_verified}")
                
            except Exception as e:
                error_count += 1
                print(f"❌ Failed to sync user {doc.id}: {e}")
        
        return {
            "message": f"Email verification sync completed",
            "synced_users": synced_count,
            "errors": error_count,
            "total_processed": synced_count + error_count
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sync failed: {e}")

@router.post("/check-verification")
def check_email_verification_status(request: dict):
    """Check if email is verified without requiring authentication"""
    try:
        email = request.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="Email is required")
        
        print(f"🔍 Checking verification status for: {email}")
        user_record = auth_client.get_user_by_email(email)
        print(f"📧 User found: {user_record.email}, verified: {user_record.email_verified}")
        
        return {
            "email": email,
            "email_verified": user_record.email_verified,
            "user_exists": True,
            "uid": user_record.uid
        }
    except auth_client.UserNotFoundError:
        print(f"❌ User not found: {email}")
        return {
            "email": email,
            "email_verified": False,
            "user_exists": False,
            "error": "User not found"
        }
    except Exception as e:
        print(f"❌ Error checking verification: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to check verification status: {e}")

@router.get("/debug-user/{email}")
def debug_user_status(email: str):
    """Debug endpoint to check user status in Firebase Auth"""
    try:
        print(f"🔍 Debug: Checking user status for: {email}")
        user_record = auth_client.get_user_by_email(email)
        print(f"📧 Debug: User found - Email: {user_record.email}, Verified: {user_record.email_verified}")
        
        return {
            "email": user_record.email,
            "email_verified": user_record.email_verified,
            "disabled": user_record.disabled,
            "uid": user_record.uid,
            "created_at": getattr(user_record.user_metadata, "creation_time", None),
            "last_sign_in": getattr(user_record.user_metadata, "last_sign_in_time", None),
            "provider_data": [{"provider_id": provider.provider_id, "email": provider.email} for provider in user_record.provider_data],
        }
    except auth_client.UserNotFoundError:
        print(f"❌ Debug: User not found: {email}")
        return {"error": "User not found", "email": email}
    except Exception as e:
        print(f"❌ Debug: Error: {e}")
        return {"error": str(e), "email": email}
