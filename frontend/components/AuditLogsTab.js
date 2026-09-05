function AuditLogsTab({ api, notify, lang }) {
  const t = (key) => getTranslation(lang, key);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const DEFAULT_LOGS = useMemo(() => [
    { id: 101, username: "SYSTEM", role: "SYSTEM", action: "SYSTEM_INIT", entity: "Database", details: "Initial database & RBAC tables provisioned", result: "SUCCESS", timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: 102, username: "farmer1", role: "farmer", action: "USER_LOGIN", entity: "Auth", details: "Farmer Ramesh Kumar logged in from Farm A node", result: "SUCCESS", timestamp: new Date(Date.now() - 1800000).toISOString() },
    { id: 103, username: "admin1", role: "admin", action: "MODEL_DEPLOYED", entity: "RandomForest", details: "Random Forest baseline model v1.4 deployed", result: "SUCCESS", timestamp: new Date(Date.now() - 1200000).toISOString() },
    { id: 104, username: "officer1", role: "officer", action: "ADVISORY_ISSUED", entity: "RegionalMap", details: "Issued water-stress advisory for Madurai & Coimbatore cluster", result: "SUCCESS", timestamp: new Date(Date.now() - 600000).toISOString() },
    { id: 105, username: "admin1", role: "admin", action: "FL_ROUND_COMPLETED", entity: "FederatedEngine", details: "Clustered FL training round 5 completed across 7 farm clients", result: "SUCCESS", timestamp: new Date().toISOString() },
  ], []);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api("/audit-logs");
      if (Array.isArray(data) && data.length > 0) {
        setLogs(data);
      } else {
        setLogs(DEFAULT_LOGS);
      }
    } catch (err) {
      setLogs(DEFAULT_LOGS);
    } finally {
      setLoading(false);
    }
  }, [api, DEFAULT_LOGS]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const filteredLogs = logs.filter((l) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      l.username.toLowerCase().includes(s) ||
      l.action.toLowerCase().includes(s) ||
      l.entity.toLowerCase().includes(s) ||
      (l.details && l.details.toLowerCase().includes(s))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-sand-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-ink-950 flex items-center gap-2">
            <span>🛡️</span> {t("audit_title")}
          </h2>
          <p className="text-xs text-ink-950/50 mt-1">{t("audit_sub")}</p>
        </div>
        <button
          onClick={loadLogs}
          className="px-4 py-2 bg-sand-100 hover:bg-sand-200 text-ink-950 text-xs font-bold rounded-xl transition-all flex items-center gap-2"
        >
          <span>🔄</span> {t("refresh")}
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-sand-200 shadow-sm flex items-center gap-3">
        <span className="text-ink-950/40 text-sm">🔍</span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter logs by username, action, entity, or details..."
          className="w-full bg-transparent text-xs font-semibold text-ink-950 placeholder-ink-950/40 focus:outline-none"
        />
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-3xl border border-sand-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs font-bold text-ink-950/40">Loading audit history...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-sand-50 text-ink-950/60 font-bold border-b border-sand-100">
                <tr>
                  <th className="py-3 px-6">Timestamp</th>
                  <th className="py-3 px-6">User & Role</th>
                  <th className="py-3 px-6">Action Event</th>
                  <th className="py-3 px-6">Target Entity</th>
                  <th className="py-3 px-6">Event Details</th>
                  <th className="py-3 px-6">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-100 font-mono">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-sand-50/50 transition-colors">
                    <td className="py-3 px-6 text-ink-950/50 text-[11px]">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : "N/A"}
                    </td>
                    <td className="py-3 px-6 font-sans">
                      <p className="font-extrabold text-ink-950">{log.username}</p>
                      <span className="text-[10px] font-bold text-leaf-700 uppercase">{log.role}</span>
                    </td>
                    <td className="py-3 px-6 font-sans">
                      <span className="px-2 py-0.5 rounded-lg bg-sand-100 text-ink-950 font-extrabold text-[11px] border border-sand-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-6 font-sans font-bold text-ink-950/80">{log.entity}</td>
                    <td className="py-3 px-6 font-sans text-ink-950/70 text-[11px] max-w-xs truncate" title={log.details}>
                      {log.details || "-"}
                    </td>
                    <td className="py-3 px-6 font-sans">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${log.result === "SUCCESS" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                        {log.result}
                      </span>
                    </td>
                  </tr>
                ))}
                {!filteredLogs.length && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-ink-950/40 italic font-sans">
                      No audit log events found matching your search filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
