from fastapi import APIRouter
import requests

router = APIRouter(prefix="/api/space", tags=["Space Tracking"])

@router.get("/iss/live")
async def get_iss_location():
    """Fetches real-time latitude, longitude, and velocity of the ISS."""
    try:
        response = requests.get("https://api.wheretheiss.at/v1/satellites/25544")
        data = response.json()
        return {
            "success": True,
            "name": "ISS",
            "latitude": data.get("latitude"),
            "longitude": data.get("longitude"),
            "velocity": data.get("velocity"),
            "altitude": data.get("altitude")
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.get("/weather/solar-storm")
async def get_solar_weather():
    """Returns current simulated or live geomagnetic solar storm status."""
    # This acts as a reliable placeholder you can use immediately for your UI
    return {
        "success": True,
        "status": "WARNING",
        "storm_level": "G3",
        "interference_probability": 78,
        "message": "Geomagnetic storm active. Expect radar anomalies and telemetry glitches."
    }
