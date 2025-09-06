from pydantic import BaseModel, Field
from typing import List, Optional

# Single GPS point
class LocationPoint(BaseModel):
    lat: float
    lng: float
    t_ms: int  # timestamp in milliseconds

# Start a workout
class WorkoutStartRequest(BaseModel):
    workout_type: str = "run"
    start_time_ms: int

# Add multiple GPS points at once
class WorkoutAddPointsRequest(BaseModel):
    session_id: str
    points: List[LocationPoint] = Field(default_factory=list)

# Finish a workout
class WorkoutFinishRequest(BaseModel):
    session_id: str
    end_time_ms: int

# List / detail response
class WorkoutSessionResponse(BaseModel):
    id: str
    workout_type: str
    start_time_ms: int
    end_time_ms: Optional[int] = None
    distance_m: float = 0.0
    duration_s: float = 0.0
    pace_min_per_km: Optional[float] = None
    points_count: int = 0
    status: str = "active"