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
    return {
        "uid": user.get("uid"),
        "email": user.get("email"),
        "name": user.get("name"),
        "provider": user.get("firebase", {}).get("sign_in_provider"),
    }

