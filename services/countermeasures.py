import numpy as np
from typing import Dict, Tuple, Optional
from models import Satellite, Threat, Countermeasure
from enum import Enum


class CountermeasureType(Enum):
    ORBITAL_SHIFT = "orbital_shift"
    DECOY_DEPLOYMENT = "decoy_deployment"
    SIGNAL_SPOOFING = "signal_spoofing"
    ELECTRONIC_ATTACK = "electronic_attack"


class CountermeasureSystem:
    """
    Calculates and simulates various countermeasures against ASAT threats.
    Determines success probabilities and resource requirements.
    """
    
    # Physical constants
    EARTH_RADIUS = 6371.0  # km
    EARTH_MU = 398600.4418  # km^3/s^2
    
    def __init__(self):
        # Countermeasure effectiveness parameters
        self.countermeasure_params = {
            "orbital_shift": {
                "base_success_rate": 0.85,
                "fuel_consumption_rate": 15.0,  # % per 100km altitude change
                "minimum_time_required": 30.0,  # seconds
                "maximum_effective_altitude_change": 500.0  # km
            },
            "decoy_deployment": {
                "base_success_rate": 0.70,
                "fuel_consumption_rate": 5.0,  # % per decoy
                "minimum_time_required": 10.0,  # seconds
                "max_decoys": 10,
                "effectiveness_per_decoy": 0.15  # 15% confusion per decoy
            },
            "signal_spoofing": {
                "base_success_rate": 0.60,
                "fuel_consumption_rate": 2.0,  # % (minimal)
                "minimum_time_required": 5.0,  # seconds
                "power_consumption": 20.0,  # kW
                "effective_against": ["kinetic", "electronic"]
            },
            "electronic_attack": {
                "base_success_rate": 0.75,
                "fuel_consumption_rate": 8.0,  # %
                "minimum_time_required": 15.0,  # seconds
                "power_consumption": 50.0,  # kW
                "effective_against": ["electronic", "laser"]
            }
        }
    
    def calculate_orbital_shift_success(self, satellite: Satellite, 
                                      threat: Threat,
                                      altitude_change: float) -> Dict:
        """
        Calculate success probability and requirements for orbital shift countermeasure.
        
        Args:
            satellite: Satellite to protect
            threat: Threat information
            altitude_change: Desired altitude change in km
            
        Returns:
            Dictionary with orbital shift analysis
        """
        params = self.countermeasure_params["orbital_shift"]
        
        # Calculate delta-v required for altitude change
        delta_v = self._calculate_delta_v_for_altitude_change(
            satellite.position.altitude,
            satellite.position.altitude + altitude_change
        )
        
        # Calculate fuel required
        fuel_required = self._calculate_fuel_required(delta_v, satellite)
        
        # Check if sufficient fuel
        fuel_sufficient = fuel_required <= satellite.fuel_remaining
        
        # Check time constraint
        time_available = threat.time_to_impact
        time_sufficient = time_available >= params["minimum_time_required"]
        
        # Calculate success probability
        base_success = params["base_success_rate"]
        
        # Adjust for fuel availability
        fuel_factor = 1.0 if fuel_sufficient else 0.3
        
        # Adjust for time constraint
        time_factor = min(1.0, time_available / params["minimum_time_required"])
        
        # Adjust for altitude change feasibility
        altitude_factor = min(1.0, params["maximum_effective_altitude_change"] / abs(altitude_change))
        
        # Combined success probability
        success_probability = base_success * fuel_factor * time_factor * altitude_factor
        
        # Calculate resulting miss distance
        miss_distance = altitude_change * 1000  # Convert km to m for miss distance
        
        return {
            "countermeasure_type": "orbital_shift",
            "delta_v_required": delta_v,
            "fuel_required": fuel_required,
            "fuel_sufficient": fuel_sufficient,
            "time_required": params["minimum_time_required"],
            "time_sufficient": time_sufficient,
            "success_probability": max(0.0, min(1.0, success_probability)),
            "estimated_miss_distance": miss_distance,
            "altitude_change_feasible": abs(altitude_change) <= params["maximum_effective_altitude_change"]
        }
    
    def _calculate_delta_v_for_altitude_change(self, current_altitude: float, 
                                             target_altitude: float) -> float:
        """
        Calculate delta-v required for altitude change using Hohmann transfer principles.
        
        Args:
            current_altitude: Current orbital altitude in km
            target_altitude: Target orbital altitude in km
            
        Returns:
            Required delta-v in km/s
        """
        r1 = self.EARTH_RADIUS + current_altitude
        r2 = self.EARTH_RADIUS + target_altitude
        
        # Hohmann transfer delta-v
        v1 = np.sqrt(self.EARTH_MU / r1)
        v2 = np.sqrt(self.EARTH_MU / r2)
        v_transfer1 = np.sqrt(self.EARTH_MU / r1) * np.sqrt(2 * r2 / (r1 + r2))
        v_transfer2 = np.sqrt(self.EARTH_MU / r2) * np.sqrt(2 * r1 / (r1 + r2))
        
        delta_v = abs(v_transfer1 - v1) + abs(v_transfer2 - v2)
        return delta_v
    
    def _calculate_fuel_required(self, delta_v: float, satellite: Satellite) -> float:
        """
        Calculate fuel required for given delta-v based on satellite mass.
        
        Args:
            delta_v: Required velocity change in km/s
            satellite: Satellite object
            
        Returns:
            Fuel required as percentage of total fuel
        """
        # Assume satellite mass based on type (simplified)
        satellite_masses = {
            "military": 5000,  # kg
            "communications": 3000,
            "navigation": 2000,
            "weather": 2500,
            "research": 1500,
            "spy": 4000
        }
        
        mass = satellite_masses.get(satellite.satellite_type, 3000)
        
        # Rocket equation: delta_v = Isp * g0 * ln(m0 / mf)
        # Rearranged: fuel_required = m0 * (1 - exp(-delta_v / (Isp * g0)))
        Isp = 300  # Specific impulse in seconds (typical for satellite thrusters)
        g0 = 9.81  # Standard gravity
        
        fuel_mass = mass * (1 - np.exp(-delta_v / (Isp * g0)))
        
        # Convert to percentage (assume fuel is 20% of satellite mass)
        total_fuel_mass = mass * 0.2
        fuel_percentage = (fuel_mass / total_fuel_mass) * 100
        
        return min(100.0, fuel_percentage)
    
    def simulate_decoy_deployment(self, satellite: Satellite, 
                                 threat: Threat,
                                 num_decoys: int) -> Dict:
        """
        Simulate decoy deployment countermeasure effectiveness.
        
        Args:
            satellite: Satellite to protect
            threat: Threat information
            num_decoys: Number of decoys to deploy
            
        Returns:
            Dictionary with decoy deployment analysis
        """
        params = self.countermeasure_params["decoy_deployment"]
        
        # Limit decoys to maximum
        num_decoys = min(num_decoys, params["max_decoys"])
        
        # Calculate fuel required
        fuel_required = num_decoys * params["fuel_consumption_rate"]
        fuel_sufficient = fuel_required <= satellite.fuel_remaining
        
        # Calculate confusion factor
        confusion_factor = num_decoys * params["effectiveness_per_decoy"]
        confusion_factor = min(0.9, confusion_factor)  # Max 90% confusion
        
        # Check time constraint
        time_required = num_decoys * 2.0  # 2 seconds per decoy
        time_sufficient = threat.time_to_impact >= time_required
        
        # Calculate success probability
        base_success = params["base_success_rate"]
        
        # Adjust for confusion factor
        confusion_bonus = confusion_factor * 0.3
        
        # Adjust for fuel and time
        fuel_factor = 1.0 if fuel_sufficient else 0.4
        time_factor = min(1.0, threat.time_to_impact / time_required)
        
        # Combined success probability
        success_probability = base_success + confusion_bonus
        success_probability *= fuel_factor * time_factor
        success_probability = max(0.0, min(1.0, success_probability))
        
        # Calculate expected miss distance (random scattering)
        expected_miss_distance = confusion_factor * 500  # meters
        
        return {
            "countermeasure_type": "decoy_deployment",
            "num_decoys": num_decoys,
            "fuel_required": fuel_required,
            "fuel_sufficient": fuel_sufficient,
            "time_required": time_required,
            "time_sufficient": time_sufficient,
            "confusion_factor": confusion_factor,
            "success_probability": success_probability,
            "estimated_miss_distance": expected_miss_distance
        }
    
    def calculate_signal_spoofing(self, satellite: Satellite, 
                                threat: Threat) -> Dict:
        """
        Calculate signal spoofing countermeasure effectiveness.
        
        Args:
            satellite: Satellite to protect
            threat: Threat information
            
        Returns:
            Dictionary with signal spoofing analysis
        """
        params = self.countermeasure_params["signal_spoofing"]
        
        # Check if effective against missile type
        missile_type = threat.missile_id  # Would need to get actual missile object
        # For now, assume effectiveness
        effective_against = True
        
        # Check power availability
        power_required = params["power_consumption"]
        power_available = True  # Assume sufficient power for now
        
        # Calculate success probability
        base_success = params["base_success_rate"]
        
        # Adjust for effectiveness against missile type
        type_factor = 1.0 if effective_against else 0.3
        
        # Adjust for time (earlier is better)
        time_factor = min(1.0, threat.time_to_impact / 60.0)  # More effective if more time
        
        # Combined success probability
        success_probability = base_success * type_factor * time_factor
        success_probability = max(0.0, min(1.0, success_probability))
        
        # Calculate fuel requirement (minimal)
        fuel_required = params["fuel_consumption_rate"]
        
        return {
            "countermeasure_type": "signal_spoofing",
            "fuel_required": fuel_required,
            "power_required": power_required,
            "effective_against_threat": effective_against,
            "success_probability": success_probability,
            "time_required": params["minimum_time_required"],
            "estimated_miss_distance": success_probability * 1000  # meters
        }
    
    def calculate_electronic_attack(self, satellite: Satellite,
                                    threat: Threat) -> Dict:
        """
        Calculate electronic attack countermeasure effectiveness.
        
        Args:
            satellite: Satellite to protect
            threat: Threat information
            
        Returns:
            Dictionary with electronic attack analysis
        """
        params = self.countermeasure_params["electronic_attack"]
        
        # Check if effective against missile type
        effective_against = True  # Simplified
        
        # Calculate success probability
        base_success = params["base_success_rate"]
        
        # Adjust for effectiveness
        type_factor = 1.0 if effective_against else 0.4
        
        # Adjust for time and fuel
        time_factor = min(1.0, threat.time_to_impact / params["minimum_time_required"])
        fuel_factor = 1.0 if params["fuel_consumption_rate"] <= satellite.fuel_remaining else 0.5
        
        # Combined success probability
        success_probability = base_success * type_factor * time_factor * fuel_factor
        success_probability = max(0.0, min(1.0, success_probability))
        
        return {
            "countermeasure_type": "electronic_attack",
            "fuel_required": params["fuel_consumption_rate"],
            "power_required": params["power_consumption"],
            "effective_against_threat": effective_against,
            "success_probability": success_probability,
            "time_required": params["minimum_time_required"],
            "estimated_miss_distance": success_probability * 800  # meters
        }
    
    def determine_best_countermeasure(self, satellite: Satellite, 
                                     threat: Threat) -> Dict:
        """
        Analyze all countermeasures and recommend the best option.
        
        Args:
            satellite: Satellite to protect
            threat: Threat information
            
        Returns:
            Dictionary with recommended countermeasure and analysis
        """
        countermeasures = []
        
        # Analyze each countermeasure type
        countermeasures.append(
            self.calculate_orbital_shift_success(satellite, threat, 100.0)
        )
        countermeasures.append(
            self.simulate_decoy_deployment(satellite, threat, 5)
        )
        countermeasures.append(
            self.calculate_signal_spoofing(satellite, threat)
        )
        countermeasures.append(
            self.calculate_electronic_attack(satellite, threat)
        )
        
        # Sort by success probability
        countermeasures.sort(key=lambda x: x["success_probability"], reverse=True)
        
        best_countermeasure = countermeasures[0]
        
        # Calculate overall confidence
        top_two = countermeasures[:2]
        if len(top_two) == 2:
            confidence_gap = top_two[0]["success_probability"] - top_two[1]["success_probability"]
            recommendation_confidence = 0.5 + (confidence_gap * 0.5)
        else:
            recommendation_confidence = 0.8
        
        return {
            "recommended_countermeasure": best_countermeasure["countermeasure_type"],
            "success_probability": best_countermeasure["success_probability"],
            "estimated_miss_distance": best_countermeasure["estimated_miss_distance"],
            "fuel_required": best_countermeasure["fuel_required"],
            "time_required": best_countermeasure["time_required"],
            "recommendation_confidence": recommendation_confidence,
            "all_countermeasures_analyzed": countermeasures,
            "reasoning": self._generate_countermeasure_reasoning(best_countermeasure, countermeasures)
        }
    
    def _generate_countermeasure_reasoning(self, best: Dict, all_options: list) -> str:
        """Generate explanation for countermeasure recommendation."""
        reasoning_parts = [
            f"{best['countermeasure_type'].replace('_', ' ').title()} offers the highest success probability",
            f"at {best['success_probability']:.1%} with estimated miss distance of {best['estimated_miss_distance']:.0f}m",
            f"requiring {best['fuel_required']:.1f}% fuel and {best['time_required']:.0f}s to execute"
        ]
        
        return ". ".join(reasoning_parts)
    
    def simulate_countermeasure_execution(self, countermeasure: Countermeasure,
                                         satellite: Satellite,
                                         threat: Threat) -> Dict:
        """
        Simulate the actual execution of a countermeasure.
        
        Args:
            countermeasure: Countermeasure to execute
            satellite: Satellite being protected
            threat: Threat being addressed
            
        Returns:
            Dictionary with execution results
        """
        # Update satellite fuel
        fuel_used = countermeasure.fuel_required
        satellite.fuel_remaining -= fuel_used
        
        # Calculate actual success based on probability
        import random
        actual_success = random.random() < countermeasure.success_probability
        
        # Calculate actual miss distance
        if actual_success:
            # Successful - use estimated miss distance with some variance
            variance = countermeasure.estimated_miss_distance * 0.2
            actual_miss_distance = countermeasure.estimated_miss_distance + random.uniform(-variance, variance)
        else:
            # Failed - minimal or no miss distance
            actual_miss_distance = random.uniform(0, 50)  # 0-50m miss
        
        # Update countermeasure status
        countermeasure.actual_success = actual_success
        countermeasure.final_miss_distance = actual_miss_distance
        countermeasure.fuel_used = fuel_used
        countermeasure.status = "completed" if actual_success else "failed"
        
        return {
            "countermeasure_id": countermeasure.id,
            "execution_successful": actual_success,
            "fuel_used": fuel_used,
            "satellite_fuel_remaining": satellite.fuel_remaining,
            "actual_miss_distance": actual_miss_distance,
            "threat_mitigated": actual_miss_distance > 100  # 100m threshold for successful mitigation
        }