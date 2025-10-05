from fastapi import APIRouter, HTTPException, Depends
from math import radians, cos, sin, asin, sqrt
from app.core.firebase import db
from app.dependencies.auth import get_current_user
from app.schemas.workout import (
    WorkoutStartRequest, WorkoutAddPointsRequest, WorkoutFinishRequest, WorkoutSessionResponse,
    CompleteWorkoutRequest
)
from app.utils.workout_helpers import create_enhanced_workout_data

router = APIRouter()

def _session_doc(uid: str, sid: str):
    return db.collection("users").document(uid).collection("workout").document(sid)

def _sessions_col(uid: str):
    return db.collection("users").document(uid).collection("workout")

# Test endpoint to check Firebase connection
@router.get("/test-firebase")
def test_firebase_connection():
    """Test Firebase Firestore connection for workout data"""
    try:
        print("🧪 Testing Firebase connection...")
        # Try to write a test document
        test_doc = db.collection("test").document("workout_test")
        test_doc.set({
            "test": True,
            "timestamp": "test",
            "message": "Firebase connection test successful"
        })
        print("✅ Firebase test write successful")
        
        # Try to read it back
        doc = test_doc.get()
        if doc.exists:
            print("✅ Firebase test read successful")
            data = doc.to_dict()
            print(f"📄 Test data: {data}")
            
            # Clean up test document
            test_doc.delete()
            print("🧹 Test document cleaned up")
            
            return {
                "status": "success",
                "message": "Firebase connection working",
                "test_data": data
            }
        else:
            print("❌ Firebase test read failed")
            return {"status": "error", "message": "Firebase read failed"}
            
    except Exception as e:
        print(f"❌ Firebase test failed: {e}")
        return {"status": "error", "message": f"Firebase connection failed: {e}"}

# Test endpoint to check authentication
@router.get("/test-auth")
def test_authentication(user=Depends(get_current_user)):
    """Test authentication for workout endpoints"""
    try:
        print(f"🔐 Testing authentication for user: {user['uid']}")
        return {
            "status": "success",
            "message": "Authentication working",
            "user_id": user["uid"],
            "user_email": user.get("email", "unknown")
        }
    except Exception as e:
        print(f"❌ Authentication test failed: {e}")
        return {"status": "error", "message": f"Authentication failed: {e}"}

