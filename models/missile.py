from pydantic import BaseModel, Field
from typing import Literal, Optional
from datetime import datetime


class MissileTrajectory(BaseModel):
    launch_position: tuple[float, float] = Field(..., description="Launch coordinates (lat, lon)")
    current_position: tuple[float, float, float] = Field(..., description="Current position (lat, lon, alt)")
    target_position: tuple[float, float, float] = Field(..., description="Target position (lat, lon, alt)")
    velocity: float = Field(..., gt=0, description="Current velocity in km/s")
    heading: float = Field(..., ge=0, le=360, description="Heading in degrees")
    flight_path_points: list[tuple[float, float, float]] = Field(
        default_factory=list, description="Predicted flight path points"
    )


class Missile(BaseModel):
    id: str = Field(..., description="Unique missile identifier")
    missile_type: Literal["kinetic", "explosive", "electronic", "laser"] = Field(
        ..., description="Type of ASAT missile"
    )
    trajectory: MissileTrajectory = Field(..., description="Current trajectory information")
    launch_time: datetime = Field(default_factory=datetime.now, description="Launch timestamp")
    status: Literal["boost", "midcourse", "terminal", "intercepted", "failed"] = Field(
        default="boost", description="Flight phase status"
    )
    target_satellite_id: Optional[str] = Field(default=None, description="ID of target satellite")
    
    # Detection information
    detected_by: list[str] = Field(default_factory=list, description="Sensors that detected this missile")
    detection_confidence: float = Field(default=1.0, ge=0, le=1, description="Detection confidence")
    
    # Capabilities
    max_speed: float = Field(default=8.0, gt=0, description="Maximum speed in km/s")
    maneuverability: float = Field(default=0.5, ge=0, le=1, description="Maneuverability score")
    warhead_yield: Optional[float] = Field(default=None, description="Warhead yield in kilotons (if applicable)")