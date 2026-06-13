# HELIOS SENTINEL Backend

AI-Powered Orbital Threat & Space Infrastructure Protection Platform - Backend Service

## 🚀 Overview

HELIOS SENTINEL is an interactive AI-powered command center that detects hostile Anti-Satellite (ASAT) missile launches, predicts threatened satellites, analyzes the impact of losing those satellites, recommends countermeasures, and simulates the outcome through dramatic visualizations.

## 🏗️ Architecture

```
FastAPI Backend
├── Threat Detection Engine
├── Trajectory Prediction
├── Impact Analysis
├── Countermeasure Logic
├── Mission Scenarios
└── Gemini AI Integration
```

## 📋 Prerequisites

- Python 3.10+
- Virtual environment (venv)

## 🔧 Setup Instructions

### 1. Clone and Navigate

```bash
cd arcnight-backend
```

### 2. Create Virtual Environment

```bash
python -m venv venv
```

### 3. Activate Virtual Environment

**Windows:**
```bash
venv\Scripts\activate
```

**Linux/Mac:**
```bash
source venv/bin/activate
```

### 4. Install Dependencies

```bash
pip install -r requirements.txt
```

### 5. Configure Environment Variables

```bash
cp .env.example .env
# Edit .env with your API keys and configuration
```

### 6. Run the Server

```bash
python main.py
```

Or using uvicorn directly:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 🌐 API Endpoints

### Health & Status
- `GET /` - Root endpoint with API info
- `GET /health` - Health check status

### Satellites
- `GET /api/satellites` - Get all satellites
- `GET /api/satellites/{satellite_id}` - Get specific satellite
- `POST /api/satellites` - Create new satellite

### Threats
- `GET /api/threats` - Get all threats
- `GET /api/threats/{threat_id}` - Get specific threat
- `POST /api/threats/detect` - Detect and register new threat

### Countermeasures
- `POST /api/countermeasures/deploy` - Deploy countermeasure
- `GET /api/countermeasures` - Get all countermeasures

### Missions
- `POST /api/missions/start` - Start new mission scenario
- `GET /api/missions/{mission_id}` - Get specific mission
- `GET /api/missions` - Get all missions

## 🧪 Testing the API

Once the server is running, visit:
- API Documentation: `http://localhost:8000/docs`
- Alternative docs: `http://localhost:8000/redoc`

## 📊 Data Models

### Satellite
- Position tracking (latitude, longitude, altitude, velocity)
- Orbital parameters (Keplerian elements)
- Status and fuel levels
- Service dependencies and user impact

### Missile
- Trajectory tracking
- Detection confidence
- Target assignment
- Flight phase status

### Threat
- Threat level assessment
- Collision probability
- Impact analysis
- AI recommendations

### Countermeasure
- Multiple types (orbital shift, decoys, signal spoofing)
- Success probability calculation
- Resource requirements

### Mission Report
- Comprehensive mission summary
- AI-generated insights
- Performance metrics

## 🔬 Core Algorithms

### Threat Detection
- Simulated sensor network input
- Heat signature analysis
- Radar cross-section calculation
- Launch coordinate triangulation

### Trajectory Prediction
- Keplerian orbit propagation
- Missile flight path modeling
- Intercept point calculation
- Time-to-impact estimation

### Impact Analysis
- Dependency graph traversal
- User impact calculation
- Economic loss estimation
- Critical service identification

### Countermeasure Logic
- Orbital mechanics calculations
- Delta-v requirements
- Success probability modeling
- Resource optimization

## 🤖 AI Integration

The backend integrates with Gemini AI for:
- Threat explanation and analysis
- Countermeasure recommendations
- Impact summary generation
- Mission report creation

## 🔒 Security Notes

- Never commit `.env` files
- Keep API keys secure
- Use environment variables for sensitive data
- Implement proper authentication in production

## 📝 Development Workflow

1. **Core Foundation**: Data models and basic API structure
2. **Physics Engine**: Trajectory prediction and collision detection
3. **Countermeasures**: Defense logic and simulation
4. **AI Integration**: Gemini API for intelligent analysis
5. **Database Layer**: Firebase for persistent storage
6. **Testing**: Comprehensive unit and integration tests

## 🛠️ Tech Stack

- **FastAPI**: Modern, fast web framework for building APIs
- **Pydantic**: Data validation using Python type annotations
- **NumPy**: Numerical computing for physics calculations
- **httpx**: Async HTTP client for external API calls
- **Firebase Admin**: Database and authentication
- **Gemini API**: AI-powered analysis and recommendations

## 📄 License

This project is part of the HELIOS SENTINEL orbital defense system.

## 🚀 Project Status

- [x] Project structure setup
- [x] Data models defined
- [x] Basic FastAPI application
- [ ] Threat detection engine
- [ ] Trajectory prediction algorithms
- [ ] Impact analysis logic
- [ ] Countermeasure simulation
- [ ] AI integration
- [ ] Database implementation
- [ ] Comprehensive testing

---

**HELIOS SENTINEL - Protecting Space Assets with AI** 🛰️🛡️