import httpx
from typing import Dict, Optional
from models import Threat, Satellite, MissionReport
import json


class GeminiAIService:
    """
    Integrates with Google Gemini AI for intelligent analysis and recommendations.
    Provides threat explanations, countermeasure suggestions, and mission reports.
    """
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or "your_gemini_api_key_here"
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def _call_gemini(self, prompt: str) -> str:
        """
        Make API call to Gemini for text generation.
        
        Args:
            prompt: Text prompt to send to Gemini
            
        Returns:
            Generated text response
        """
        headers = {"Content-Type": "application/json"}
        
        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }]
        }
        
        if self.api_key != "your_gemini_api_key_here":
            url = f"{self.base_url}?key={self.api_key}"
        else:
            # For demo purposes, return mock response
            return self._get_mock_response(prompt)
        
        try:
            response = await self.client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            
            data = response.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]
        except Exception as e:
            print(f"Gemini API error: {e}")
            return self._get_mock_response(prompt)
    
    def _get_mock_response(self, prompt: str) -> str:
        """Generate mock responses for demo when API key is not configured."""
        if "threat" in prompt.lower() and "explain" in prompt.lower():
            return """THREAT ANALYSIS:

This threat represents a hostile Anti-Satellite (ASAT) missile launch with high collision probability. The missile is on a direct intercept course with the target satellite, demonstrating sophisticated guidance capabilities typical of modern ASAT systems.

KEY CHARACTERISTICS:
- High-velocity ballistic trajectory
- Advanced guidance and control systems
- Short flight time reducing defensive window
- Potential for nuclear or conventional payload

IMPLICATIONS:
Loss of this satellite would significantly impact military communications and coordination capabilities. The cascading effects would disrupt fleet operations, border surveillance, and encrypted transmission networks used by strategic assets.

RECOMMENDATION:
Immediate defensive action required. Probability of successful interception decreases rapidly with time."""
        
        elif "countermeasure" in prompt.lower():
            return """COUNTERMEASURE RECOMMENDATION:

Based on the threat analysis and satellite state, the following countermeasure strategy is recommended:

PRIMARY ACTION: Orbital Shift
- Success Probability: 89%
- Fuel Requirement: 12.5%
- Execution Time: 35 seconds
- Expected Miss Distance: 150-200 meters

RATIONALE:
Orbital shift offers the highest probability of success given the time available and fuel reserves. The satellite's current orbital parameters allow for a safe altitude change that would place it outside the missile's interception envelope.

ALTERNATIVE OPTIONS:
1. Decoy Deployment (72% success, 8% fuel)
2. Signal Spoofing (58% success, 2% fuel)

EXECUTION PRIORITY: IMMEDIATE
Defensive window is closing rapidly. Recommend immediate execution of orbital shift maneuver."""
        
        elif "impact" in prompt.lower():
            return """IMPACT ANALYSIS SUMMARY:

CRITICAL INFRASTRUCTURE AFFECTED:
- Military Communications: HIGH IMPACT
- Fleet Coordination: SEVERE DISRUPTION
- Border Surveillance: SIGNIFICANT DEGRADATION
- Encrypted Networks: MAJOR IMPACT

USER IMPACT:
- Direct Users: 2,000,000 military and government personnel
- Indirect Users: 12,000,000+ through dependent systems
- Peak Impact Hours: 00:00, 06:00, 12:00, 18:00 UTC

ECONOMIC CONSEQUENCES:
- Immediate Operational Loss: $2.4B
- Replacement Cost: $7.5B
- Cascading Economic Impact: $8.2B
- Total Financial Impact: $18.1B

TIME CRITICALITY:
- First 6 hours: Most severe operational impact
- 24-48 hours: System adaptation and workaround implementation
- 7-30 days: Full operational restoration with backup systems

MITIGATION PRIORITY: CRITICAL"""
        
        elif "mission report" in prompt.lower():
            return """MISSION SUMMARY:

HELIOS SENTINEL DEFENSE OPERATION - SUCCESSFUL

THREAT NEUTRALIZED:
- hostile ASAT missile intercepted and neutralized
- Target satellite protected with zero damage
- Collision avoided with 200m miss distance

OPERATIONAL METRICS:
- Response Time: 8.2 seconds (from detection to countermeasure initiation)
- Countermeasure Execution: 35 seconds
- Total Engagement Time: 43.2 seconds
- Fuel Consumed: 12.5% (within acceptable limits)

ASSETS PROTECTED:
- Primary Satellite: MILCOM-12 (Military Communications)
- Value Preserved: $5.0B satellite + $18.1B economic impact
- Services Maintained: Military comms, fleet coordination, border surveillance

LESSONS LEARNED:
- Early detection critical for successful defense
- Orbital shift proves highly effective against kinetic threats
- AI recommendations aligned perfectly with optimal strategy
- Sensor network integration performed flawlessly

RECOMMENDATIONS:
- Expand constellation redundancy for critical military satellites
- Implement automated response for threats with <60 second warning
- Enhance detection sensitivity for reduced response times

OPERATOR PERFORMANCE: EXCELLENT
AI ACCURACY: 94%

MISSION STATUS: COMPLETED SUCCESSFULLY"""
        
        else:
            return "AI analysis complete. Recommendations based on threat assessment, satellite capabilities, and time constraints."
    
    async def get_threat_explanation(self, threat: Threat, satellite: Satellite) -> str:
        """
        Generate AI explanation of the threat.
        
        Args:
            threat: Threat object with assessment data
            satellite: Target satellite
            
        Returns:
            AI-generated threat explanation
        """
        prompt = f"""You are an AI military analyst specializing in space defense. Explain the following ASAT threat:

THREAT DETAILS:
- Threat Level: {threat.threat_level.value}
- Collision Probability: {threat.collision_probability:.1%}
- Time to Impact: {threat.time_to_impact:.1f} seconds
- Target Satellite: {satellite.name} ({satellite.satellite_type})
- Satellite Value: ${satellite.economic_value:,.0f}
- Services: {', '.join(satellite.services)}

Provide a clear, concise explanation of:
1. What this threat represents
2. Why it's dangerous
3. What would happen if the satellite is lost
4. Any additional factors operators should know

Format as a military intelligence briefing."""
        
        return await self._call_gemini(prompt)
    
    async def get_countermeasure_recommendation(self, threat: Threat, 
                                               satellite: Satellite,
                                               fuel_remaining: float) -> str:
        """
        Generate AI countermeasure recommendation.
        
        Args:
            threat: Threat information
            satellite: Satellite to protect
            fuel_remaining: Available fuel percentage
            
        Returns:
            AI-generated countermeasure recommendation
        """
        prompt = f"""You are an AI defense strategist for space assets. Recommend the best countermeasure:

SITUATION:
- Threat Level: {threat.threat_level.value}
- Collision Probability: {threat.collision_probability:.1%}
- Time to Impact: {threat.time_to_impact:.1f} seconds
- Satellite: {satellite.name}
- Fuel Remaining: {fuel_remaining}%

AVAILABLE COUNTERMEASURES:
1. Orbital Shift - Highest success but requires significant fuel
2. Decoy Deployment - Moderate success, lower fuel requirement
3. Signal Spoofing - Lower success, minimal fuel
4. Electronic Attack - Good success, moderate fuel

Recommend the BEST countermeasure with:
- Specific recommendation
- Success probability estimate
- Fuel requirement
- Execution time
- Rationale for your choice

Format as a tactical recommendation."""
        
        return await self._call_gemini(prompt)
    
    async def generate_impact_summary(self, impact_data: Dict) -> str:
        """
        Generate AI summary of impact analysis.
        
        Args:
            impact_data: Dictionary with impact analysis results
            
        Returns:
            AI-generated impact summary
        """
        prompt = f"""You are an AI impact analyst. Summarize the following satellite loss impact analysis:

IMPACT DATA:
- Affected Systems: {impact_data.get('total_affected_systems', 0)}
- Users Affected: {impact_data.get('total_affected_users', 0):,}
- Economic Loss: ${impact_data.get('total_economic_loss', 0):,.0f}
- Critical Services: {', '.join(impact_data.get('critical_services', []))}
- Sector Impact: {impact_data.get('sector_impact', {})}

Provide a concise summary focusing on:
1. Scale of impact
2. Most critical consequences
3. Time sensitivity
4. Mitigation priority

Format as an executive summary."""
        
        return await self._call_gemini(prompt)
    
    async def generate_mission_report(self, mission_data: Dict) -> str:
        """
        Generate AI-powered mission report.
        
        Args:
            mission_data: Dictionary with mission results and metrics
            
        Returns:
            AI-generated mission report
        """
        prompt = f"""You are an AI mission analyst. Generate a comprehensive mission report:

MISSION DATA:
- Mission Type: {mission_data.get('mission_type', 'unknown')}
- Status: {mission_data.get('status', 'unknown')}
- Threats Detected: {mission_data.get('threats_detected', 0)}
- Threats Mitigated: {mission_data.get('threats_mitigated', 0)}
- Satellites Protected: {len(mission_data.get('satellites_protected', []))}
- Loss Prevented: ${mission_data.get('loss_prevented', 0):,.0f}
- Countermeasures Deployed: {mission_data.get('countermeasures_deployed', 0)}
- AI Accuracy: {mission_data.get('ai_accuracy', 0):.1%}

Generate a professional mission report including:
1. Executive Summary
2. Operational Metrics
3. Threat Assessment
4. Defensive Actions Taken
5. Results Achieved
6. Lessons Learned
7. Recommendations

Format as a formal military after-action report."""
        
        return await self._call_gemini(prompt)
    
    async def get_situation_assessment(self, satellites: Dict[str, Satellite],
                                      threats: Dict[str, Threat]) -> str:
        """
        Generate overall situation assessment.
        
        Args:
            satellites: Dictionary of all satellites
            threats: Dictionary of all current threats
            
        Returns:
            AI-generated situation assessment
        """
        active_threats = [t for t in threats.values() if t.status == "active"]
        active_satellites = [s for s in satellites.values() if s.status == "active"]
        
        prompt = f"""You are an AI space defense commander. Provide a situation assessment:

CURRENT STATUS:
- Active Satellites: {len(active_satellites)}
- Active Threats: {len(active_threats)}
- Threat Levels: {[t.threat_level.value for t in active_threats]}
- Total Time to Impact: {sum(t.time_to_impact for t in active_threats):.1f} seconds

Provide:
1. Overall threat assessment
2. Resource status
3. Recommended priorities
4. Confidence in defense capabilities

Format as a tactical situation report."""
        
        return await self._call_gemini(prompt)
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()