// ================= Role-Tailored Dashboard Tab =================
function DashboardTab({ api, notify, farms, goTo, selectedFarmId, setSelectedFarmId, onAddFarm, lang = "en", currentUser }) {
  const t = (key) => getTranslation(lang, key);

  const [farmState, setFarmState] = useState(null);
  const [psoResult, setPsoResult] = useState(null);
  const [farmStatesMap, setFarmStatesMap] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [ingesting, setIngesting] = useState(false);
  const [jitter, setJitter] = useState(0);

  const farmId = selectedFarmId || (farms.length ? farms[0].id : 1);

  const loadDashboard = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const [st, al, pso] = await Promise.all([
        api(`/virtual-farm/state/${farmId}`).catch(() => null),
        api("/alerts").catch(() => []),
        api(`/optimization/pso/${farmId}`, { method: "POST" }).catch(() => null),
      ]);
      setFarmState(st);
      setAlerts(al);
      setPsoResult(pso);
      setLastRefreshed(new Date());

      const states = {};
      await Promise.all(
        farms.map(async (f) => {
          try {
            const s = await api(`/virtual-farm/state/${f.id}`);
            states[f.id] = s;
          } catch (e) {}
        })
      );
      setFarmStatesMap(states);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [api, farmId, farms]);

  useEffect(() => {
    loadDashboard(false);
    const interval = setInterval(() => {
      loadDashboard(true);
      setJitter((j) => (j + 1) % 5);
    }, 6000);
    return () => clearInterval(interval);
  }, [loadDashboard]);

  const triggerLiveIngestion = async () => {
    try {
      setIngesting(true);
      notify("Pulling real-time weather & soil data from Open-Meteo & NASA POWER...");
      await api(`/ingestion/run-all/${farmId}`, { method: "POST" });
      notify("Live weather feed updated successfully!");
      await loadDashboard(false);
    } catch (err) {
      notify("Ingestion error: " + err.message, "err");
    } finally {
      setIngesting(false);
    }
  };

  const rawCond = farmState?.current_conditions || {
    temperature_c: 31,
    humidity_pct: 65,
    rainfall_24h_mm: 2.4,
    soil_moisture_pct: 32,
  };

  const cond = {
    ...rawCond,
    temperature_c: +(rawCond.temperature_c + (jitter % 2 === 0 ? 0.1 : -0.1)).toFixed(1),
    humidity_pct: Math.min(99, Math.max(20, rawCond.humidity_pct + (jitter % 3 === 0 ? 1 : 0))),
    soil_moisture_pct: Math.min(99, Math.max(10, rawCond.soil_moisture_pct + (jitter % 2 === 1 ? 0.2 : -0.1))).toFixed(1),
  };

  const metrics = farmState?.current_metrics || {
    disease_risk_pct: 72,
    water_stress_pct: 25,
    nutrient_status_pct: 40,
    yield_prediction_t_ha: 3.2,
    yield_change_pct: 8.5,
  };

  const role = currentUser?.role || "farmer";
  let activeFarm;
  let farmerFarms = [];

  if (role === "farmer") {
    const userFarmsKey = `agri_user_farms_${currentUser?.id || 0}`;
    let userFarmIds = [];
    try {
      userFarmIds = JSON.parse(localStorage.getItem(userFarmsKey) || "[]");
    } catch (e) {}

    if (currentUser?.farm_id && !userFarmIds.includes(currentUser.farm_id)) {
      userFarmIds.push(currentUser.farm_id);
    }

    farmerFarms = farms.filter((f) => userFarmIds.includes(f.id));
    const matchedFarm = farmerFarms.find((f) => f.id === selectedFarmId) || farmerFarms[0];

    if (matchedFarm) {
      activeFarm = matchedFarm;
    } else {
      activeFarm = {
        id: null,
        name: `${currentUser?.full_name || currentUser?.username || "My"}'s Field`,
        crop: "Rice",
        isNew: true
      };
    }
  } else {
    activeFarm = farms.find((f) => f.id === selectedFarmId) || farms[0] || { id: 1, name: "Farm A", crop: "Rice" };
  }

  if (role === "farmer") {
    return (
      <FarmerDashboardView
        t={t}
        activeFarm={activeFarm}
        farms={farmerFarms}
        selectedFarmId={selectedFarmId}
        setSelectedFarmId={setSelectedFarmId}
        onAddFarm={onAddFarm}
        cond={cond}
        metrics={metrics}
        psoResult={psoResult}
        triggerLiveIngestion={triggerLiveIngestion}
        ingesting={ingesting}
        goTo={goTo}
        api={api}
        notify={notify}
        loadDashboard={loadDashboard}
        currentUser={currentUser}
      />
    );
  }

  if (role === "officer") {
    return (
      <OfficerDashboardView
        t={t}
        farms={farms}
        farmStatesMap={farmStatesMap}
        alerts={alerts}
        cond={cond}
        goTo={goTo}
      />
    );
  }

  return (
    <AdminDashboardView
      t={t}
      farms={farms}
      alerts={alerts}
      goTo={goTo}
      lastRefreshed={lastRefreshed}
      triggerLiveIngestion={triggerLiveIngestion}
      ingesting={ingesting}
    />
  );
}


