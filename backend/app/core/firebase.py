# app/core/firebase.py
import firebase_admin
from firebase_admin import credentials, auth as fb_auth, firestore
from .settings import settings

def init_firebase():
    if not firebase_admin._apps:
        cred = credentials.Certificate(str(settings.GOOGLE_APPLICATION_CREDENTIALS))
        firebase_admin.initialize_app(cred)
    return firestore.client()

db = init_firebase()
auth_client = fb_auth
