from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.settings import settings
from app.api.auth import router as auth_router
from app.api.workout import router as workout_router
from app.api.users import router as users_router
from app.api.foods import router as foods_router
from app.api.meals import router as meals_router
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
def health_check():
    """Health check endpoint for Cloud Run"""
    return {"status": "healthy", "service": "fitquest-api"}

@app.get("/api/health")
def api_health_check():
    """API health check endpoint"""
    return {"status": "ok"}

@app.get("/api")
def api_root():
    """API root endpoint"""
    return {"status": "ok", "message": "FitQuest API is running", "version": "1.0.0"}

# API Routes
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(workout_router, prefix="/workouts", tags=["workouts"])
app.include_router(users_router, prefix="/users", tags=["users"])
app.include_router(foods_router)
app.include_router(meals_router)

# API Routes with /api prefix for Firebase Hosting reverse proxy
app.include_router(auth_router, prefix="/api/auth", tags=["api-auth"])
app.include_router(workout_router, prefix="/api/workouts", tags=["api-workouts"])
app.include_router(users_router, prefix="/api/users", tags=["api-users"])
app.include_router(foods_router, prefix="/api")
app.include_router(meals_router, prefix="/api")
