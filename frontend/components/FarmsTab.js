// ================= Farms =================
function FarmsTab({ api, notify, farms, refreshFarms, selectedFarmId, setSelectedFarmId, lang = "en", currentUser }) {
  const t = (key) => getTranslation(lang, key);
  const [form, setForm] = useState({ name: "", latitude: "", longitude: "", crop: "", irrigation_method: "", soil_ph_farm_declared: "", extra_attributes_json: "" });
  const [busy, setBusy] = useState(false);

  const isAdmin = currentUser?.role === "admin";

  const submit = async (e) => {
    e.preventDefault();
    const cleanName = form.name.trim();
    if (!cleanName) return;

    if (farms.some(f => f.name.trim().toLowerCase() === cleanName.toLowerCase())) {
      notify("A farm with the name '" + cleanName + "' already exists!", "error");
      return;
    }

    setBusy(true);
    try {
      const payload = {
        name: cleanName,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        crop: form.crop || null,
        irrigation_method: form.irrigation_method || null,
        soil_ph_farm_declared: form.soil_ph_farm_declared ? parseFloat(form.soil_ph_farm_declared) : null,
        extra_attributes_json: form.extra_attributes_json || null,
      };
      await api("/farms", { method: "POST", body: JSON.stringify(payload) });
      notify("Farm '" + cleanName + "' added successfully.");
      setForm({ name: "", latitude: "", longitude: "", crop: "", irrigation_method: "", soil_ph_farm_declared: "", extra_attributes_json: "" });
      refreshFarms();
    } catch (err) { notify("Failed to add farm: " + err.message, "error"); } finally { setBusy(false); }
  };

  const remove = async (id, name) => {
    try {
      await api("/farms/" + id, { method: "DELETE" });
      notify("Farm '" + (name || id) + "' deleted successfully.");
      refreshFarms();
    } catch (err) {
      notify("Failed to delete farm: " + err.message, "error");
    }
  };

  const DISTRICT_PRESETS = [
    { name: "— Quick Select District / Region —", lat: "", lon: "" },
    { name: "Tiruchirappalli (Delta Rice Zone)", lat: 10.7905, lon: 78.7047 },
    { name: "Coimbatore (Cotton / Maize Belt)", lat: 11.0168, lon: 76.9558 },
    { name: "Madurai (Cotton / Vegetable Zone)", lat: 9.9252, lon: 78.1198 },
    { name: "Thanjavur (Delta Paddy Zone)", lat: 10.7870, lon: 79.1378 },
    { name: "Salem (Sugarcane / Tapioca Belt)", lat: 11.6643, lon: 78.1460 },
    { name: "Erode (Turmeric / Rice Region)", lat: 11.3410, lon: 77.7172 },
    { name: "Dindigul (Semi-Arid Groundnut Zone)", lat: 10.3673, lon: 77.9803 },
    { name: "Vellore (Groundnut / Sugarcane)", lat: 12.9165, lon: 79.1325 },
    { name: "Bengaluru Rural (Horticulture)", lat: 12.9716, lon: 77.5946 },
  ];

  const useCurrentGps = () => {
    if (!navigator.geolocation) {
      notify("GPS Geolocation is not supported by your browser.", "error");
      return;
    }
    notify("Detecting your current GPS coordinates...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(4);
        const lon = pos.coords.longitude.toFixed(4);
        setForm((prev) => ({ ...prev, latitude: lat, longitude: lon }));
        notify(`GPS Location acquired: ${lat}, ${lon}`);
      },
      (err) => {
        notify("GPS Location failed: " + err.message + ". Please pick a District preset below.", "error");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleDistrictChange = (e) => {
    const selected = DISTRICT_PRESETS.find(d => d.name === e.target.value);
    if (selected && selected.lat) {
      setForm(prev => ({ ...prev, latitude: selected.lat, longitude: selected.lon }));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
      {/* Hide Add Farm creation form for Administrators */}
      {!isAdmin && (
        <div className="lg:col-span-2">
          <Card title="Add a farm" subtitle="Location and crop details">
            <form onSubmit={submit} className="space-y-3">
              <Field label="Farm Name"><input required className={inputCls} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Green Valley Farm" /></Field>
              
              {/* Convenient Location Helpers */}
              <div className="p-3 bg-sand-50 rounded-xl border border-sand-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-ink-950">Location Selection</span>
                  <button
                    type="button"
                    onClick={useCurrentGps}
                    className="px-2.5 py-1 bg-leaf-600 hover:bg-leaf-700 text-white text-[11px] font-extrabold rounded-lg flex items-center gap-1 transition-colors shadow-sm"
                  >
                    📍 Use My Current Location (GPS)
                  </button>
                </div>

                <div>
                  <select
                    onChange={handleDistrictChange}
                    className="w-full text-xs font-semibold bg-white border border-sand-200 rounded-lg p-2 text-ink-950"
                  >
                    {DISTRICT_PRESETS.map((d, i) => (
                      <option key={i} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Latitude"><input required type="number" step="any" className={inputCls} value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} placeholder="11.65" /></Field>
                <Field label="Longitude"><input required type="number" step="any" className={inputCls} value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} placeholder="78.15" /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Crop"><input className={inputCls} value={form.crop} onChange={e => setForm({ ...form, crop: e.target.value })} placeholder="Rice" /></Field>
                <Field label="Irrigation"><input className={inputCls} value={form.irrigation_method} onChange={e => setForm({ ...form, irrigation_method: e.target.value })} placeholder="Drip" /></Field>
              </div>
              <Field label="Declared soil pH"><input type="number" step="any" className={inputCls} value={form.soil_ph_farm_declared} onChange={e => setForm({ ...form, soil_ph_farm_declared: e.target.value })} placeholder="6.5" /></Field>
              <Field label="Extra attribute (optional, JSON)"><input className={inputCls + " font-mono"} value={form.extra_attributes_json} onChange={e => setForm({ ...form, extra_attributes_json: e.target.value })} placeholder='{"canopy_temp_c": 28.4}' /></Field>
              <Button type="submit" disabled={busy} icon={<IconPlus className="w-4 h-4" />}>{busy ? "Adding…" : "Add farm"}</Button>
            </form>
          </Card>
        </div>
      )}

      {/* Regional Farm Network Table (Full Width for Admin) */}
      <div className={isAdmin ? "lg:col-span-5" : "lg:col-span-3"}>
        <Card title="Regional Farm Network & Nodes" subtitle={farms.length + " participating farms in federated network"}>
          {farms.length === 0 ? <p className="text-sm text-ink-950/40 py-10 text-center">No farms registered yet in system.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs uppercase tracking-wide text-ink-950/40 border-b border-sand-100">
                  <th className="py-2 pr-3">Node Status</th>
                  <th className="py-2 pr-3">Farm Name</th>
                  <th className="py-2 pr-3">Crop</th>
                  <th className="py-2 pr-3">Irrigation</th>
                  <th className="py-2 pr-3">Coordinates</th>
                  <th className="py-2 pr-3"></th>
                </tr></thead>
                <tbody>
                  {farms.map(f => {
                    const isActive = selectedFarmId === f.id;
                    return (
                      <tr key={f.id} onClick={() => setSelectedFarmId(f.id)} className={`border-b border-sand-50 last:border-0 cursor-pointer ${isActive ? "bg-leaf-100/60" : "hover:bg-sand-50"}`}>
                        <td className="py-2.5 pr-3">
                          {isActive ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-leaf-600 text-white">ACTIVE NODE</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sand-200 text-ink-950/60">PEER FARM</span>
                          )}
                        </td>
                        <td className="py-2.5 pr-3 font-bold text-ink-950">{f.name}</td>
                        <td className="py-2.5 pr-3">{f.crop || "—"}</td>
                        <td className="py-2.5 pr-3">{f.irrigation_method || "—"}</td>
                        <td className="py-2.5 pr-3 font-mono text-xs text-ink-950/50">{f.latitude.toFixed(2)}, {f.longitude.toFixed(2)}</td>
                        <td className="py-2.5 pr-3 text-right"><button onClick={(e) => { e.stopPropagation(); remove(f.id, f.name); }} className="text-rose-600 hover:bg-rose-100 p-1.5 rounded-lg transition-colors" title="Delete Farm Node"><IconTrash className="w-4 h-4" /></button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
