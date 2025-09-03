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
        doc_ref.set({
            "workout_type": req.workout_type,
            "start_time_ms": req.start_time_ms,
            "status": "active",
            "distance_m": 0.0,
            "duration_s": 0.0,
            "pace_min_per_km": None,
            "points_count": 0,
        })
        # Store GPS points in subcollection to avoid large single documents
        return WorkoutSessionResponse(
            id=doc_ref.id,
            workout_type=req.workout_type,
            start_time_ms=req.start_time_ms,
            status="active",
            distance_m=0.0,
            duration_s=0.0,
            pace_min_per_km=None,
            points_count=0,
        )
    except Exception as e:
        raise HTTPException(500, f"Failed to start workout: {e}")

# Add GPS points to an existing workout session
@router.post("/add-points")
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
            "points": [p.dict() for p in req.points]
        })

        session_ref.update({"points_count": db.field_path("points_count")})
        snap = session_ref.get()
        count = (snap.to_dict() or {}).get("points_count", 0) + len(req.points)
        session_ref.update({"points_count": count})

        return {"ok": True, "added": len(req.points)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to add points: {e}")

# Finish a workout session: calculate total distance, duration, and pace
@router.post("/finish", response_model=WorkoutSessionResponse)
def finish_workout(req: WorkoutFinishRequest, user=Depends(get_current_user)):
    try:
        session_ref = _session_doc(user["uid"], req.session_id)
        snap = session_ref.get()
        if not snap.exists:
            raise HTTPException(404, "Session not found")

        data = snap.to_dict() or {}
        start_ms = data.get("start_time_ms")
        if not start_ms:
            raise HTTPException(400, "Session start_time_ms missing")

        # Read all GPS points and calculate total distance
        points_col = session_ref.collection("points").stream()
        pts = []
        for doc in points_col:
            chunk = doc.to_dict() or {}
            pts.extend(chunk.get("points", []))

        pts = sorted(pts, key=lambda p: p.get("t_ms", 0))
        total_m = 0.0
        for i in range(1, len(pts)):
            a, b = pts[i-1], pts[i]
            total_m += _haversine_m(a["lat"], a["lng"], b["lat"], b["lng"])

        duration_s = max(0, (req.end_time_ms - start_ms) / 1000.0)
        pace = None
        if total_m > 1:
            pace = (duration_s / 60.0) / (total_m / 1000.0)  # min/km

        session_ref.update({
            "end_time_ms": req.end_time_ms,
            "status": "finished",
            "distance_m": float(total_m),
            "duration_s": float(duration_s),
            "pace_min_per_km": pace,
        })

        updated = session_ref.get().to_dict() or {}
        return WorkoutSessionResponse(
            id=req.session_id,
            workout_type=updated.get("workout_type", "run"),
            start_time_ms=updated.get("start_time_ms"),
            end_time_ms=updated.get("end_time_ms"),
            status=updated.get("status", "finished"),
            distance_m=updated.get("distance_m", 0.0),
            duration_s=updated.get("duration_s", 0.0),
            pace_min_per_km=updated.get("pace_min_per_km"),
            points_count=updated.get("points_count", 0),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to finish workout: {e}")

# List all workout sessions for the current user
@router.get("/", response_model=list[WorkoutSessionResponse])
def list_workouts(user=Depends(get_current_user)):
    try:
        q = _sessions_col(user["uid"]).order_by("start_time_ms", direction="DESCENDING").stream()
        res = []
        for d in q:
            v = d.to_dict() or {}
            res.append(WorkoutSessionResponse(
                id=d.id,
                workout_type=v.get("workout_type", "run"),
                start_time_ms=v.get("start_time_ms"),
                end_time_ms=v.get("end_time_ms"),
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
            start_time_ms=v.get("start_time_ms"),
            end_time_ms=v.get("end_time_ms"),
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
