# app/schemas/users.py
from typing import Optional, Literal
from pydantic import BaseModel, EmailStr, Field, PositiveFloat, conint, confloat
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
    height_cm: confloat(gt=0, le=300.0)  # cm (supports decimals)
    weight_kg: confloat(gt=0, le=500.0)  # kg (supports decimals)

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
    height_cm: confloat(gt=0, le=300.0) = Field(description="Height in cm (supports decimals)")
    weight_kg: confloat(gt=0, le=500.0) = Field(description="Weight in kg (supports decimals)")
    activityLevel: ActivityLevel
    
    # Fitness Goals
    primaryGoal: PrimaryGoal
    target_weight_kg: Optional[confloat(gt=0, le=500.0)] = None  # kg (supports decimals)
    weeklyRunGoal: Optional[confloat(ge=0, le=500.0)] = None  # km per week (supports decimals)
    petRewardGoal: Optional[confloat(ge=0.1, le=100.0)] = None  # km to unlock pet box (supports decimals)
    
    # Preferences
    units: Units = "metric"
    notifications: bool = True
    healthKit: bool = False
    
    # Calculated fields
    dailyCalories: Optional[confloat(ge=800, le=5000)] = None  # calories (supports decimals)

class OnboardingResponse(BaseModel):
    success: bool
    message: str
    user_id: str
    daily_calories: Optional[int] = None
    temp_token: Optional[str] = None

# Password change schema
class PasswordChangeRequest(BaseModel):
    current_password: str = Field(min_length=6, max_length=128)
    new_password: str = Field(min_length=6, max_length=128)

class PasswordChangeResponse(BaseModel):
    success: bool
    message: str

# Profile update schemas
class ProfileUpdate(BaseModel):
    # Basic Information
    display_name: Optional[str] = None
    gender: Optional[Gender] = None
    birth_date: Optional[date] = None
    
    # Health Metrics
    height_cm: Optional[confloat(gt=0, le=300.0)] = None  # cm (supports decimals)
    weight_kg: Optional[confloat(gt=0, le=500.0)] = None  # kg (supports decimals)
    activity_level: Optional[ActivityLevel] = None
    
    # Fitness Goals
    primary_goal: Optional[PrimaryGoal] = None
    target_weight_kg: Optional[confloat(gt=0, le=500.0)] = None  # kg (supports decimals)
    weekly_run_goal: Optional[confloat(ge=0, le=500.0)] = None  # km per week (supports decimals)
    pet_reward_goal: Optional[confloat(ge=0.1, le=100.0)] = None  # km to unlock pet box (supports decimals)
    
    # Preferences
    units: Optional[Units] = None
    notifications: Optional[bool] = None