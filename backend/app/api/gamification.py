from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import firebase_admin
from firebase_admin import firestore
from ..dependencies.auth import get_current_user

router = APIRouter(prefix="/api/gamification", tags=["gamification"])

# Initialize Firestore
db = firestore.client()

# Pydantic models for gamification data
class PetCollectionUpdate(BaseModel):
    user_pets: List[str]  # Array of pet IDs user owns
    blind_boxes: int  # Number of unopened blind boxes
    active_companion: Optional[Dict[str, Any]] = None  # Currently selected pet
    total_run_distance: int = 0  # Total distance run in meters
    achievement_history: List[Dict[str, Any]] = []

class PetCollectionResponse(BaseModel):
    user_pets: List[str]
    blind_boxes: int
    active_companion: Optional[Dict[str, Any]]
    total_run_distance: int
    achievement_history: List[Dict[str, Any]]
    last_updated: str

@router.post("/sync-collection", response_model=PetCollectionResponse)
def sync_pet_collection(
    collection_data: PetCollectionUpdate,
    user=Depends(get_current_user)
):
    """
    Sync user's pet collection data with Firebase
    """
    try:
        uid = user.get("uid")
        print(f"🎮 Syncing pet collection for user: {uid}")
        print(f"📊 Collection data: {collection_data}")
        
        # Prepare data for Firebase
        gamification_data = {
            "user_pets": collection_data.user_pets,
            "blind_boxes": collection_data.blind_boxes,
            "active_companion": collection_data.active_companion,
            "total_run_distance": collection_data.total_run_distance,
            "achievement_history": collection_data.achievement_history,
            "last_updated": firestore.SERVER_TIMESTAMP,
            "user_id": uid
        }
        
        # Save to Firebase
        doc_ref = db.collection("users").document(uid).collection("gamification").document("pet_collection")
        doc_ref.set(gamification_data, merge=True)
        
        print(f"✅ Pet collection synced successfully")
        
        return PetCollectionResponse(
            user_pets=collection_data.user_pets,
            blind_boxes=collection_data.blind_boxes,
            active_companion=collection_data.active_companion,
            total_run_distance=collection_data.total_run_distance,
            achievement_history=collection_data.achievement_history,
            last_updated=datetime.now().isoformat()
        )
        
    except Exception as e:
        print(f"❌ Failed to sync pet collection: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to sync pet collection: {e}")

@router.get("/collection", response_model=PetCollectionResponse)
def get_pet_collection(user=Depends(get_current_user)):
    """
    Get user's pet collection data from Firebase
    """
    try:
        uid = user.get("uid")
        print(f"🎮 Getting pet collection for user: {uid}")
        
        # Get from Firebase
        doc_ref = db.collection("users").document(uid).collection("gamification").document("pet_collection")
        doc = doc_ref.get()
        
        if not doc.exists:
            print(f"📝 No pet collection data found, returning Pikachu as starter")
            # Return Pikachu as default starter pet
            pikachu_data = {
                "id": "pokemon_004",
                "name": "Pikachu",
                "series": "pokemon",
                "rarity": "common",
                "pokemonId": "25",
                "pokemonVariant": "showdown",
                "image": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/25.gif",
                "description": "An electric mouse Pokémon with shocking abilities.",
                "element": "Electric",
                "isStarterPet": True
            }
            return PetCollectionResponse(
                user_pets=["pokemon_004"],  # Pikachu ID
                blind_boxes=0,
                active_companion=pikachu_data,
                total_run_distance=0,
                achievement_history=[],
                last_updated=datetime.now().isoformat()
            )
        
        data = doc.to_dict()
        print(f"📊 Found pet collection data: {data}")
        
        # Handle Firebase timestamp conversion
        last_updated = data.get("last_updated")
        if last_updated:
            # Convert Firebase timestamp to ISO string
            if hasattr(last_updated, 'timestamp'):
                last_updated = datetime.fromtimestamp(last_updated.timestamp()).isoformat()
            elif isinstance(last_updated, datetime):
                last_updated = last_updated.isoformat()
            else:
                last_updated = datetime.now().isoformat()
        else:
            last_updated = datetime.now().isoformat()

        return PetCollectionResponse(
            user_pets=data.get("user_pets", []),
            blind_boxes=data.get("blind_boxes", 0),
            active_companion=data.get("active_companion"),
            total_run_distance=data.get("total_run_distance", 0),
            achievement_history=data.get("achievement_history", []),
            last_updated=last_updated
        )
        
    except Exception as e:
        print(f"❌ Failed to get pet collection: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get pet collection: {e}")

