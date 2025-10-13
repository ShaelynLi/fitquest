# app/schemas/users.py
from typing import Optional, Literal
from pydantic import BaseModel, EmailStr, Field, PositiveFloat, conint
from datetime import date

# Common types used across all schemas
Gender = Literal["male", "female", "other", "prefer_not_to_say"]
ActivityLevel = Literal["sedentary", "light", "moderate", "active", "very_active"]
PrimaryGoal = Literal["weight_loss", "muscle_gain", "endurance", "general_fitness"]
Units = Literal["metric", "imperial"]

# Authentication schemas
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    display_name: Optional[str] = None
    gender: Gender
    birth_date: date
    height_cm: PositiveFloat
    weight_kg: PositiveFloat

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)

class TokenResponse(BaseModel):
    id_token: str
    refresh_token: str
    expires_in: int
    local_id: str  # Firebase UID

# Onboarding schemas
class OnboardingRequest(BaseModel):
    # Basic Information
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    firstName: str = Field(min_length=1, max_length=50)
    lastName: str = Field(min_length=1, max_length=50)
    dateOfBirth: date
    gender: Gender
    
    # Health Metrics
    height_cm: PositiveFloat = Field(description="Height in cm")
    weight_kg: PositiveFloat = Field(description="Weight in kg")
    activityLevel: ActivityLevel
    
    # Fitness Goals
    primaryGoal: PrimaryGoal
    target_weight_kg: Optional[PositiveFloat] = None
    weeklyRunGoal: Optional[conint(ge=0, le=200)] = None  # km per week
    petRewardGoal: Optional[conint(ge=1, le=50)] = None  # km to unlock pet box
    
    # Preferences
    units: Units = "metric"
    notifications: bool = True
    healthKit: bool = False
    
    # Calculated fields
    dailyCalories: Optional[conint(ge=800, le=5000)] = None

class OnboardingResponse(BaseModel):
    success: bool
    message: str
    user_id: str
    daily_calories: Optional[int] = None
    temp_token: Optional[str] = None

# Profile update schemas
class ProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    gender: Optional[Gender] = None
    birth_date: Optional[date] = None
    height_cm: Optional[PositiveFloat] = None
    weight_kg: Optional[PositiveFloat] = None
    metersPerBlindBox: Optional[conint(ge=1000, le=50000)] = None  # 1km - 50km, must be multiple of 1000