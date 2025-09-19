# app/schemas/goals.py
from typing import Optional, Literal
from pydantic import BaseModel, PositiveFloat, Field, conint

GoalType = Literal["lose_weight", "maintain", "gain_weight"]
ActivityLevel = Literal["sedentary", "light", "moderate", "active", "very_active"]

class HealthGoal(BaseModel):
    goal_type: GoalType
    target_weight_kg: PositiveFloat
    weekly_weight_delta_kg: float = Field(..., ge=-1.5, le=1.5)
    activity_level: ActivityLevel
    daily_calorie_target: Optional[int] = Field(None, ge=800, le=6000)
    daily_protein_target_g: Optional[conint(ge=0, le=400)] = None
    daily_steps_target: Optional[conint(ge=0, le=50000)] = None
