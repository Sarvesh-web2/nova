from typing import Dict, List, Tuple
from models import Satellite, Threat
from enum import Enum


class ServiceCategory(Enum):
    MILITARY = "military"
    COMMUNICATIONS = "communications"
    NAVIGATION = "navigation"
    WEATHER = "weather"
    RESEARCH = "research"
    FINANCIAL = "financial"
    EMERGENCY = "emergency"
    TRANSPORTATION = "transportation"


class ImpactAnalyzer:
    """
    Analyzes the cascading impact of satellite loss on global infrastructure.
    Calculates economic, social, and operational consequences.
    """
    
    def __init__(self):
        # Dependency graph showing system interdependencies
        self.dependency_graph = {
            # Military satellites
            "military_comms": ["fleet_coordination", "border_surveillance", "drone_operations"],
            "encrypted_transmission": ["diplomatic_communications", "nuclear_command", "spy_networks"],
            
            # Navigation satellites
            "gps_navigation": ["aviation", "shipping", "ground_transportation", "banking"],
            "timing": ["financial_markets", "power_grid_synchronization", "telecommunications"],
            
            # Communications satellites
            "broadcasting": ["television", "radio", "internet_backbone"],
            "satellite_internet": ["rural_connectivity", "maritime_comms", "aviation_comms"],
            
            # Weather satellites
            "weather_forecasting": ["aviation_safety", "shipping_routes", "agriculture", "disaster_warning"],
            "climate_monitoring": ["long_term_planning", "environmental_protection", "research"],
            
            # Research satellites
            "scientific_research": ["space_exploration", "technology_development", "education"],
            "earth_observation": ["mapping", "urban_planning", "resource_management"]
        }
        
        # Service value multipliers for economic impact calculation
        self.service_values = {
            "military": 10.0,  # Highest multiplier
            "navigation": 8.0,
            "communications": 6.0,
            "financial": 7.0,
            "emergency": 9.0,
            "transportation": 5.0,
            "weather": 4.0,
            "research": 2.0
        }
        
        # User impact categories
        self.user_categories = {
            "military": {"user_count": 1000000, "economic_impact_per_user": 100000},
            "government": {"user_count": 10000000, "economic_impact_per_user": 50000},
            "commercial": {"user_count": 100000000, "economic_impact_per_user": 10000},
            "consumer": {"user_count": 1000000000, "economic_impact_per_user": 100}
        }
    
    def analyze_satellite_dependencies(self, satellite: Satellite) -> Dict:
        """
        Traverse dependency graph to find all systems affected by satellite loss.
        
        Args:
            satellite: Satellite object with services and dependent systems
            
        Returns:
            Dictionary with dependency analysis results
        """
        affected_systems = set()
        critical_path = []
        
        # Start with direct dependencies
        for service in satellite.services:
            if service in self.dependency_graph:
                direct_deps = self.dependency_graph[service]
                affected_systems.update(direct_deps)
                critical_path.extend(direct_deps)
        
        # Second-order dependencies (systems that depend on the first-order systems)
        second_order_systems = set()
        for system in affected_systems:
            for service, deps in self.dependency_graph.items():
                if system in deps:
                    second_order_systems.update(deps)
        
        affected_systems.update(second_order_systems)
        
        # Categorize impact by sector
        sector_impact = self._categorize_by_sector(affected_systems)
        
        return {
            "direct_dependencies": satellite.dependent_systems,
            "affected_systems": list(affected_systems),
            "critical_path": critical_path,
            "sector_impact": sector_impact,
            "total_affected_systems": len(affected_systems)
        }
    
    def _categorize_by_sector(self, systems: List[str]) -> Dict[str, List[str]]:
        """Categorize affected systems by economic sector."""
        sector_mapping = {
            "aviation": ["transportation", "military"],
            "shipping": ["transportation", "commercial"],
            "banking": ["financial"],
            "power_grid_synchronization": ["infrastructure", "emergency"],
            "telecommunications": ["communications", "infrastructure"],
            "agriculture": ["commercial"],
            "disaster_warning": ["emergency", "government"],
            "financial_markets": ["financial"],
            "fleet_coordination": ["military"],
            "border_surveillance": ["military", "government"],
            "drone_operations": ["military", "commercial"]
        }
        
        sector_impact = {}
        for system in systems:
            sectors = sector_mapping.get(system, ["other"])
            for sector in sectors:
                if sector not in sector_impact:
                    sector_impact[sector] = []
                sector_impact[sector].append(system)
        
        return sector_impact
    
    def calculate_user_impact(self, satellite: Satellite) -> Dict:
        """
        Calculate number and type of users affected by satellite loss.
        
        Args:
            satellite: Satellite object with user count
            
        Returns:
            Dictionary with user impact breakdown
        """
        base_user_count = satellite.user_count
        
        # Distribute users across categories based on satellite type
        user_distribution = self._get_user_distribution(satellite.satellite_type)
        
        affected_users = {}
        total_affected = 0
        
        for category, distribution in user_distribution.items():
            category_users = int(base_user_count * distribution)
            affected_users[category] = category_users
            total_affected += category_users
        
        # Calculate users per hour of outage
        users_per_hour = total_affected / 24  # Assuming global impact
        
        return {
            "base_user_count": base_user_count,
            "affected_users_by_category": affected_users,
            "total_affected_users": total_affected,
            "users_affected_per_hour": users_per_hour,
            "peak_impact_hours": self._calculate_peak_impact_hours(satellite.satellite_type)
        }
    
    def _get_user_distribution(self, satellite_type: str) -> Dict[str, float]:
        """Get user distribution by category for satellite type."""
        distributions = {
            "military": {"military": 0.7, "government": 0.2, "commercial": 0.1, "consumer": 0.0},
            "communications": {"military": 0.1, "government": 0.2, "commercial": 0.4, "consumer": 0.3},
            "navigation": {"military": 0.15, "government": 0.15, "commercial": 0.4, "consumer": 0.3},
            "weather": {"government": 0.4, "commercial": 0.3, "consumer": 0.2, "military": 0.1},
            "research": {"government": 0.3, "commercial": 0.2, "consumer": 0.1, "military": 0.4},
            "spy": {"military": 0.8, "government": 0.2, "commercial": 0.0, "consumer": 0.0}
        }
        
        return distributions.get(satellite_type, distributions["communications"])
    
    def _calculate_peak_impact_hours(self, satellite_type: str) -> List[int]:
        """Calculate peak impact hours (UTC) for different satellite types."""
        peak_hours = {
            "military": [0, 6, 12, 18],  # Regular military operations
            "communications": [8, 12, 18, 22],  # Business hours
            "navigation": [6, 12, 18, 0],  # Transportation peaks
            "weather": [6, 12, 18],  # Forecast updates
            "research": [9, 14, 20],  # Business/research hours
            "spy": [0, 6, 12, 18, 23]  # Continuous
        }
        
        return peak_hours.get(satellite_type, [8, 12, 18])
    
    def estimate_economic_loss(self, satellite: Satellite, outage_duration_hours: float = 24.0) -> Dict:
        """
        Estimate economic loss from satellite loss over time.
        
        Args:
            satellite: Satellite object with economic value
            outage_duration_hours: Duration of outage in hours
            
        Returns:
            Dictionary with economic loss breakdown
        """
        # Direct satellite value
        satellite_value = satellite.economic_value
        
        # Service value multiplier based on satellite type
        service_multiplier = self.service_values.get(
            satellite.satellite_type, 
            5.0  # Default multiplier
        )
        
        # Calculate hourly economic impact
        base_hourly_loss = satellite_value / (365 * 24)  # Daily operational value
        service_hourly_loss = base_hourly_loss * service_multiplier
        
        # Total economic loss over outage duration
        total_economic_loss = service_hourly_loss * outage_duration_hours
        
        # Break down by sector
        sector_loss = self._calculate_sector_loss(satellite, total_economic_loss)
        
        # Calculate recovery costs
        replacement_cost = satellite_value * 1.5  # 1.5x for replacement
        operational_disruption = total_economic_loss * 0.3  # 30% additional disruption
        
        return {
            "satellite_value": satellite_value,
            "hourly_economic_impact": service_hourly_loss,
            "total_economic_loss": total_economic_loss,
            "loss_by_sector": sector_loss,
            "replacement_cost": replacement_cost,
            "operational_disruption": operational_disruption,
            "total_financial_impact": total_economic_loss + replacement_cost + operational_disruption
        }
    
    def _calculate_sector_loss(self, satellite: Satellite, total_loss: float) -> Dict[str, float]:
        """Calculate economic loss by sector."""
        sector_percentages = {
            "military": 0.4,
            "financial": 0.25,
            "transportation": 0.15,
            "communications": 0.1,
            "other": 0.1
        }
        
        # Adjust based on satellite type
        if satellite.satellite_type == "navigation":
            sector_percentages = {
                "transportation": 0.4,
                "financial": 0.3,
                "military": 0.2,
                "other": 0.1
            }
        elif satellite.satellite_type == "weather":
            sector_percentages = {
                "agriculture": 0.3,
                "transportation": 0.3,
                "emergency": 0.2,
                "other": 0.2
            }
        
        sector_loss = {}
        for sector, percentage in sector_percentages.items():
            sector_loss[sector] = total_loss * percentage
        
        return sector_loss
    
    def cascade_impact_analysis(self, primary_loss: Dict) -> Dict:
        """
        Perform cascading impact analysis considering second and third-order effects.
        
        Args:
            primary_loss: Dictionary with primary impact analysis results
            
        Returns:
            Dictionary with cascading impact results
        """
        cascading_effects = []
        total_cascading_loss = 0.0
        
        # Second-order effects (systems depending on affected systems)
        second_order_multiplier = 1.5
        second_order_loss = primary_loss["total_economic_loss"] * (second_order_multiplier - 1)
        total_cascading_loss += second_order_loss
        
        cascading_effects.append({
            "order": 2,
            "description": "Systems dependent on primary services",
            "economic_impact": second_order_loss,
            "affected_systems": ["backup_systems", "alternative_networks", "manual_processes"]
        })
        
        # Third-order effects (long-term economic impacts)
        third_order_multiplier = 1.2
        third_order_loss = primary_loss["total_economic_loss"] * (third_order_multiplier - 1)
        total_cascading_loss += third_order_loss
        
        cascading_effects.append({
            "order": 3,
            "description": "Long-term economic and operational impacts",
            "economic_impact": third_order_loss,
            "affected_systems": ["market_confidence", "investor_sentiment", "operational_efficiency"]
        })
        
        return {
            "primary_loss": primary_loss,
            "cascading_effects": cascading_effects,
            "total_cascading_loss": total_cascading_loss,
            "total_impact_with_cascade": primary_loss["total_economic_loss"] + total_cascading_loss,
            "cascade_multiplier": (primary_loss["total_economic_loss"] + total_cascading_loss) / primary_loss["total_economic_loss"]
        }
    
    def generate_impact_report(self, satellite: Satellite, threat: Threat) -> Dict:
        """
        Generate comprehensive impact report for satellite under threat.
        
        Args:
            satellite: Satellite object
            threat: Threat object with collision probability
            
        Returns:
            Comprehensive impact report dictionary
        """
        # Calculate dependency impacts
        dependency_analysis = self.analyze_satellite_dependencies(satellite)
        
        # Calculate user impact
        user_impact = self.calculate_user_impact(satellite)
        
        # Estimate economic loss
        economic_loss = self.estimate_economic_loss(satellite)
        
        # Perform cascade analysis
        cascade_analysis = self.cascade_impact_analysis(economic_loss)
        
        # Calculate risk-adjusted impact
        risk_adjusted_loss = economic_loss["total_financial_impact"] * threat.collision_probability
        
        # Generate impact summary
        impact_summary = self._generate_impact_summary(
            dependency_analysis,
            user_impact,
            cascade_analysis,
            risk_adjusted_loss
        )
        
        return {
            "satellite_id": satellite.id,
            "satellite_name": satellite.name,
            "threat_id": threat.id,
            "collision_probability": threat.collision_probability,
            "dependency_analysis": dependency_analysis,
            "user_impact": user_impact,
            "economic_impact": economic_loss,
            "cascade_analysis": cascade_analysis,
            "risk_adjusted_financial_impact": risk_adjusted_loss,
            "impact_summary": impact_summary,
            "recommendation_priority": self._determine_recommendation_priority(
                threat.threat_level,
                risk_adjusted_loss
            )
        }
    
    def _generate_impact_summary(self, dependency_analysis: Dict, user_impact: Dict, 
                               cascade_analysis: Dict, risk_adjusted_loss: float) -> str:
        """Generate human-readable impact summary."""
        summary_parts = [
            f"Loss of {dependency_analysis['total_affected_systems']} critical systems",
            f"{user_impact['total_affected_users']:,} users affected",
            f"${risk_adjusted_loss:,.2f} risk-adjusted economic impact",
            f"{cascade_analysis['cascade_multiplier']:.1f}x cascading effect multiplier"
        ]
        
        return ". ".join(summary_parts)
    
    def _determine_recommendation_priority(self, threat_level: str, financial_impact: float) -> str:
        """Determine priority for countermeasure recommendation."""
        if threat_level == "critical" or financial_impact > 10000000000:
            return "IMMEDIATE"
        elif threat_level == "high" or financial_impact > 5000000000:
            return "HIGH"
        elif threat_level == "moderate" or financial_impact > 1000000000:
            return "MEDIUM"
        else:
            return "LOW"