from fastapi import APIRouter, HTTPException, Depends
from math import radians, cos, sin, asin, sqrt
from app.core.firebase import db
from app.dependencies.auth import get_current_user
from app.schemas.workout import (
    WorkoutStartRequest, WorkoutAddPointsRequest, WorkoutFinishRequest, WorkoutSessionResponse
)

router = APIRouter()

def _session_doc(uid: str, sid: str):
    return db.collection("users").document(uid).collection("workout_sessions").document(sid)

def _sessions_col(uid: str):
    return db.collection("users").document(uid).collection("workout_sessions")

# calculate distance (meters) between two GPS points using haversine formula
def _haversine_m(lat1, lng1, lat2, lng2):
    R = 6371000.0
    dlat = radians(lat2 - lat1)
    dlng = radians(lng2 - lng1)
    a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng/2)**2
    c = 2 * asin(sqrt(a))
    return R * c

# Start a new workout session
@router.post("/start", response_model=WorkoutSessionResponse)
def start_workout(req: WorkoutStartRequest, user=Depends(get_current_user)):
    try:
        doc_ref = _sessions_col(user["uid"]).document()
        start_time_s = req.start_time_s 
        doc_ref.set({
            "workout_type": req.workout_type,
            "start_time_s": start_time_s,
            "status": "active",
            "distance_m": 0.0,
            "duration_s": 0.0,
            "pace_min_per_km": None,
            "points_count": 0,
            "pause_durations": [],
            "last_pause_start": None 
        })
        # Store GPS points in subcollection to avoid large single documents
        return WorkoutSessionResponse(
            id=doc_ref.id,
            workout_type=req.workout_type,
            start_time_s=start_time_s, 
            status="active",
            distance_m=0.0,
            duration_s=0.0,
            pace_min_per_km=None,
            points_count=0,
        )
    except Exception as e:
        raise HTTPException(500, f"Failed to start workout: {e}")

