// ================= Ingestion =================
function IngestionTab({ api, notify, farms, selectedFarmId, setSelectedFarmId }) {
  const [runs, setRuns] = useState([]);
  const [weather, setWeather] = useState([]);
  const [soil, setSoil] = useState([]);
  const [busy, setBusy] = useState(false);
  const [historyDays, setHistoryDays] = useState(60);
  const [forecastDays, setForecastDays] = useState(7);

  const loadRecords = useCallback(async (farmId) => {
    if (!farmId) return;
    try {
      const [w, s] = await Promise.all([api("/ingestion/weather/" + farmId), api("/ingestion/soil/" + farmId)]);
      setWeather(w); setSoil(s);
    } catch (err) { notify(err.message, "error"); }
  }, [api, notify]);

  useEffect(() => { loadRecords(selectedFarmId); }, [selectedFarmId, loadRecords]);

  const runAll = async () => {
    if (!selectedFarmId) { notify("Select a farm first.", "error"); return; }
    setBusy(true);
    try {
      const result = await api(`/ingestion/farm/${selectedFarmId}/all?history_days=${historyDays}&forecast_days=${forecastDays}`, { method: "POST" });
      setRuns(result);
      notify("Data pulled: " + result.map(r => r.source + " (" + r.status + ")").join(", "));
      loadRecords(selectedFarmId);
    } catch (err) { notify(err.message, "error"); } finally { setBusy(false); }
  };

  const runOne = async (kind) => {
    if (!selectedFarmId) { notify("Select a farm first.", "error"); return; }
    setBusy(true);
    try {
      let path, payload;
      if (kind === "historical") {
        const end = new Date(); const start = new Date(); start.setDate(end.getDate() - historyDays);
        path = "/ingestion/weather/historical";
        payload = { farm_id: selectedFarmId, start_date: start.toISOString().slice(0,10), end_date: end.toISOString().slice(0,10) };
      } else if (kind === "forecast") {
        path = "/ingestion/weather/forecast"; payload = { farm_id: selectedFarmId, forecast_days: forecastDays };
      } else { path = "/ingestion/soil"; payload = { farm_id: selectedFarmId, depth: "0-5cm" }; }
      const result = await api(path, { method: "POST", body: JSON.stringify(payload) });
      setRuns(prev => [result, ...prev]);
      notify(kind + " data pulled — " + result.status);
      loadRecords(selectedFarmId);
    } catch (err) { notify(err.message, "error"); } finally { setBusy(false); }
  };

  const farm = farms.find(f => f.id === selectedFarmId);

  return (
    <div className="space-y-5">
      <Card title="Pull field data" subtitle="Weather and soil, from live public data sources"
        actions={<Button onClick={runAll} disabled={busy || !selectedFarmId} icon={<IconCloud className="w-4 h-4" />}>{busy ? "Pulling…" : "Pull everything"}</Button>}>
        <div className="flex flex-wrap items-end gap-4">
          <Field label="Farm">
            <select className={inputCls} value={selectedFarmId || ""} onChange={e => setSelectedFarmId(Number(e.target.value))}>
              <option value="">— select —</option>
              {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </Field>
          <Field label="History (days)"><input type="number" className={inputCls + " w-28"} value={historyDays} onChange={e => setHistoryDays(Number(e.target.value))} /></Field>
          <Field label="Forecast (days)"><input type="number" className={inputCls + " w-28"} value={forecastDays} onChange={e => setForecastDays(Number(e.target.value))} /></Field>
          <div className="flex gap-2 pb-0.5">
            <Button variant="secondary" onClick={() => runOne("historical")} disabled={busy || !selectedFarmId}>Historical weather</Button>
            <Button variant="secondary" onClick={() => runOne("forecast")} disabled={busy || !selectedFarmId}>Forecast</Button>
            <Button variant="secondary" onClick={() => runOne("soil")} disabled={busy || !selectedFarmId}>Soil</Button>
          </div>
        </div>
        {farm && farm.extra_attributes_json && (
          <p className="mt-3 text-xs text-sky-600 bg-sky-100 inline-block px-2.5 py-1 rounded-lg">
            This farm has a custom attribute — check the feature catalog to see it get picked up.
          </p>
        )}
        {runs.length > 0 && (
          <div className="mt-4 border-t border-sand-100 pt-3 flex flex-wrap gap-2">
            {runs.slice(0, 8).map(r => (
              <span key={r.id} className="text-xs bg-sand-50 border border-sand-100 rounded-lg px-2.5 py-1 font-mono flex items-center gap-1.5">{r.source} <Badge tone={r.status === "success" ? "ok" : "error"}>{r.status}</Badge></span>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card title="Weather records" subtitle={weather.length + " rows"}>
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-white"><tr className="text-left text-ink-950/40 border-b border-sand-100"><th className="py-1.5 pr-2">Date</th><th className="py-1.5 pr-2">Source</th><th className="py-1.5 pr-2">Temp °C</th><th className="py-1.5 pr-2">Rain mm</th><th className="py-1.5 pr-2">RH %</th></tr></thead>
              <tbody>{weather.map(w => (
                <tr key={w.id} className="border-b border-sand-50">
                  <td className="py-1 pr-2 font-mono">{w.record_date}</td><td className="py-1 pr-2">{w.source}</td>
                  <td className="py-1 pr-2">{w.temperature_c ?? "—"}</td><td className="py-1 pr-2">{w.rainfall_mm ?? "—"}</td><td className="py-1 pr-2">{w.relative_humidity_pct ?? "—"}</td>
                </tr>
              ))}</tbody>
            </table>
            {weather.length === 0 && <p className="text-sm text-ink-950/35 text-center py-8">No weather data yet for this farm.</p>}
          </div>
        </Card>
        <Card title="Soil records" subtitle={soil.length + " rows"}>
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-white"><tr className="text-left text-ink-950/40 border-b border-sand-100"><th className="py-1.5 pr-2">Source</th><th className="py-1.5 pr-2">Depth</th><th className="py-1.5 pr-2">pH</th><th className="py-1.5 pr-2">Clay %</th><th className="py-1.5 pr-2">Sand %</th></tr></thead>
              <tbody>{soil.map(s => (
                <tr key={s.id} className="border-b border-sand-50"><td className="py-1 pr-2">{s.source}</td><td className="py-1 pr-2 font-mono">{s.depth}</td><td className="py-1 pr-2">{s.soil_ph ?? "—"}</td><td className="py-1 pr-2">{s.clay_content_pct ?? "—"}</td><td className="py-1 pr-2">{s.sand_content_pct ?? "—"}</td></tr>
              ))}</tbody>
            </table>
            {soil.length === 0 && <p className="text-sm text-ink-950/35 text-center py-8">No soil data yet for this farm.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
