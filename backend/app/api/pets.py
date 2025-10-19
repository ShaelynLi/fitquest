# app/api/pets.py
"""
Pet Collection API

Handles user's pet collection (gamification feature):
- Get user's unlocked pets
- Save newly unlocked pets
- Sync pet collection with backend
"""

from fastapi import APIRouter, HTTPException, status, Depends
from app.dependencies.auth import get_current_user
from app.core.firebase import db
from app.schemas.pets import (
    PetCollectionResponse,
    UpdatePetsRequest,
    AddPetRequest
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/pets", tags=["pets"])


# ============ API Endpoints ============

@router.get("/", response_model=PetCollectionResponse)
async def get_user_pets(user=Depends(get_current_user)):
    """
    Get user's unlocked pet collection
    
    Returns:
        - List of pet IDs the user has unlocked
    """
    try:
        uid = user["uid"]
        logger.info(f"📦 Getting pet collection for user: {uid}")
        
        # Get user document
        user_ref = db.collection("users").document(uid)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            logger.warning(f"User not found: {uid}")
            return PetCollectionResponse(
                success=True,
                pets=[],
                message="User has no pets yet"
            )
        
        user_data = user_doc.to_dict()
        pets = user_data.get("pets", [])
        
        logger.info(f"✅ Retrieved {len(pets)} pets for user {uid}")
        
        return PetCollectionResponse(
            success=True,
            pets=pets,
            message=f"Retrieved {len(pets)} pets"
        )
        
    except Exception as e:
        logger.error(f"❌ Error getting pets for user {uid}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get pet collection: {str(e)}"
        )


@router.post("/", response_model=PetCollectionResponse)
async def update_user_pets(
    request: UpdatePetsRequest,
    user=Depends(get_current_user)
):
    """
    Update user's complete pet collection
    
    This replaces the entire pet collection with the provided list.
    Use this for syncing local collection to backend.
    
    Args:
        request: UpdatePetsRequest with complete list of pet IDs
        
    Returns:
        Updated pet collection
    """
    try:
        uid = user["uid"]
        logger.info(f"📦 Updating pet collection for user: {uid}")
        logger.info(f"New pet list: {request.pets}")
        
        # Validate pet IDs are non-empty strings
        if not all(isinstance(pet_id, str) and pet_id.strip() for pet_id in request.pets):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="All pet IDs must be non-empty strings"
            )
        
        # Remove duplicates while preserving order
        unique_pets = list(dict.fromkeys(request.pets))
        
        # Update user document
        user_ref = db.collection("users").document(uid)
        user_ref.set({
            "pets": unique_pets,
            "petCount": len(unique_pets)
        }, merge=True)
        
        logger.info(f"✅ Updated pet collection for user {uid}: {len(unique_pets)} pets")
        
        return PetCollectionResponse(
            success=True,
            pets=unique_pets,
            message=f"Successfully saved {len(unique_pets)} pets"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error updating pets for user {uid}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update pet collection: {str(e)}"
        )


@router.post("/add", response_model=PetCollectionResponse)
async def add_pet_to_collection(
    request: AddPetRequest,
    user=Depends(get_current_user)
):
    """
    Add a single pet to user's collection
    
    This is atomic - only adds if the pet isn't already owned.
    Use this when opening blind boxes.
    
    Args:
        request: AddPetRequest with pet_id to add
        
    Returns:
        Updated pet collection
    """
    try:
        uid = user["uid"]
        logger.info(f"🎁 Adding pet {request.pet_id} to user {uid}'s collection")
        
        # Validate pet ID
        if not request.pet_id or not request.pet_id.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Pet ID cannot be empty"
            )
        
        pet_id = request.pet_id.strip()
        
        # Get current pets
        user_ref = db.collection("users").document(uid)
        user_doc = user_ref.get()
        
        if user_doc.exists:
            user_data = user_doc.to_dict()
            current_pets = user_data.get("pets", [])
        else:
            current_pets = []
        
        # Check if pet already owned
        if pet_id in current_pets:
            logger.info(f"Pet {pet_id} already owned by user {uid}")
            return PetCollectionResponse(
                success=True,
                pets=current_pets,
                message="Pet already in collection (duplicate)"
            )
        
        # Add new pet
        updated_pets = current_pets + [pet_id]
        
        # Update user document
        user_ref.set({
            "pets": updated_pets,
            "petCount": len(updated_pets)
        }, merge=True)
        
        logger.info(f"✅ Added pet {pet_id} to user {uid}. Total pets: {len(updated_pets)}")
        
        return PetCollectionResponse(
            success=True,
            pets=updated_pets,
            message=f"Successfully added {pet_id}. Total: {len(updated_pets)} pets"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error adding pet for user {uid}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add pet to collection: {str(e)}"
        )


@router.delete("/{pet_id}", response_model=PetCollectionResponse)
async def remove_pet_from_collection(
    pet_id: str,
    user=Depends(get_current_user)
):
    """
    Remove a pet from user's collection
    
    Args:
        pet_id: ID of pet to remove
        
    Returns:
        Updated pet collection
    """
    try:
        uid = user["uid"]
        logger.info(f"🗑️ Removing pet {pet_id} from user {uid}'s collection")
        
        # Get current pets
        user_ref = db.collection("users").document(uid)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        user_data = user_doc.to_dict()
        current_pets = user_data.get("pets", [])
        
        # Check if pet exists in collection
        if pet_id not in current_pets:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Pet {pet_id} not found in collection"
            )
        
        # Remove pet
        updated_pets = [p for p in current_pets if p != pet_id]
        
        # Update user document
        user_ref.set({
            "pets": updated_pets,
            "petCount": len(updated_pets)
        }, merge=True)
        
        logger.info(f"✅ Removed pet {pet_id} from user {uid}. Remaining pets: {len(updated_pets)}")
        
        return PetCollectionResponse(
            success=True,
            pets=updated_pets,
            message=f"Successfully removed {pet_id}. Remaining: {len(updated_pets)} pets"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error removing pet for user {uid}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to remove pet from collection: {str(e)}"
        )

