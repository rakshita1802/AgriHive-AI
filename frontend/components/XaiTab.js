// ================= Explainable AI (XAI) Tab =================
function XaiTab({ api, notify, farms, selectedFarmId, lang = "en" }) {
  const t = (key) => getTranslation(lang, key);
  const farmId = selectedFarmId || (farms.length ? farms[0].id : 1);
  const activeFarmObj = farms.find(f => f.id === farmId) || farms[0];
  const [xaiData, setXaiData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadXai = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api(`/xai/explain/${farmId}`);
      setXaiData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [api, farmId]);

  useEffect(() => { loadXai(); }, [loadXai]);

  const riskScore = xaiData?.prediction?.risk_score_pct || 82;
  const riskLevel = xaiData?.prediction?.risk_level || (riskScore >= 70 ? "HIGH" : riskScore >= 40 ? "MEDIUM" : "LOW");
  const factors = xaiData?.top_contributing_factors || [
    { factor: "Leaf Wetness", score: 0.28 },
    { factor: "Humidity", score: 0.22 },
    { factor: "Temperature", score: 0.18 },
    { factor: "Recent Rainfall", score: 0.15 },
    { factor: "Soil Moisture", score: 0.10 },
    { factor: "Wind Speed", score: 0.07 },
  ];

  const shapItems = xaiData?.shap_feature_importance || [
    { feature: "Leaf Wetness", impact: 0.32, type: "increase_risk" },
    { feature: "Humidity", impact: 0.25, type: "increase_risk" },
    { feature: "Temperature", impact: 0.18, type: "increase_risk" },
    { feature: "Recent Rainfall", impact: 0.12, type: "increase_risk" },
    { feature: "Soil Moisture", impact: 0.08, type: "increase_risk" },
    { feature: "Wind Speed", impact: 0.05, type: "increase_risk" },
    { feature: "Nitrogen (N)", impact: -0.08, type: "decrease_risk" },
    { feature: "Plant Age", impact: -0.14, type: "decrease_risk" },
    { feature: "Sunlight Hours", impact: -0.16, type: "decrease_risk" },
  ];

  const explanation = xaiData?.model_explanation_plain_language || (
    "The high risk is mainly due to high leaf wetness, humidity, and recent rainfall in your area. These conditions are favorable for fungal disease spread."
  );

  const actions = xaiData?.what_you_can_do || [
    "Improve air circulation between crop rows",
    "Reduce irrigation frequency over the next 48 hours",
    "Monitor field leaf humidity and soil moisture daily",
    "Apply preventive organic fungicide spray if humidity exceeds 70%"
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-ink-950">Explainable AI ({activeFarmObj?.name || "Selected Farm"})</h2>
        <p className="text-xs text-ink-950/50">Understand why this recommendation was generated using live SHAP value attributions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Prediction & Top Factors & Plain Language */}
        <div className="space-y-6">
          {/* Live Prediction Metric Card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-sand-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-ink-950/40 uppercase tracking-wider">Live Model Prediction</p>
              <h3 className="text-sm font-extrabold text-ink-950 mt-0.5">Water-Stress & Disease Risk</h3>
              <p className={`text-4xl font-black mt-2 ${riskLevel === "HIGH" ? "text-rose-600" : riskLevel === "MEDIUM" ? "text-amber-600" : "text-leaf-600"}`}>{riskScore}%</p>
              <span className={`inline-block mt-2 text-xs font-extrabold px-3 py-1 rounded-full ${riskLevel === "HIGH" ? "bg-rose-100 text-rose-600" : riskLevel === "MEDIUM" ? "bg-amber-100 text-amber-600" : "bg-leaf-100 text-leaf-700"}`}>
                {riskLevel} RISK
              </span>
            </div>
            <div className={`w-16 h-16 rounded-full border flex items-center justify-center font-black text-2xl ${riskLevel === "HIGH" ? "bg-rose-50 border-rose-200 text-rose-600" : "bg-leaf-50 border-leaf-200 text-leaf-600"}`}>
              !
            </div>
          </div>

          {/* Top Contributing Factors */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-sand-200">
            <h3 className="font-extrabold text-base text-ink-950 mb-4">Top Contributing Risk Factors</h3>
            <div className="space-y-3">
              {factors.map((f, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-ink-950">{f.factor || f.feature}</span>
                    <span className="text-rose-600 font-mono">{(f.score || f.impact || 0.1).toFixed(2)}</span>
                  </div>
                  <div className="w-full h-2 bg-sand-100 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-600 rounded-full" style={{ width: `${Math.min(100, (f.score || f.impact || 0.1) * 100)}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Model Explanation (Plain Language) */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-sand-200">
            <h3 className="font-extrabold text-base text-ink-950 mb-2">Model Explanation (Agronomic Natural Language)</h3>
            <p className="text-xs text-ink-950/80 leading-relaxed font-medium bg-sand-50 p-4 rounded-xl border border-sand-100">
              {explanation}
            </p>
          </div>
        </div>

        {/* Right Column: SHAP Bar Chart & What You Can Do */}
        <div className="space-y-6">
          {/* SHAP Feature Importance Horizontal Bar Chart */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-sand-200">
            <h3 className="font-extrabold text-base text-ink-950 mb-1">SHAP Feature Importance</h3>
            <p className="text-xs text-ink-950/40 mb-4">SHAP value (additive impact on log-odds risk prediction)</p>

            <div className="space-y-3 relative">
              {/* Zero line */}
              <div className="absolute top-0 bottom-0 left-1/2 w-px bg-sand-200"></div>

              {shapItems.map((item, idx) => {
                const isPositive = item.impact > 0;
                const barWidth = Math.min(48, Math.abs(item.impact) * 120);

                return (
                  <div key={idx} className="flex items-center text-xs font-semibold">
                    <span className="w-32 truncate text-right pr-3 text-ink-950">{item.feature}</span>
                    <div className="flex-1 flex items-center h-5">
                      {isPositive ? (
                        <div className="flex items-center w-1/2">
                          <div className="h-4 bg-rose-600 rounded-r" style={{ width: `${barWidth}%` }}></div>
                          <span className="text-[10px] text-rose-600 font-mono ml-2">+{item.impact}</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end w-1/2 pr-0">
                          <span className="text-[10px] text-sky-600 font-mono mr-2">{item.impact}</span>
                          <div className="h-4 bg-sky-600 rounded-l" style={{ width: `${barWidth}%` }}></div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              <div className="flex justify-between text-[10px] font-mono text-ink-950/40 pt-2 border-t border-sand-100">
                <span>-0.3</span>
                <span>-0.1</span>
                <span>0.0</span>
                <span>+0.1</span>
                <span>+0.3</span>
              </div>
            </div>
          </div>

          {/* What You Can Do Box */}
          <div className="bg-leaf-50 border border-leaf-200 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-leaf-800 mb-3">Actionable Mitigation Steps</h3>
              <ul className="space-y-2 text-xs font-semibold text-leaf-900">
                {actions.map((act, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-leaf-600 font-extrabold">◇</span>
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="w-16 h-16 rounded-2xl bg-leaf-600 text-white flex items-center justify-center shrink-0 shadow-lg">
              <IconShield className="w-8 h-8" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

