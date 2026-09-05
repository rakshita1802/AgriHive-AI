// ================= Feature Registry =================
function RegistryTab({ api, notify, selectedFarmId }) {
  const [entries, setEntries] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try { const q = statusFilter ? "?status=" + statusFilter : ""; setEntries(await api("/feature-registry" + q)); }
    catch (err) { notify(err.message, "error"); }
  }, [api, notify, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const seed = async () => { setBusy(true); try { await api("/feature-registry/seed", { method: "POST" }); notify("Catalog initialized."); load(); } catch (err) { notify(err.message, "error"); } finally { setBusy(false); } };
  const refresh = async () => { setBusy(true); try { await api("/feature-registry/refresh", { method: "POST" }); notify("Availability and quality recalculated."); load(); } catch (err) { notify(err.message, "error"); } finally { setBusy(false); } };
  const discover = async () => {
    if (!selectedFarmId) { notify("Select a farm first.", "error"); return; }
    setBusy(true);
    try { const found = await api("/feature-registry/discover/" + selectedFarmId, { method: "POST" }); notify(found.length ? "New attributes found: " + found.join(", ") : "Nothing new for this farm."); load(); }
    catch (err) { notify(err.message, "error"); } finally { setBusy(false); }
  };
  const setStatus = async (name, status) => {
    try { await api("/feature-registry/" + encodeURIComponent(name), { method: "PATCH", body: JSON.stringify({ status }) }); load(); }
    catch (err) { notify(err.message, "error"); }
  };

  const statusCounts = useMemo(() => {
    const c = { GLOBAL: 0, LOCAL: 0, CANDIDATE: 0, EXCLUDED: 0 };
    entries.forEach(e => { c[e.status] = (c[e.status] || 0) + 1; });
    return c;
  }, [entries]);

  return (
    <Card title="Feature catalog" subtitle="Every variable tracked, where it comes from, and whether it's usable"
      actions={<>
        <Button variant="secondary" onClick={seed} disabled={busy}>Initialize</Button>
        <Button variant="secondary" onClick={refresh} disabled={busy} icon={<IconRefresh className="w-4 h-4" />}>Refresh</Button>
        <Button onClick={discover} disabled={busy}>Scan selected farm</Button>
      </>}>
      <div className="flex flex-wrap gap-3 mb-4">
        {Object.entries(statusCounts).map(([k, v]) => (
          <div key={k} className="flex items-center gap-2 bg-sand-50 border border-sand-100 rounded-lg px-3 py-1.5"><Badge>{k}</Badge><span className="text-sm font-mono">{v}</span></div>
        ))}
        <select className={inputCls + " w-40 ml-auto"} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option><option value="GLOBAL">GLOBAL</option><option value="LOCAL">LOCAL</option><option value="CANDIDATE">CANDIDATE</option><option value="EXCLUDED">EXCLUDED</option>
        </select>
      </div>
      <div className="overflow-x-auto max-h-[28rem] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white"><tr className="text-left text-xs uppercase tracking-wide text-ink-950/40 border-b border-sand-100">
            <th className="py-2 pr-3">Feature</th><th className="py-2 pr-3">Source</th><th className="py-2 pr-3">Unit</th><th className="py-2 pr-3">Status</th><th className="py-2 pr-3">Availability</th><th className="py-2 pr-3">Quality</th><th className="py-2 pr-3">Used for</th><th className="py-2 pr-3"></th>
          </tr></thead>
          <tbody>{entries.map(e => (
            <tr key={e.id} className="border-b border-sand-50 hover:bg-sand-50">
              <td className="py-2 pr-3 font-semibold">{e.feature_name}</td>
              <td className="py-2 pr-3 text-ink-950/60">{e.source}</td>
              <td className="py-2 pr-3 text-ink-950/60">{e.unit || "—"}</td>
              <td className="py-2 pr-3"><Badge>{e.status}</Badge></td>
              <td className="py-2 pr-3 font-mono">{e.availability != null ? (e.availability * 100).toFixed(0) + "%" : "—"}</td>
              <td className="py-2 pr-3 font-mono">{e.quality != null ? (e.quality * 100).toFixed(0) + "%" : "—"}</td>
              <td className="py-2 pr-3 text-xs text-ink-950/50">{e.required_for || "—"}</td>
              <td className="py-2 pr-3">
                <select className="text-xs border border-sand-200 rounded-lg px-1.5 py-0.5 bg-white" value={e.status} onChange={ev => setStatus(e.feature_name, ev.target.value)}>
                  <option value="GLOBAL">GLOBAL</option><option value="LOCAL">LOCAL</option><option value="CANDIDATE">CANDIDATE</option><option value="EXCLUDED">EXCLUDED</option>
                </select>
              </td>
            </tr>
          ))}</tbody>
        </table>
        {entries.length === 0 && <p className="text-sm text-ink-950/35 text-center py-10">Catalog is empty — click Initialize to load it.</p>}
      </div>
    </Card>
  );
}
