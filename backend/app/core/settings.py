# app/core/settings.py
import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / "config" / ".env")

class Settings:
    FIREBASE_WEB_API_KEY = os.getenv("FIREBASE_API_KEY")
    FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID")
    GOOGLE_APPLICATION_CREDENTIALS = BASE_DIR / "config" / "firebase_service_account.json"

    # FatSecret API Configuration
    FATSECRET_CLIENT_ID = os.getenv("FATSECRET_CLIENT_ID")
    FATSECRET_CLIENT_SECRET = os.getenv("FATSECRET_CLIENT_SECRET")
    FATSECRET_BASE_URL = os.getenv("FATSECRET_BASE_URL", "https://platform.fatsecret.com/rest/server.api")
    FATSECRET_TOKEN_URL = os.getenv("FATSECRET_TOKEN_URL", "https://oauth.fatsecret.com/connect/token")

    # allows all urls visit backend APIs
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")

settings = Settings()
