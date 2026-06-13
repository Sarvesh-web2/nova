from pydantic import BaseModel, Field
from typing import Literal, Optional
from datetime import datetime
from enum import Enum


class ThreatLevel(str, Enum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"


class Threat(BaseModel):
    id: str = Field(..., description="Unique threat identifier")
    threat_level: ThreatLevel = Field(..., description="Severity assessment")
    missile_id: str = Field(..., description="Associated missile ID")
    target_satellite_id: str = Field(..., description="Target satellite ID")
    
    # Prediction metrics
    collision_probability: float = Field(..., ge=0, le=1, description="Probability of collision (0-1)")
    time_to_impact: float = Field(..., gt=0, description="Time until potential impact in seconds")
    miss_distance: float = Field(default=0.0, ge=0, description="Predicted miss distance in km")
    intercept_point: tuple[float, float, float] = Field(
        default=(0.0, 0.0, 0.0), description="Predicted intercept coordinates (lat, lon, alt)"
    )
    
    # Impact assessment
    affected_users: int = Field(default=0, ge=0, description="Estimated affected users")
    economic_loss: float = Field(default=0.0, ge=0, description="Estimated economic loss in USD")
    critical_services: list[str] = Field(default_factory=list, description="Critical services at risk")
    
    # Status and timestamps
    status: Literal["active", "mitigated", "impacted", "false_alarm"] = Field(
        default="active", description="Current threat status"
    )
    detected_at: datetime = Field(default_factory=datetime.now, description="Detection timestamp")
    last_updated: datetime = Field(default_factory=datetime.now, description="Last update timestamp")
    
    # AI recommendations
    recommended_countermeasure: Optional[str] = Field(default=None, description="AI-recommended countermeasure")
    countermeasure_success_probability: Optional[float] = Field(
        default=None, ge=0, le=1, description="Success probability of recommended countermeasure"
    )