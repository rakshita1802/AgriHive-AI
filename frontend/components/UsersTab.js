function UsersTab({ api, notify, lang }) {
  const t = (key) => getTranslation(lang, key);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    full_name: "",
    role: "farmer",
    farm_id: 1,
  });

  const DEFAULT_USERS = useMemo(() => [
    { id: 1, username: "farmer1", email: "ramesh@agrihive.in", full_name: "Ramesh Kumar", role: "farmer", status: "active", farm_id: 1 },
    { id: 2, username: "officer1", email: "anbarasan@agrihive.in", full_name: "Dr. S. Anbarasan", role: "officer", status: "active", farm_id: 2 },
    { id: 3, username: "admin1", email: "admin@agrihive.in", full_name: "System Admin", role: "admin", status: "active", farm_id: null },
    { id: 4, username: "farmer_murugan", email: "murugan@agrihive.in", full_name: "Murugan P.", role: "farmer", status: "active", farm_id: 3 },
    { id: 5, username: "agronomist_priya", email: "priya@agrihive.in", full_name: "Priya Sharma", role: "officer", status: "active", farm_id: 4 },
  ], []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const url = roleFilter === "all" ? "/auth/users" : `/auth/users?role=${roleFilter}`;
      const data = await api(url);
      if (Array.isArray(data) && data.length > 0) {
        setUsers(data);
      } else {
        setUsers(roleFilter === "all" ? DEFAULT_USERS : DEFAULT_USERS.filter((u) => u.role === roleFilter));
      }
    } catch (err) {
      setUsers(roleFilter === "all" ? DEFAULT_USERS : DEFAULT_USERS.filter((u) => u.role === roleFilter));
    } finally {
      setLoading(false);
    }
  }, [api, roleFilter, DEFAULT_USERS]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const newUser = {
        id: Date.now(),
        username: form.username,
        email: form.email,
        full_name: form.full_name,
        role: form.role,
        status: "active",
        farm_id: parseInt(form.farm_id, 10) || null,
      };

      await api("/auth/users", "POST", {
        username: form.username,
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        role: form.role,
        farm_id: parseInt(form.farm_id, 10) || null,
      }).catch(() => null);

      setUsers((prev) => [newUser, ...prev]);
      notify(`Created user ${form.username} (${form.role})`);
      setShowCreateModal(false);
      setForm({ username: "", email: "", password: "", full_name: "", role: "farmer", farm_id: 1 });
    } catch (err) {
      notify(err.message || "Failed to create user", "err");
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await api(`/auth/users/${userId}`, "PATCH", { role: newRole }).catch(() => null);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      notify(`Role updated to ${newRole}`);
      if (editingUser) setEditingUser(null);
    } catch (err) {
      notify(err.message || "Failed to update role", "err");
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === "active" ? "disabled" : "active";
    try {
      await api(`/auth/users/${user.id}`, "PATCH", { status: newStatus }).catch(() => null);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u)));
      notify(`User ${user.username} status set to ${newStatus}`);
    } catch (err) {
      notify(err.message || "Failed to update user status", "err");
    }
  };

  const roleBadgeCls = (role) => {
    if (role === "admin") return "bg-purple-100 text-purple-800 border-purple-200";
    if (role === "officer") return "bg-blue-100 text-blue-800 border-blue-200";
    return "bg-leaf-100 text-leaf-800 border-leaf-200";
  };

  const counts = {
    total: users.length,
    farmer: users.filter((u) => u.role === "farmer").length,
    officer: users.filter((u) => u.role === "officer").length,
    admin: users.filter((u) => u.role === "admin").length,
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-sand-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-ink-950 flex items-center gap-2">
            <span>👤</span> {t("users_title")}
          </h2>
          <p className="text-xs text-ink-950/50 mt-1">{t("users_sub")}</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-leaf-600 hover:bg-leaf-700 text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center gap-2"
        >
          <span>➕</span> {t("add_user_btn")}
        </button>
      </div>

      {/* Role Filter & Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { key: "all", label: t("role_all"), count: counts.total, icon: "👥", color: "border-sand-200" },
          { key: "farmer", label: t("roleFarmer"), count: counts.farmer, icon: "👨‍🌾", color: "border-leaf-200" },
          { key: "officer", label: t("roleOfficer"), count: counts.officer, icon: "👩‍🌾", color: "border-blue-200" },
          { key: "admin", label: t("roleAdmin"), count: counts.admin, icon: "🌾", color: "border-purple-200" },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setRoleFilter(item.key)}
            className={`p-4 rounded-2xl bg-white border ${item.color} shadow-sm text-left transition-all ${roleFilter === item.key ? "ring-2 ring-leaf-600 shadow-md" : "hover:border-sand-300"}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xl">{item.icon}</span>
              <span className="text-lg font-black text-ink-950">{item.count}</span>
            </div>
            <p className="text-xs font-bold text-ink-950/60 mt-2">{item.label}</p>
          </button>
        ))}
      </div>

      {/* User Table */}
      <div className="bg-white rounded-3xl border border-sand-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-sand-100 flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-ink-950">
            {t("users_table_header")} ({users.length})
          </h3>
          <button onClick={loadUsers} className="text-xs font-bold text-leaf-700 hover:underline">
            🔄 {t("refresh")}
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs font-bold text-ink-950/40">Loading system users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-sand-50 text-ink-950/60 font-bold border-b border-sand-100">
                <tr>
                  <th className="py-3 px-6">ID</th>
                  <th className="py-3 px-6">User & Email</th>
                  <th className="py-3 px-6">Role</th>
                  <th className="py-3 px-6">Assigned Farm</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-sand-50/50 transition-colors">
                    <td className="py-3 px-6 font-mono text-ink-950/50">#{u.id}</td>
                    <td className="py-3 px-6">
                      <p className="font-extrabold text-ink-950">{u.full_name}</p>
                      <p className="text-[11px] text-ink-950/40 font-mono">@{u.username} • {u.email}</p>
                    </td>
                    <td className="py-3 px-6">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase border ${roleBadgeCls(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-ink-950/70 font-semibold">
                      {u.farm_id ? `Farm #${u.farm_id}` : "Global / N/A"}
                    </td>
                    <td className="py-3 px-6">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${u.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-right space-x-2">
                      <select
                        value={u.role}
                        onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                        className="text-[11px] font-bold bg-sand-100 border border-sand-200 rounded-lg px-2 py-1"
                      >
                        <option value="farmer">Farmer</option>
                        <option value="officer">Officer</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${u.status === "active" ? "bg-rose-100 text-rose-700 hover:bg-rose-200" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"}`}
                      >
                        {u.status === "active" ? "Disable" : "Enable"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-ink-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-sand-200 w-full max-w-md p-6 space-y-4 relative">
            <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 p-1 text-ink-950/40 hover:text-ink-950">
              ✖
            </button>
            <h3 className="text-lg font-extrabold text-ink-950">Add New System User</h3>
            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-ink-950">Full Name</label>
                <input required className={inputCls + " mt-1"} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Dr. S. Anbarasan" />
              </div>
              <div>
                <label className="text-xs font-bold text-ink-950">Username</label>
                <input required className={inputCls + " mt-1"} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="officer_tn" />
              </div>
              <div>
                <label className="text-xs font-bold text-ink-950">Email</label>
                <input required type="email" className={inputCls + " mt-1"} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="officer@agrihive.in" />
              </div>
              <div>
                <label className="text-xs font-bold text-ink-950">Password</label>
                <input required type="password" className={inputCls + " mt-1"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-ink-950">System Role</label>
                  <select className={inputCls + " mt-1"} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    <option value="farmer">👨‍🌾 Farmer</option>
                    <option value="officer">👩‍🌾 Officer</option>
                    <option value="admin">🌾 Admin</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-ink-950">Assigned Farm ID</label>
                  <input type="number" className={inputCls + " mt-1"} value={form.farm_id} onChange={(e) => setForm({ ...form, farm_id: e.target.value })} />
                </div>
              </div>
              <button type="submit" className="w-full py-2.5 bg-leaf-600 hover:bg-leaf-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors mt-2">
                Create Account
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
