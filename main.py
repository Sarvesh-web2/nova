from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import Dict, Optional
import uvicorn
import os
import asyncio
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import models
from models import (
    Satellite, Threat, Countermeasure, MissionReport,
    MissionType, ThreatLevel, Countermeasure as CountermeasureType
)

# Import services
from services import (
    ThreatDetectionEngine, TrajectoryPredictor, ImpactAnalyzer,
    CountermeasureSystem, GeminiAIService, DatabaseService
)

# Initialize services (will be properly initialized in lifespan)
threat_engine: Optional[ThreatDetectionEngine] = None
trajectory_predictor: Optional[TrajectoryPredictor] = None
impact_analyzer: Optional[ImpactAnalyzer] = None
countermeasure_system: Optional[CountermeasureSystem] = None
gemini_service: Optional[GeminiAIService] = None
database_service: Optional[DatabaseService] = None

# In-memory storage
satellites: Dict[str, Satellite] = {}
threats: Dict[str, Threat] = {}
countermeasures: Dict[str, Countermeasure] = {}
missions: Dict[str, MissionReport] = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize services and sample data
    global threat_engine, trajectory_predictor, impact_analyzer
    global countermeasure_system, gemini_service, database_service
    
    print("HELIOS SENTINEL Backend Starting...")
    
    # Initialize services
    threat_engine = ThreatDetectionEngine()
    trajectory_predictor = TrajectoryPredictor()
    impact_analyzer = ImpactAnalyzer()
    countermeasure_system = CountermeasureSystem()
    
    # Initialize AI service with API key from environment
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    gemini_service = GeminiAIService(api_key=gemini_api_key)
    
    # Initialize database service (can use Firebase or local storage)
    use_firebase = os.getenv("USE_FIREBASE", "false").lower() == "true"
    database_service = DatabaseService(use_firebase=use_firebase)
    
    # Initialize sample data
    initialize_sample_data()
    
    print("All services initialized successfully")
    yield
    
    # Shutdown: Cleanup
    print("HELIOS SENTINEL Backend Shutting Down...")
    if gemini_service:
        await gemini_service.close()


