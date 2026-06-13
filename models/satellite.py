from pydantic import BaseModel, Field
from typing import Literal, Optional
from datetime import datetime


class SatellitePosition(BaseModel):
    latitude: float = Field(..., ge=-90, le=90, description="Latitude in degrees")
    longitude: float = Field(..., ge=-180, le=180, description="Longitude in degrees")
    altitude: float = Field(..., gt=0, description="Altitude in kilometers")
    velocity_x: float = Field(default=0.0, description="Velocity vector X component (km/s)")
    velocity_y: float = Field(default=0.0, description="Velocity vector Y component (km/s)")
    velocity_z: float = Field(default=0.0, description="Velocity vector Z component (km/s)")


class SatelliteOrbit(BaseModel):
    semi_major_axis: float = Field(..., gt=0, description="Semi-major axis in kilometers")
    eccentricity: float = Field(..., ge=0, le=1, description="Orbital eccentricity")
    inclination: float = Field(..., ge=0, le=180, description="Orbital inclination in degrees")
    raan: float = Field(default=0.0, ge=0, le=360, description="Right ascension of ascending node")
    arg_perigee: float = Field(default=0.0, ge=0, le=360, description="Argument of perigee")
    true_anomaly: float = Field(default=0.0, ge=0, le=360, description="True anomaly")


class Satellite(BaseModel):
    id: str = Field(..., description="Unique satellite identifier")
    name: str = Field(..., description="Satellite name")
    satellite_type: Literal["military", "communications", "navigation", "weather", "research", "spy"] = Field(
        ..., description="Type of satellite"
    )
    position: SatellitePosition = Field(..., description="Current position and velocity")
    orbit: SatelliteOrbit = Field(..., description="Orbital parameters")
    status: Literal["active", "inactive", "damaged", "destroyed"] = Field(
        default="active", description="Operational status"
    )
    fuel_remaining: float = Field(default=100.0, ge=0, le=100, description="Fuel remaining percentage")
    operator: str = Field(default="unknown", description="Operating agency/country")
    launch_date: Optional[datetime] = Field(default=None, description="Launch date")
    
    # Dependencies for impact analysis
    services: list[str] = Field(default_factory=list, description="Services provided by this satellite")
    dependent_systems: list[str] = Field(default_factory=list, description="Systems that depend on this satellite")
    user_count: int = Field(default=0, ge=0, description="Number of users relying on this satellite")
    economic_value: float = Field(default=0.0, ge=0, description="Estimated economic value in USD")