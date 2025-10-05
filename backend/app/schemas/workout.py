from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# Single GPS point with enhanced data
class LocationPoint(BaseModel):
    lat: float
    lng: float
    t_ms: float  # timestamp in milliseconds (allows sub-millisecond precision)
    altitude: Optional[float] = None
    accuracy: Optional[float] = None
    speed: Optional[float] = None  # m/s
    heading: Optional[float] = None  # degrees

# Start a workout
class WorkoutStartRequest(BaseModel):
    workout_type: str = "run"
    start_time_ms: int
    timezone_offset: Optional[float] = None  # User's timezone offset in hours

# Add multiple GPS points at once
class WorkoutAddPointsRequest(BaseModel):
    session_id: str
    points: List[LocationPoint] = Field(default_factory=list)

# Finish a workout
class WorkoutFinishRequest(BaseModel):
    session_id: str
    end_time_ms: int
    timezone_offset: Optional[float] = None  # User's timezone offset in hours

# Complete workout data from frontend
class CompleteWorkoutRequest(BaseModel):
    session_id: str
    workout_type: str = "run"
    
    # Time information (from frontend)
    start_time: Dict[str, Any]  # {timestamp, timezone, timezoneOffset}
    end_time: Dict[str, Any]    # {timestamp, timezone, timezoneOffset}
    
    # GPS trajectory data
    gps_points: List[Dict[str, Any]] = Field(default_factory=list)
    
    # Calculated metrics (from frontend)
    calculated_metrics: Dict[str, Any] = Field(default_factory=dict)

# Enhanced time information
class TimeInfo(BaseModel):
    timestamp: int  # milliseconds
    iso: str  # ISO 8601 format
    date: str  # YYYY-MM-DD
    time: str  # HH:MM:SS
    timezone: str = "UTC"

# Distance information in multiple units
class DistanceInfo(BaseModel):
    meters: float
    kilometers: float
    miles: float

# Duration information in multiple formats
class DurationInfo(BaseModel):
    seconds: float
    minutes: float
    formatted: str  # "1m 29s"

# Pace information in multiple units
class PaceInfo(BaseModel):
    min_per_km: float
    min_per_mile: float
    km_per_hour: float
    mph: float

# Calorie information
class CalorieInfo(BaseModel):
    burned: float
    estimated: bool = True
    formula: str = "distance_based"
    user_weight: Optional[float] = None  # kg

# Route information
class RouteInfo(BaseModel):
    points_count: int
    total_elevation_gain: float = 0.0
    total_elevation_loss: float = 0.0
    elevation_profile: List[float] = Field(default_factory=list)

# Workout analysis
class WorkoutAnalysis(BaseModel):
    intensity: str  # low, moderate, high, very_high
    effort_level: int = Field(ge=1, le=5)  # 1-5 scale
    zones: Dict[str, int] = Field(default_factory=dict)  # warmup, active, cooldown
    pace_consistency: Optional[float] = None  # 0-1 scale

# List / detail response with enhanced data
class WorkoutSessionResponse(BaseModel):
    # Basic info
    id: str
    workout_type: str
    status: str = "active"
    
    # Time information
    start_time: TimeInfo
    end_time: Optional[TimeInfo] = None
    
    # Distance and duration
    distance: Optional[DistanceInfo] = None
    duration: Optional[DurationInfo] = None
    pace: Optional[PaceInfo] = None
    
    # Health data
    calories: Optional[CalorieInfo] = None
    
    # Route data
    route: Optional[RouteInfo] = None
    
    # Analysis
    analysis: Optional[WorkoutAnalysis] = None
    
    # Metadata
    created_at: str
    updated_at: str
    user_id: str