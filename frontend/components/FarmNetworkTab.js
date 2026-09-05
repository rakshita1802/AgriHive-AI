// ================= Farm Network Tab =================
function FarmNetworkTab({ api, notify, farms, refreshFarms, lang = "en" }) {
  const t = (key) => getTranslation(lang, key);
  const [clusters, setClusters] = useState([]);
  const [features, setFeatures] = useState([]);
  const [newFarmName, setNewFarmName] = useState("");
  const [newFarmCrop, setNewFarmCrop] = useState("Rice");
  const [extraAttrKey, setExtraAttrKey] = useState("leaf_wetness_pct");
  const [extraAttrVal, setExtraAttrVal] = useState("78.5");
  const [showModal, setShowModal] = useState(false);

  const loadNetworkData = useCallback(async () => {
    try {
      const [cls, featList] = await Promise.all([
        api("/clustered-fl/clusters").catch(() => []),
        api("/feature-registry/").catch(() => [])
      ]);
      setClusters(cls);
      setFeatures(featList);
    } catch (err) {
      console.error(err);
    }
  }, [api]);

  useEffect(() => { loadNetworkData(); }, [loadNetworkData]);

  const handleOnboard = async (e) => {
    e.preventDefault();
    const cleanName = newFarmName.trim();
    if (!cleanName) return;

    if (farms.some(f => f.name.trim().toLowerCase() === cleanName.toLowerCase())) {
      notify("A farm with the name '" + cleanName + "' already exists!", "error");
      return;
    }

    try {
      const payload = {
        name: cleanName,
        latitude: 10.8 + Math.random() * 0.5,
        longitude: 78.5 + Math.random() * 0.5,
        crop: newFarmCrop,
        irrigation_method: "Drip",
        soil_ph_farm_declared: 6.5,
        management_history: "Newly onboarded farm client",
        extra_attributes_json: JSON.stringify({ [extraAttrKey]: parseFloat(extraAttrVal) })
      };
      await api("/farms", { method: "POST", body: JSON.stringify(payload) });
      notify(`Onboarded ${cleanName}! Discovered feature '${extraAttrKey}' retained locally.`);
      setNewFarmName("");
      setShowModal(false);
      refreshFarms();
      loadNetworkData();
    } catch (err) {
      notify("Failed to onboard farm: " + err.message, "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-ink-950">Farm Network & Feature Discovery</h2>
          <p className="text-xs text-ink-950/50">Manage farm clients, clusters, and new local feature discovery (Section 11)</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-leaf-600 hover:bg-leaf-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 shadow"
        >
          <IconPlus className="w-4 h-4" />
          Onboard New Farm
        </button>
      </div>

      {/* Cluster Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {clusters.map((c, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-sand-200">
            <div className="flex items-center justify-between border-b border-sand-100 pb-3 mb-3">
              <h3 className="font-extrabold text-sm text-ink-950">{c.name}</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-leaf-100 text-leaf-700">{c.farm_count} Farms</span>
            </div>
            <p className="text-xs text-ink-950/50 mb-3">Center: ({c.center_lat}, {c.center_lon})</p>
            <div className="space-y-1.5 text-xs font-semibold text-ink-950">
              {c.farm_names && c.farm_names.map((fn, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-sand-50">
                  <span className="flex items-center gap-2"><IconSprout className="w-4 h-4 text-leaf-600" /> {fn}</span>
                  <span className="text-[10px] text-ink-950/40">Client #{idx + 1}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Dynamic Feature Separation: Shared vs Local Table */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-sand-200">
        <h3 className="font-extrabold text-base text-ink-950 mb-3">Dynamic Feature Catalog & Scope Lifecycle (Section 10 & 11)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-sand-50 text-ink-950/60 font-extrabold border-b border-sand-200">
              <tr>
                <th className="p-3">Feature Name</th>
                <th className="p-3">Scope Status</th>
                <th className="p-3">Domain Source</th>
                <th className="p-3">Federated Model Usage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-100 font-medium">
              {features.map((f, i) => {
                const isGlobal = f.scope_status === "GLOBAL" || !f.farm_id;
                return (
                  <tr key={i}>
                    <td className="p-3 font-bold text-ink-950">{f.feature_name || f.name || f.key}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${isGlobal ? "bg-leaf-100 text-leaf-700" : "bg-amber-100 text-amber-700"}`}>
                        {isGlobal ? "GLOBAL SHARED" : `LOCAL (Farm ${f.farm_id})`}
                      </span>
                    </td>
                    <td className="p-3 text-ink-950/60">{f.domain || "Meteorological/Soil"}</td>
                    <td className="p-3 font-semibold">
                      <span className={isGlobal ? "text-leaf-600" : "text-amber-700"}>
                        {isGlobal ? "Trained in Clustered FL Neural Model" : "Retained locally; evaluating for future global release"}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {!features.length && (
                <tr>
                  <td colSpan="4" className="p-4 text-center text-ink-950/40 italic">Loading dynamic feature catalog...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Onboard Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-ink-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-sand-200 space-y-4">
            <div className="flex items-center justify-between border-b border-sand-100 pb-3">
              <h3 className="text-base font-extrabold text-ink-950">Onboard New Farm (Section 11)</h3>
              <button onClick={() => setShowModal(false)} className="text-ink-950/40 hover:text-ink-950"><IconX className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleOnboard} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-ink-950 block mb-1">Farm Name</label>
                <input
                  type="text"
                  required
                  value={newFarmName}
                  onChange={(e) => setNewFarmName(e.target.value)}
                  placeholder="e.g. Farm H"
                  className="w-full text-xs bg-sand-50 border border-sand-200 rounded-xl p-2.5 font-semibold text-ink-950"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-ink-950 block mb-1">Crop Type</label>
                <input
                  type="text"
                  value={newFarmCrop}
                  onChange={(e) => setNewFarmCrop(e.target.value)}
                  className="w-full text-xs bg-sand-50 border border-sand-200 rounded-xl p-2.5 font-semibold text-ink-950"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-ink-950 block mb-1">New Local Attribute Key</label>
                  <input
                    type="text"
                    value={extraAttrKey}
                    onChange={(e) => setExtraAttrKey(e.target.value)}
                    className="w-full text-xs bg-sand-50 border border-sand-200 rounded-xl p-2.5 font-semibold text-ink-950"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-ink-950 block mb-1">Value</label>
                  <input
                    type="text"
                    value={extraAttrVal}
                    onChange={(e) => setExtraAttrVal(e.target.value)}
                    className="w-full text-xs bg-sand-50 border border-sand-200 rounded-xl p-2.5 font-semibold text-ink-950"
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-sand-100 text-ink-950 rounded-xl text-xs font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-leaf-600 text-white rounded-xl text-xs font-extrabold hover:bg-leaf-700">Onboard Farm</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
