"""
Workout utility functions for data processing and calculations
"""

from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Tuple
import math

def create_time_info(timestamp_ms: int, timezone_str: str = None, timezone_offset_hours: float = None) -> Dict:
    """
    Create comprehensive time information from timestamp
    Automatically detects user timezone or uses provided timezone info
    """
    # Determine timezone
    if timezone_offset_hours is not None:
        # Use provided timezone offset (from frontend)
        user_tz = timezone(timedelta(hours=timezone_offset_hours))
        tz_name = f"UTC{'+' if timezone_offset_hours >= 0 else ''}{timezone_offset_hours}"
    elif timezone_str:
        # Use provided timezone string
        if timezone_str.startswith("UTC"):
            # Parse UTC offset like "UTC+11" or "UTC-5"
            offset_str = timezone_str[3:]
            offset_hours = float(offset_str)
            user_tz = timezone(timedelta(hours=offset_hours))
            tz_name = timezone_str
        else:
            # Assume it's a named timezone (fallback to UTC)
            user_tz = timezone.utc
            tz_name = timezone_str
    else:
        # Default to UTC if no timezone info provided
        user_tz = timezone.utc
        tz_name = "UTC"
    
    # Convert timestamp to user timezone
    dt = datetime.fromtimestamp(timestamp_ms / 1000, tz=user_tz)
    
    return {
        "timestamp": timestamp_ms,
        "iso": dt.isoformat(),  # With timezone info: 2025-10-03T21:15:20.747+11:00
        "iso_local": dt.strftime("%Y-%m-%dT%H:%M:%S"),  # Without timezone info: 2025-10-03T21:15:20
        "date": dt.strftime("%Y-%m-%d"),
        "time": dt.strftime("%H:%M:%S"),
        "timezone": tz_name,
        "timezone_offset": timezone_offset_hours
    }

def calculate_distance_info(meters: float) -> Dict:
    """
    Convert distance from meters to multiple units
    """
    return {
        "meters": round(meters, 2),
        "kilometers": round(meters / 1000, 3),
        "miles": round(meters / 1609.34, 3)
    }

def calculate_duration_info(seconds: float) -> Dict:
    """
    Convert duration from seconds to multiple formats
    """
    minutes = seconds / 60
    hours = minutes / 60
    
    if hours >= 1:
        formatted = f"{int(hours)}h {int(minutes % 60)}m"
    else:
        formatted = f"{int(minutes)}m {int(seconds % 60)}s"
    
    return {
        "seconds": round(seconds, 2),
        "minutes": round(minutes, 2),
        "formatted": formatted
    }

def calculate_pace_info(distance_m: float, duration_s: float) -> Dict:
    """
    Calculate pace in multiple units
    """
    if distance_m <= 0 or duration_s <= 0:
        return {
            "min_per_km": 0,
            "min_per_mile": 0,
            "km_per_hour": 0,
            "mph": 0
        }
    
    distance_km = distance_m / 1000
    distance_miles = distance_m / 1609.34
    
    min_per_km = (duration_s / 60) / distance_km
    min_per_mile = (duration_s / 60) / distance_miles
    km_per_hour = distance_km / (duration_s / 3600)
    mph = distance_miles / (duration_s / 3600)
    
    return {
        "min_per_km": round(min_per_km, 2),
        "min_per_mile": round(min_per_mile, 2),
        "km_per_hour": round(km_per_hour, 2),
        "mph": round(mph, 2)
    }

def calculate_calories_burned(
    distance_km: float, 
    user_weight_kg: float = 70.0, 
    workout_type: str = "run",
    pace_min_per_km: float = 6.0
) -> Dict:
    """
    Calculate calories burned based on distance, weight, and pace
    """
    if distance_km <= 0 or user_weight_kg <= 0:
        return {
            "burned": 0,
            "estimated": True,
            "formula": "distance_based",
            "user_weight": user_weight_kg
        }
    
    # Base calorie burn per km (varies by pace)
    base_calories_per_km = user_weight_kg * 1.0
    
    # Adjust for pace (faster = more calories)
    # Handle None or invalid pace values
    if pace_min_per_km is None or pace_min_per_km <= 0:
        pace_min_per_km = 8.0  # Default to slow pace
    
    if pace_min_per_km < 5.0:  # Very fast
        pace_factor = 1.3
    elif pace_min_per_km < 6.0:  # Fast
        pace_factor = 1.2
    elif pace_min_per_km < 7.0:  # Moderate
        pace_factor = 1.1
    elif pace_min_per_km < 8.0:  # Slow
        pace_factor = 1.0
    else:  # Very slow
        pace_factor = 0.9
    
    # Adjust for workout type
    type_factors = {
        "run": 1.0,
        "walk": 0.6,
        "cycle": 0.4,
        "swim": 1.5,
        "gym": 0.8,
        "other": 0.7
    }
    
    type_factor = type_factors.get(workout_type, 1.0)
    
    calories = distance_km * base_calories_per_km * pace_factor * type_factor
    
    return {
        "burned": round(calories, 1),
        "estimated": True,
        "formula": "distance_based",
        "user_weight": user_weight_kg
    }

