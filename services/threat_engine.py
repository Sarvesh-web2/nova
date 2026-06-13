import numpy as np
from typing import Dict, Tuple, Optional
from datetime import datetime, timedelta
from models import Satellite, Missile, Threat, ThreatLevel


class ThreatDetectionEngine:
    """
    Processes simulated sensor data to detect ASAT missile launches
    and assess threat levels against satellite constellations.
    """
    
    def __init__(self):
        # Sensor network configuration
        self.sensor_network = {
            "infrared_sensors": [
                {"id": "IR-001", "location": (35.6762, 139.6503), "sensitivity": 0.95},
                {"id": "IR-002", "location": (40.7128, -74.0060), "sensitivity": 0.92},
                {"id": "IR-003", "location": (51.5074, -0.1278), "sensitivity": 0.94}
            ],
            "radar_stations": [
                {"id": "RADAR-001", "location": (37.7749, -122.4194), "range_km": 5000},
                {"id": "RADAR-002", "location": (34.0522, -118.2437), "range_km": 4800},
                {"id": "RADAR-003", "location": (41.8781, -87.6298), "range_km": 5200}
            ],
            "optical_sensors": [
                {"id": "OPT-001", "location": (33.8688, 151.2093), "resolution": 0.1},
                {"id": "OPT-002", "location": (52.5200, 13.4050), "resolution": 0.15}
            ]
        }
        
        # Detection thresholds
        self.heat_signature_threshold = 2500.0  # Kelvin
        self.radar_cross_section_threshold = 0.5  # m^2
        self.launch_detection_confidence = 0.85
    
    def analyze_heat_signature(self, sensor_data: Dict) -> Tuple[bool, float]:
        """
        Analyze infrared sensor data for missile launch heat signatures.
        
        Args:
            sensor_data: Dictionary containing temperature readings, spectral data
            
        Returns:
            Tuple of (launch_detected, confidence_score)
        """
        temperature = sensor_data.get("temperature", 0.0)
        spectral_peak = sensor_data.get("spectral_peak", 0.0)
        intensity = sensor_data.get("intensity", 0.0)
        
        # Rocket launch characteristics
        rocket_temperature_range = (2000, 3500)  # Kelvin
        rocket_spectral_range = (2.0, 5.0)  # micrometers
        
        # Temperature analysis
        temp_score = 1.0 if rocket_temperature_range[0] <= temperature <= rocket_temperature_range[1] else 0.0
        if temperature > rocket_temperature_range[1]:
            temp_score = max(0.0, 1.0 - (temperature - rocket_temperature_range[1]) / 1000)
        
        # Spectral analysis
        spectral_score = 1.0 if rocket_spectral_range[0] <= spectral_peak <= rocket_spectral_range[1] else 0.0
        
        # Intensity analysis (logarithmic scale)
        intensity_score = min(1.0, intensity / 10000.0)
        
        # Combined confidence
        confidence = (temp_score * 0.5 + spectral_score * 0.3 + intensity_score * 0.2)
        launch_detected = confidence >= self.launch_detection_confidence
        
        return launch_detected, confidence
    
    def analyze_radar_signature(self, radar_data: Dict) -> Tuple[bool, float]:
        """
        Analyze radar data for missile detection.
        
        Args:
            radar_data: Dictionary containing RCS, velocity, altitude
            
        Returns:
            Tuple of (missile_detected, confidence_score)
        """
        rcs = radar_data.get("radar_cross_section", 0.0)  # m^2
        velocity = radar_data.get("velocity", 0.0)  # m/s
        altitude = radar_data.get("altitude", 0.0)  # m
        acceleration = radar_data.get("acceleration", 0.0)  # m/s^2
        
        # ASAT missile characteristics
        asat_rcs_range = (0.1, 2.0)  # m^2
        asat_velocity_range = (2000, 8000)  # m/s
        asat_acceleration_range = (20, 100)  # m/s^2
        
        # RCS analysis
        rcs_score = 1.0 if asat_rcs_range[0] <= rcs <= asat_rcs_range[1] else 0.5
        
        # Velocity analysis
        velocity_score = 0.0
        if asat_velocity_range[0] <= velocity <= asat_velocity_range[1]:
            velocity_score = 1.0
        elif velocity < asat_velocity_range[0]:
            velocity_score = velocity / asat_velocity_range[0]
        
        # Acceleration analysis (boost phase characteristic)
        accel_score = 1.0 if asat_acceleration_range[0] <= acceleration <= asat_acceleration_range[1] else 0.0
        
        # Combined confidence
        confidence = (rcs_score * 0.3 + velocity_score * 0.4 + accel_score * 0.3)
        missile_detected = confidence >= self.launch_detection_confidence
        
        return missile_detected, confidence
    
    def triangulate_launch_coordinates(self, sensor_detections: list) -> Tuple[float, float]:
        """
        Triangulate launch coordinates using multiple sensor detections.
        
        Args:
            sensor_detections: List of (sensor_location, bearing, elevation, time)
            
        Returns:
            Tuple of (latitude, longitude)
        """
        if len(sensor_detections) < 2:
            # Default to first sensor location with estimated bearing
            return sensor_detections[0][0] if sensor_detections else (0.0, 0.0)
        
        # Simple triangulation (simplified for demo)
        # In production, use proper spherical triangulation
        latitudes = [d[0][0] for d in sensor_detections]
        longitudes = [d[0][1] for d in sensor_detections]
        
        # Weighted average based on confidence
        weights = [d[3] if len(d) > 3 else 1.0 for d in sensor_detections]
        total_weight = sum(weights)
        
        avg_lat = sum(lat * w for lat, w in zip(latitudes, weights)) / total_weight
        avg_lon = sum(lon * w for lon, w in zip(longitudes, weights)) / total_weight
        
        return (avg_lat, avg_lon)
    
    def calculate_collision_probability(self, missile: Missile, satellite: Satellite) -> float:
        """
        Calculate probability of missile-satellite collision.
        
        Args:
            missile: Missile object with trajectory data
            satellite: Satellite object with position/orbit data
            
        Returns:
            Collision probability (0.0 to 1.0)
        """
        # Extract positions
        missile_pos = np.array(missile.trajectory.current_position)
        satellite_pos = np.array([
            satellite.position.latitude,
            satellite.position.longitude,
            satellite.position.altitude
        ])
        
        # Calculate relative distance
        distance = np.linalg.norm(missile_pos - satellite_pos)
        
        # Convert position to Cartesian for better accuracy (simplified)
        # In production, use proper spherical to Cartesian conversion
        miss_distance_km = distance
        
        # Missile accuracy factors
        missile_accuracy = 0.95 - (missile.maneuverability * 0.1)  # High maneuverability = harder to intercept
        sensor_confidence = missile.detection_confidence
        
        # Time factor (less time = harder to defend)
        time_factor = min(1.0, missile.trajectory.velocity / 10.0)  # Normalize velocity
        
        # Distance factor (closer = higher probability)
        distance_factor = max(0.0, 1.0 - (miss_distance_km / 1000.0))  # 1000km engagement range
        
        # Combined probability
        collision_prob = (
            missile_accuracy * 0.3 +
            sensor_confidence * 0.2 +
            time_factor * 0.2 +
            distance_factor * 0.3
        )
        
        return max(0.0, min(1.0, collision_prob))
    
    def estimate_time_to_impact(self, missile: Missile, satellite: Satellite) -> float:
        """
        Estimate time until potential impact.
        
        Args:
            missile: Missile object with trajectory data
            satellite: Satellite object with position data
            
        Returns:
            Time to impact in seconds
        """
        missile_pos = np.array(missile.trajectory.current_position)
        satellite_pos = np.array([
            satellite.position.latitude,
            satellite.position.longitude,
            satellite.position.altitude
        ])
        
        # Calculate distance
        distance = np.linalg.norm(missile_pos - satellite_pos)
        
        # Convert to approximate meters (simplified conversion)
        distance_m = distance * 111000  # 1 degree ≈ 111km
        
        # Calculate closing speed
        missile_speed = missile.trajectory.velocity * 1000  # Convert km/s to m/s
        satellite_speed = np.linalg.norm([
            satellite.position.velocity_x,
            satellite.position.velocity_y,
            satellite.position.velocity_z
        ]) * 1000
        
        # Relative speed (simplified - doesn't account for direction)
        relative_speed = missile_speed - satellite_speed
        
        if relative_speed <= 0:
            return 9999.0  # Missile won't catch satellite
        
        time_to_impact = distance_m / relative_speed
        return max(0.0, time_to_impact)
    
    def determine_threat_level(self, collision_prob: float, time_to_impact: float, satellite_value: float) -> ThreatLevel:
        """
        Determine threat level based on multiple factors.
        
        Args:
            collision_prob: Probability of collision (0-1)
            time_to_impact: Time until impact in seconds
            satellite_value: Economic value of satellite
            
        Returns:
            ThreatLevel enum value
        """
        # Urgency factor (less time = more critical)
        urgency = max(0.0, 1.0 - (time_to_impact / 300.0))  # 5 minutes = critical
        
        # Impact factor (higher value = more critical)
        value_factor = min(1.0, satellite_value / 10000000000.0)  # 10B = max
        
        # Combined threat score
        threat_score = (collision_prob * 0.5 + urgency * 0.3 + value_factor * 0.2)
        
        if threat_score >= 0.8:
            return ThreatLevel.CRITICAL
        elif threat_score >= 0.6:
            return ThreatLevel.HIGH
        elif threat_score >= 0.4:
            return ThreatLevel.MODERATE
        else:
            return ThreatLevel.LOW
    
    def detect_threat(self, sensor_data: Dict, satellites: Dict[str, Satellite]) -> Optional[Threat]:
        """
        Main threat detection function - processes sensor data and generates threat assessment.
        
        Args:
            sensor_data: Dictionary containing sensor readings from multiple sources
            satellites: Dictionary of satellites to assess threats against
            
        Returns:
            Threat object if threat detected, None otherwise
        """
        # Analyze different sensor types
        ir_data = sensor_data.get("infrared", {})
        radar_data = sensor_data.get("radar", {})
        
        # Heat signature analysis
        launch_detected, ir_confidence = self.analyze_heat_signature(ir_data)
        
        # Radar signature analysis
        missile_detected, radar_confidence = self.analyze_radar_signature(radar_data)
        
        # Combined detection confidence
        overall_confidence = (ir_confidence + radar_confidence) / 2
        
        if not (launch_detected and missile_detected):
            return None
        
        # Triangulate launch coordinates
        sensor_detections = sensor_data.get("sensor_detections", [])
        launch_coords = self.triangulate_launch_coordinates(sensor_detections)
        
        # Create missile object
        missile_id = f"MISSILE-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        missile = Missile(
            id=missile_id,
            missile_type="kinetic",
            trajectory={
                "launch_position": launch_coords,
                "current_position": (
                    launch_coords[0],
                    launch_coords[1],
                    radar_data.get("altitude", 0.0) / 1000.0  # Convert to km
                ),
                "target_position": (0.0, 0.0, 0.0),  # Will be calculated
                "velocity": radar_data.get("velocity", 0.0) / 1000.0,  # Convert to km/s
                "heading": radar_data.get("heading", 0.0),
                "flight_path_points": []
            },
            detected_by=[d.get("sensor_id", "UNKNOWN") for d in sensor_detections],
            detection_confidence=overall_confidence
        )
        
        # Find most threatened satellite
        highest_threat = None
        highest_collision_prob = 0.0
        
        for sat_id, satellite in satellites.items():
            if satellite.status != "active":
                continue
            
            collision_prob = self.calculate_collision_probability(missile, satellite)
            
            if collision_prob > highest_collision_prob:
                highest_collision_prob = collision_prob
                missile.target_satellite_id = sat_id
                highest_threat = satellite
        
        if not highest_threat:
            return None
        
        # Calculate time to impact
        time_to_impact = self.estimate_time_to_impact(missile, highest_threat)
        
        # Determine threat level
        threat_level = self.determine_threat_level(
            highest_collision_prob,
            time_to_impact,
            highest_threat.economic_value
        )
        
        # Create threat object
        threat_id = f"THREAT-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        threat = Threat(
            id=threat_id,
            threat_level=threat_level,
            missile_id=missile_id,
            target_satellite_id=highest_threat.id,
            collision_probability=highest_collision_prob,
            time_to_impact=time_to_impact,
            status="active",
            detected_at=datetime.now(),
            last_updated=datetime.now()
        )
        
        return threat