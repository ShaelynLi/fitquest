# app/schemas/users.py
from typing import Optional, Literal
from pydantic import BaseModel, EmailStr, Field, PositiveFloat, conint
from datetime import date

Gender = Literal["male", "female", "other", "prefer_not_to_say"]

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
