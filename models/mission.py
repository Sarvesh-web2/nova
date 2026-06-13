from pydantic import BaseModel, Field
from typing import Literal, Optional
from datetime import datetime
from enum import Enum


class MissionType(str, Enum):
    ALPHA = "alpha"  # Single satellite attack
    BETA = "beta"    # GPS network attack
    GAMMA = "gamma"  # Multiple missile launches
    DELTA = "delta"  # Autonomous defense mode


class MissionStatus(str, Enum):
    INITIATED = "initiated"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    ABORTED = "aborted"


class MissionReport(BaseModel):
    id: str = Field(..., description="Unique mission identifier")
    mission_type: MissionType = Field(..., description="Type of mission scenario")
    status: MissionStatus = Field(default=MissionStatus.INITIATED, description="Mission status")
    
    # Timeline
    start_time: datetime = Field(default_factory=datetime.now, description="Mission start time")
    end_time: Optional[datetime] = Field(default=None, description="Mission end time")
    duration: Optional[float] = Field(default=None, description="Mission duration in seconds")
    
    # Threats encountered
    threats_detected: int = Field(default=0, ge=0, description="Number of threats detected")
    threats_mitigated: int = Field(default=0, ge=0, description="Number of threats successfully mitigated")
    threats_impacted: int = Field(default=0, ge=0, description="Number of threats that caused impact")
    
    # Assets protected
    satellites_protected: list[str] = Field(default_factory=list, description="IDs of protected satellites")
    satellites_lost: list[str] = Field(default_factory=list, description="IDs of lost satellites")
    
    # Impact metrics
    total_users_affected: int = Field(default=0, ge=0, description="Total users affected by losses")
    total_economic_loss: float = Field(default=0.0, ge=0, description="Total economic loss in USD")
    loss_prevented: float = Field(default=0.0, ge=0, description="Economic loss prevented in USD")
    
    # Countermeasures used
    countermeasures_deployed: int = Field(default=0, ge=0, description="Number of countermeasures deployed")
    countermeasures_successful: int = Field(default=0, ge=0, description="Number of successful countermeasures")
    
    # AI performance
    ai_recommendations_followed: int = Field(default=0, ge=0, description="Number of AI recommendations followed")
    ai_accuracy: Optional[float] = Field(default=None, ge=0, le=1, description="AI prediction accuracy")
    
    # AI-generated summary
    ai_summary: Optional[str] = Field(default=None, description="AI-generated mission summary")
    key_achievements: list[str] = Field(default_factory=list, description="Key mission achievements")
    lessons_learned: list[str] = Field(default_factory=list, description="Lessons from the mission")
    
    # Human inputs
    operator_notes: Optional[str] = Field(default=None, description="Notes from mission operator")
    operator_rating: Optional[int] = Field(default=None, ge=1, le=5, description="Operator mission rating")