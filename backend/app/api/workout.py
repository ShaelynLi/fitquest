from fastapi import APIRouter, HTTPException, Depends
from app.core.firebase import db
from app.dependencies.auth import get_current_user
from app.schemas.workout import WorkoutSessionRequest, WorkoutSessionResponse

router = APIRouter()

@router.post("/", response_model=WorkoutSessionResponse)
def create_workout(session: WorkoutSessionRequest, user=Depends(get_current_user)):
    try:
        doc_ref = db.collection("users").document(user["uid"]).collection("workout_sessions").document()
        doc_ref.set(session.dict())
        return {"id": doc_ref.id, **session.dict()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create workout session: {e}")

@router.get("/", response_model=list[WorkoutSessionResponse])
def get_workouts(user=Depends(get_current_user)):
    try:
        docs = db.collection("users").document(user["uid"]).collection("workout_sessions").stream()
        return [{"id": doc.id, **doc.to_dict()} for doc in docs]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get workouts: {e}")