@router.post("/award-pet")
def award_pet(
    pet_id: str,
    reason: str = "Blind Box Opened",
    user=Depends(get_current_user)
):
    """
    Award a pet to user (called when opening blind boxes)
    """
    try:
        uid = user.get("uid")
        print(f"🎁 Awarding pet {pet_id} to user: {uid}")
        
        # Get current collection
        doc_ref = db.collection("users").document(uid).collection("gamification").document("pet_collection")
        doc = doc_ref.get()
        
        if doc.exists:
            data = doc.to_dict()
            user_pets = data.get("user_pets", [])
            achievement_history = data.get("achievement_history", [])
        else:
            user_pets = []
            achievement_history = []
        
        # Check if pet is already owned
        if pet_id in user_pets:
            return {
                "success": False,
                "message": "Pet already owned",
                "is_new": False
            }
        
        # Add pet to collection
        user_pets.append(pet_id)
        
        # Add achievement record
        achievement = {
            "id": f"pet_{pet_id}_{int(datetime.now().timestamp())}",
            "type": "pet_unlocked",
            "reason": reason,
            "timestamp": datetime.now().isoformat(),
            "reward": pet_id
        }
        achievement_history.append(achievement)
        
        # Update Firebase
        update_data = {
            "user_pets": user_pets,
            "achievement_history": achievement_history,
            "last_updated": firestore.SERVER_TIMESTAMP
        }
        doc_ref.set(update_data, merge=True)
        
        print(f"✅ Pet {pet_id} awarded successfully")
        
        return {
            "success": True,
            "message": "Pet awarded successfully",
            "is_new": True,
            "achievement": achievement
        }
        
    except Exception as e:
        print(f"❌ Failed to award pet: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to award pet: {e}")

# Pydantic model for set companion request
class SetCompanionRequest(BaseModel):
    pet_id: str

@router.post("/set-companion")
def set_active_companion(
    request: SetCompanionRequest,
    user=Depends(get_current_user)
):
    """
    Set user's active companion pet
    """
    try:
        uid = user.get("uid")
        pet_id = request.pet_id
        print(f"🎯 Setting active companion {pet_id} for user: {uid}")
        
        # Get current collection to verify pet is owned
        doc_ref = db.collection("users").document(uid).collection("gamification").document("pet_collection")
        doc = doc_ref.get()
        
        if not doc.exists:
            print(f"📝 No pet collection data found, creating with Pikachu as starter")
            # Create new collection with Pikachu as starter pet
            pikachu_data = {
                "id": "pokemon_004",
                "name": "Pikachu",
                "series": "pokemon",
                "rarity": "common",
                "pokemonId": "25",
                "pokemonVariant": "showdown",
                "image": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/25.gif",
                "description": "An electric mouse Pokémon with shocking abilities.",
                "element": "Electric",
                "isStarterPet": True
            }
            
            # Allow Pikachu as starter pet even if not in user_pets
            is_pikachu = pet_id == "pokemon_004"
            if not is_pikachu:
                # For non-Pikachu pets, we need to check if user actually owns them
                # Since there's no collection data, we can't verify ownership
                raise HTTPException(status_code=400, detail="Pet not owned by user. Please collect this Pokemon first.")
            
            # Create new collection with Pikachu
            new_collection_data = {
                "user_pets": ["pokemon_004"],
                "blind_boxes": 0,
                "active_companion": pikachu_data,
                "total_run_distance": 0,
                "achievement_history": [],
                "last_updated": firestore.SERVER_TIMESTAMP
            }
            
            doc_ref.set(new_collection_data)
            print(f"✅ Created new collection with Pikachu as starter")
            
            return {
                "success": True,
                "message": "Active companion updated successfully"
            }
        
        data = doc.to_dict()
        user_pets = data.get("user_pets", [])
        
        # Allow Pikachu as starter pet even if not in user_pets
        is_pikachu = pet_id == "pokemon_004"  # Pikachu's ID
        if pet_id not in user_pets and not is_pikachu:
            raise HTTPException(status_code=400, detail="Pet not owned by user")
        
        # Update active companion
        update_data = {
            "active_companion": {"id": pet_id},
            "last_updated": firestore.SERVER_TIMESTAMP
        }
        doc_ref.set(update_data, merge=True)
        
        print(f"✅ Active companion set to {pet_id}")
        
        return {
            "success": True,
            "message": "Active companion updated successfully"
        }
        
    except Exception as e:
        print(f"❌ Failed to set active companion: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to set active companion: {e}")