# Test endpoint to list user's workout sessions
@router.get("/test-list-workouts")
def test_list_workouts(user=Depends(get_current_user)):
    """Test listing workout sessions for debugging"""
    try:
        print(f"🔍 Listing workouts for user: {user['uid']}")
        
        # Query workout sessions
        sessions = _sessions_col(user["uid"]).stream()
        workout_list = []
        
        for doc in sessions:
            data = doc.to_dict() or {}
            workout_list.append({
                "id": doc.id,
                "workout_type": data.get("workout_type"),
                "status": data.get("status"),
                "start_time_ms": data.get("start_time_ms"),
                "end_time_ms": data.get("end_time_ms"),
                "distance_m": data.get("distance_m"),
                "duration_s": data.get("duration_s"),
                "points_count": data.get("points_count")
            })
        
        print(f"📊 Found {len(workout_list)} workout sessions")
        for workout in workout_list:
            print(f"  - {workout['id']}: {workout['workout_type']} ({workout['status']})")
        
        return {
            "status": "success",
            "user_id": user["uid"],
            "workout_count": len(workout_list),
            "workouts": workout_list
        }
    except Exception as e:
        print(f"❌ Failed to list workouts: {e}")
        return {"status": "error", "message": f"Failed to list workouts: {e}"}

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
        print(f"🏃 Starting workout for user: {user['uid']}")
        print(f"📊 Workout type: {req.workout_type}, start time: {req.start_time_ms}")
        
        doc_ref = _sessions_col(user["uid"]).document()
        
        # Create enhanced time info for start using user's timezone
        from app.utils.workout_helpers import create_time_info
        start_time_info = create_time_info(
            req.start_time_ms, 
            timezone_offset_hours=req.timezone_offset
        )
        print(f"🌍 Using timezone offset: {req.timezone_offset} hours for user")
        
        workout_data = {
            "workout_type": req.workout_type,
            "status": "active",
            "start_time": start_time_info,
            "distance": {"meters": 0.0, "kilometers": 0.0, "miles": 0.0},
            "duration": {"seconds": 0.0, "minutes": 0.0, "formatted": "0s"},
            "pace": {"min_per_km": 0, "min_per_mile": 0, "km_per_hour": 0, "mph": 0},
            "calories": {"burned": 0.0, "estimated": True, "formula": "distance_based", "user_weight": 70.0},
            "route": {"points_count": 0, "total_elevation_gain": 0.0, "total_elevation_loss": 0.0, "elevation_profile": []},
            "analysis": {"intensity": "low", "effort_level": 1, "zones": {"warmup": 0, "active": 0, "cooldown": 0}, "pace_consistency": None},
            "created_at": start_time_info["iso"],
            "updated_at": start_time_info["iso"],
            "user_id": user["uid"]
        }
        
        print(f"💾 Saving workout data to Firebase: {workout_data}")
        doc_ref.set(workout_data)
        print(f"✅ Workout session created with ID: {doc_ref.id}")
        
        # Store GPS points in subcollection to avoid large single documents
        return WorkoutSessionResponse(
            id=doc_ref.id,
            workout_type=req.workout_type,
            status="active",
            start_time=start_time_info,
            distance={"meters": 0.0, "kilometers": 0.0, "miles": 0.0},
            duration={"seconds": 0.0, "minutes": 0.0, "formatted": "0s"},
            pace={"min_per_km": 0, "min_per_mile": 0, "km_per_hour": 0, "mph": 0},
            calories={"burned": 0.0, "estimated": True, "formula": "distance_based", "user_weight": 70.0},
            route={"points_count": 0, "total_elevation_gain": 0.0, "total_elevation_loss": 0.0, "elevation_profile": []},
            analysis={"intensity": "low", "effort_level": 1, "zones": {"warmup": 0, "active": 0, "cooldown": 0}, "pace_consistency": None},
            created_at=start_time_info["iso"],
            updated_at=start_time_info["iso"],
            user_id=user["uid"]
        )
    except Exception as e:
        print(f"❌ Failed to start workout: {e}")
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
        # Get start time from new structure
        start_time_data = data.get("start_time")
        if not start_time_data:
            # Fallback to old format for backward compatibility
            start_ms = data.get("start_time_ms")
            if not start_ms:
                raise HTTPException(400, "Session start time missing")
        else:
            start_ms = start_time_data.get("timestamp")
            if not start_ms:
                raise HTTPException(400, "Session start timestamp missing")

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

        # Create enhanced workout data using the new schema structure
        from app.utils.workout_helpers import (
            create_time_info, calculate_distance_info, calculate_duration_info,
            calculate_pace_info, calculate_calories_burned, analyze_workout_intensity,
            calculate_route_info
        )
        
        # Create time info using user's timezone
        start_time_info = create_time_info(start_ms, timezone_offset_hours=req.timezone_offset)
        end_time_info = create_time_info(req.end_time_ms, timezone_offset_hours=req.timezone_offset)
        print(f"🌍 Using timezone offset: {req.timezone_offset} hours for finish")
        
        # Calculate enhanced data
        distance_info = calculate_distance_info(total_m)
        duration_info = calculate_duration_info(duration_s)
        pace_info = calculate_pace_info(total_m, duration_s)
        
        # Handle potential None values in pace_info
        pace_min_per_km = pace_info.get("min_per_km", 0) if pace_info else 0
        if pace_min_per_km is None or pace_min_per_km <= 0:
            pace_min_per_km = 10.0  # Default to slow pace
        
        calories_info = calculate_calories_burned(total_m / 1000, 70.0, data.get("workout_type", "run"), pace_min_per_km)
        analysis_info = analyze_workout_intensity(pace_min_per_km, duration_s)
        route_info = calculate_route_info(pts)
        
        print(f"🔍 Debug - pace_min_per_km: {pace_min_per_km}, total_m: {total_m}, duration_s: {duration_s}")
        
        # Create enhanced response
        enhanced_response = WorkoutSessionResponse(
            id=req.session_id,
            workout_type=data.get("workout_type", "run"),
            status="finished",
            start_time=start_time_info,
            end_time=end_time_info,
            distance=distance_info,
            duration=duration_info,
            pace=pace_info,
            calories=calories_info,
            route=route_info,
            analysis=analysis_info,
            created_at=start_time_info["iso"],
            updated_at=end_time_info["iso"],
            user_id=user["uid"]
        )
        
        # Update the session with enhanced data (replace old format)
        update_data = {
            "end_time_ms": req.end_time_ms,
            "status": "finished",
            # Enhanced data structure
            "start_time": start_time_info,
            "end_time": end_time_info,
            "distance": distance_info,
            "duration": duration_info,
            "pace": pace_info,
            "calories": calories_info,
            "route": route_info,
            "analysis": analysis_info,
            "created_at": start_time_info["iso"],
            "updated_at": end_time_info["iso"],
            "user_id": user["uid"]
        }
        
        print(f"🏁 Finishing workout - Total distance: {total_m}m, Duration: {duration_s}s")
        print(f"📊 Enhanced data: {update_data}")
        
        session_ref.update(update_data)
        print(f"✅ Workout finished and data updated in Firebase")

        # Return the enhanced response
        return enhanced_response
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