# Add GPS points to an existing workout session
@router.post("/add-points", response_model=WorkoutSessionResponse)
def add_points(req: WorkoutAddPointsRequest, user=Depends(get_current_user)):
    if not req.points:
        return {"ok": True, "added": 0}

    try:
        session_ref = _session_doc(user["uid"], req.session_id)
        if not session_ref.get().exists:
            raise HTTPException(404, "Session not found")
        
        # Save points in subcollection
        batch_ref = session_ref.collection("points").document()
        batch_ref.set({
            "points": [{"lat": p.lat, "lng": p.lng, "t_s": p.t_ms / 1000} for p in req.points]
        })

        snap = session_ref.get()
        data = snap.to_dict() or {}
        current_count = data.get("points_count", 0)

        if isinstance(current_count, str):
            try:
                current_count = int(current_count)
            except ValueError:
                current_count = 0
                
        count = current_count + len(req.points)
        session_ref.update({"points_count": count})

        updated = session_ref.get().to_dict() or {}
        return WorkoutSessionResponse(
            id=req.session_id,
            workout_type=updated.get("workout_type", "run"),
            start_time_s=updated.get("start_time_s"), 
            end_time_s=updated.get("end_time_s"),  
            status=updated.get("status", "active"),
            distance_m=updated.get("distance_m", 0.0),
            duration_s=updated.get("duration_s", 0.0),
            pace_min_per_km=updated.get("pace_min_per_km"),
            points_count=updated.get("points_count", 0),
            calories=updated.get("calories")
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to add points: {e}")

# Sets the session status to "paused" and records the start time of the pause
@router.post("/pause", response_model=WorkoutSessionResponse)
def pause_workout(req: WorkoutFinishRequest, user=Depends(get_current_user)):
    session_ref = _session_doc(user["uid"], req.session_id)
    snap = session_ref.get()
    if not snap.exists:
        raise HTTPException(404, "Session not found")
    
    data = snap.to_dict() or {}
    if data.get("status") != "active":
        raise HTTPException(400, "Workout is not active")
    
    # Set status to paused and record the start time of the pause
    session_ref.update({
        "status": "paused",
        "last_pause_start": req.end_time_s  # Frontend provides the current pause start time
    })

    updated = session_ref.get().to_dict() or {}
    return WorkoutSessionResponse(
        id=session_ref.id,
        workout_type=updated.get("workout_type", "run"),
        start_time_s=updated.get("start_time_s"), 
        end_time_s=updated.get("end_time_s"), 
        status=updated.get("status", "paused"),
        distance_m=updated.get("distance_m", 0.0),
        duration_s=updated.get("duration_s", 0.0),
        pace_min_per_km=updated.get("pace_min_per_km"),
        points_count=updated.get("points_count", 0),
        calories=updated.get("calories")
    )

# Sets the session status back to "active" and saves the pause duration
@router.post("/resume", response_model=WorkoutSessionResponse)
def resume_workout(req: WorkoutFinishRequest, user=Depends(get_current_user)):
    session_ref = _session_doc(user["uid"], req.session_id)
    snap = session_ref.get()
    if not snap.exists:
        raise HTTPException(404, "Session not found")
    
    data = snap.to_dict() or {}
    if data.get("status") != "paused":
        raise HTTPException(400, "Workout is not paused")
    
    last_pause_start = data.get("last_pause_start")
    if not last_pause_start:
        raise HTTPException(400, "Pause start time missing")
    
    # Append the pause period to pause_durations
    pause_durations = data.get("pause_durations", [])
    pause_durations.append({
        "start_s": last_pause_start, 
        "end_s": req.end_time_s     # Frontend provides the current resume time
    })
    
    session_ref.update({
        "status": "active",
        "last_pause_start": None,
        "pause_durations": pause_durations
    })
    
    updated = session_ref.get().to_dict() or {}
    return WorkoutSessionResponse(
        id=session_ref.id,
        workout_type=updated.get("workout_type", "run"),
        start_time_s=updated.get("start_time_s"),  
        end_time_s=updated.get("end_time_s"), 
        status=updated.get("status", "active"),
        distance_m=updated.get("distance_m", 0.0),
        duration_s=updated.get("duration_s", 0.0),
        pace_min_per_km=updated.get("pace_min_per_km"),
        points_count=updated.get("points_count", 0),
        calories=updated.get("calories")
    )

# Finish a workout session: calculate total distance, duration (excluding pauses), pace, and calories
@router.post("/finish", response_model=WorkoutSessionResponse)
def finish_workout(req: WorkoutFinishRequest, user=Depends(get_current_user)):
    try:
        session_ref = _session_doc(user["uid"], req.session_id)
        snap = session_ref.get()
        if not snap.exists:
            raise HTTPException(404, "Session not found")

        data = snap.to_dict() or {}
        start_s = data.get("start_time_s")
        if not start_s:
            raise HTTPException(400, "Session start_time_s missing")

        # Read all GPS points and calculate total distance
        points_col = session_ref.collection("points").stream()
        pts = []
        for doc in points_col:
            chunk = doc.to_dict() or {}
            pts.extend(chunk.get("points", []))
        pts = sorted(pts, key=lambda p: p.get("t_s", 0))

        # Calculate the total distance
        total_m = 0.0
        for i in range(1, len(pts)):
            a, b = pts[i-1], pts[i]
            total_m += _haversine_m(a["lat"], a["lng"], b["lat"], b["lng"])

        # Total duration in seconds
        duration_s = max(0, req.end_time_s - start_s)

        # Subtract paused time durations
        pause_durations = data.get("pause_durations", [])
        for p in pause_durations:
            start_pause = p.get("start_s", 0)
            end_pause = p.get("end_s", 0)
            duration_s -= (end_pause - start_pause)
        duration_s = max(duration_s, 0)

        # Calculate pace (min/km)
        pace = None
        if total_m > 1:
            pace = (duration_s / 60.0) / (total_m / 1000.0)

        # Calculate calories
        user_doc = db.collection("users").document(user["uid"]).get()
        weight_kg = user_doc.to_dict().get("weight_kg", 70)  # Default weight: 70 kg

        METS = {"run": 9.8, "bike": 8.0, "gym": 6.0}
        workout_type = data.get("workout_type", "run")
        met = METS.get(workout_type, 8.0)

        duration_h = duration_s / 3600.0
        calories = met * weight_kg * duration_h

        session_ref.update({
            "end_time_s": req.end_time_s,
            "status": "finished",
            "distance_m": float(total_m),
            "duration_s": float(duration_s),
            "pace_min_per_km": pace,
            "calories": calories,
        })

        updated = session_ref.get().to_dict() or {}
        return WorkoutSessionResponse(
            id=req.session_id,
            workout_type=updated.get("workout_type", "run"),
            start_time_s=updated.get("start_time_s"), 
            end_time_s=updated.get("end_time_s"),  
            status=updated.get("status", "finished"),
            distance_m=updated.get("distance_m", 0.0),
            duration_s=updated.get("duration_s", 0.0),
            pace_min_per_km=updated.get("pace_min_per_km"),
            points_count=updated.get("points_count", 0),
            calories=updated.get("calories"),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to finish workout: {e}")

# List all workout sessions for the current user
@router.get("/", response_model=list[WorkoutSessionResponse])
def list_workouts(user=Depends(get_current_user)):
    try:
        q = _sessions_col(user["uid"]).order_by("start_time_s", direction="DESCENDING").stream()
        res = []
        for d in q:
            v = d.to_dict() or {}
            res.append(WorkoutSessionResponse(
                id=d.id,
                workout_type=v.get("workout_type", "run"),
                start_time_s=v.get("start_time_s"), 
                end_time_s=v.get("end_time_s"),   
                status=v.get("status", "active"),
                distance_m=v.get("distance_m", 0.0),
                duration_s=v.get("duration_s", 0.0),
                pace_min_per_km=v.get("pace_min_per_km"),
                points_count=v.get("points_count", 0),
            ))
        return res
    except Exception as e:
        raise HTTPException(500, f"Failed to list workouts: {e}")

# Get details of a specific workout session
@router.get("/{session_id}", response_model=WorkoutSessionResponse)
def get_workout(session_id: str, user=Depends(get_current_user)):
    try:
        snap = _session_doc(user["uid"], session_id).get()
        if not snap.exists:
            raise HTTPException(404, "Session not found")
        v = snap.to_dict() or {}
        return WorkoutSessionResponse(
            id=snap.id,
            workout_type=v.get("workout_type", "run"),
            start_time_s=v.get("start_time_s"),
            end_time_s=v.get("end_time_s"),   
            status=v.get("status", "active"),
            distance_m=v.get("distance_m", 0.0),
            duration_s=v.get("duration_s", 0.0),
            pace_min_per_km=v.get("pace_min_per_km"),
            points_count=v.get("points_count", 0),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to get workout: {e}")

# Get GPS points (trajectory) of a specific workout session
@router.get("/{session_id}/points")
def get_workout_points(session_id: str, user=Depends(get_current_user)):
    try:
        session_ref = _session_doc(user["uid"], session_id)
        snap = session_ref.get()
        if not snap.exists:
            raise HTTPException(404, "Session not found")

        points_col = session_ref.collection("points").stream()
        pts = []
        for doc in points_col:
            chunk = doc.to_dict() or {}
            pts.extend(chunk.get("points", []))

        pts = sorted(pts, key=lambda p: p.get("t_s", 0))

        return {"session_id": session_id, "points": pts}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to get workout points: {e}")
    
