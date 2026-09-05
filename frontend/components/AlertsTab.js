// ================= Alerts Tab =================
function AlertsTab({ api }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/alerts")
      .then(setAlerts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [api]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-ink-950">Regional & Farm Risk Alerts</h2>
        <p className="text-xs text-ink-950/50">Proactive alerts triggered by weather forecasts and regional federated patterns</p>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-sand-200 space-y-4">
        {loading ? (
          <div className="text-xs text-ink-950/50 italic py-6 text-center">Loading alerts feed...</div>
        ) : (
          alerts.map((a) => (
            <div key={a.id} className="p-4 rounded-xl bg-sand-50 border border-sand-100 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${a.level === "high" ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"}`}>
                  <IconBell className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-ink-950">{a.title}</span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${a.level === "high" ? "bg-rose-600 text-white" : "bg-amber-500 text-white"}`}>
                      {a.category}
                    </span>
                  </div>
                  <p className="text-xs text-ink-950/60 mt-1">Detected across regional farm network. Recommended action: inspect leaf wetness and irrigation schedule.</p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-ink-950/40 shrink-0">{a.time_ago}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
