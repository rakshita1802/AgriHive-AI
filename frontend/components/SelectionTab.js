// ================= Feature Selection =================
const STEPS = [
  { key: "domain", label: "Relevance" }, { key: "quality", label: "Quality" }, { key: "leakage", label: "Leakage" }, { key: "redundancy", label: "Redundancy" }, { key: "model", label: "Model fit" },
];
function StepTracker({ decision }) {
  const state = (key) => {
    if (!decision) return "pending";
    if (key === "domain") return decision.domain_relevant === false ? "fail" : "pass";
    if (key === "quality") return decision.quality_passed === false ? "fail" : "pass";
    if (key === "leakage") return decision.leakage_safe === false ? "fail" : "pass";
    if (key === "redundancy") return decision.redundancy_flag ? "fail" : "pass";
    if (key === "model") return decision.final_status === "KEEP" ? "pass" : "neutral";
    return "pending";
  };
  return (
    <div className="flex items-center gap-1.5">
      {STEPS.map(s => {
        const st = state(s.key);
        const dot = st === "pass" ? "bg-leaf-600" : st === "fail" ? "bg-rose-600" : "bg-sand-200";
        return <div key={s.key} className={`w-2.5 h-2.5 rounded-full ${dot}`} title={s.label}></div>;
      })}
    </div>
  );
}
function SelectionTab({ api, notify, farms }) {
  const [runs, setRuns] = useState([]);
  const [activeRun, setActiveRun] = useState(null);
  const [busy, setBusy] = useState(false);
  const [scopeFarms, setScopeFarms] = useState([]);
  const [notes, setNotes] = useState("");

  const loadRuns = useCallback(async () => {
    try { const data = await api("/feature-selection/runs"); setRuns(data); if (data.length && !activeRun) setActiveRun(data[0]); }
    catch (err) { notify(err.message, "error"); }
  }, [api, notify]);

  useEffect(() => { loadRuns(); }, [loadRuns]);

  const runEngine = async () => {
    setBusy(true);
    try {
      const payload = { farm_ids: scopeFarms.length ? scopeFarms : null, notes: notes || null };
      const result = await api("/feature-selection/run", { method: "POST", body: JSON.stringify(payload) });
      notify("Run complete — best fit " + (result.best_model_f1 != null ? (result.best_model_f1 * 100).toFixed(0) + "%" : "n/a"));
      setActiveRun(result); loadRuns();
    } catch (err) { notify(err.message, "error"); } finally { setBusy(false); }
  };

  const toggleScope = (id) => setScopeFarms(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const keepCount = activeRun ? activeRun.decisions.filter(d => d.final_status === "KEEP").length : 0;
  const excludeCount = activeRun ? activeRun.decisions.filter(d => d.final_status !== "KEEP").length : 0;

  return (
    <div className="space-y-5">
      <Card title="Run feature selection" subtitle="Checks relevance, data quality, leakage risk, redundancy, and model fit"
        actions={<Button onClick={runEngine} disabled={busy} icon={<IconFilter className="w-4 h-4" />}>{busy ? "Running…" : "Run"}</Button>}>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wide text-ink-950/40 mb-1">Scope (optional — default all farms)</span>
            <div className="flex flex-wrap gap-1.5">
              {farms.map(f => <button key={f.id} onClick={() => toggleScope(f.id)} className={`text-xs px-2.5 py-1 rounded-full border ${scopeFarms.includes(f.id) ? "bg-ink-950 text-white border-ink-950" : "bg-white border-sand-200 text-ink-950/60"}`}>{f.name}</button>)}
            </div>
          </div>
          <Field label="Notes"><input className={inputCls + " w-64"} value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. after onboarding new farm" /></Field>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div className="lg:col-span-1">
          <Card title="Runs" subtitle={runs.length + " total"}>
            <div className="space-y-1.5 max-h-[32rem] overflow-y-auto">
              {runs.map(r => (
                <button key={r.id} onClick={() => setActiveRun(r)} className={`w-full text-left px-3 py-2 rounded-lg text-sm border ${activeRun && activeRun.id === r.id ? "bg-leaf-100 border-leaf-500" : "border-sand-100 hover:bg-sand-50"}`}>
                  <div className="flex justify-between items-center"><span className="font-mono text-xs">#{r.id}</span>{r.best_model_f1 != null && <span className="font-mono text-xs text-leaf-700">{(r.best_model_f1 * 100).toFixed(0)}%</span>}</div>
                  <div className="text-xs text-ink-950/40 mt-0.5">{new Date(r.created_at).toLocaleString()}</div>
                </button>
              ))}
              {runs.length === 0 && <p className="text-sm text-ink-950/35 text-center py-8">No runs yet.</p>}
            </div>
          </Card>
        </div>
        <div className="lg:col-span-3 space-y-5">
          {activeRun ? (<>
            <Card title={"Run #" + activeRun.id} subtitle={activeRun.notes || "All tracked farms"}>
              <div className="flex items-center gap-6 mb-1">
                <div className="flex items-center gap-2"><Badge tone="ok">KEEP</Badge><span className="font-mono text-sm">{keepCount}</span></div>
                <div className="flex items-center gap-2"><Badge tone="error">EXCLUDE</Badge><span className="font-mono text-sm">{excludeCount}</span></div>
                {activeRun.best_model_f1 != null && <div className="ml-auto text-sm text-ink-950/60">Best fit score: <span className="font-mono font-bold text-leaf-700">{(activeRun.best_model_f1 * 100).toFixed(0)}%</span></div>}
              </div>
            </Card>
            <Card title="Feature-by-feature results">
              <div className="space-y-3 max-h-[30rem] overflow-y-auto pr-1">
                {activeRun.decisions.map(d => (
                  <div key={d.id} className="border border-sand-100 rounded-xl p-3.5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2"><span className="font-semibold text-sm">{d.feature_name}</span><Badge tone={d.final_status === "KEEP" ? "ok" : "error"}>{d.final_status}</Badge></div>
                      <StepTracker decision={d} />
                    </div>
                    {d.reason_summary && <p className="text-xs text-ink-950/55">{d.reason_summary}</p>}
                    {d.redundant_with && <p className="text-xs text-sky-600 mt-1">Overlaps with: {d.redundant_with}</p>}
                  </div>
                ))}
                {activeRun.decisions.length === 0 && <p className="text-sm text-ink-950/35 text-center py-8">No results for this run.</p>}
              </div>
            </Card>
          </>) : <Card><p className="text-sm text-ink-950/35 text-center py-16">Run the engine, or pick a past run, to see results.</p></Card>}
        </div>
      </div>
    </div>
  );
}