# Get trajectory/route data for a specific workout session
@router.get("/{session_id}/trajectory")
def get_workout_trajectory(session_id: str, user=Depends(get_current_user)):
    """
    Get the complete GPS trajectory for a workout session
    Returns all GPS points in chronological order
    """
    try:
        session_ref = _session_doc(user["uid"], session_id)
        snap = session_ref.get()
        if not snap.exists:
            raise HTTPException(404, "Session not found")
        
        # Read all GPS points from subcollection
        points_col = session_ref.collection("points").stream()
        all_points = []
        
        for doc in points_col:
            chunk = doc.to_dict() or {}
            points = chunk.get("points", [])
            all_points.extend(points)
        
        # Sort by timestamp
        all_points = sorted(all_points, key=lambda p: p.get("t_ms", 0))
        
        print(f"🗺️ Retrieved {len(all_points)} GPS points for session {session_id}")
        
        return {
            "session_id": session_id,
            "total_points": len(all_points),
            "trajectory": all_points,
            "start_time": all_points[0].get("t_ms") if all_points else None,
            "end_time": all_points[-1].get("t_ms") if all_points else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Failed to get trajectory: {e}")
        raise HTTPException(500, f"Failed to get trajectory: {e}")

# Get simplified route data (for map display)
@router.get("/{session_id}/route")
def get_workout_route(session_id: str, user=Depends(get_current_user)):
    """
    Get simplified route data for map display
    Returns key points for efficient rendering
    """
    try:
        session_ref = _session_doc(user["uid"], session_id)
        snap = session_ref.get()
        if not snap.exists:
            raise HTTPException(404, "Session not found")
        
        # Read all GPS points
        points_col = session_ref.collection("points").stream()
        all_points = []
        
        for doc in points_col:
            chunk = doc.to_dict() or {}
            points = chunk.get("points", [])
            all_points.extend(points)
        
        # Sort by timestamp
        all_points = sorted(all_points, key=lambda p: p.get("t_ms", 0))
        
        # Simplify route for map display (every 10th point or significant points)
        simplified_route = []
        for i, point in enumerate(all_points):
            # Include first, last, and every 10th point
            if i == 0 or i == len(all_points) - 1 or i % 10 == 0:
                simplified_route.append({
                    "lat": point.get("lat"),
                    "lng": point.get("lng"),
                    "timestamp": point.get("t_ms"),
                    "altitude": point.get("altitude"),
                    "speed": point.get("speed")
                })
        
        print(f"🗺️ Simplified route: {len(simplified_route)} key points from {len(all_points)} total points")
        
        return {
            "session_id": session_id,
            "total_points": len(all_points),
            "key_points": len(simplified_route),
            "route": simplified_route,
            "start_point": simplified_route[0] if simplified_route else None,
            "end_point": simplified_route[-1] if simplified_route else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Failed to get route: {e}")
        raise HTTPException(500, f"Failed to get route: {e}")

# Complete workout with full data from frontend
@router.post("/complete")
def complete_workout(workout_data: CompleteWorkoutRequest, user=Depends(get_current_user)):
    """
    Complete a workout session with full data from frontend
    This replaces the old start/add-points/finish flow with a single complete upload
    """
    try:
        print(f"🏁 Completing workout session: {workout_data.session_id}")
        print(f"📊 Workout data: {workout_data.workout_type}, GPS points: {len(workout_data.gps_points)}")
        
        # Create enhanced time info from frontend data
        from app.utils.workout_helpers import create_time_info
        
        start_time_info = create_time_info(
            workout_data.start_time["timestamp"],
            timezone_offset_hours=workout_data.start_time.get("timezoneOffset")
        )
        
        end_time_info = create_time_info(
            workout_data.end_time["timestamp"],
            timezone_offset_hours=workout_data.end_time.get("timezoneOffset")
        )
        
        # Use frontend calculated metrics
        calculated_metrics = workout_data.calculated_metrics
        
        # Create complete workout document
        complete_workout_doc = {
            # Basic info
            "session_id": workout_data.session_id,
            "workout_type": workout_data.workout_type,
            "status": "completed",
            
            # Time information (from frontend)
            "start_time": start_time_info,
            "end_time": end_time_info,
            
            # GPS trajectory data
            "gps_points": workout_data.gps_points,
            "total_points": len(workout_data.gps_points),
            
            # Calculated metrics (from frontend)
            "distance": calculated_metrics.get("distance", {"meters": 0, "kilometers": 0, "miles": 0}),
            "duration": calculated_metrics.get("duration", {"seconds": 0, "minutes": 0, "formatted": "0s"}),
            "pace": calculated_metrics.get("pace", {"min_per_km": 0, "min_per_mile": 0, "km_per_hour": 0, "mph": 0}),
            "calories": calculated_metrics.get("calories", {"burned": 0, "estimated": True}),
            
            # Route information (complete GPS trajectory)
            "route": {
                "points_count": len(workout_data.gps_points),
                "total_elevation_gain": calculated_metrics.get("elevation_gain", 0),
                "total_elevation_loss": calculated_metrics.get("elevation_loss", 0),
                "elevation_profile": calculated_metrics.get("elevation_profile", [])
            },
            
            # Metadata
            "created_at": start_time_info["iso"],
            "updated_at": end_time_info["iso"],
            "user_id": user["uid"]
        }
        
        # Store in Firebase
        print(f"🔍 Attempting to save workout to Firebase...")
        print(f"🔍 User ID: {user['uid']}")
        print(f"🔍 Session ID: {workout_data.session_id}")
        print(f"🔍 Document path: users/{user['uid']}/workouts/{workout_data.session_id}")
        
        doc_ref = db.collection("users").document(user["uid"]).collection("workouts").document(workout_data.session_id)
        doc_ref.set(complete_workout_doc)
        
        print(f"✅ Workout completed and saved to Firebase: {workout_data.session_id}")
        print(f"✅ Document saved to: users/{user['uid']}/workouts/{workout_data.session_id}")
        print(f"✅ Complete workout document keys: {list(complete_workout_doc.keys())}")
        
        return {
            "success": True,
            "session_id": workout_data.session_id,
            "message": "Workout completed successfully"
        }
        
    except Exception as e:
        print(f"❌ Failed to complete workout: {e}")
        import traceback
        print(f"❌ Full traceback: {traceback.format_exc()}")
        raise HTTPException(500, f"Failed to complete workout: {e}")

# Test endpoint for complete workout (no auth required)
@router.post("/complete-test")
def complete_workout_test(workout_data: CompleteWorkoutRequest):
    """
    Test endpoint for complete workout API (no authentication required)
    """
    try:
        print(f"🧪 Testing complete workout: {workout_data.session_id}")
        print(f"📊 Workout data: {workout_data.workout_type}, GPS points: {len(workout_data.gps_points)}")
        
        # Simulate user data for testing
        test_user = {"uid": "test_user_123"}
        
        # Create enhanced time info from frontend data
        from app.utils.workout_helpers import create_time_info
        
        start_time_info = create_time_info(
            workout_data.start_time["timestamp"],
            timezone_offset_hours=workout_data.start_time.get("timezoneOffset")
        )
        
        end_time_info = create_time_info(
            workout_data.end_time["timestamp"],
            timezone_offset_hours=workout_data.end_time.get("timezoneOffset")
        )
        
        # Use frontend calculated metrics
        calculated_metrics = workout_data.calculated_metrics
        
        # Create complete workout document
        complete_workout_doc = {
            # Basic info
            "session_id": workout_data.session_id,
            "workout_type": workout_data.workout_type,
            "status": "completed",
            
            # Time information (from frontend)
            "start_time": start_time_info,
            "end_time": end_time_info,
            
            # GPS trajectory data
            "gps_points": workout_data.gps_points,
            "total_points": len(workout_data.gps_points),
            
            # Calculated metrics (from frontend)
            "distance": calculated_metrics.get("distance", {"meters": 0, "kilometers": 0, "miles": 0}),
            "duration": calculated_metrics.get("duration", {"seconds": 0, "minutes": 0, "formatted": "0s"}),
            "pace": calculated_metrics.get("pace", {"min_per_km": 0, "min_per_mile": 0, "km_per_hour": 0, "mph": 0}),
            "calories": calculated_metrics.get("calories", {"burned": 0, "estimated": True}),
            
            # Route information (complete GPS trajectory)
            "route": {
                "points_count": len(workout_data.gps_points),
                "total_elevation_gain": calculated_metrics.get("elevation_gain", 0),
                "total_elevation_loss": calculated_metrics.get("elevation_loss", 0),
                "elevation_profile": calculated_metrics.get("elevation_profile", [])
            },
            
            # Metadata
            "created_at": start_time_info["iso"],
            "updated_at": end_time_info["iso"],
            "user_id": test_user["uid"]
        }
        
        print(f"✅ Test workout data processed successfully")
        print(f"📊 Processed data: {complete_workout_doc}")
        
        return {
            "success": True,
            "session_id": workout_data.session_id,
            "message": "Test workout completed successfully",
            "processed_data": complete_workout_doc
        }
        
    except Exception as e:
        print(f"❌ Failed to process test workout: {e}")
        raise HTTPException(500, f"Failed to process test workout: {e}")

@router.get("/test-workout-save")
async def test_workout_save():
    """Test saving a workout to Firebase"""
    try:
        # Create a test workout document
        test_workout = {
            "session_id": "test_workout_123",
            "workout_type": "run",
            "status": "completed",
            "start_time": {
                "timestamp": 1759469803308,
                "iso": "2025-10-03T05:36:43.308+10:00",
                "timezone": "Australia/Melbourne"
            },
            "end_time": {
                "timestamp": 1759469817137,
                "iso": "2025-10-03T05:36:57.137+10:00",
                "timezone": "Australia/Melbourne"
            },
            "gps_points": [
                {"latitude": -37.79941138538117, "longitude": 144.96272268225363, "timestamp": 1759469801895.4202},
                {"latitude": -37.79941138538116, "longitude": 144.9627226822536, "timestamp": 1759469803314.873}
            ],
            "total_points": 2,
            "distance": {"meters": 0, "kilometers": 0, "miles": 0},
            "duration": {"seconds": 14, "minutes": 0.23, "formatted": "13s"},
            "pace": {"min_per_km": 88004172450.04, "min_per_mile": 141628634890.75, "km_per_hour": 0, "mph": 0},
            "calories": {"burned": 0, "estimated": True},
            "route": {
                "points_count": 2,
                "total_elevation_gain": 0,
                "total_elevation_loss": 0,
                "elevation_profile": []
            },
            "created_at": "2025-10-03T05:36:43.308+10:00",
            "updated_at": "2025-10-03T05:36:57.137+10:00",
            "user_id": "test_user_123"
        }
        
        # Save to Firebase
        doc_ref = db.collection("users").document("test_user_123").collection("workouts").document("test_workout_123")
        doc_ref.set(test_workout)
        
        print(f"✅ Test workout saved to Firebase: test_workout_123")
        return {"status": "success", "message": "Test workout saved successfully"}
    except Exception as e:
        print(f"❌ Test workout save failed: {e}")
        return {"status": "error", "message": str(e)}
