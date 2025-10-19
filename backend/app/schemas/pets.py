"""
Pet Collection API Schemas

Pydantic models for pet gamification system endpoints.
"""

from pydantic import BaseModel, Field
from typing import List, Optional


class PetCollectionResponse(BaseModel):
    """Response with user's pet collection"""
    success: bool = Field(..., description="Whether the request was successful")
    pets: List[str] = Field(..., description="List of pet IDs user owns")
    message: Optional[str] = Field(None, description="Additional message")


class UpdatePetsRequest(BaseModel):
    """Request to update user's pet collection"""
    pets: List[str] = Field(..., description="Complete list of pet IDs user owns")


class AddPetRequest(BaseModel):
    """Request to add a single pet to collection"""
    pet_id: str = Field(..., description="Pet ID to add to collection")


class RemovePetRequest(BaseModel):
    """Request to remove a pet from collection"""
    pet_id: str = Field(..., description="Pet ID to remove from collection")