def analyze_workout_intensity(pace_min_per_km: float, duration_s: float) -> Dict:
    """
    Analyze workout intensity based on pace and duration
    """
    # Handle None or invalid pace values
    if pace_min_per_km is None or pace_min_per_km <= 0:
        pace_min_per_km = 10.0  # Default to slow pace for safety
    
    # Determine intensity level
    if pace_min_per_km < 5.0:
        intensity = "very_high"
        effort_level = 5
    elif pace_min_per_km < 6.0:
        intensity = "high"
        effort_level = 4
    elif pace_min_per_km < 7.0:
        intensity = "moderate"
        effort_level = 3
    elif pace_min_per_km < 8.0:
        intensity = "low"
        effort_level = 2
    else:
        intensity = "low"
        effort_level = 1
    
    # Calculate zones (simplified)
    zones = {
        "warmup": max(60, int(duration_s * 0.1)),  # 10% of duration
        "active": int(duration_s * 0.8),  # 80% of duration
        "cooldown": max(60, int(duration_s * 0.1))  # 10% of duration
    }
    
    return {
        "intensity": intensity,
        "effort_level": effort_level,
        "zones": zones,
        "pace_consistency": 0.85  # Placeholder - would need actual pace data
    }

def calculate_route_info(points: List[Dict]) -> Dict:
    """
    Calculate route information from GPS points
    """
    if not points:
        return {
            "points_count": 0,
            "total_elevation_gain": 0,
            "total_elevation_loss": 0,
            "elevation_profile": []
        }
    
    elevation_gain = 0
    elevation_loss = 0
    elevation_profile = []
    
    for i in range(1, len(points)):
        current_alt = points[i].get("altitude", 0)
        previous_alt = points[i-1].get("altitude", 0)
        
        if current_alt > previous_alt:
            elevation_gain += current_alt - previous_alt
        else:
            elevation_loss += previous_alt - current_alt
        
        elevation_profile.append(current_alt)
    
    return {
        "points_count": len(points),
        "total_elevation_gain": round(elevation_gain, 2),
        "total_elevation_loss": round(elevation_loss, 2),
        "elevation_profile": elevation_profile
    }

def create_enhanced_workout_data(
    session_id: str,
    workout_type: str,
    start_time_ms: int,
    end_time_ms: int,
    distance_m: float,
    points: List[Dict],
    user_weight_kg: float = 70.0
) -> Dict:
    """
    Create enhanced workout data with all calculated fields
    """
    duration_s = (end_time_ms - start_time_ms) / 1000
    distance_km = distance_m / 1000
    pace_min_per_km = (duration_s / 60) / distance_km if distance_km > 0 else 0
    
    return {
        "id": session_id,
        "workout_type": workout_type,
        "status": "finished",
        
        # Time information
        "start_time": create_time_info(start_time_ms),
        "end_time": create_time_info(end_time_ms),
        
        # Distance and duration
        "distance": calculate_distance_info(distance_m),
        "duration": calculate_duration_info(duration_s),
        "pace": calculate_pace_info(distance_m, duration_s),
        
        # Health data
        "calories": calculate_calories_burned(distance_km, user_weight_kg, workout_type, pace_min_per_km),
        
        # Route data
        "route": calculate_route_info(points),
        
        # Analysis
        "analysis": analyze_workout_intensity(pace_min_per_km, duration_s),
        
        # Metadata
        "created_at": create_time_info(start_time_ms)["iso"],
        "updated_at": create_time_info(end_time_ms)["iso"],
        "user_id": "user_placeholder",  # Will be set by the calling function
        "device_info": {
            "platform": "mobile",
            "app_version": "1.0.0"
        }
    }