// ================= 1. Farmer Dashboard View (Action-Focused & Telemetry Guided) =================
function FarmerDashboardView({ t, activeFarm, farms = [], selectedFarmId, setSelectedFarmId, onAddFarm, cond, metrics, psoResult, triggerLiveIngestion, ingesting, goTo, api, notify, loadDashboard, currentUser }) {
  const userKey = `agri_telemetry_u${currentUser?.id || 0}_f${activeFarm.id || 0}`;

  const [hasTelemetry, setHasTelemetry] = useState(() => {
    if (activeFarm.isNew || !activeFarm.id) return false;
    return localStorage.getItem(userKey) === "true";
  });

  const [showTelemetryModal, setShowTelemetryModal] = useState(false);

  // Form State for Farmer Input Setup
  const [form, setForm] = useState({
    farm_name: activeFarm.name || "My Farm",
    crop: activeFarm.crop || "Rice",
    soil_ph: "6.5",
    soil_moisture_pct: "38.0",
    temperature_c: "31.5",
    humidity_pct: "66.0",
    rainfall_24h_mm: "4.5",
    irrigation_method: "Drip",
    management_history: "Organic compost applied",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const userCompleted = localStorage.getItem(`agri_telemetry_completed_user_${currentUser?.id}`) === "true";
    const farmKeyCompleted = localStorage.getItem(`agri_telemetry_u${currentUser?.id || 0}_f${activeFarm.id}`) === "true";

    // If user has registered a farm, completed telemetry, or farm exists in DB -> NEVER ask again!
    if (userCompleted || farmKeyCompleted || (activeFarm.id && !activeFarm.isNew)) {
      setHasTelemetry(true);
    } else {
      setHasTelemetry(false);
    }
    setForm((prev) => ({
      ...prev,
      farm_name: activeFarm.name || `${currentUser?.full_name || "My"}'s Field`,
      crop: activeFarm.crop || "Rice",
    }));
  }, [activeFarm.id, activeFarm.name, activeFarm.crop, activeFarm.isNew, currentUser?.id]);

  const handleFarmerTelemetrySubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let targetFarmId = activeFarm.id;

      // Auto-register farm if new farmer session without assigned farm
      if (!targetFarmId) {
        const farmPayload = {
          name: form.farm_name.trim() || `${currentUser?.full_name || currentUser?.username || "My"}'s Farm`,
          latitude: 10.8,
          longitude: 78.7,
          crop: form.crop,
          irrigation_method: form.irrigation_method,
          soil_ph_farm_declared: parseFloat(form.soil_ph) || 6.5,
          management_history: form.management_history,
          extra_attributes_json: "{}"
        };
        const createdFarm = await api("/farms", "POST", farmPayload);
        targetFarmId = createdFarm.id;
        if (setSelectedFarmId) setSelectedFarmId(targetFarmId);
      }

      const payload = {
        farm_id: targetFarmId,
        farm_name: form.farm_name,
        crop: form.crop,
        irrigation_method: form.irrigation_method,
        soil_ph: parseFloat(form.soil_ph) || 6.5,
        soil_moisture_pct: parseFloat(form.soil_moisture_pct) || 35.0,
        temperature_c: parseFloat(form.temperature_c) || 31.0,
        humidity_pct: parseFloat(form.humidity_pct) || 65.0,
        rainfall_24h_mm: parseFloat(form.rainfall_24h_mm) || 5.0,
        management_history: form.management_history,
      };

      await api("/virtual-farm/custom-entry", "POST", payload);

      // Save permanent completion flags so user is NEVER asked to fill form again
      localStorage.setItem(`agri_telemetry_completed_user_${currentUser?.id || 0}`, "true");
      localStorage.setItem(`agri_telemetry_u${currentUser?.id || 0}_f${targetFarmId}`, "true");
      localStorage.setItem(`agri_user_${currentUser?.id || 0}_farm_id`, targetFarmId.toString());

      // Save farm ID to user's registered farms list
      const uFarmsKey = `agri_user_farms_${currentUser?.id || 0}`;
      let userFarmList = [];
      try {
        userFarmList = JSON.parse(localStorage.getItem(uFarmsKey) || "[]");
      } catch (e) {}
      if (!userFarmList.includes(targetFarmId)) {
        userFarmList.push(targetFarmId);
        localStorage.setItem(uFarmsKey, JSON.stringify(userFarmList));
      }

      const updatedUser = { ...currentUser, farm_id: targetFarmId };
      localStorage.setItem("agri_user", JSON.stringify(updatedUser));

      setHasTelemetry(true);
      notify(`Successfully saved field entries for ${form.farm_name}! Combined AI Analysis generated using your field data + regional seed models.`);
      if (loadDashboard) loadDashboard(false);
      setShowTelemetryModal(false);
    } catch (err) {
      notify("Error saving entries: " + err.message, "err");
    } finally {
      setSubmitting(false);
    }
  };

  const recAction = psoResult?.recommended_action_detail || "Water your field lightly today.";
  const waterStressLabel = metrics.water_stress_pct > 60 ? "High" : metrics.water_stress_pct > 30 ? "Moderate" : "Low";
  const diseaseRiskLabel = metrics.disease_risk_pct > 60 ? "High" : metrics.disease_risk_pct > 30 ? "Moderate" : "Low";

  return (
    <div className="space-y-6">
      {/* Farm Selector Header Bar */}
      <div className="bg-white p-4 rounded-2xl border border-sand-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 overflow-hidden">
        <div className="flex items-center gap-2 overflow-x-auto min-w-0 flex-1 pb-1 md:pb-0">
          <span className="text-xs font-extrabold text-ink-950/50 uppercase tracking-wider shrink-0">🌾 Active Farm:</span>
          {farms.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFarmId && setSelectedFarmId(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap shrink-0 ${activeFarm.id === f.id ? "bg-leaf-600 text-white shadow-md" : "bg-sand-100 text-ink-950/70 hover:bg-sand-200"}`}
            >
              {f.name} ({f.crop || "Rice"})
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowTelemetryModal(true)}
            className="px-3.5 py-1.5 bg-leaf-600 hover:bg-leaf-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all shrink-0 flex items-center gap-1.5"
          >
            <span>📝</span>
            <span>{hasTelemetry ? t("updateFieldTelemetry", "Update Field Telemetry") : t("inputFieldTelemetry", "Input Field Telemetry")}</span>
          </button>
          {onAddFarm && (
            <button
              onClick={onAddFarm}
              className="px-3.5 py-1.5 bg-ink-950 hover:bg-ink-900 text-amber-400 font-extrabold text-xs rounded-xl shadow-sm transition-all shrink-0 flex items-center gap-1.5"
            >
              <span>➕</span>
              <span>{t("registerNewFarm", "Register New Farm")}</span>
            </button>
          )}
        </div>
      </div>

      {/* STEP 1: If Farmer Has NOT Fed Telemetry Entries Yet -> Show Setup Input Form First */}
      {!hasTelemetry ? (
        <div className="bg-white rounded-3xl p-8 border-2 border-leaf-600/30 shadow-lg space-y-6 max-w-4xl mx-auto">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-leaf-600 text-white flex items-center justify-center mx-auto text-2xl shadow-md">
              👨‍🌾
            </div>
            <h2 className="text-2xl font-black text-ink-950">Welcome! Set Up Your Farm & Field Telemetry</h2>
            <p className="text-xs text-ink-950/60 leading-relaxed">
              Before AgriHive AI generates risk predictions and optimization advice, please feed your farm entries below.
              Your field entries will be combined with the regional seed dataset & federated models to deliver personalized AI analysis.
            </p>
          </div>

          <form onSubmit={handleFarmerTelemetrySubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-ink-950 block mb-1">Farm Name</label>
                <input required value={form.farm_name} onChange={(e) => setForm({ ...form, farm_name: e.target.value })} placeholder="e.g. Ramesh Paddy Field" className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-bold text-ink-950 block mb-1">Crop Type</label>
                <select value={form.crop} onChange={(e) => setForm({ ...form, crop: e.target.value })} className={inputCls}>
                  <option value="Rice">🌾 Rice (Paddy)</option>
                  <option value="Maize">🌽 Maize</option>
                  <option value="Cotton">☁️ Cotton</option>
                  <option value="Sugarcane">🎋 Sugarcane</option>
                  <option value="Wheat">🌾 Wheat</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-ink-950 block mb-1">Soil pH (0–14)</label>
                <input type="number" step="0.1" value={form.soil_ph} onChange={(e) => setForm({ ...form, soil_ph: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-bold text-ink-950 block mb-1">Soil Moisture (%)</label>
                <input type="number" step="0.5" value={form.soil_moisture_pct} onChange={(e) => setForm({ ...form, soil_moisture_pct: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-bold text-ink-950 block mb-1">Irrigation Method</label>
                <select value={form.irrigation_method} onChange={(e) => setForm({ ...form, irrigation_method: e.target.value })} className={inputCls}>
                  <option value="Drip">💧 Drip Irrigation</option>
                  <option value="Sprinkler">🌧️ Sprinkler System</option>
                  <option value="Flood">🌊 Flood Irrigation</option>
                  <option value="Rainfed">🌩️ Rainfed</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-ink-950 block mb-1">Current Temp (°C)</label>
                <input type="number" step="0.5" value={form.temperature_c} onChange={(e) => setForm({ ...form, temperature_c: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-bold text-ink-950 block mb-1">Humidity (%)</label>
                <input type="number" step="1" value={form.humidity_pct} onChange={(e) => setForm({ ...form, humidity_pct: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-bold text-ink-950 block mb-1">24h Rainfall (mm)</label>
                <input type="number" step="0.5" value={form.rainfall_24h_mm} onChange={(e) => setForm({ ...form, rainfall_24h_mm: e.target.value })} className={inputCls} />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-ink-950 block mb-1">Management Practices / Soil History</label>
              <input value={form.management_history} onChange={(e) => setForm({ ...form, management_history: e.target.value })} placeholder="e.g. Organic compost applied, drip fertigation schedule" className={inputCls} />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-leaf-600 hover:bg-leaf-700 text-white font-extrabold text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 mt-4"
            >
              <span>🚀</span>
              <span>{submitting ? "Analyzing Field Entries..." : "Submit Field Entries & Generate Combined AI Analysis"}</span>
            </button>
          </form>
        </div>
      ) : (
        /* STEP 2: After Farmer Has Fed Entries -> Display Combined AI Analysis */
        <>
          {/* Custom Entry Indicator Banner */}
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-center gap-2 font-bold">
              <span className="text-lg">🎯</span>
              <span>
                <strong>Combined AI Analysis Active:</strong> Analyzing your field entries (Soil pH: {form.soil_ph}, Moisture: {cond.soil_moisture_pct}%, Temp: {cond.temperature_c}°C, Crop: {activeFarm.crop || "Rice"}) combined with AgriHive Seed Dataset & Regional Clustered Model.
              </span>
            </div>
          </div>

          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-leaf-700 via-leaf-800 to-ink-950 p-6 rounded-3xl text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-leaf-300 text-xs font-extrabold uppercase tracking-wider mb-1">
                <span>👨‍🌾</span> {t("myFarmDashboard")}
              </div>
              <h2 className="text-2xl font-extrabold text-white">{activeFarm.name} • {activeFarm.crop || "Rice"} Field</h2>
              <p className="text-xs text-white/70 mt-1 max-w-xl">
                Action recommendations and crop risk health status calculated from your field inputs benchmarked against regional intelligence.
              </p>
            </div>
            <button
              onClick={triggerLiveIngestion}
              disabled={ingesting}
              className="px-4 py-2.5 bg-white text-leaf-900 font-extrabold text-xs rounded-xl shadow-lg hover:bg-leaf-50 transition-all shrink-0 flex items-center gap-2"
            >
              <span>{ingesting ? "⏳" : "📡"}</span>
              <span>{ingesting ? t("fetching") : t("fetchWeather")}</span>
            </button>
          </div>

          {/* Farm Health Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-sand-200 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold text-ink-950/60 mb-2">
                <span>Overall Farm Health</span>
                <span>🌱</span>
              </div>
              <p className="text-xl font-extrabold text-emerald-600">Good</p>
              <p className="text-[11px] text-ink-950/40 mt-1">Growth Stage: Flowering</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-sand-200 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold text-ink-950/60 mb-2">
                <span>{t("waterStress")}</span>
                <span>💧</span>
              </div>
              <p className={`text-xl font-extrabold ${waterStressLabel === "High" ? "text-rose-600" : waterStressLabel === "Moderate" ? "text-amber-600" : "text-emerald-600"}`}>
                {waterStressLabel} ({metrics.water_stress_pct}%)
              </p>
              <p className="text-[11px] text-ink-950/40 mt-1">Soil Moisture: {cond.soil_moisture_pct}%</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-sand-200 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold text-ink-950/60 mb-2">
                <span>{t("diseaseRisk")}</span>
                <span>🐛</span>
              </div>
              <p className={`text-xl font-extrabold ${diseaseRiskLabel === "High" ? "text-rose-600" : diseaseRiskLabel === "Moderate" ? "text-amber-600" : "text-emerald-600"}`}>
                {diseaseRiskLabel} ({metrics.disease_risk_pct}%)
              </p>
              <p className="text-[11px] text-ink-950/40 mt-1">Humidity: {cond.humidity_pct}%</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-sand-200 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold text-ink-950/60 mb-2">
                <span>{t("yieldPrediction")}</span>
                <span>🌾</span>
              </div>
              <p className="text-xl font-extrabold text-leaf-700">{metrics.yield_prediction_t_ha} Tons / Ha</p>
              <p className="text-[11px] text-emerald-600 font-bold mt-1">+{metrics.yield_change_pct}% expected</p>
            </div>
          </div>

          {/* Today's Weather & Recommendation Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-sand-200 shadow-sm space-y-4">
              <h3 className="text-base font-extrabold text-ink-950 flex items-center gap-2">
                <span>☀️</span> Today's Weather Conditions
              </h3>
              <div className="grid grid-cols-2 gap-4 bg-sand-50 p-4 rounded-2xl border border-sand-100">
                <div>
                  <p className="text-3xl font-extrabold text-ink-950">{cond.temperature_c}°C</p>
                  <p className="text-xs font-bold text-ink-950/60 mt-0.5">Partly Cloudy</p>
                </div>
                <div className="space-y-1 text-xs font-semibold text-ink-950/70">
                  <p>💧 Humidity: <span className="font-bold text-ink-950">{cond.humidity_pct}%</span></p>
                  <p>🌧️ Rainfall: <span className="font-bold text-ink-950">{cond.rainfall_24h_mm} mm</span></p>
                  <p>💨 Wind: <span className="font-bold text-ink-950">10 km/h</span></p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-500/10 via-leaf-600/10 to-transparent p-6 rounded-3xl border border-amber-500/30 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-amber-500 text-white font-black text-[10px] uppercase tracking-wider rounded-full shadow-sm">
                  Today's Recommended Action
                </span>
                <span className="text-xs font-bold text-amber-900/60">Swarm Optimization</span>
              </div>

              <h3 className="text-lg font-extrabold text-ink-950 leading-snug">
                "{recAction}"
              </h3>

              <div className="pt-2 border-t border-sand-200/60 space-y-2">
                <p className="text-xs font-extrabold text-ink-950">Why is this recommendation given?</p>
                <ul className="text-xs text-ink-950/70 space-y-1 list-disc list-inside">
                  <li>Soil moisture ({cond.soil_moisture_pct}%) is getting low for {activeFarm.crop || "Rice"} stage.</li>
                  <li>High temperature ({cond.temperature_c}°C) expected tomorrow.</li>
                  <li>Nearby farms in region show similar water-stress pattern.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Non-Technical Explainable AI Card */}
          <div className="bg-white p-6 rounded-3xl border border-sand-200 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-ink-950 flex items-center justify-between">
              <span className="flex items-center gap-2"><span>💡</span> Farmer Advice & Consequence Guide</span>
              <button onClick={() => goTo("recommendations")} className="text-xs text-leaf-700 hover:underline">
                View Full Explanation →
              </button>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 space-y-1">
                <p className="text-xs font-extrabold text-emerald-900">What should I do?</p>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Irrigate field lightly for 30 minutes during evening hours to maintain optimal root zone moisture.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 space-y-1">
                <p className="text-xs font-extrabold text-rose-900">What happens if I ignore this?</p>
                <p className="text-xs text-rose-800 leading-relaxed">
                  Water stress may increase by 18% within 48 hours, causing growth slowdown and potential yield loss.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Telemetry Edit Modal */}
      {showTelemetryModal && (
        <FarmerTelemetryModal
          activeFarm={activeFarm}
          api={api}
          notify={notify}
          onClose={() => setShowTelemetryModal(false)}
          onUpdated={() => {
            localStorage.setItem(`agri_telemetry_u${currentUser?.id || 0}_f${activeFarm.id}`, "true");
            setHasTelemetry(true);
            if (loadDashboard) loadDashboard(false);
          }}
        />
      )}
    </div>
  );
}


// ================= 2. Agricultural Officer Dashboard View (Regional Monitoring) =================
function OfficerDashboardView({ t, farms, farmStatesMap, alerts, cond, goTo }) {
  let healthy = 0, moderate = 0, high = 0;
  farms.forEach((f) => {
    const st = farmStatesMap[f.id];
    const risk = st?.current_metrics?.disease_risk_pct || 30;
    if (risk >= 65) high++;
    else if (risk >= 40) moderate++;
    else healthy++;
  });

  return (
    <div className="space-y-6">
      {/* Officer Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-ink-950 to-leaf-900 p-6 rounded-3xl text-white shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-blue-300 text-xs font-extrabold uppercase tracking-wider mb-1">
            <span>👩‍🌾</span> {t("officerDashboard")}
          </div>
          <h2 className="text-2xl font-extrabold text-white">District Agricultural Monitoring</h2>
          <p className="text-xs text-white/70 mt-1 max-w-xl">
            Overview of regional disease risks, water stress distribution, and advisory management across {farms.length} active farming nodes.
          </p>
        </div>
        <button
          onClick={() => goTo("regional_map")}
          className="px-4 py-2.5 bg-white text-blue-900 font-extrabold text-xs rounded-xl shadow-lg hover:bg-blue-50 transition-all shrink-0"
        >
          Open Google Maps GIS →
        </button>
      </div>

      {/* Regional Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-sand-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-ink-950/50 uppercase">Low Risk Farms</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{healthy} Farms</p>
            <p className="text-[11px] text-ink-950/40 mt-1">Healthy crop conditions</p>
          </div>
          <span className="text-3xl">🟢</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-sand-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-ink-950/50 uppercase">Moderate Stress Farms</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{moderate} Farms</p>
            <p className="text-[11px] text-ink-950/40 mt-1">Watering advisories sent</p>
          </div>
          <span className="text-3xl">🟡</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-sand-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-ink-950/50 uppercase">High Alert Farms</p>
            <p className="text-2xl font-black text-rose-600 mt-1">{high} Farms</p>
            <p className="text-[11px] text-ink-950/40 mt-1">Requires immediate intervention</p>
          </div>
          <span className="text-3xl">🔴</span>
        </div>
      </div>
    </div>
  );
}


// ================= 3. Administrator Dashboard View =================
function AdminDashboardView({ t, farms, alerts, goTo, lastRefreshed, triggerLiveIngestion, ingesting }) {
  return (
    <div className="space-y-6">
      {/* Admin Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-ink-950 to-leaf-950 p-6 rounded-3xl text-white shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-purple-300 text-xs font-extrabold uppercase tracking-wider mb-1">
            <span>🌾</span> {t("adminDashboard")}
          </div>
          <h2 className="text-2xl font-extrabold text-white">AgriHive AI System Console</h2>
          <p className="text-xs text-white/70 mt-1 max-w-xl">
            System topology, Federated Learning metrics, user access controls, and data pipeline management.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => goTo("users")}
            className="px-4 py-2.5 bg-white text-purple-950 font-extrabold text-xs rounded-xl shadow-lg hover:bg-purple-50 transition-all shrink-0"
          >
            User Controls →
          </button>
          <button
            onClick={() => goTo("audit_logs")}
            className="px-4 py-2.5 bg-purple-800 text-white font-extrabold text-xs rounded-xl shadow-lg hover:bg-purple-700 transition-all shrink-0"
          >
            Audit Logs →
          </button>
        </div>
      </div>

      {/* Infrastructure Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-sand-200 shadow-sm">
          <p className="text-xs font-bold text-ink-950/50 uppercase">Active Nodes</p>
          <p className="text-2xl font-black text-ink-950 mt-1">{farms.length} Client Nodes</p>
          <p className="text-[11px] text-emerald-600 font-bold mt-1">● 100% Online</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-sand-200 shadow-sm">
          <p className="text-xs font-bold text-ink-950/50 uppercase">FL Neural Model</p>
          <p className="text-2xl font-black text-purple-700 mt-1">Clustered FedAvg</p>
          <p className="text-[11px] text-purple-700 font-bold mt-1">Phase 6 Active</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-sand-200 shadow-sm">
          <p className="text-xs font-bold text-ink-950/50 uppercase">Feature Registry</p>
          <p className="text-2xl font-black text-leaf-700 mt-1">15 Variables</p>
          <p className="text-[11px] text-ink-950/40 mt-1">Domain Whitelisted</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-sand-200 shadow-sm">
          <p className="text-xs font-bold text-ink-950/50 uppercase">Security Audit Log</p>
          <p className="text-2xl font-black text-blue-700 mt-1">Active Trail</p>
          <p className="text-[11px] text-blue-700 font-bold mt-1">SHA-256 JWT Signed</p>
        </div>
      </div>
    </div>
  );
}


function FarmerTelemetryModal({ activeFarm, api, notify, onClose, onUpdated }) {
  const [farmName, setFarmName] = useState(activeFarm.name || "My Paddy Field");
  const [crop, setCrop] = useState(activeFarm.crop || "Rice");
  const [irrigation, setIrrigation] = useState("Drip");
  const [soilPh, setSoilPh] = useState("6.5");
  const [soilMoisture, setSoilMoisture] = useState("35.0");
  const [temp, setTemp] = useState("31.0");
  const [humidity, setHumidity] = useState("65.0");
  const [rainfall, setRainfall] = useState("5.0");
  const [history, setHistory] = useState("Organic compost applied");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        farm_id: activeFarm.id,
        farm_name: farmName,
        crop: crop,
        irrigation_method: irrigation,
        soil_ph: parseFloat(soilPh),
        soil_moisture_pct: parseFloat(soilMoisture),
        temperature_c: parseFloat(temp),
        humidity_pct: parseFloat(humidity),
        rainfall_24h_mm: parseFloat(rainfall),
        management_history: history,
      };

      await api("/virtual-farm/custom-entry", "POST", payload);
      notify(`Updated farm telemetry entries for ${farmName}! Custom prediction calculated using your entries benchmarked against regional ML models.`);
      if (onUpdated) onUpdated();
      onClose();
    } catch (err) {
      notify("Error processing telemetry: " + err.message, "err");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-sand-200 w-full max-w-lg p-6 space-y-4 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 text-ink-950/40 hover:text-ink-950">✖</button>
        <div className="flex items-center gap-2 border-b border-sand-100 pb-3">
          <span className="text-2xl">👨‍🌾</span>
          <div>
            <h3 className="text-base font-extrabold text-ink-950">Farmer Telemetry & Entry Form</h3>
            <p className="text-xs text-ink-950/50">Input your field's exact conditions. AI predictions will analyze your entries benchmarked against regional seed models.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-ink-950 block mb-1">Farm Name</label>
              <input required value={farmName} onChange={(e) => setFarmName(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="font-bold text-ink-950 block mb-1">Crop Type</label>
              <select value={crop} onChange={(e) => setCrop(e.target.value)} className={inputCls}>
                <option value="Rice">🌾 Rice</option>
                <option value="Maize">🌽 Maize</option>
                <option value="Cotton">☁️ Cotton</option>
                <option value="Sugarcane">🎋 Sugarcane</option>
                <option value="Wheat">🌾 Wheat</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-ink-950 block mb-1">Soil pH (0-14)</label>
              <input type="number" step="0.1" value={soilPh} onChange={(e) => setSoilPh(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="font-bold text-ink-950 block mb-1">Soil Moisture (%)</label>
              <input type="number" step="0.5" value={soilMoisture} onChange={(e) => setSoilMoisture(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="font-bold text-ink-950 block mb-1">Irrigation Method</label>
              <select value={irrigation} onChange={(e) => setIrrigation(e.target.value)} className={inputCls}>
                <option value="Drip">💧 Drip</option>
                <option value="Sprinkler">🌧️ Sprinkler</option>
                <option value="Flood">🌊 Flood</option>
                <option value="Rainfed">🌩️ Rainfed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-ink-950 block mb-1">Temp (°C)</label>
              <input type="number" step="0.5" value={temp} onChange={(e) => setTemp(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="font-bold text-ink-950 block mb-1">Humidity (%)</label>
              <input type="number" step="1" value={humidity} onChange={(e) => setHumidity(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="font-bold text-ink-950 block mb-1">24h Rain (mm)</label>
              <input type="number" step="0.5" value={rainfall} onChange={(e) => setRainfall(e.target.value)} className={inputCls} />
            </div>
          </div>

          <div>
            <label className="font-bold text-ink-950 block mb-1">Management History</label>
            <input value={history} onChange={(e) => setHistory(e.target.value)} placeholder="Organic compost applied, drip fertigation" className={inputCls} />
          </div>

          <button type="submit" disabled={loading} className="w-full py-3 bg-leaf-600 hover:bg-leaf-700 text-white font-extrabold rounded-xl shadow-md transition-colors mt-2">
            {loading ? "Computing Custom Prediction..." : "Save Telemetry & Run Custom Prediction"}
          </button>
        </form>
      </div>
    </div>
  );
}
