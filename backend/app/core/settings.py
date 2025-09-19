# app/core/settings.py
import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Load environment variables from .env file (for local development)
env_file = BASE_DIR / "config" / ".env"
if env_file.exists():
    load_dotenv(env_file)

class Settings:
    # Firebase Configuration
    FIREBASE_WEB_API_KEY = os.getenv("FIREBASE_API_KEY")
    FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID")
    
    # For local development, use file path
    # For production (Cloud Run), use environment variable for service account JSON
    GOOGLE_APPLICATION_CREDENTIALS = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if not GOOGLE_APPLICATION_CREDENTIALS:
        local_creds = BASE_DIR / "config" / "firebase_service_account.json"
        if local_creds.exists():
            GOOGLE_APPLICATION_CREDENTIALS = str(local_creds)

    # FatSecret API Configuration
    FATSECRET_CLIENT_ID = os.getenv("FATSECRET_CLIENT_ID")
    FATSECRET_CLIENT_SECRET = os.getenv("FATSECRET_CLIENT_SECRET")
    FATSECRET_BASE_URL = os.getenv("FATSECRET_BASE_URL", "https://platform.fatsecret.com/rest/server.api")
    FATSECRET_TOKEN_URL = os.getenv("FATSECRET_TOKEN_URL", "https://oauth.fatsecret.com/connect/token")

    # CORS Configuration
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")
    
    # Environment detection
    ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
    DEBUG = os.getenv("DEBUG", "True").lower() == "true"
    
    # Cloud Run specific
    PORT = int(os.getenv("PORT", "8000"))

settings = Settings()
