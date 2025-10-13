from fastapi import APIRouter, HTTPException, Depends
from math import radians, cos, sin, asin, sqrt
from app.core.firebase import db
from app.dependencies.auth import get_current_user
from app.schemas.workout import CompleteWorkoutRequest
from app.utils.workout_helpers import create_time_info
import traceback

router = APIRouter()

def _session_doc(uid: str, sid: str):
    return db.collection("users").document(uid).collection("workouts").document(sid)

def _sessions_col(uid: str):
    return db.collection("users").document(uid).collection("workouts")

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
            "message": "Workout API Firebase connection test"
        })
        print("✅ Firebase connection test successful")
        return {"status": "success", "message": "Firebase connection working"}
    except Exception as e:
        print(f"❌ Firebase connection test failed: {e}")
        return {"status": "error", "message": f"Firebase connection failed: {e}"}

# Test endpoint to check authentication
@router.get("/test-auth")
def test_auth(user=Depends(get_current_user)):
    """Test authentication for workout endpoints"""
    try:
        print(f"🔐 Testing authentication for user: {user['uid']}")
        return {
            "status": "success",
            "message": "Authentication working",
            "user_id": user["uid"]
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
                "workout_type": data.get("workout_type", "unknown"),
                "status": data.get("status", "unknown"),
                "created_at": data.get("created_at", "unknown"),
                "session_id": data.get("session_id", "unknown")
            })
        
        print(f"📊 Found {len(workout_list)} workout sessions")
        
        return {
            "status": "success",
            "user_id": user["uid"],
            "workout_count": len(workout_list),
            "workouts": workout_list
        }
    except Exception as e:
        print(f"❌ Failed to list workouts: {e}")
        return {"status": "error", "message": f"Failed to list workouts: {e}"}

# Complete workout with full data from frontend
@router.post("/complete")
def complete_workout(workout_data: CompleteWorkoutRequest, user=Depends(get_current_user)):
    """
    Complete a workout session with full data from frontend
    This is the main endpoint for workout completion
    """
    try:
        print(f"🏁 Completing workout session: {workout_data.session_id}")
        print(f"📊 Workout data: {workout_data.workout_type}, GPS points: {len(workout_data.gps_points)}")
        
        # Validate input data
        if not workout_data.session_id:
            raise HTTPException(400, "Session ID is required")
        
        if not workout_data.gps_points:
            print("⚠️ Warning: No GPS points provided")
        
        # Create enhanced time info from frontend data
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
        
        # Store in Firebase with retry mechanism
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
            "message": "Workout completed successfully",
            "session_id": workout_data.session_id,
            "workout_type": workout_data.workout_type,
            "total_points": len(workout_data.gps_points),
            "distance_meters": calculated_metrics.get("distance", {}).get("meters", 0),
            "duration_seconds": calculated_metrics.get("duration", {}).get("seconds", 0)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Failed to complete workout: {e}")
        print(f"❌ Full traceback: {traceback.format_exc()}")
        raise HTTPException(500, f"Failed to complete workout: {e}")

# List all workout sessions for the current user
@router.get("/")
def list_workouts(user=Depends(get_current_user)):
    """List all workout sessions for the current user"""
    try:
        print(f"📋 Listing workouts for user: {user['uid']}")
        
        # Query workout sessions using the new data structure
        sessions = _sessions_col(user["uid"]).order_by("created_at", direction="DESCENDING").stream()
        workout_list = []
        
        for doc in sessions:
            data = doc.to_dict() or {}
            
            # Extract data from new nested structure
            start_time = data.get("start_time", {})
            end_time = data.get("end_time", {})
            distance = data.get("distance", {})
            duration = data.get("duration", {})
            pace = data.get("pace", {})
            
            workout_list.append({
                "id": doc.id,
                "session_id": data.get("session_id", doc.id),
                "workout_type": data.get("workout_type", "run"),
                "status": data.get("status", "unknown"),
                "start_time": start_time.get("iso", "unknown"),
                "end_time": end_time.get("iso", "unknown"),
                "distance_meters": distance.get("meters", 0),
                "distance_kilometers": distance.get("kilometers", 0),
                "duration_seconds": duration.get("seconds", 0),
                "duration_formatted": duration.get("formatted", "0s"),
                "pace_min_per_km": pace.get("min_per_km", 0),
                "pace_km_per_hour": pace.get("km_per_hour", 0),
                "total_points": data.get("total_points", 0),
                "created_at": data.get("created_at", "unknown"),
                "updated_at": data.get("updated_at", "unknown")
            })
        
        print(f"📊 Found {len(workout_list)} workout sessions")
        
        return {
            "success": True,
            "workouts": workout_list,
            "total_count": len(workout_list)
        }
        
    except Exception as e:
        print(f"❌ Failed to list workouts: {e}")
        raise HTTPException(500, f"Failed to list workouts: {e}")

