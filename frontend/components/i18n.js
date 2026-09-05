// ================= Internationalization (i18n) Translations =================
// Robust, Conflict-Free React i18n Engine supporting English (en), Tamil (ta - தமிழ்), and Hindi (hi - हिंदी)

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
  },

  ta: {
    appTitle: "அக்ரிஹைவ் AI",
    tagline: "கூட்டு பண்ணை அறிவுத்திறன் பிளாட்ஃபார்ம்",

    // Nav Keys by Role
    nav_dashboard: "முகப்பு டாஷ்போர்டு",
    nav_my_farm: "எனது பண்ணை",
    nav_regional_map: "பிராந்திய ஆபத்து வரைபடம்",
    nav_digital_twin: "டிஜிட்டல் இரட்டை & உருவகப்படுத்துதல்",
    nav_analytics: "பிராந்திய பகுப்பாய்வு",
    nav_farm_network: "பண்ணை நெட்வொர்க் & கிளஸ்டர்கள்",
    nav_recommendations: "AI பரிந்துரைகள்",
    nav_ingestion: "தரவு உள்ளீடு",
    nav_registry: "அம்சம் பதிவேடு",
    nav_selection: "அம்சத் தேர்வு எஞ்சின்",
    nav_users: "பயனர் மேலாண்மை",
    nav_audit_logs: "பாதுகாப்பு பதிவுகள்",
    nav_help: "உதவி & ஆதரவு",
    nav_login: "பயனர் கணக்கு & உள்நுழைவு",

    // Subtitles
    sub_dashboard: "பயிர் ஆரோக்கியம், நீர் அழுத்தம் மற்றும் பரிந்துரைகளின் நேரலை மேலோட்டம்",
    sub_my_farm: "தனிப்பட்ட பயிர் நிலை, நிலத்தின் பண்புகள் மற்றும் வரலாற்றுத் தகவல்கள்",
    sub_regional_map: "தனியுரிமை பாதுகாக்கப்பட்ட பிராந்திய ஆபத்து வரைபடம்",
    sub_digital_twin: "பண்ணையில் செயல்படுத்துவதற்கு முன் 7 நாள் விளைவுகளை உருவகப்படுத்தி கணிக்கவும்",
    sub_analytics: "மாவட்ட ரீதியிலான பயிர் ஆபத்து பகுப்பாய்வு மற்றும் நோய் பரவல் கண்காணிப்பு",
    sub_farm_network: "பண்ணை கிளஸ்டர்கள் மற்றும் புதிய அம்ச கண்டுபிடிப்பு எஞ்சின்",
    sub_recommendations: "காரண விளக்கங்களுடன் AI பரிந்துரைகள்",
    sub_ingestion: "Open-Meteo & NASA POWER மூலம் நேரலை வானிலை மற்றும் மண் தரவை பெறவும்",
    sub_registry: "அனைத்து பண்ணை முனையங்களிலும் கண்காணிக்கப்படும் அளவுருக்களின் பட்டியல்",
    sub_selection: "தரக் கட்டுப்பாடு மற்றும் கசிவு தடுப்பு அம்ச தேர்வு எஞ்சின்",
    sub_users: "நிர்வாகி பயனர் கணக்கு மேலாண்மை மற்றும் பங்குகள் ஒதுக்கீடு",
    sub_audit_logs: "பாதுகாப்பு மற்றும் தணிக்கைப் பதிவுகள்",
    sub_help: "பயனர் ஆவணங்கள் மற்றும் பங்கு சார்ந்த ஆதரவு",

    // Dashboard Modes
    myFarmDashboard: "👨‍🌾 எனது பண்ணை தனிப்பட்ட டாஷ்போர்டு",
    officerDashboard: "👩‍🌾 வேளாண் அதிகாரி பிராந்திய டாஷ்போர்டு",
    adminDashboard: "🌾 நிர்வாகி பிளாட்ஃபார்ம் கன்சோல்",
    predictingForTitle: "தற்போது AI கணிப்பு செய்யப்படும் பண்ணை:",
    predictionExplanation: "Open-Meteo நேரலை வானிலை API, NASA POWER சூரிய தரவு, SoilGrids மண் சுயவிவரம் மூலம் கணிப்புகள் செய்யப்படுகின்றன.",
    privacyNotice: "🔒 தனியுரிமை பாதுகாக்கப்பட்ட பிராந்திய பகுப்பாய்வு — தனியுரிமை தரவு வெளிப்படுத்தப்படாமல் கூட்டமைப்பு கற்றல் மூலம் பகிரப்படுகிறது.",

    // Role Titles
    roleFarmer: "விவசாயி / பண்ணை உரிமையாளர்",
    roleOfficer: "வேளாண் அதிகாரி (Officer)",
    roleAdmin: "நிர்வாகி (Admin)",

    // Common Metrics & Badges
    activeNode: "செயல்படும் பண்ணை",
    peerFarm: "நெட்வொர்க் பண்ணை",
    diseaseRisk: "பயிர் நோய் ஆபத்து",
    waterStress: "நீர் அழுத்த நிலை",
    nutrientStatus: "ஊட்டச்சத்து நிலை",
    yieldPrediction: "விளைச்சல் கணிப்பு",
    overallFarmHealth: "ஒட்டுமொத்த பண்ணை ஆரோக்கியம்",
    todayRecommendedAction: "இன்றைய பரிந்துரைக்கப்பட்ட நடவடிக்கை",
    todayWeatherConditions: "இன்றைய வானிலை நிலைமைகள்",
    liveShapFactors: "AI முதன்மை ஆபத்து காரணிகள்",
    highRisk: "அதிக ஆபத்து",
    mediumRisk: "நடுத்தர ஆபத்து",
    lowRisk: "குறைந்த ஆபத்து",
    optimal: "சிறந்தது (Optimal)",
    balanced: "சீரானது (Balanced)",
    humidHighRisk: "அதிக ஈரப்பதம் / அதிக ஆபத்து",
    partlyCloudy: "பகுதியளவு மேகமூட்டம்",
    humidity: "ஈரப்பதம்",
    soilMoisture: "மண் ஈரப்பதம்",
    rainfall: "மழைப்பொழிவு",
    temperature: "வெப்பநிலை",
    windSpeed: "காற்றின் வேகம்",
    liveTelemetry: "நேரலை தரவு",
    fetchWeather: "வானிலை தகவலைப் பெறுக",
    fetching: "தரவு பெறப்படுகிறது...",
    runSimulation: "உருவகப்படுத்துதலை இயக்கு",
    useGps: "📍 எனது தற்போதைய இடத்தை இருப்பிடமாக்கு (GPS)",
    selectDistrict: "— மாவட்டத்தை விரைவாகத் தேர்ந்தெடுக்கவும் —",
    reconnect: "மீண்டும் இணைக்கவும்",
    logout: "வெளியேறு (Logout)",

    // Farm Action Buttons & Headers
    updateFieldTelemetry: "நிலத்தின் தரவை புதுப்பிக்கவும்",
    registerNewFarm: "புதிய பண்ணையைப் பதிவு செய்க",
    addFarmBtn: "+ பண்ணை சேர்க்கவும்",
    googleMapBtn: "கூகிள் வரைபடம்",
    satelliteMapBtn: "சாட்டிலைட் வரைபடம்",
    viewFarmXai: "பண்ணை AI விளக்கக்காட்சியைப் பார்க்கவும்",

    // Dashboard Cards & Sources
    dataSourceNotice: "ஆதாரம்: Open-Meteo & NASA POWER நேரலை சென்சார் API",
    riskTrend: "நேரலை ஆபத்து போக்கு",
    riskTrendSub: "சென்சார் தரவு அடிப்படையிலான ஆபத்துக் காட்டி",
    nearbyFarmsTitle: "அருகிலுள்ள பிராந்திய பண்ணைகள் — ஆபத்து பகுப்பாய்வு",
    viewMap: "வரைபடத்தைப் பார்க்கவும்",
    psoRecTitle: "Swarm AI பரிந்துரைக்கப்பட்ட நடவடிக்கை (PSO)",
    confidence: "நம்பகத்தன்மை அளவு",

    // Auth & Profiles
    loginTitle: "அக்ரிஹைவ் AI-க்கு நல்வரவு",
    loginSub: "உங்கள் பங்கு சார்ந்த டாஷ்போர்டை அணுக உள்நுழைக",
    signIn: "உள்நுழைக (Sign In)",
    signUp: "புதிய கணக்கை உருவாக்கவும்",
    username: "பயனர் பெயர் / மின்னஞ்சல்",
    password: "கடவுச்சொல்",
    fullName: "முழு பெயர்",
    selectRole: "கணக்கு வகையைத் தேர்ந்தெடுக்கவும்",
    createAccountBtn: "கணக்கை உருவாக்கு",
    alreadyHaveAccount: "ஏற்கனவே கணக்கு உள்ளதா? உள்நுழைக",
    noAccountYet: "கணக்கு இல்லையா? புதிய கணக்கை பதிவு செய்க",

    // Access Denied
    accessDeniedTitle: "403 — அனுமதி மறுக்கப்பட்டது",
    accessDeniedSub: "இந்தப் பக்கத்தைப் பார்க்க உங்களுக்கு அனுமதி இல்லை.",
    accessDeniedMessage: "உங்கள் கணக்கு வகைக்கு இந்த பக்கத்தைப் பார்க்க அனுமதி இல்லை.",

    // Admin Dashboard Elements
    adminHeaderTitle: "கூட்டுறவு பிராந்திய நுண்ணறிவு & நிர்வாகக் கட்டுப்பாடு",
    adminHeaderSub: "பதிவு செய்யப்பட்ட அனைத்து பண்ணைகள், பயனர்கள் மற்றும் கிளஸ்டர்களின் நெட்வொர்க் மேலாண்மை",
    totalFarms: "மொத்த பதிவு செய்யப்பட்ட பண்ணைகள்",
    totalUsers: "மொத்த செயலில் உள்ள பயனர்கள்",
    activeClusters: "கூட்டமைப்பு கிளஸ்டர்கள்",
    modelAccuracy: "உலகளாவிய AI துல்லியம்",
  },

  hi: {
    appTitle: "एग्रीहाइव एआई",
    tagline: "सहयोगी कृषि बुद्धिमत्ता मंच",

    // Nav Keys by Role
    nav_dashboard: "डैशबोर्ड",
    nav_my_farm: "मेरा फार्म",
    nav_regional_map: "क्षेत्रीय जोखिम मानचित्र",
    nav_digital_twin: "डिजिटल ट्विन और सिमुलेशन",
    nav_analytics: "क्षेत्रीय विश्लेषण",
    nav_farm_network: "फार्म नेटवर्क और क्लस्टर",
    nav_recommendations: "एआई सिफारिशें",
    nav_ingestion: "डेटा अंतर्ग्रहण",
    nav_registry: "फीचर रजिस्ट्री",
    nav_selection: "फीचर चयन इंजन",
    nav_users: "उपयोगकर्ता प्रबंधन",
    nav_audit_logs: "सुरक्षा ऑडिट लॉग",
    nav_help: "सहायता और समर्थन",
    nav_login: "उपयोगकर्ता खाता और लॉगिन",

    // Subtitles
    sub_dashboard: "फसल स्वास्थ्य, जल तनाव और सिफारिशों का लाइव अवलोकन",
    sub_my_farm: "व्यक्तिगत फसल स्थिति और क्षेत्र प्रबंधन इतिहास",
    sub_regional_map: "सक्रिय कृषि नोड्स पर गोपनीयता-संरक्षित जोखिम मानचित्र",
    sub_digital_twin: "खेत पर लागू करने से पहले 7-दिवसीय फसल परिणामों का अनुकरण करें",
    sub_analytics: "क्षेत्रीय फसल जोखिम विश्लेषण और रोग प्रसार निगरानी",
    sub_farm_network: "फार्म क्लस्टर और नई सुविधा खोज इंजन",
    sub_recommendations: "कार्रवाई योग्य सिफारिशें और एआई कारण",
    sub_ingestion: "Open-Meteo और NASA POWER से लाइव मौसम और मिट्टी डेटा डाउनलोड करें",
    sub_registry: "सभी फार्म नोड्स पर ट्रैक किए गए मापदंडों की सूची",
    sub_selection: "गुणवत्ता नियंत्रण और लीक रोकथाम सुविधा चयन प्रणाली",
    sub_users: "व्यवस्थापक उपयोगकर्ता खाता प्रबंधन और भूमिका आवंटन",
    sub_audit_logs: "सुरक्षा ऑडिट लॉग और सिस्टम इवेंट्स",
    sub_help: "उपयोगकर्ता दस्तावेज़ और भूमिका-विशिष्ट सहायता",

    // Dashboard Modes
    myFarmDashboard: "👨‍🌾 मेरा व्यक्तिगत फार्म डैशबोर्ड",
    officerDashboard: "👩‍🌾 कृषि अधिकारी क्षेत्रीय डैशबोर्ड",
    adminDashboard: "🌾 व्यवस्थापक कंसोल",
    predictingForTitle: "वर्तमान में इस खेत के लिए एआई पूर्वाग्रह किया जा रहा है:",
    predictionExplanation: "पूर्वाग्रह Open-Meteo मौसम एपीआई, NASA POWER सौर डेटा, SoilGrids से प्राप्त किया जाता है।",
    privacyNotice: "🔒 गोपनीयता संरक्षित क्षेत्रीय विश्लेषण — व्यक्तिगत डेटा उजागर किए बिना साझा किया जाता है।",

    // Role Titles
    roleFarmer: "किसान / फार्म मालिक",
    roleOfficer: "कृषि अधिकारी (Officer)",
    roleAdmin: "प्रशासक (Admin)",

    // Common Metrics & Badges
    activeNode: "सक्रिय खेत",
    peerFarm: "नेटवर्क खेत",
    diseaseRisk: "रोग जोखिम",
    waterStress: "जल तनाव",
    nutrientStatus: "पोषक तत्व स्थिति",
    yieldPrediction: "उपज का अनुमान",
    overallFarmHealth: "समग्र कृषि स्वास्थ्य",
    todayRecommendedAction: "आज की अनुशंसित कार्रवाई",
    todayWeatherConditions: "आज का मौसम",
    liveShapFactors: "एआई प्राथमिक कारक",
    highRisk: "उच्च जोखिम",
    mediumRisk: "मध्यम जोखिम",
    lowRisk: "कम जोखिम",
    optimal: "इष्टतम (Optimal)",
    balanced: "संतुलित (Balanced)",
    humidHighRisk: "आर्द्र / उच्च जोखिम",
    partlyCloudy: "आंशिक रूप से बादल",
    humidity: "आर्द्रता",
    soilMoisture: "मिट्टी की नमी",
    rainfall: "वर्षा",
    temperature: "तापमान",
    windSpeed: "हवा की गति",
    liveTelemetry: "लाइव टेलीमेट्री",
    fetchWeather: "मौसम एपीआई प्राप्त करें",
    fetching: "प्राप्त हो रहा है...",
    runSimulation: "अनुकरण चलाएं",
    useGps: "📍 मेरा वर्तमान स्थान उपयोग करें (GPS)",
    selectDistrict: "— त्वरित जिला / क्षेत्र चुनें —",
    reconnect: "पुन: कनेक्ट करें",
    logout: "लॉगआउट (Logout)",

    // Farm Action Buttons & Headers
    updateFieldTelemetry: "खेत टेलीमेट्री अपडेट करें",
    registerNewFarm: "नया खेत पंजीकृत करें",
    addFarmBtn: "+ खेत जोड़ें",
    googleMapBtn: "गूगल मानचित्र",
    satelliteMapBtn: "उपग्रह मानचित्र",
    viewFarmXai: "फार्म एआई विवरण देखें",

    // Dashboard Cards & Sources
    dataSourceNotice: "स्रोत: Open-Meteo & NASA POWER सेंसर एपीआई",
    riskTrend: "डायनामिक जोखिम रुझान",
    riskTrendSub: "सेंसर डेटा पर आधारित लाइव संकेतक",
    nearbyFarmsTitle: "आस-पास के क्षेत्रीय खेत — जोखिम विश्लेषण",
    viewMap: "मानचित्र देखें",
    psoRecTitle: "Swarm AI अनुशंसित कार्रवाई (PSO)",
    confidence: "विश्वास स्कोर",

    // Auth & Profiles
    loginTitle: "एग्रीहाइव एआई में आपका स्वागत है",
    loginSub: "अपने डैशबोर्ड तक पहुंचने के लिए साइन इन करें",
    signIn: "साइन इन करें",
    signUp: "नया खाता पंजीकृत करें",
    username: "उपयोगकर्ता नाम / ईमेल",
    password: "पासवर्ड",
    fullName: "पूरा नाम",
    selectRole: "खाता भूमिका चुनें",
    createAccountBtn: "खाता बनाएं",
    alreadyHaveAccount: "क्या आपके पास पहले से एक खाता मौजूद है? साइन इन करें",
    noAccountYet: "खाता नहीं है? अभी पंजीकृत करें",

    // Access Denied
    accessDeniedTitle: "403 — पहुंच से वंचित",
    accessDeniedSub: "आपको इस पृष्ठ को देखने की अनुमति नहीं है।",
    accessDeniedMessage: "आपकी वर्तमान भूमिका के पास इस मॉड्यूल तक पहुंचने की अनुमति नहीं है।",

    // Admin Dashboard Elements
    adminHeaderTitle: "सहकारी क्षेत्रीय बुद्धिमत्ता और व्यवस्थापक कंसोल",
    adminHeaderSub: "सभी पंजीकृत खेतों, उपयोगकर्ताओं और समूहों का नेटवर्क-व्यापी प्रबंधन",
    totalFarms: "कुल पंजीकृत खेत",
    totalUsers: "कुल सक्रिय उपयोगकर्ता",
    activeClusters: "फेडरेटेड क्लस्टर",
    modelAccuracy: "वैश्विक एआई सटीकता",
  }
};

/**
 * Robust getTranslation helper function with automatic reverse English string lookup
 */
function getTranslation(lang, key, fallback) {
  if (!key) return "";
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
  
  // 1. Direct dictionary key match
  if (dict && dict[key]) return dict[key];
  if (TRANSLATIONS.en && TRANSLATIONS.en[key]) return TRANSLATIONS.en[key];

  // 2. Reverse lookup: if key is an English text phrase, match it to its translated equivalent!
  if (lang !== "en" && TRANSLATIONS[lang]) {
    const trimmedKey = String(key).trim();
    for (const [k, englishVal] of Object.entries(TRANSLATIONS.en)) {
      if (String(englishVal).trim() === trimmedKey && TRANSLATIONS[lang][k]) {
        return TRANSLATIONS[lang][k];
      }
    }
  }

  return fallback !== undefined ? fallback : key;
}
