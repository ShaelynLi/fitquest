from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.settings import settings
from app.api.auth import router as auth_router
from app.api.workout import router as workout_router
from app.api.users import router as users_router
from app.api.foods import router as foods_router
from app.api.gamification import router as gamification_router
from app.core.firebase import db, auth_client
from app.services.fatsecret import fatsecret_service
import os

app = FastAPI(
    title="FitQuest API",
    description="A gamified health companion API",
    version="1.0.0",
)

# Enhanced CORS configuration for production
production_origins = [
    "http://localhost:19006",  # Expo dev
    "http://localhost:3000",   # React dev
    "http://localhost:5173",   # Vite dev
    "https://*.web.app",       # Firebase Hosting
    "https://*.firebaseapp.com",  # Firebase Hosting
]

# Use environment-specific CORS origins
cors_origins = settings.CORS_ORIGINS if settings.CORS_ORIGINS != ["*"] else production_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "ok", "message": "FitQuest API is running"}

@app.get("/health")
async def health_check():
    """Aggregated health check for core dependencies."""
    # Firebase Auth check
    auth_ok = False
    auth_error = None
    try:
        # Test auth client with a simple operation
        users_page = auth_client.list_users(max_results=1)  # type: ignore[attr-defined]
        # Just check if we can get the page object
        _ = users_page.users
        auth_ok = True
    except Exception as e:
        auth_error = str(e)

    # Firestore check
    firestore_ok = False
    firestore_error = None
    try:
        if db is not None:
            # Use a valid collection name for health check
            _ = db.collection("health_check").document("ping").get()
            firestore_ok = True
        else:
            firestore_error = "Firestore client is None"
    except Exception as e:
        firestore_error = str(e)

    # FatSecret check (lightweight)
    fatsecret_ok = False
    fatsecret_error = None
    try:
        _ = await fatsecret_service.search_foods("apple", 0, 1)
        fatsecret_ok = True
    except Exception as e:
        fatsecret_error = str(e)

    overall_ok = auth_ok and firestore_ok and fatsecret_ok
    return {
        "status": "ok" if overall_ok else "degraded",
        "service": "fitquest-api",
        "dependencies": {
            "firebase_auth": {"ok": auth_ok, "error": auth_error},
            "firestore": {"ok": firestore_ok, "error": firestore_error},
            "fatsecret": {"ok": fatsecret_ok, "error": fatsecret_error},
        },
    }

@app.get("/api/health")
async def api_health_check():
    """API aggregated health check (same as root /health)."""
    return await health_check()

@app.get("/api")
def api_root():
    """API root endpoint"""
    return {"status": "ok", "message": "FitQuest API is running", "version": "1.0.0"}

# API Routes
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(workout_router, prefix="/workouts", tags=["workouts"])
app.include_router(users_router, prefix="/users", tags=["users"])
app.include_router(foods_router)
app.include_router(gamification_router)

# API Routes with /api prefix for Firebase Hosting reverse proxy
app.include_router(auth_router, prefix="/api/auth", tags=["api-auth"])
app.include_router(workout_router, prefix="/api/workouts", tags=["api-workouts"])
app.include_router(users_router, prefix="/api/users", tags=["api-users"])
app.include_router(foods_router, prefix="/api")
app.include_router(gamification_router, prefix="/api")
