# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.settings import settings
from app.api.auth import router as auth_router
from api.workout import router as workout_router 

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "ok"}

app.include_router(auth_router, prefix="/auth", tags=["auth"])

app.include_router(workout_router, prefix="/workout_sessions", tags=["workout"])