app = FastAPI(
    title="HELIOS SENTINEL API",
    description="AI-Powered Orbital Threat & Space Infrastructure Protection Platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def initialize_sample_data():
    """Initialize with sample satellite constellation data"""
    sample_satellites = {
        "SAT-001": Satellite(
            id="SAT-001",
            name="MILCOM-12",
            satellite_type="military",
            position={
                "latitude": 35.6762,
                "longitude": 139.6503,
                "altitude": 550.0,
                "velocity_x": 7.5,
                "velocity_y": 0.0,
                "velocity_z": 0.0
            },
            orbit={
                "semi_major_axis": 7000.0,
                "eccentricity": 0.001,
                "inclination": 98.0,
                "raan": 120.0,
                "arg_perigee": 45.0,
                "true_anomaly": 180.0
            },
            status="active",
            fuel_remaining=85.0,
            operator="US Space Force",
            services=["military_comms", "encrypted_transmission"],
            dependent_systems=["fleet_coordination", "border_surveillance"],
            user_count=2000000,
            economic_value=5000000000.0
        ),
        "SAT-002": Satellite(
            id="SAT-002",
            name="GPS-IIF-12",
            satellite_type="navigation",
            position={
                "latitude": 0.0,
                "longitude": -90.0,
                "altitude": 20200.0,
                "velocity_x": 3.9,
                "velocity_y": 0.0,
                "velocity_z": 0.0
            },
            orbit={
                "semi_major_axis": 26560.0,
                "eccentricity": 0.01,
                "inclination": 55.0,
                "raan": 200.0,
                "arg_perigee": 30.0,
                "true_anomaly": 90.0
            },
            status="active",
            fuel_remaining=60.0,
            operator="US Space Force",
            services=["gps_navigation", "timing"],
            dependent_systems=["aviation", "shipping", "banking"],
            user_count=1000000000,
            economic_value=10000000000.0
        )
    }
    
    satellites.update(sample_satellites)
    print(f"Initialized {len(sample_satellites)} sample satellites")
    
    # Initialize sample threats
    sample_threats = {
        "THREAT-001": Threat(
            id="THREAT-001",
            threat_level=ThreatLevel.HIGH,
            missile_id="MISSILE-001",
            target_satellite_id="SAT-001",
            collision_probability=0.85,
            time_to_impact=120.0,
            miss_distance=0.0,
            intercept_point=(35.6762, 139.6503, 550.0),
            affected_users=2000000,
            economic_loss=2400000000.0,
            critical_services=["military_comms", "fleet_coordination"],
            status="active"
        ),
        "THREAT-002": Threat(
            id="THREAT-002",
            threat_level=ThreatLevel.CRITICAL,
            missile_id="MISSILE-002", 
            target_satellite_id="SAT-002",
            collision_probability=0.92,
            time_to_impact=60.0,
            miss_distance=0.0,
            intercept_point=(0.0, -90.0, 20200.0),
            affected_users=1000000000,
            economic_loss=10000000000.0,
            critical_services=["gps_navigation", "aviation", "banking"],
            status="active"
        )
    }
    
    threats.update(sample_threats)
    print(f"Initialized {len(sample_threats)} sample threats")


# Health check endpoint
@app.get("/")
async def root():
    return {
        "message": "HELIOS SENTINEL API Online",
        "status": "operational",
        "version": "1.0.0",
        "services": {
            "threat_engine": threat_engine is not None,
            "trajectory_predictor": trajectory_predictor is not None,
            "impact_analyzer": impact_analyzer is not None,
            "countermeasure_system": countermeasure_system is not None,
            "gemini_service": gemini_service is not None,
            "database_service": database_service is not None
        }
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "satellites_active": len(satellites),
        "active_threats": len([t for t in threats.values() if t.status == "active"]),
        "database_stats": database_service.get_statistics() if database_service else None
    }


# Satellite endpoints
@app.get("/api/satellites")
async def get_satellites():
    """Get all satellites"""
    return {"satellites": list(satellites.values())}


@app.get("/api/satellites/{satellite_id}")
async def get_satellite(satellite_id: str):
    """Get specific satellite by ID"""
    if satellite_id not in satellites:
        raise HTTPException(status_code=404, detail="Satellite not found")
    return satellites[satellite_id]


@app.post("/api/satellites")
async def create_satellite(satellite: Satellite):
    """Create new satellite"""
    satellites[satellite.id] = satellite
    if database_service:
        database_service.update_satellite_status(satellite)
    return {"message": "Satellite created successfully", "satellite_id": satellite.id}


@app.get("/api/satellites/{satellite_id}/trajectory")
async def get_satellite_trajectory(satellite_id: str, duration: float = 90.0):
    """Get predicted satellite trajectory"""
    if satellite_id not in satellites:
        raise HTTPException(status_code=404, detail="Satellite not found")
    
    if not trajectory_predictor:
        raise HTTPException(status_code=503, detail="Trajectory predictor not available")
    
    satellite = satellites[satellite_id]
    ground_track = trajectory_predictor.calculate_ground_track(satellite, duration)
    
    return {
        "satellite_id": satellite_id,
        "duration_minutes": duration,
        "ground_track": ground_track,
        "orbital_period": trajectory_predictor.calculate_orbital_period(satellite)
    }


# Threat endpoints
@app.get("/api/threats")
async def get_threats():
    """Get all threats"""
    return {"threats": list(threats.values())}


@app.get("/api/threats/{threat_id}")
async def get_threat(threat_id: str):
    """Get specific threat by ID"""
    if threat_id not in threats:
        raise HTTPException(status_code=404, detail="Threat not found")
    return threats[threat_id]


@app.post("/api/threats/detect")
async def detect_threat(sensor_data: dict):
    """Detect and register a new threat using the threat detection engine"""
    if not threat_engine:
        raise HTTPException(status_code=503, detail="Threat detection engine not available")
    
    threat = threat_engine.detect_threat(sensor_data, satellites)
    
    if not threat:
        return {"message": "No threat detected", "threat_id": None}
    
    threats[threat.id] = threat
    
    # Log to database
    if database_service:
        database_service.log_threat(threat)
    
    return {
        "message": "Threat detected and registered",
        "threat_id": threat.id,
        "threat_level": threat.threat_level.value,
        "collision_probability": threat.collision_probability
    }


@app.get("/api/threats/{threat_id}/impact")
async def get_threat_impact(threat_id: str):
    """Get detailed impact analysis for a threat"""
    if threat_id not in threats:
        raise HTTPException(status_code=404, detail="Threat not found")
    
    if not impact_analyzer:
        raise HTTPException(status_code=503, detail="Impact analyzer not available")
    
    threat = threats[threat_id]
    
    if threat.target_satellite_id not in satellites:
        raise HTTPException(status_code=404, detail="Target satellite not found")
    
    satellite = satellites[threat.target_satellite_id]
    
    # Generate impact report
    impact_report = impact_analyzer.generate_impact_report(satellite, threat)
    
    return impact_report


@app.post("/api/threats/{threat_id}/ai-explanation")
async def get_threat_ai_explanation(threat_id: str):
    """Get AI-generated explanation of the threat"""
    if threat_id not in threats:
        raise HTTPException(status_code=404, detail="Threat not found")
    
    if not gemini_service:
        raise HTTPException(status_code=503, detail="AI service not available")
    
    threat = threats[threat_id]
    
    if threat.target_satellite_id not in satellites:
        raise HTTPException(status_code=404, detail="Target satellite not found")
    
    satellite = satellites[threat.target_satellite_id]
    
    explanation = await gemini_service.get_threat_explanation(threat, satellite)
    
    return {
        "threat_id": threat_id,
        "ai_explanation": explanation
    }


# Countermeasure endpoints
@app.post("/api/countermeasures/deploy")
async def deploy_countermeasure(countermeasure: Countermeasure):
    """Deploy a countermeasure against a threat"""
    if countermeasure.target_threat_id not in threats:
        raise HTTPException(status_code=404, detail="Target threat not found")
    
    if countermeasure.target_satellite_id not in satellites:
        raise HTTPException(status_code=404, detail="Target satellite not found")
    
    if not countermeasure_system:
        raise HTTPException(status_code=503, detail="Countermeasure system not available")
    
    threat = threats[countermeasure.target_threat_id]
    satellite = satellites[countermeasure.target_satellite_id]
    
    # Simulate execution
    result = countermeasure_system.simulate_countermeasure_execution(countermeasure, satellite, threat)
    
    countermeasures[countermeasure.id] = countermeasure
    
    # Log to database
    if database_service:
        database_service.log_countermeasure(countermeasure, result)
    
    return {
        "message": "Countermeasure executed",
        "countermeasure_id": countermeasure.id,
        "result": result
    }


@app.get("/api/countermeasures")
async def get_countermeasures():
    """Get all countermeasures"""
    return {"countermeasures": list(countermeasures.values())}


@app.post("/api/threats/{threat_id}/recommend-countermeasure")
async def recommend_countermeasure(threat_id: str):
    """Get AI-recommended countermeasure for a threat"""
    if threat_id not in threats:
        raise HTTPException(status_code=404, detail="Threat not found")
    
    if not countermeasure_system:
        raise HTTPException(status_code=503, detail="Countermeasure system not available")
    
    threat = threats[threat_id]
    
    if threat.target_satellite_id not in satellites:
        raise HTTPException(status_code=404, detail="Target satellite not found")
    
    satellite = satellites[threat.target_satellite_id]
    
    # Get countermeasure recommendation
    recommendation = countermeasure_system.determine_best_countermeasure(satellite, threat)
    
    return recommendation


@app.post("/api/threats/{threat_id}/ai-recommendation")
async def get_ai_countermeasure_recommendation(threat_id: str):
    """Get AI-powered countermeasure recommendation"""
    if threat_id not in threats:
        raise HTTPException(status_code=404, detail="Threat not found")
    
    if not gemini_service:
        raise HTTPException(status_code=503, detail="AI service not available")
    
    threat = threats[threat_id]
    
    if threat.target_satellite_id not in satellites:
        raise HTTPException(status_code=404, detail="Target satellite not found")
    
    satellite = satellites[threat.target_satellite_id]
    
    recommendation = await gemini_service.get_countermeasure_recommendation(
        threat, satellite, satellite.fuel_remaining
    )
    
    return {
        "threat_id": threat_id,
        "ai_recommendation": recommendation
    }


# Mission endpoints
@app.post("/api/missions/start")
async def start_mission(mission_type: MissionType):
    """Start a new mission scenario"""
    mission_id = f"MISSION-{len(missions) + 1:03d}"
    mission = MissionReport(
        id=mission_id,
        mission_type=mission_type
    )
    missions[mission_id] = mission
    
    # Log to database
    if database_service:
        database_service.save_mission(mission)
    
    return {"message": "Mission started successfully", "mission_id": mission_id}


@app.get("/api/missions/{mission_id}")
async def get_mission(mission_id: str):
    """Get specific mission by ID"""
    if mission_id not in missions:
        raise HTTPException(status_code=404, detail="Mission not found")
    return missions[mission_id]


@app.get("/api/missions")
async def get_missions():
    """Get all missions"""
    return {"missions": list(missions.values())}


@app.post("/api/missions/{mission_id}/complete")
async def complete_mission(mission_id: str, mission_data: dict):
    """Complete a mission and generate final report"""
    if mission_id not in missions:
        raise HTTPException(status_code=404, detail="Mission not found")
    
    mission = missions[mission_id]
    
    # Update mission with results
    mission.status = mission_data.get("status", "completed")
    mission.threats_detected = mission_data.get("threats_detected", 0)
    mission.threats_mitigated = mission_data.get("threats_mitigated", 0)
    mission.satellites_protected = mission_data.get("satellites_protected", [])
    mission.loss_prevented = mission_data.get("loss_prevented", 0.0)
    mission.countermeasures_deployed = mission_data.get("countermeasures_deployed", 0)
    mission.countermeasures_successful = mission_data.get("countermeasures_successful", 0)
    
    # Generate AI mission report if available
    if gemini_service:
        mission.ai_summary = await gemini_service.generate_mission_report(mission.dict())
    
    # Save to database
    if database_service:
        database_service.save_mission(mission)
    
    return {
        "message": "Mission completed successfully",
        "mission_id": mission_id,
        "final_report": mission.dict()
    }


@app.get("/api/missions/history")
async def get_mission_history(limit: int = 20):
    """Get mission history from database"""
    if not database_service:
        raise HTTPException(status_code=503, detail="Database service not available")
    
    history = database_service.get_mission_history(limit)
    return {"missions": history}


# System status endpoint
@app.get("/api/situation")
async def get_situation_assessment():
    """Get overall AI-powered situation assessment"""
    if not gemini_service:
        raise HTTPException(status_code=503, detail="AI service not available")
    
    assessment = await gemini_service.get_situation_assessment(satellites, threats)
    
    return {
        "situation_assessment": assessment,
        "active_threats": len([t for t in threats.values() if t.status == "active"]),
        "active_satellites": len([s for s in satellites.values() if s.status == "active"])
    }


# Additional endpoints for Nova frontend integration

@app.get("/api/iss/telemetry")
async def get_iss_telemetry():
    """Get ISS telemetry data (integrates with external API or mock)"""
    try:
        import httpx
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get("https://api.wheretheiss.at/v1/satellites/25544")
            if response.status_code == 200:
                data = response.json()
                return {
                    "latitude": data["latitude"],
                    "longitude": data["longitude"],
                    "altitude": data["altitude"],
                    "velocity": data["velocity"],
                    "timestamp": data["timestamp"],
                    "source": "LIVE"
                }
    except:
        pass
    
    # Fallback to mock data
    import time
    mock_phase = time.time() % 3600 / 3600
    return {
        "latitude": 51.6 * (0.8 + 0.2 * (mock_phase - 0.5)),
        "longitude": ((mock_phase * 60) % 360) - 180,
        "altitude": 408 + 6 * (mock_phase % 2),
        "velocity": 27580 + 60 * (mock_phase % 1.3),
        "timestamp": int(time.time()),
        "source": "MOCK"
    }


@app.get("/api/solar/status")
async def get_solar_status():
    """Get solar weather status"""
    import random
    flares = ["B1.2", "C3.4", "M1.0", "X1.8", "C7.2", "M2.5"]
    
    # Simulate delay
    await asyncio.sleep(0.1)
    
    return {
        "kpIndex": round(random.uniform(1, 7), 2),
        "solarWind": random.randint(380, 620),
        "flareClass": flares[random.randint(0, len(flares) - 1)],
        "cmeProbability": random.randint(10, 90),
        "updatedAt": datetime.now().isoformat()
    }


@app.get("/api/solar/feed")
async def get_solar_feed():
    """Get solar event feed"""
    # Simulate delay
    await asyncio.sleep(0.15)
    
    return [
        {"id": "evt-401", "t": "T-00:02:14", "msg": "CORONAL HOLE 812 - high-speed stream inbound"},
        {"id": "evt-402", "t": "T-00:18:42", "msg": "GOES-18 X-RAY FLUX nominal, monitoring band C"},
        {"id": "evt-403", "t": "T-01:04:09", "msg": "DSCOVR magnetometer Bz flipped negative"},
        {"id": "evt-404", "t": "T-02:31:55", "msg": "NOAA SWPC issued G1 minor storm watch"},
        {"id": "evt-405", "t": "T-03:47:11", "msg": "Proton event probability < 12% next 24h"},
        {"id": "evt-406", "t": "T-05:12:08", "msg": "SOHO LASCO C2 - no Earth-directed CME detected"}
    ]


@app.get("/api/threat/targets")
async def get_threat_targets():
    """Get threat targets (mapped from satellites)"""
    # Simulate delay
    await asyncio.sleep(0.1)
    
    # Map satellites to threat targets format
    targets = []
    for sat_id, satellite in satellites.items():
        if satellite.status == "active":
            import random
            vector = random.choice(["PRO", "RET", "NORM"])
            range_km = random.randint(50, 2000)
            targets.append({
                "id": f"TGT-{sat_id.replace('SAT-', '')}",
                "designation": f"{satellite.name} - {satellite.satellite_type.upper()}",
                "range": range_km,
                "vector": vector
            })
    
    return targets


@app.post("/api/threat/action")
async def log_tactical_action(action_data: dict):
    """Log tactical threat action"""
    # Simulate delay
    await asyncio.sleep(0.08)
    
    action = action_data.get("action", "unknown")
    
    # Create a countermeasure based on the action
    if action and threats:
        threat_id = list(threats.keys())[0] if threats else "THREAT-001"
        satellite_id = list(satellites.keys())[0] if satellites else "SAT-001"
        
        countermeasure = Countermeasure(
            id=f"CM-{int(datetime.now().timestamp())}",
            countermeasure_type="orbital_shift",
            target_threat_id=threat_id,
            target_satellite_id=satellite_id,
            execution_time=datetime.now().isoformat(),
            fuel_required=15.0,
            duration=35.0,
            success_probability=0.85,
            estimated_miss_distance=150.0,
            status="completed",
            parameters={"action": action}
        )
        
        countermeasures[countermeasure.id] = countermeasure
    
    import random
    return {
        "ok": True,
        "action": action,
        "timestamp": datetime.now().isoformat(),
        "confirmation": f"ACK :: {action.upper()} :: AUTH 7-NOVEMBER-{str(random.randint(100, 999)).zfill(3)}"
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
