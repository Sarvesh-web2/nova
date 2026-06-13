from typing import Dict, List, Optional
from datetime import datetime
from models import Threat, Satellite, Countermeasure, MissionReport
import json


class DatabaseService:
    """
    Database service for persisting threat data, mission history, and reports.
    Uses Firebase for cloud storage with local fallback.
    """
    
    def __init__(self, use_firebase: bool = False):
        self.use_firebase = use_firebase
        self.local_storage = {
            "threats": {},
            "missions": {},
            "reports": {},
            "satellite_history": {},
            "countermeasure_log": {}
        }
        
        # Firebase would be initialized here if use_firebase is True
        # For now, we'll use local storage
        self.firebase_db = None
        
        if self.use_firebase:
            self._initialize_firebase()
    
    def _initialize_firebase(self):
        """Initialize Firebase connection (placeholder for actual implementation)."""
        try:
            import firebase_admin
            from firebase_admin import credentials, db
            
            # This would load actual Firebase credentials
            # cred = credentials.Certificate("path/to/service-account-key.json")
            # firebase_admin.initialize_app(cred, {
            #     'databaseURL': 'your-firebase-database-url'
            # })
            # self.firebase_db = db.reference()
            
            print("Firebase initialization placeholder - would connect to actual Firebase")
        except ImportError:
            print("Firebase admin SDK not installed, using local storage")
            self.use_firebase = False
        except Exception as e:
            print(f"Firebase initialization error: {e}, using local storage")
            self.use_firebase = False
    
    def log_threat(self, threat: Threat) -> str:
        """
        Log threat data to database.
        
        Args:
            threat: Threat object to log
            
        Returns:
            Database record ID
        """
        threat_data = threat.dict()
        threat_data["logged_at"] = datetime.now().isoformat()
        
        if self.use_firebase and self.firebase_db:
            # Firebase implementation
            try:
                ref = self.firebase_db.child('threats').push(threat_data)
                return ref.key
            except Exception as e:
                print(f"Firebase error: {e}, falling back to local storage")
        
        # Local storage fallback
        record_id = f"threat_{threat.id}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        self.local_storage["threats"][record_id] = threat_data
        
        return record_id
    
    def get_threat_history(self, limit: int = 100) -> List[Dict]:
        """
        Retrieve threat history from database.
        
        Args:
            limit: Maximum number of records to retrieve
            
        Returns:
            List of threat records
        """
        if self.use_firebase and self.firebase_db:
            try:
                threats_ref = self.firebase_db.child('threats').limit_to_last(limit)
                threats_data = threats_ref.get()
                return list(threats_data.values()) if threats_data else []
            except Exception as e:
                print(f"Firebase error: {e}, using local storage")
        
        # Local storage
        threats = list(self.local_storage["threats"].values())
        threats.sort(key=lambda x: x.get("logged_at", ""), reverse=True)
        return threats[:limit]
    
    def save_mission(self, mission: MissionReport) -> str:
        """
        Save mission report to database.
        
        Args:
            mission: MissionReport object to save
            
        Returns:
            Database record ID
        """
        mission_data = mission.dict()
        mission_data["saved_at"] = datetime.now().isoformat()
        
        if self.use_firebase and self.firebase_db:
            try:
                ref = self.firebase_db.child('missions').push(mission_data)
                return ref.key
            except Exception as e:
                print(f"Firebase error: {e}, falling back to local storage")
        
        # Local storage
        record_id = f"mission_{mission.id}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        self.local_storage["missions"][record_id] = mission_data
        
        return record_id
    
    def get_mission_history(self, limit: int = 50) -> List[Dict]:
        """
        Retrieve mission history from database.
        
        Args:
            limit: Maximum number of records to retrieve
            
        Returns:
            List of mission records
        """
        if self.use_firebase and self.firebase_db:
            try:
                missions_ref = self.firebase_db.child('missions').limit_to_last(limit)
                missions_data = missions_ref.get()
                return list(missions_data.values()) if missions_data else []
            except Exception as e:
                print(f"Firebase error: {e}, using local storage")
        
        # Local storage
        missions = list(self.local_storage["missions"].values())
        missions.sort(key=lambda x: x.get("saved_at", ""), reverse=True)
        return missions[:limit]
    
    def store_report(self, report_type: str, report_data: Dict) -> str:
        """
        Store AI-generated or analysis reports.
        
        Args:
            report_type: Type of report (threat_analysis, mission_summary, etc.)
            report_data: Report content dictionary
            
        Returns:
            Database record ID
        """
        report_entry = {
            "type": report_type,
            "data": report_data,
            "created_at": datetime.now().isoformat()
        }
        
        if self.use_firebase and self.firebase_db:
            try:
                ref = self.firebase_db.child('reports').push(report_entry)
                return ref.key
            except Exception as e:
                print(f"Firebase error: {e}, falling back to local storage")
        
        # Local storage
        record_id = f"report_{report_type}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        self.local_storage["reports"][record_id] = report_entry
        
        return record_id
    
    def get_reports_by_type(self, report_type: str, limit: int = 20) -> List[Dict]:
        """
        Retrieve reports by type.
        
        Args:
            report_type: Type of reports to retrieve
            limit: Maximum number of records
            
        Returns:
            List of reports
        """
        if self.use_firebase and self.firebase_db:
            try:
                reports_ref = self.firebase_db.child('reports').order_by_child('type').equal_to(report_type).limit_to_last(limit)
                reports_data = reports_ref.get()
                return list(reports_data.values()) if reports_data else []
            except Exception as e:
                print(f"Firebase error: {e}, using local storage")
        
        # Local storage
        reports = [
            r for r in self.local_storage["reports"].values() 
            if r.get("type") == report_type
        ]
        reports.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return reports[:limit]
    
    def log_countermeasure(self, countermeasure: Countermeasure, result: Dict) -> str:
        """
        Log countermeasure execution and results.
        
        Args:
            countermeasure: Countermeasure object
            result: Execution result dictionary
            
        Returns:
            Database record ID
        """
        log_entry = {
            "countermeasure": countermeasure.dict(),
            "result": result,
            "logged_at": datetime.now().isoformat()
        }
        
        if self.use_firebase and self.firebase_db:
            try:
                ref = self.firebase_db.child('countermeasures').push(log_entry)
                return ref.key
            except Exception as e:
                print(f"Firebase error: {e}, falling back to local storage")
        
        # Local storage
        record_id = f"countermeasure_{countermeasure.id}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        self.local_storage["countermeasure_log"][record_id] = log_entry
        
        return record_id
    
    def update_satellite_status(self, satellite: Satellite) -> str:
        """
        Update satellite status in database.
        
        Args:
            satellite: Satellite object with updated status
            
        Returns:
            Database record ID
        """
        satellite_data = satellite.dict()
        satellite_data["updated_at"] = datetime.now().isoformat()
        
        if self.use_firebase and self.firebase_db:
            try:
                ref = self.firebase_db.child(f'satellites/{satellite.id}').set(satellite_data)
                return satellite.id
            except Exception as e:
                print(f"Firebase error: {e}, falling back to local storage")
        
        # Local storage
        self.local_storage["satellite_history"][satellite.id] = satellite_data
        
        return satellite.id
    
    def get_satellite_history(self, satellite_id: str, limit: int = 50) -> List[Dict]:
        """
        Retrieve historical status data for a specific satellite.
        
        Args:
            satellite_id: Satellite identifier
            limit: Maximum number of records
            
        Returns:
            List of satellite status records
        """
        # For local storage, we only have current status
        # In a real implementation, this would query historical data
        if satellite_id in self.local_storage["satellite_history"]:
            return [self.local_storage["satellite_history"][satellite_id]]
        return []
    
    def get_statistics(self) -> Dict:
        """
        Get overall system statistics from database.
        
        Returns:
            Dictionary with system statistics
        """
        stats = {
            "total_threats_logged": len(self.local_storage["threats"]),
            "total_missions_completed": len(self.local_storage["missions"]),
            "total_reports_stored": len(self.local_storage["reports"]),
            "total_countermeasures_logged": len(self.local_storage["countermeasure_log"]),
            "active_satellites": len(self.local_storage["satellite_history"]),
            "storage_type": "firebase" if self.use_firebase else "local"
        }
        
        return stats
    
    def export_data(self, data_type: str) -> str:
        """
        Export data to JSON format.
        
        Args:
            data_type: Type of data to export (threats, missions, reports, etc.)
            
        Returns:
            JSON string of exported data
        """
        if data_type in self.local_storage:
            return json.dumps(self.local_storage[data_type], indent=2)
        return "{}"
    
    def import_data(self, data_type: str, json_data: str) -> bool:
        """
        Import data from JSON format.
        
        Args:
            data_type: Type of data to import
            json_data: JSON string containing data
            
        Returns:
            Success status
        """
        try:
            data = json.loads(json_data)
            if data_type in self.local_storage:
                self.local_storage[data_type].update(data)
                return True
            return False
        except Exception as e:
            print(f"Import error: {e}")
            return False
    
    def clear_local_storage(self):
        """Clear all local storage data (useful for testing)."""
        self.local_storage = {
            "threats": {},
            "missions": {},
            "reports": {},
            "satellite_history": {},
            "countermeasure_log": {}
        }