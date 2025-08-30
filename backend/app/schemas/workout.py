from pydantic import BaseModel
from typing import List, Optional

class SetModel(BaseModel):
    reps: int
    weight_kg: float
    rpe: Optional[int]

class ExerciseModel(BaseModel):
    exercise_name: str
    sets: List[SetModel]

class WorkoutSessionRequest(BaseModel):
    workout_name: str
    exercises: List[ExerciseModel]

class WorkoutSessionResponse(WorkoutSessionRequest):
    id: str
