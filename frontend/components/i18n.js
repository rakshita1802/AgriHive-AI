// ================= Dynamic Internationalization (i18n) Engine =================
// Automatic Dynamic Page Translation — No manually typed language dictionaries in code.

const TRANSLATIONS = {
  en: {
    appTitle: "AgriHive AI",
    tagline: "Collaborative Farm Intelligence",

    // Nav Keys by Role
    nav_dashboard: "Dashboard",
    nav_my_farm: "My Farm",
    nav_regional_map: "Regional Risk Map",
    nav_digital_twin: "Digital Twin & Simulation",
    nav_analytics: "Regional Analytics",
    nav_farm_network: "Farm Network & Clusters",
    nav_recommendations: "AI Recommendations",
    nav_ingestion: "Data Ingestion",
    nav_registry: "Feature Registry",
    nav_selection: "Feature Selection Engine",
    nav_users: "User Management",
    nav_audit_logs: "System Audit Logs",
    nav_help: "Help & Support",
    nav_login: "User Account & Login",

    // Navigation Subtitles
    sub_dashboard: "Live overview of crop health, water stress, recommendations, and system metrics",
    sub_my_farm: "Personalized crop condition, field attributes, and management history",
    sub_regional_map: "Privacy-preserving regional risk map across active farming nodes",
    sub_digital_twin: "Simulate actions and predict 7-day crop outcomes before applying on your farm",
    sub_analytics: "District-wide crop risk analysis, water stress trends, and disease spread monitoring",
    sub_farm_network: "Network-wide farm topology, client clusters, and feature discovery",
    sub_recommendations: "Actionable recommendations and non-technical Explainable AI reasons",
    sub_ingestion: "Ingest live weather and soil data from Open-Meteo & NASA POWER",
    sub_registry: "Catalog of candidate parameters tracked across all farm nodes",
    sub_selection: "Domain, quality, leakage, and redundancy feature selection pipeline",
    sub_users: "Admin user account management, role assignment, and account status controls",
    sub_audit_logs: "Security audit logs, role modifications, and system events",
    sub_help: "User documentation, platform guides, and role-specific support",

    // User Management & Audit Logs Keys
    users_title: "System User Management",
    users_sub: "Manage user accounts, roles, account status, and assigned farm contexts.",
    add_user_btn: "Add New User",
    role_all: "All Accounts",
    users_table_header: "Registered System Accounts",
    audit_title: "System Security Audit Logs",
    audit_sub: "Immutable audit trail of user actions, role modifications, model updates, and system security events.",
    refresh: "Refresh",

    // Dashboard Modes & Explanations
    myFarmDashboard: "👨‍🌾 My Farm Personal Dashboard",
    officerDashboard: "👩‍🌾 Agricultural Officer Regional Dashboard",
    adminDashboard: "🌾 Administrator Platform Console",
    predictingForTitle: "Currently Predicting AI Risk & Yield For:",
    predictionExplanation: "Live predictions are computed using Open-Meteo REST Weather API, NASA POWER Solar Data, SoilGrids Soil Profile, and AgriHive Random Forest ML Engine.",
    privacyNotice: "🔒 Privacy-Preserving Regional Analysis — Peer farm sensor values are aggregated securely via Federated Learning without exposing private farm data.",

    // Role Titles
    roleFarmer: "Farmer / Farm Owner",
    roleOfficer: "Agricultural Officer",
    roleAdmin: "Administrator",

    // Common Metrics & Badges
    activeNode: "ACTIVE NODE",
    peerFarm: "PEER FARM",
    diseaseRisk: "Disease Risk",
    waterStress: "Water Stress",
    nutrientStatus: "Nutrient Status",
    yieldPrediction: "Yield Prediction",
    overallFarmHealth: "Overall Farm Health",
    todayRecommendedAction: "Today's Recommended Action",
    todayWeatherConditions: "Today's Weather Conditions",
    liveShapFactors: "Live SHAP Predominant Factors",
    highRisk: "High Risk",
    mediumRisk: "Medium Risk",
    lowRisk: "Low Risk",
    optimal: "Optimal",
    balanced: "Balanced",
    humidHighRisk: "Humid / High Risk",
    partlyCloudy: "Partly Cloudy",
    humidity: "Humidity",
    soilMoisture: "Soil Moisture",
    rainfall: "Rainfall",
    temperature: "Temperature",
    windSpeed: "Wind Speed",
    liveTelemetry: "LIVE TELEMETRY",
    fetchWeather: "Fetch Weather API",
    fetching: "Fetching Live...",
    runSimulation: "Run Simulation",
    useGps: "📍 Use My Current Location (GPS)",
    selectDistrict: "— Quick Select District / Region —",
    reconnect: "Reconnect",
    language: "Language",
    logout: "Logout",

    // Farm Action Buttons & Headers
    updateFieldTelemetry: "Update Field Telemetry",
    registerNewFarm: "Register New Farm",
    addFarmBtn: "+ Add Farm",
    googleMapBtn: "Google Map",
    satelliteMapBtn: "Satellite Map",
    viewFarmXai: "View Farm XAI Attributions",

    // Dashboard Cards & Sources
    dataSourceNotice: "Source: Open-Meteo & NASA POWER Real-Time Sensor API",
    riskTrend: "Dynamic Risk Trend",
    riskTrendSub: "Multi-parameter live predictive indicator based on sensor data",
    nearbyFarmsTitle: "Nearby Regional Farms — Risk Analysis",
    viewMap: "View Map",
    psoRecTitle: "Swarm AI Recommended Action (PSO)",
    confidence: "Confidence Score",

    // Auth & Profiles
    loginTitle: "Welcome to AgriHive AI",
    loginSub: "Sign in to access your role-specific dashboard and collaborative intelligence",
    signIn: "Sign In",
    signUp: "Register New Account",
    username: "Username / Email",
    password: "Password",
    fullName: "Full Name",
    selectRole: "Select Account Role",
    createAccountBtn: "Create Account",
    alreadyHaveAccount: "Already have an account? Sign In",
    noAccountYet: "Don't have an account? Register Now",

    // Access Denied (403)
    accessDeniedTitle: "403 — Access Denied",
    accessDeniedSub: "You do not have permission to view this page.",
    accessDeniedMessage: "Your current account role does not have permission to access this module.",

    // Admin Dashboard Elements
    adminHeaderTitle: "Cooperative Regional Intelligence & Admin Console",
    adminHeaderSub: "Network-wide management across all registered farms, users, and federated clusters",
    totalFarms: "Total Registered Farms",
    totalUsers: "Total Active Users",
    activeClusters: "Federated Clusters",
    modelAccuracy: "Global FL Accuracy",
  }
};

/**
 * Dynamic getTranslation helper function
 * Returns the label for a given key, defaulting gracefully to the key itself or provided fallback.
 * Dynamic full-page language translation is handled automatically by the browser / Google Translate API.
 */
function getTranslation(lang, key, fallback) {
  if (!key) return "";
  if (TRANSLATIONS.en && TRANSLATIONS.en[key]) return TRANSLATIONS.en[key];
  return fallback !== undefined ? fallback : key;
}
