# app/api/auth.py
import httpx
from fastapi import APIRouter, HTTPException, status, Depends
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
    try:
        auth_client.get_user_by_email(req.email)
        raise HTTPException(status_code=409, detail="Email address has been registered")
    except auth_client.UserNotFoundError:  # type: ignore[attr-defined]
        pass

    # create user
    try:
        user = auth_client.create_user(
            email=req.email,
            password=req.password,
            display_name=req.display_name or "",
            disabled=False,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create the user: {e}")

    # initialize firebase data
    try:
        db.collection("users").document(user.uid).set({
            "email": req.email,
            "displayName": req.display_name or "",
            "createdAt": firestore.SERVER_TIMESTAMP,  # type: ignore[name-defined]
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"failed to create user data: {e}")

    # get the user id-token
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={settings.FIREBASE_WEB_API_KEY}"
    payload = {"email": req.email, "password": req.password, "returnSecureToken": True}
    r = httpx.post(url, json=payload, timeout=10.0)
    if r.status_code != 200:
        detail = (r.json().get("error", {}) or {}).get("message", "REGISTER_LOGIN_FAILED")
        raise _firebase_error_to_http(detail)

    data = r.json()
    return TokenResponse(
        id_token=data["idToken"],
        refresh_token=data["refreshToken"],
        expires_in=int(data["expiresIn"]),
        local_id=data["localId"],
    )

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest):
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={settings.FIREBASE_WEB_API_KEY}"
    payload = {"email": req.email, "password": req.password, "returnSecureToken": True}
    r = httpx.post(url, json=payload, timeout=10.0)
    if r.status_code != 200:
        detail = (r.json().get("error", {}) or {}).get("message", "LOGIN_FAILED")
        raise _firebase_error_to_http(detail)

    data = r.json()
    return TokenResponse(
        id_token=data["idToken"],
        refresh_token=data["refreshToken"],
        expires_in=int(data["expiresIn"]),
        local_id=data["localId"],
    )

@router.get("/me")
def me(user=Depends(get_current_user)):
    return {
        "uid": user.get("uid"),
        "email": user.get("email"),
        "name": user.get("name"),
        "provider": user.get("firebase", {}).get("sign_in_provider"),
    }
