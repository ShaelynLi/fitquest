# app/schemas/profile.py
from typing import Optional, Literal
from pydantic import BaseModel, PositiveFloat
from datetime import date

Gender = Literal["male", "female", "other", "prefer_not_to_say"]

class ProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    gender: Optional[Gender] = None
    birth_date: Optional[date] = None
    height_cm: Optional[PositiveFloat] = None
    weight_kg: Optional[PositiveFloat] = None
