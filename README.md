# 🌾 AgriHive AI — Collaborative Farm Intelligence & Regional Risk Analytics

AgriHive AI is a state-of-the-art agricultural collaborative AI platform designed to protect crops, optimize irrigation and nutrient management, and predict yields across regional farming networks. By combining **Clustered Federated Learning (CFL)**, **Physics-Informed Digital Twins**, **TreeSHAP Explainable AI (XAI)**, and **Particle Swarm Optimization (PSO)**, AgriHive AI delivers personalized, privacy-preserving recommendations for farmers and extension officers.

---

## 🌟 Key System Capabilities

- **👨‍🌾 Farmer-Specific Data Isolation & Onboarding**:
  - Direct first-time onboarding for new farmers with soil pH, moisture %, ambient temperature, humidity, and rainfall entry.
  - Telemetry persistence prevents repetitive form prompts upon logging in.
  - Multi-farm registration support allowing farmers to switch between their registered fields seamlessly.

- **🗺️ Interactive Google Maps GIS Intelligence**:
  - High-resolution **Normal Google Map** and **Satellite Map** toggle modes.
  - Interactive custom farm pins with risk badges (Low, Medium, High Risk) and pulsing alert indicators.
  - Smooth pan/zoom and popups displaying real-time disease risk and water stress percentages.

- **🤖 Swarm Optimization (PSO) & Digital Twin Simulator**:
  - 50-particle Particle Swarm Optimization searching equilibrium for irrigation %, NPK fertilizer rates, and canopy aeration.
  - 7-day crop health simulation evaluating proposed intervention strategies before field application.

- **🔍 Explainable AI (TreeSHAP XAI)**:
  - Translates complex machine learning attributions into clear, non-technical "Predominant Risk Factors" (e.g., High Relative Humidity + Temp Spikes).

- **📱 Fast2SMS OTP Authentication & RBAC Access**:
  - SMS OTP verification using Fast2SMS API gateway integration.
  - Role-Based Access Control (RBAC) tailoring views for **Farmers**, **Agricultural Officers**, and **Administrators**.

- **🌐 Multi-Language Support**:
  - Instant language switching across **English**, **Tamil (தமிழ்)**, and **Hindi (हिंदी)** powered by clean React state i18n dictionaries.

---

## 🛠️ Technology Stack

| Layer | Technology Used |
| :--- | :--- |
| **Backend Framework** | Python 3.11, FastAPI, Uvicorn, Pydantic v2 |
| **Database & ORM** | SQLite / PostgreSQL, SQLAlchemy ORM |
| **Machine Learning & AI** | Scikit-Learn, PyTorch, Joblib, TreeSHAP |
| **Optimization Engine** | PySwarms (Particle Swarm Optimization) |
| **External APIs** | Fast2SMS Gateway, Open-Meteo REST API, NASA POWER |
| **Frontend UI** | HTML5, Vanilla CSS, React 18 (CDN UMD), Tailwind CSS |
| **GIS Mapping** | Leaflet.js v1.9.4, Google Maps Tiles (Roadmap & Satellite) |

---

## 📂 Project Architecture

```
agrihive-ai/
├── backend/
│   ├── app/
│   │   ├── core/           # Security, OAuth2, and Settings Configuration
│   │   ├── database.py     # SQLAlchemy DB Session & Engine setup
│   │   ├── main.py         # FastAPI App Entrypoint & CORS Middleware
│   │   ├── models/         # SQLAlchemy DB Models (User, Farm, RawRecords, TrainedModel)
│   │   ├── routers/        # API Routes (Auth, VirtualFarm, XAI, Farms, Users, Ingestion)
│   │   ├── schemas/        # Pydantic Request & Response Validation Schemas
│   │   └── services/       # Core AI Engines (Clustered FL, PSO, Telemetry, OTP Service)
│   ├── data/
│   │   └── models/         # Trained Active Joblib ML Model Binary Storage
│   ├── tests/              # Pytest Unit Test Suite (100% Pass Rate)
│   ├── seed_demo.py        # Seed script for initial regional demo data
│   └── requirements.txt    # Backend Python Dependencies
├── frontend/
│   ├── components/         # Modular React Components (DashboardTab, RegionalMapTab, etc.)
│   ├── index.html          # Main HTML5 Single Page Application Shell
└── README.md               # Complete Project & Setup Documentation
```

---

## 🚀 Complete Step-by-Step Setup Guide

### 1. Prerequisites
Ensure you have the following installed on your machine:
- **Python**: `3.11.x` or higher
- **Web Browser**: Google Chrome, Microsoft Edge, or Mozilla Firefox
- **Git**: For repository cloning and version control

---

### 2. Backend Setup & Environment Configuration

1. **Navigate to the Backend Directory**:
   ```bash
   cd backend
   ```

2. **Create and Activate Virtual Environment**:
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - **Linux / macOS**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. **Install Dependencies**:
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables (`.env`)**:
   Create a `.env` file in the `backend/` root directory:
   ```env
   # Application Settings
   PROJECT_NAME="AgriHive AI"
   API_V1_STR="/api/v1"
   SECRET_KEY="super-secret-key-change-this-in-production"
   ACCESS_TOKEN_EXPIRE_MINUTES=43200

   # Database Connection (Default: SQLite local file)
   DATABASE_URL="sqlite:///./agrihive.db"

   # Fast2SMS OTP Service Key (Replace with your Fast2SMS API key)
   FAST2SMS_API_KEY="YOUR_FAST2SMS_API_KEY_HERE"
   ```

5. **Seed Initial Demo Data**:
   Populate the database with demo regional farms, users, and baseline parameters:
   ```bash
   python seed_demo.py
   ```

6. **Run Backend FastAPI Server**:
   ```bash
   uvicorn app.main:app --reload --port 8001
   ```
   The backend API documentation will be available live at:
   - **Swagger Interactive UI**: `http://localhost:8001/docs`
   - **ReDoc UI**: `http://localhost:8001/redoc`

---

### 3. Frontend Setup & Local Server Execution

1. **Open a New Terminal Window** and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. **Start Local HTTP Server**:
   ```bash
   python -m http.server 3000
   ```

3. **Access AgriHive AI Web Dashboard**:
   Open your browser and navigate to:
   `http://localhost:3000`

---

### 4. Running Verification Unit Tests

To execute the backend pytest test suite:
```bash
cd backend
python -m pytest
```
*Expected Output*: `13 passed in ~8.0s (100% Success)`

---

## 👥 Demo User Credentials

Use the following pre-configured credentials or create a new account directly from the login modal:

| Role | Username / Handle | Default Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Farmer** | `farmer1` | `password123` | Personal Field Telemetry & PSO Recommendations |
| **Agricultural Officer** | `officer1` | `password123` | District-wide Monitoring & Alert Controls |
| **Administrator** | `admin` | `password123` | Full Network Console, User Management & Audit Logs |

---
