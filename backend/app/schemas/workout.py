from pydantic import BaseModel, Field
from typing import List, Optional

# Single GPS point
class LocationPoint(BaseModel):
    lat: float
    lng: float
    t_s: int  # timestamp in seconds

# Start a workout
class WorkoutStartRequest(BaseModel):
    workout_type: str = "run"
    start_time_s: int

# Add multiple GPS points at once
class WorkoutAddPointsRequest(BaseModel):
    session_id: str
    points: List[LocationPoint] = Field(default_factory=list)

# Finish a workout
class WorkoutFinishRequest(BaseModel):
    session_id: str
    end_time_s: int

# List / detail response
class WorkoutSessionResponse(BaseModel):
    id: str
    workout_type: str
    start_time_s: int
    end_time_s: Optional[int] = None
    distance_m: float = 0.0
    duration_s: float = 0.0
    pace_min_per_km: Optional[float] = None
    points_count: int = 0
    calories: Optional[float] = None
    status: str = "active"

class WorkoutStatsItem(BaseModel):
    period: str
    total_distance_m: float
    total_duration_s: float
    average_pace_min_per_km: Optional[float] = None
    total_calories: float
