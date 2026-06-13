import numpy as np
from typing import Tuple, List, Optional
from datetime import datetime, timedelta
from models import Satellite, Missile


class TrajectoryPredictor:
    """
    Predicts satellite orbits and missile trajectories for collision analysis.
    Uses Keplerian orbital mechanics for satellites and ballistic physics for missiles.
    """
    
    # Earth parameters
    EARTH_RADIUS = 6371.0  # km
    EARTH_MU = 398600.4418  # km^3/s^2 (standard gravitational parameter)
    
    def __init__(self):
        self.time_step = 1.0  # seconds for trajectory calculations
    
    def kepler_to_cartesian(self, orbit: dict) -> Tuple[float, float, float, float, float, float]:
        """
        Convert Keplerian orbital elements to Cartesian state vectors.
        
        Args:
            orbit: Dictionary containing orbital elements (a, e, i, Ω, ω, ν)
            
        Returns:
            Tuple of (x, y, z, vx, vy, vz) in km and km/s
        """
        a = orbit["semi_major_axis"]
        e = orbit["eccentricity"]
        i = np.radians(orbit["inclination"])
        raan = np.radians(orbit["raan"])
        arg_perigee = np.radians(orbit["arg_perigee"])
        true_anomaly = np.radians(orbit["true_anomaly"])
        
        # Calculate distance from central body
        r = a * (1 - e**2) / (1 + e * np.cos(true_anomaly))
        
        # Position in perifocal frame
        x_p = r * np.cos(true_anomaly)
        y_p = r * np.sin(true_anomaly)
        
        # Velocity in perifocal frame
        v = np.sqrt(self.EARTH_MU * a) / r
        vx_p = -v * np.sin(true_anomaly)
        vy_p = v * (e + np.cos(true_anomaly))
        
        # Rotation matrices to transform to ECI frame
        # 1. Rotate by argument of perigee (ω) about z-axis
        cos_omega = np.cos(arg_perigee)
        sin_omega = np.sin(arg_perigee)
        
        x_1 = x_p * cos_omega - y_p * sin_omega
        y_1 = x_p * sin_omega + y_p * cos_omega
        vx_1 = vx_p * cos_omega - vy_p * sin_omega
        vy_1 = vx_p * sin_omega + vy_p * cos_omega
        
        # 2. Rotate by inclination (i) about x-axis
        cos_i = np.cos(i)
        sin_i = np.sin(i)
        
        x_2 = x_1
        y_2 = y_1 * cos_i
        z_2 = y_1 * sin_i
        vx_2 = vx_1
        vy_2 = vy_1 * cos_i
        vz_2 = vy_1 * sin_i
        
        # 3. Rotate by RAAN (Ω) about z-axis
        cos_raan = np.cos(raan)
        sin_raan = np.sin(raan)
        
        x = x_2 * cos_raan - y_2 * sin_raan
        y = x_2 * sin_raan + y_2 * cos_raan
        z = z_2
        vx = vx_2 * cos_raan - vy_2 * sin_raan
        vy = vx_2 * sin_raan + vy_2 * cos_raan
        vz = vz_2
        
        return (x, y, z, vx, vy, vz)
    
    def cartesian_to_geodetic(self, x: float, y: float, z: float) -> Tuple[float, float, float]:
        """
        Convert Cartesian ECI coordinates to geodetic coordinates.
        
        Args:
            x, y, z: Cartesian coordinates in km
            
        Returns:
            Tuple of (latitude, longitude, altitude) in degrees and km
        """
        # Calculate longitude
        longitude = np.arctan2(y, x)
        
        # Calculate latitude
        r = np.sqrt(x**2 + y**2 + z**2)
        latitude = np.arcsin(z / r)
        
        # Calculate altitude
        altitude = r - self.EARTH_RADIUS
        
        return (np.degrees(latitude), np.degrees(longitude), altitude)
    
    def propagate_satellite_orbit(self, satellite: Satellite, time_ahead: float) -> dict:
        """
        Propagate satellite orbit to future time using Keplerian mechanics.
        
        Args:
            satellite: Satellite object with current orbit
            time_ahead: Time in seconds to propagate
            
        Returns:
            Dictionary with future position and velocity
        """
        # Get current orbital elements
        a = satellite.orbit.semi_major_axis
        e = satellite.orbit.eccentricity
        
        # Calculate mean motion
        n = np.sqrt(self.EARTH_MU / a**3)
        
        # Current mean anomaly
        M0 = satellite.orbit.true_anomaly  # Simplified - should be from eccentric anomaly
        
        # Future mean anomaly
        M = M0 + np.degrees(n * time_ahead)
        
        # Solve Kepler's equation for eccentric anomaly (M = E - e*sin(E))
        # Using Newton-Raphson iteration
        E = M
        for _ in range(10):
            E = E - (E - e * np.sin(E) - M) / (1 - e * np.cos(E))
        
        # Calculate true anomaly from eccentric anomaly
        true_anomaly = 2 * np.arctan(np.sqrt((1 + e) / (1 - e)) * np.tan(E / 2))
        
        # Create updated orbit
        updated_orbit = satellite.orbit.copy() if hasattr(satellite.orbit, 'copy') else satellite.orbit.dict()
        updated_orbit["true_anomaly"] = np.degrees(true_anomaly) % 360
        
        # Convert to Cartesian
        x, y, z, vx, vy, vz = self.kepler_to_cartesian(updated_orbit)
        
        # Convert to geodetic
        lat, lon, alt = self.cartesian_to_geodetic(x, y, z)
        
        return {
            "latitude": lat,
            "longitude": lon,
            "altitude": alt,
            "velocity_x": vx,
            "velocity_y": vy,
            "velocity_z": vz
        }
    
    def calculate_ballistic_trajectory(self, launch_coords: Tuple[float, float], 
                                       target_coords: Tuple[float, float, float],
                                       velocity: float) -> List[Tuple[float, float, float]]:
        """
        Calculate ballistic missile trajectory from launch to target.
        
        Args:
            launch_coords: (latitude, longitude) of launch site
            target_coords: (latitude, longitude, altitude) of target
            velocity: Launch velocity in km/s
            
        Returns:
            List of trajectory points (lat, lon, alt)
        """
        trajectory_points = []
        
        # Convert to Cartesian
        lat1, lon1 = np.radians(launch_coords[0]), np.radians(launch_coords[1])
        lat2, lon2, alt2 = np.radians(target_coords[0]), np.radians(target_coords[1]), target_coords[2]
        
        # Calculate launch and target positions in 3D
        r1 = self.EARTH_RADIUS
        r2 = self.EARTH_RADIUS + alt2
        
        # Simple ballistic arc (simplified for demo)
        # In production, use proper ballistic missile trajectory equations
        
        # Number of points for trajectory
        num_points = 100
        
        for i in range(num_points + 1):
            t = i / num_points
            
            # Linear interpolation of position (simplified)
            lat_t = lat1 + (lat2 - lat1) * t
            lon_t = lon1 + (lon2 - lon1) * t
            
            # Altitude follows ballistic arc
            # Peak altitude at mid-point
            if t <= 0.5:
                # Ascending
                altitude = r1 + (r2 - r1) * t + 500 * np.sin(t * np.pi)
            else:
                # Descending
                altitude = r1 + (r2 - r1) * t + 500 * np.sin(t * np.pi)
            
            # Add some noise for realism
            altitude += np.random.normal(0, 10)  # 10km standard deviation
            
            trajectory_points.append((
                np.degrees(lat_t),
                np.degrees(lon_t),
                altitude
            ))
        
        return trajectory_points
    
    def predict_intercept_point(self, missile: Missile, satellite: Satellite, 
                               time_horizon: float = 300.0) -> Tuple[float, float, float]:
        """
        Predict where missile and satellite will be closest (potential intercept point).
        
        Args:
            missile: Missile object with trajectory
            satellite: Satellite object with orbit
            time_horizon: Maximum time to look ahead in seconds
            
        Returns:
            Tuple of (latitude, longitude, altitude) of intercept point
        """
        # Search for minimum distance over time horizon
        min_distance = float('inf')
        intercept_point = (0.0, 0.0, 0.0)
        intercept_time = 0.0
        
        # Sample time points
        time_steps = np.linspace(0, time_horizon, 100)
        
        for t in time_steps:
            # Get future satellite position
            sat_future = self.propagate_satellite_orbit(satellite, t)
            sat_pos = np.array([
                sat_future["latitude"],
                sat_future["longitude"],
                sat_future["altitude"]
            ])
            
            # Get future missile position (simplified linear propagation)
            missile_progress = t / 300.0  # Assume 5 minute flight time
            if missile_progress > 1.0:
                missile_progress = 1.0
            
            current_missile_pos = np.array(missile.trajectory.current_position)
            target_missile_pos = np.array(missile.trajectory.target_position)
            missile_future_pos = current_missile_pos + (target_missile_pos - current_missile_pos) * missile_progress
            
            # Calculate distance
            distance = np.linalg.norm(sat_pos - missile_future_pos)
            
            if distance < min_distance:
                min_distance = distance
                intercept_point = (
                    (sat_pos[0] + missile_future_pos[0]) / 2,
                    (sat_pos[1] + missile_future_pos[1]) / 2,
                    (sat_pos[2] + missile_future_pos[2]) / 2
                )
                intercept_time = t
        
        return intercept_point
    
    def calculate_satellite_visibility(self, satellite: Satellite, 
                                     observer_coords: Tuple[float, float]) -> dict:
        """
        Calculate if satellite is visible from a ground observer.
        
        Args:
            satellite: Satellite object
            observer_coords: (latitude, longitude) of observer
            
        Returns:
            Dictionary with visibility information
        """
        sat_lat = satellite.position.latitude
        sat_lon = satellite.position.longitude
        sat_alt = satellite.position.altitude
        
        obs_lat, obs_lon = observer_coords
        
        # Calculate angular separation
        dlat = np.radians(sat_lat - obs_lat)
        dlon = np.radians(sat_lon - obs_lon)
        a = np.sin(dlat/2)**2 + np.cos(np.radians(obs_lat)) * np.cos(np.radians(sat_lat)) * np.sin(dlon/2)**2
        angular_separation = 2 * np.arcsin(np.sqrt(a))
        
        # Calculate elevation angle
        # Simplified calculation
        earth_radius = self.EARTH_RADIUS
        satellite_range = earth_radius + sat_alt
        
        # Elevation angle
        elevation = np.arcsin(sat_alt / satellite_range) - angular_separation
        elevation_deg = np.degrees(elevation)
        
        # Visibility threshold (typically 10-15 degrees above horizon)
        is_visible = elevation_deg > 10.0
        
        return {
            "is_visible": is_visible,
            "elevation_angle": elevation_deg,
            "angular_separation": np.degrees(angular_separation),
            "azimuth": np.degrees(np.arctan2(dlon, dlat))
        }
    
    def calculate_orbital_period(self, satellite: Satellite) -> float:
        """
        Calculate orbital period using Kepler's third law.
        
        Args:
            satellite: Satellite object
            
        Returns:
            Orbital period in seconds
        """
        a = satellite.orbit.semi_major_axis
        period = 2 * np.pi * np.sqrt(a**3 / self.EARTH_MU)
        return period
    
    def calculate_ground_track(self, satellite: Satellite, duration: float = 90.0) -> List[Tuple[float, float]]:
        """
        Calculate satellite ground track over time.
        
        Args:
            satellite: Satellite object
            duration: Time period in minutes to calculate track
            
        Returns:
            List of (latitude, longitude) points
        """
        ground_track = []
        time_seconds = duration * 60
        time_step = 10.0  # 10 second intervals
        
        for t in np.arange(0, time_seconds, time_step):
            future_pos = self.propagate_satellite_orbit(satellite, t)
            ground_track.append((
                future_pos["latitude"],
                future_pos["longitude"]
            ))
        
        return ground_track