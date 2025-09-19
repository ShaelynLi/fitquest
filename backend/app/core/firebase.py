# app/core/firebase.py
import os
import firebase_admin
from firebase_admin import credentials, auth as fb_auth, firestore
from .settings import settings

def init_firebase():
    if not firebase_admin._apps:
        # Check if we have credentials
        if settings.GOOGLE_APPLICATION_CREDENTIALS and os.path.exists(str(settings.GOOGLE_APPLICATION_CREDENTIALS)):
            # Use service account file
            cred = credentials.Certificate(str(settings.GOOGLE_APPLICATION_CREDENTIALS))
            firebase_admin.initialize_app(cred)
        else:
            # For testing or when credentials are set via environment variables
            # This will use default credentials (ADC) or environment variables
            firebase_admin.initialize_app()
    
    try:
        return firestore.client()
    except Exception as e:
        print(f"Warning: Could not initialize Firestore client: {e}")
        return None

# Initialize Firebase
db = init_firebase()
auth_client = fb_auth
