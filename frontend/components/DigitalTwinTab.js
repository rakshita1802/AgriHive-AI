// ================= Digital Twin Simulator Tab =================
function DigitalTwinTab({ api, notify, farms, selectedFarmId, lang = "en" }) {
  const t = (key) => getTranslation(lang, key);
  const farmId = selectedFarmId || (farms.length ? farms[0].id : 1);

  const [farmState, setFarmState] = useState(null);
  const [irrigation, setIrrigation] = useState(60);
  const [rainfall, setRainfall] = useState(20);
  const [temperature, setTemperature] = useState(32);
  const [fertilizer, setFertilizer] = useState(80);
  const [scenario, setScenario] = useState("Scenario 1");

  const [simResult, setSimResult] = useState(null);
  const [simulating, setSimulating] = useState(false);

  const loadCurrentState = useCallback(async () => {
    try {
      const res = await api(`/virtual-farm/state/${farmId}`);
      setFarmState(res);
      if (res?.current_conditions) {
        setTemperature(res.current_conditions.temperature_c || 32);
        setRainfall(res.current_conditions.rainfall_24h_mm || 20);
      }
    } catch (err) {
      console.error(err);
    }
  }, [api, farmId]);

  const runSimulation = async () => {
    try {
      setSimulating(true);
      const payload = {
        farm_id: parseInt(farmId),
        irrigation_level_pct: parseFloat(irrigation),
        rainfall_mm: parseFloat(rainfall),
        temperature_c: parseFloat(temperature),
        fertilizer_npk_pct: parseFloat(fertilizer),
        scenario_name: scenario
      };
      const res = await api("/virtual-farm/simulate", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setSimResult(res);
      notify("Virtual Farm Simulation complete!");
    } catch (err) {
      notify("Simulation failed: " + err.message, "err");
    } finally {
      setSimulating(false);
    }
  };

  useEffect(() => {
    loadCurrentState();
    runSimulation();
    // eslint-disable-next-line
  }, [farmId]);

  const cond = farmState?.current_conditions || {
    soil_moisture_pct: 32,
    temperature_c: 31,
    humidity_pct: 65,
    rainfall_24h_mm: 2.4,
    nitrogen_n: "Medium",
    phosphorus_p: "Low",
    potassium_k: "Medium",
    soil_ph: 6.5
  };

  const outcomes = simResult?.simulated_outcomes_7d || {
    disease_risk_pct: 68,
    disease_risk_from_pct: 72,
    expected_yield_t_ha: 3.65,
    expected_yield_change_pct: 14,
    water_usage_delta_l: 120,
    profitability_gain_pct: 11
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-ink-950">Digital Twin Simulator ({farmState?.farm_name || "Active Farm"})</h2>
        <p className="text-xs text-ink-950/50">Simulate actions and predict outcomes before applying in your farm</p>
      </div>

      {/* Controls & Current State Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Current Conditions */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-sand-200">
          <h3 className="font-extrabold text-base text-ink-950 mb-4 border-b border-sand-100 pb-2">Live Current Conditions</h3>
          <div className="space-y-3 text-xs font-bold text-ink-950">
            <div className="flex items-center justify-between p-2 rounded-lg bg-sand-50">
              <span className="flex items-center gap-2 text-sky-600"><IconDroplet className="w-4 h-4" /> Soil Moisture</span>
              <span>{cond.soil_moisture_pct}%</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-sand-50">
              <span className="flex items-center gap-2 text-rose-600"><IconThermometer className="w-4 h-4" /> Temperature</span>
              <span>{cond.temperature_c}°C</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-sand-50">
              <span className="flex items-center gap-2 text-sky-600"><IconCloud className="w-4 h-4" /> Humidity</span>
              <span>{cond.humidity_pct}%</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-sand-50">
              <span className="flex items-center gap-2 text-sky-600"><IconCloud className="w-4 h-4" /> Rainfall (24h)</span>
              <span>{cond.rainfall_24h_mm} mm</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-sand-50">
              <span className="flex items-center gap-2 text-leaf-600"><IconSprout className="w-4 h-4" /> Nitrogen (N)</span>
              <span className="text-amber-600">{cond.nitrogen_n}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-sand-50">
              <span className="flex items-center gap-2 text-leaf-600"><IconSprout className="w-4 h-4" /> Soil pH</span>
              <span className="text-leaf-700">{cond.soil_ph}</span>
            </div>
          </div>
        </div>

        {/* Simulation Controls */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-sand-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-sand-100 pb-3 mb-4">
              <h3 className="font-extrabold text-base text-ink-950">Simulation Controls</h3>
              <div className="flex items-center gap-2">
                <select
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                  className="text-xs font-bold bg-sand-50 border border-sand-200 rounded-xl px-3 py-1.5 text-ink-950"
                >
                  <option value="Scenario 1">Scenario 1 (Irrigation Boost)</option>
                  <option value="Scenario 2">Scenario 2 (Fertilizer Optim.)</option>
                  <option value="Scenario 3">Scenario 3 (High Rain Stress)</option>
                </select>
                <button
                  onClick={runSimulation}
                  disabled={simulating}
                  className="px-4 py-1.5 bg-leaf-600 hover:bg-leaf-700 text-white font-extrabold rounded-xl text-xs transition-colors flex items-center gap-1.5"
                >
                  {simulating ? "Simulating..." : "Run Simulation"}
                </button>
              </div>
            </div>

            {/* Sliders Grid */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Irrigation Level</span>
                  <span className="text-leaf-600 font-extrabold">{irrigation}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={irrigation}
                  onChange={(e) => setIrrigation(e.target.value)}
                  className="w-full accent-leaf-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Rainfall</span>
                  <span className="text-sky-600 font-extrabold">{rainfall} mm</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={rainfall}
                  onChange={(e) => setRainfall(e.target.value)}
                  className="w-full accent-sky-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Temperature</span>
                  <span className="text-amber-600 font-extrabold">{temperature}°C</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="45"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  className="w-full accent-amber-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Fertilizer (NPK)</span>
                  <span className="text-leaf-600 font-extrabold">{fertilizer}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={fertilizer}
                  onChange={(e) => setFertilizer(e.target.value)}
                  className="w-full accent-leaf-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Dynamic ML Summary Banner */}
          {simResult?.recommendation_summary && (
            <div className="mt-5 p-3 rounded-xl bg-leaf-50 border border-leaf-200 text-xs font-medium text-leaf-900">
              <span className="font-bold block text-leaf-800 mb-0.5">Live ML Inference Model Active:</span>
              {simResult.recommendation_summary}
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Predicted Outcomes Grid */}
      <div className="space-y-3">
        <h3 className="font-extrabold text-base text-ink-950">Dynamic Predicted Outcomes (7-Day Forecast)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Disease Risk outcome */}
          <div className="bg-leaf-50 border border-leaf-200 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-leaf-700">Disease Risk</p>
              <p className="text-2xl font-black text-leaf-700 mt-1 flex items-center gap-1">
                <IconArrowDown className="w-5 h-5" /> {outcomes.disease_risk_pct}%
              </p>
              <p className="text-[10px] text-ink-950/40 font-semibold">(From {outcomes.disease_risk_from_pct}%)</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-leaf-600 text-white flex items-center justify-center">
              <IconShield className="w-5 h-5" />
            </div>
          </div>

          {/* Expected Yield outcome */}
          <div className="bg-leaf-50 border border-leaf-200 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-leaf-700">Expected Yield</p>
              <p className="text-2xl font-black text-leaf-700 mt-1 flex items-center gap-1">
                <IconArrowUp className="w-5 h-5" /> {outcomes.expected_yield_change_pct}%
              </p>
              <p className="text-[10px] text-ink-950/40 font-semibold">(Yield: {outcomes.expected_yield_t_ha} t/ha)</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-leaf-600 text-white flex items-center justify-center">
              <IconSprout className="w-5 h-5" />
            </div>
          </div>

          {/* Water Usage outcome */}
          <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-sky-700">Water Usage</p>
              <p className="text-2xl font-black text-sky-700 mt-1">+{outcomes.water_usage_delta_l} L</p>
              <p className="text-[10px] text-ink-950/40 font-semibold">(Per 1000 m²)</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-sky-600 text-white flex items-center justify-center">
              <IconDroplet className="w-5 h-5" />
            </div>
          </div>

          {/* Profitability outcome */}
          <div className="bg-leaf-100/60 border border-leaf-300 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-leaf-700">Profitability</p>
              <p className="text-2xl font-black text-leaf-700 mt-1 flex items-center gap-1">
                <IconArrowUp className="w-5 h-5" /> {outcomes.profitability_gain_pct}%
              </p>
              <p className="text-[10px] text-ink-950/40 font-semibold">(Estimated Net)</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-leaf-600 text-white flex items-center justify-center">
              <IconBarChart className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

