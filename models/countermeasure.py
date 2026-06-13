from pydantic import BaseModel, Field
from typing import Literal, Optional
from datetime import datetime


class Countermeasure(BaseModel):
    id: str = Field(..., description="Unique countermeasure identifier")
    countermeasure_type: Literal["orbital_shift", "decoy_deployment", "signal_spoofing", "electronic_attack"] = Field(
        ..., description="Type of countermeasure"
    )
    target_threat_id: str = Field(..., description="ID of threat this countermeasure addresses")
    target_satellite_id: str = Field(..., description="ID of satellite to protect")
    
    # Deployment parameters
    execution_time: datetime = Field(default_factory=datetime.now, description="When to execute")
    fuel_required: float = Field(default=0.0, ge=0, description="Fuel required percentage")
    duration: float = Field(default=0.0, ge=0, description="Duration of countermeasure in seconds")
    
    # Effectiveness assessment
    success_probability: float = Field(..., ge=0, le=1, description="Predicted success probability")
    estimated_miss_distance: float = Field(default=0.0, ge=0, description="Expected resulting miss distance")
    
    # Status
    status: Literal["pending", "executing", "completed", "failed", "aborted"] = Field(
        default="pending", description="Execution status"
    )
    
    # Results (filled after execution)
    actual_success: Optional[bool] = Field(default=None, description="Whether it actually succeeded")
    final_miss_distance: Optional[float] = Field(default=None, description="Actual miss distance achieved")
    fuel_used: Optional[float] = Field(default=None, description="Actual fuel consumed percentage")
    
    # Additional parameters based on type
    parameters: dict = Field(default_factory=dict, description="Type-specific parameters")