# Get details of a specific workout session
@router.get("/{session_id}")
def get_workout(session_id: str, user=Depends(get_current_user)):
    """Get details of a specific workout session"""
    try:
        print(f"🔍 Getting workout details for session: {session_id}")
        
        session_ref = _session_doc(user["uid"], session_id)
        snap = session_ref.get()
        
        if not snap.exists:
            raise HTTPException(404, "Workout session not found")
        
        data = snap.to_dict() or {}
        
        # Return the complete workout data
        return {
            "success": True,
            "workout": data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Failed to get workout: {e}")
        raise HTTPException(500, f"Failed to get workout: {e}")

# Get trajectory/route data for a specific workout session
@router.get("/{session_id}/trajectory")
def get_workout_trajectory(session_id: str, user=Depends(get_current_user)):
    """
    Get the complete GPS trajectory for a workout session
    Returns all GPS points in chronological order
    """
    try:
        print(f"🗺️ Getting trajectory for session: {session_id}")
        
        session_ref = _session_doc(user["uid"], session_id)
        snap = session_ref.get()
        
        if not snap.exists:
            raise HTTPException(404, "Workout session not found")
        
        data = snap.to_dict() or {}
        gps_points = data.get("gps_points", [])
        
        # Sort by timestamp if available
        if gps_points and "timestamp" in gps_points[0]:
            gps_points = sorted(gps_points, key=lambda p: p.get("timestamp", 0))
        
        print(f"🗺️ Retrieved {len(gps_points)} GPS points for session {session_id}")
        
        return {
            "success": True,
            "session_id": session_id,
            "total_points": len(gps_points),
            "trajectory": gps_points,
            "start_time": gps_points[0].get("timestamp") if gps_points else None,
            "end_time": gps_points[-1].get("timestamp") if gps_points else None
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
    Returns key GPS points for efficient map rendering
    """
    try:
        print(f"🗺️ Getting route for session: {session_id}")
        
        session_ref = _session_doc(user["uid"], session_id)
        snap = session_ref.get()
        
        if not snap.exists:
            raise HTTPException(404, "Workout session not found")
        
        data = snap.to_dict() or {}
        gps_points = data.get("gps_points", [])
        
        # Simplify route for map display (every 10th point or key points)
        simplified_points = []
        if gps_points:
            # Take every 10th point for efficiency
            for i in range(0, len(gps_points), 10):
                simplified_points.append(gps_points[i])
            
            # Always include first and last points
            if len(gps_points) > 1:
                simplified_points[-1] = gps_points[-1]
        
        print(f"🗺️ Simplified route to {len(simplified_points)} points for session {session_id}")
        
        return {
            "success": True,
            "session_id": session_id,
            "route": simplified_points,
            "total_points": len(simplified_points),
            "original_points": len(gps_points)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Failed to get route: {e}")
        raise HTTPException(500, f"Failed to get route: {e}")

# Test endpoint to manually test saving a workout document
@router.get("/test-workout-save")
def test_workout_save():
    """Test endpoint to manually test saving a workout document to Firebase"""
    try:
        print("🧪 Testing workout save to Firebase...")
        
        # Create a test workout document
        test_workout = {
            "session_id": "test_workout_123",
            "workout_type": "run",
            "status": "completed",
            "start_time": {
                "timestamp": 1759469800000,
                "iso": "2025-10-03T05:36:40.000Z",
                "date": "2025-10-03",
                "time": "05:36:40",
                "timezone": "UTC"
            },
            "end_time": {
                "timestamp": 1759469860000,
                "iso": "2025-10-03T05:37:40.000Z",
                "date": "2025-10-03",
                "time": "05:37:40",
                "timezone": "UTC"
            },
            "gps_points": [
                {"lat": -37.7994, "lng": 144.9627, "timestamp": 1759469800000},
                {"lat": -37.7995, "lng": 144.9628, "timestamp": 1759469860000}
            ],
            "total_points": 2,
            "distance": {"meters": 100, "kilometers": 0.1, "miles": 0.062},
            "duration": {"seconds": 60, "minutes": 1.0, "formatted": "1m"},
            "pace": {"min_per_km": 10.0, "min_per_mile": 16.1, "km_per_hour": 6.0, "mph": 3.7},
            "calories": {"burned": 5, "estimated": True},
            "route": {
                "points_count": 2,
                "total_elevation_gain": 0,
                "total_elevation_loss": 0,
                "elevation_profile": []
            },
            "created_at": "2025-10-03T05:36:40.000Z",
            "updated_at": "2025-10-03T05:37:40.000Z",
            "user_id": "test_user_123"
        }
        
        # Save to Firebase
        doc_ref = db.collection("users").document("test_user_123").collection("workouts").document("test_workout_123")
        doc_ref.set(test_workout)
        
        print(f"✅ Test workout saved to Firebase: test_workout_123")
        return {
            "success": True,
            "message": "Test workout saved successfully",
            "document_id": "test_workout_123"
        }
        
    except Exception as e:
        print(f"❌ Failed to save test workout: {e}")
        return {
            "success": False,
            "message": f"Failed to save test workout: {e}"
        }

# Get activities for a specific date
@router.get("/activities/{date}")
def get_activities_for_date(date: str, user=Depends(get_current_user)):
    """
    Get all activities (workouts and food logs) for a specific date
    Date format: YYYY-MM-DD
    """
    try:
        print(f"📅 Getting activities for date: {date} for user: {user['uid']}")
        
        # Get workouts for the date
        workouts = []
        sessions = _sessions_col(user["uid"]).stream()
        
        for doc in sessions:
            data = doc.to_dict() or {}
            if data.get("created_at", "").startswith(date):
                workouts.append({
                    "id": doc.id,
                    "type": "workout",
                    "workout_type": data.get("workout_type", "run"),
                    "created_at": data.get("created_at"),
                    "distance_meters": data.get("distance", {}).get("meters", 0),
                    "duration_seconds": data.get("duration", {}).get("seconds", 0),
                    "duration_formatted": data.get("duration", {}).get("formatted", "0s"),
                    "calories_burned": data.get("calories", {}).get("burned", 0),
                    "status": data.get("status", "unknown")
                })
        
        print(f"📊 Found {len(workouts)} workouts for {date}")
        
        return {
            "success": True,
            "date": date,
            "workouts": workouts,
            "total_workouts": len(workouts)
        }
        
    except Exception as e:
        print(f"❌ Failed to get activities for date: {e}")
        raise HTTPException(500, f"Failed to get activities for date: {e}")

# Clean up old test data
@router.delete("/cleanup-test-data")
def cleanup_test_data(user=Depends(get_current_user)):
    """Clean up test data for the current user"""
    try:
        print(f"🧹 Cleaning up test data for user: {user['uid']}")
        
        # Delete test workouts
        sessions = _sessions_col(user["uid"]).where("session_id", "==", "test_workout_123").stream()
        deleted_count = 0
        
        for doc in sessions:
            doc.reference.delete()
            deleted_count += 1
        
        print(f"✅ Cleaned up {deleted_count} test workout sessions")
        
        return {
            "success": True,
            "message": f"Cleaned up {deleted_count} test workout sessions",
            "deleted_count": deleted_count
        }
        
    except Exception as e:
        print(f"❌ Failed to cleanup test data: {e}")
        raise HTTPException(500, f"Failed to cleanup test data: {e}")
