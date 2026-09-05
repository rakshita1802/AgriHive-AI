function LoginModal({ onLogin, onClose, lang, apiBase }) {
  const t = (key) => getTranslation(lang, key);
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({
    username: "farmer1",
    password: "farmer123",
    fullName: "",
    role: "farmer"
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr("");

    try {
      const endpoint = isRegister ? "/auth/register" : "/auth/login";
      const payload = isRegister
        ? {
            username: form.username,
            email: form.username.includes("@") ? form.username : `${form.username}@agrihive.in`,
            password: form.password,
            full_name: form.fullName || form.username,
            role: form.role
          }
        : { username: form.username, password: form.password };

      const res = await fetch(apiBase + endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setErr(data.detail || "Authentication failed. Please check your username and password.");
        setLoading(false);
        return;
      }

      if (data.access_token) {
        localStorage.setItem("agri_token", data.access_token);
      }
      onLogin(data.user);
    } catch (error) {
      setErr(error.message || "Authentication error.");
    } finally {
      setLoading(false);
    }
  };

  const loginDemo = async (role) => {
    let username = "farmer1";
    let password = "farmer123";
    if (role === "admin") { username = "admin1"; password = "admin123"; }
    if (role === "officer") { username = "officer1"; password = "officer123"; }

    setForm({ username, password, fullName: "", role });
    setErr("");
    setLoading(true);
    try {
      const res = await fetch(apiBase + "/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        if (data.access_token) localStorage.setItem("agri_token", data.access_token);
        onLogin(data.user);
      } else {
        setErr("Invalid demo credentials.");
      }
    } catch (e) {
      setErr("Failed to connect to authentication server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-sand-200 w-full max-w-md p-6 space-y-5 relative">
        {onClose && (
          <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full text-ink-950/40 hover:text-ink-950 hover:bg-sand-100 transition-colors">
            <IconX className="w-5 h-5" />
          </button>
        )}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-leaf-600 text-white flex items-center justify-center mx-auto shadow-md">
            <IconSprout className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-ink-950 mt-2">
            {isRegister ? "Create AgriHive Account" : t("loginTitle")}
          </h2>
          <p className="text-xs text-ink-950/50 leading-relaxed">
            {isRegister ? "Register with valid email ID and password" : t("loginSub")}
          </p>
        </div>

        {err && (
          <div className="p-3 bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl text-center">
            {err}
          </div>
        )}

        <form onSubmit={submit} className="space-y-3.5">
          {isRegister && (
            <div>
              <label className="text-xs font-bold text-ink-950">Full Name</label>
              <input required className={inputCls + " mt-1"} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="e.g. Ramesh Kumar" />
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-ink-950">Email Address / Username</label>
            <input required type="text" className={inputCls + " mt-1"} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="farmer1 or farmer@agrihive.com" />
          </div>

          <div>
            <label className="text-xs font-bold text-ink-950">{t("password")}</label>
            <input required type="password" className={inputCls + " mt-1"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
          </div>

          <div>
            <label className="text-xs font-bold text-ink-950">{t("selectRole")}</label>
            <select className={inputCls + " mt-1"} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="farmer">👨‍🌾 {t("roleFarmer")}</option>
              <option value="officer">👩‍🌾 {t("roleOfficer")}</option>
              <option value="admin">🌾 {t("roleAdmin")}</option>
            </select>
          </div>

          <button type="submit" disabled={loading} className="w-full py-2.5 bg-leaf-600 hover:bg-leaf-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors">
            {loading ? "Authenticating..." : isRegister ? t("createAccountBtn") : t("signIn")}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-sand-100 space-y-2">
          <button onClick={() => { setIsRegister(!isRegister); setErr(""); }} className="text-xs font-bold text-leaf-700 hover:underline">
            {isRegister ? t("alreadyHaveAccount") : t("noAccountYet")}
          </button>

          <div className="pt-2 space-y-1.5">
            <p className="text-[11px] font-bold text-ink-950/40">{t("quickDemoLogin")}</p>
            <div className="grid grid-cols-3 gap-1.5">
              <button type="button" onClick={() => loginDemo("farmer")} className="py-1.5 px-2 bg-sand-100 hover:bg-sand-200 text-ink-950 text-[10px] font-bold rounded-lg transition-colors truncate">
                {t("loginAsFarmer")}
              </button>
              <button type="button" onClick={() => loginDemo("officer")} className="py-1.5 px-2 bg-blue-100 hover:bg-blue-200 text-blue-900 text-[10px] font-bold rounded-lg transition-colors truncate">
                {t("loginAsOfficer")}
              </button>
              <button type="button" onClick={() => loginDemo("admin")} className="py-1.5 px-2 bg-purple-100 hover:bg-purple-200 text-purple-900 text-[10px] font-bold rounded-lg transition-colors truncate">
                {t("loginAsAdmin")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


function AddFarmModal({ onClose, onCreated, api, notify }) {
  const [name, setName] = useState("");
  const [crop, setCrop] = useState("Rice");
  const [irrigation, setIrrigation] = useState("Drip");
  const [soilPh, setSoilPh] = useState("6.5");
  const [history, setHistory] = useState("Organic compost applied");
  const [lat, setLat] = useState("10.7905");
  const [lon, setLon] = useState("78.7047");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: name.trim() || "My New Farm",
        latitude: parseFloat(lat) || 10.8,
        longitude: parseFloat(lon) || 78.7,
        crop: crop,
        irrigation_method: irrigation,
        soil_ph_farm_declared: parseFloat(soilPh) || 6.5,
        management_history: history,
        extra_attributes_json: "{}"
      };
      const newFarm = await api("/farms", "POST", payload);
      notify(`Successfully registered farm '${payload.name}'!`);
      if (onCreated) onCreated(newFarm);
      onClose();
    } catch (err) {
      notify(err.message || "Failed to register farm", "err");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-sand-200 w-full max-w-md p-6 space-y-4 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 text-ink-950/40 hover:text-ink-950">✖</button>
        <div className="flex items-center gap-2 border-b border-sand-100 pb-3">
          <span className="text-xl">🌾</span>
          <h3 className="text-lg font-extrabold text-ink-950">Register New Farm</h3>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-ink-950 block mb-1">Farm Name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Paddy Field Alpha" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-ink-950 block mb-1">Crop Type</label>
              <select value={crop} onChange={(e) => setCrop(e.target.value)} className={inputCls}>
                <option value="Rice">🌾 Rice</option>
                <option value="Maize">🌽 Maize</option>
                <option value="Cotton">☁️ Cotton</option>
                <option value="Sugarcane">🎋 Sugarcane</option>
                <option value="Wheat">🌾 Wheat</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-ink-950 block mb-1">Irrigation Method</label>
              <select value={irrigation} onChange={(e) => setIrrigation(e.target.value)} className={inputCls}>
                <option value="Drip">💧 Drip Irrigation</option>
                <option value="Sprinkler">🌧️ Sprinkler</option>
                <option value="Flood">🌊 Flood Irrigation</option>
                <option value="Rainfed">🌩️ Rainfed</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="font-bold text-ink-950 block mb-1">Soil pH</label>
              <input type="number" step="0.1" value={soilPh} onChange={(e) => setSoilPh(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="font-bold text-ink-950 block mb-1">Latitude</label>
              <input type="number" step="0.001" value={lat} onChange={(e) => setLat(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="font-bold text-ink-950 block mb-1">Longitude</label>
              <input type="number" step="0.001" value={lon} onChange={(e) => setLon(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="font-bold text-ink-950 block mb-1">Management History</label>
            <input value={history} onChange={(e) => setHistory(e.target.value)} placeholder="Organic compost applied, drip fertigation" className={inputCls} />
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 bg-leaf-600 hover:bg-leaf-700 text-white font-extrabold rounded-xl shadow-md transition-colors mt-2">
            {loading ? "Registering Farm..." : "Save & Onboard Farm"}
          </button>
        </form>
      </div>
    </div>
  );
}


function AccessDeniedView({ lang, userRole, tabKey }) {
  const t = (key) => getTranslation(lang, key);
  return (
    <div className="p-12 text-center bg-white rounded-3xl border border-sand-200 shadow-sm max-w-2xl mx-auto my-12 space-y-4">
      <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-2xl mx-auto font-black">
        🚫
      </div>
      <h2 className="text-2xl font-extrabold text-ink-950">{t("accessDeniedTitle")}</h2>
      <p className="text-sm font-semibold text-ink-950/60">{t("accessDeniedSub")}</p>
      <p className="text-xs text-ink-950/50 leading-relaxed bg-sand-50 p-4 rounded-2xl border border-sand-100 max-w-lg mx-auto">
        {t("accessDeniedMessage")}
      </p>
      <div className="pt-2">
        <span className="px-3 py-1 bg-sand-100 text-ink-950 font-mono text-xs rounded-full border border-sand-200">
          Role: <strong className="uppercase">{userRole}</strong> • Attempted Module: <strong className="uppercase">{tabKey}</strong>
        </span>
      </div>
    </div>
  );
}


function App() {
  const [apiBase, setApiBase] = useState(DEFAULT_API);
  const [connected, setConnected] = useState(null);
  const [tab, setTab] = useState("dashboard");
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState(null);
  const [toast, setToast] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [lang, setLang] = useState(localStorage.getItem("agri_lang") || "en");
  const [showAddFarmModal, setShowAddFarmModal] = useState(false);

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("agri_user");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [showLoginModal, setShowLoginModal] = useState(() => {
    return !localStorage.getItem("agri_user");
  });

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem("agri_user", JSON.stringify(user));
    setShowLoginModal(false);
    setTab("dashboard");

    const savedFarmId = user.farm_id || localStorage.getItem(`agri_user_${user.id}_farm_id`);
    if (savedFarmId) {
      setSelectedFarmId(parseInt(savedFarmId));
    } else {
      setSelectedFarmId(null);
    }
    notify(`Welcome ${user.full_name || user.name || user.username}! Logged in as ${user.role.toUpperCase()}.`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("agri_user");
    localStorage.removeItem("agri_token");
    notify("Logged out successfully");
    setShowLoginModal(true);
  };

  const changeLanguage = (newLang) => {
    setLang(newLang);
    localStorage.setItem("agri_lang", newLang);
  };

  const t = (key) => getTranslation(lang, key);
  const api = useApi(apiBase);

  const notify = (msg, type = "ok") => {
    setToast({ msg, type });
    window.clearTimeout(window.__t);
    window.__t = window.setTimeout(() => setToast(null), 4500);
  };

  const refreshFarms = useCallback(async () => {
    try {
      const data = await api("/farms");
      setFarms(data);
      setConnected(true);
      if (!selectedFarmId && data.length) setSelectedFarmId(data[0].id);
    } catch (err) {
      setConnected(false);
    }
  }, [api, selectedFarmId]);

  const loadAlerts = useCallback(async () => {
    try {
      const data = await api("/alerts/");
      setAlerts(data);
    } catch (err) {
      console.error("Alerts fetch error:", err);
    }
  }, [api]);

  useEffect(() => {
    refreshFarms();
    loadAlerts();
  }, [refreshFarms, loadAlerts]);

  const [nowStr, setNowStr] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const formatted =
        d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
        ", " +
        d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
      setNowStr(formatted);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const role = currentUser?.role || "farmer";

  const navMap = {
    farmer: [
      { key: "dashboard", label: t("nav_dashboard"), icon: IconGrid },
      { key: "my_farm", label: t("nav_my_farm"), icon: IconSprout },
      { key: "regional_map", label: t("nav_regional_map"), icon: IconMap },
      { key: "digital_twin", label: t("nav_digital_twin"), icon: IconSliders },
      { key: "recommendations", label: t("nav_recommendations"), icon: IconShield },
      { key: "help", label: t("nav_help"), icon: IconHelp },
    ],
    officer: [
      { key: "dashboard", label: t("nav_dashboard"), icon: IconGrid },
      { key: "regional_map", label: t("nav_regional_map"), icon: IconMap },
      { key: "farm_network", label: t("nav_farm_network"), icon: IconNetwork },
      { key: "analytics", label: t("nav_analytics"), icon: IconBarChart },
      { key: "digital_twin", label: t("nav_digital_twin"), icon: IconSliders },
      { key: "recommendations", label: t("nav_recommendations"), icon: IconShield },
      { key: "help", label: t("nav_help"), icon: IconHelp },
    ],
    admin: [
      { key: "dashboard", label: t("nav_dashboard"), icon: IconGrid },
      { key: "users", label: t("nav_users"), icon: IconUser },
      { key: "farms", label: t("nav_my_farm"), icon: IconSprout },
      { key: "regional_map", label: t("nav_regional_map"), icon: IconMap },
      { key: "farm_network", label: t("nav_farm_network"), icon: IconNetwork },
      { key: "analytics", label: t("nav_analytics"), icon: IconBarChart },
      { key: "registry", label: t("nav_registry"), icon: IconLayers },
      { key: "selection", label: t("nav_selection"), icon: IconFilter },
      { key: "ingestion", label: t("nav_ingestion"), icon: IconCloud },
      { key: "audit_logs", label: t("nav_audit_logs"), icon: IconLock },
      { key: "help", label: t("nav_help"), icon: IconHelp },
    ],
  };

  const nav = navMap[role] || navMap.farmer;
  const isAllowed = nav.some((n) => n.key === tab);

  return (
    <div className="flex h-screen bg-sand-50 font-sans overflow-hidden">
      <Sidebar
        nav={nav}
        tab={tab}
        setTab={setTab}
        currentUser={currentUser}
        onSwitchAccount={() => setShowLoginModal(true)}
        onLogout={handleLogout}
        t={t}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-sand-200 px-8 py-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-extrabold text-ink-950">
              {nav.find((n) => n.key === tab)?.label || "AgriHive AI"}
            </h1>
            <p className="hidden md:block text-xs text-ink-950/40">
              {getTranslation(lang, "sub_" + tab)}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-sand-100 p-1 rounded-xl border border-sand-200 text-xs font-bold">
              <button onClick={() => changeLanguage("en")} className={`px-2.5 py-1 rounded-lg transition-all ${lang === "en" ? "bg-leaf-600 text-white font-extrabold shadow-sm" : "text-ink-950/60"}`}>GB EN</button>
              <button onClick={() => changeLanguage("ta")} className={`px-2.5 py-1 rounded-lg transition-all ${lang === "ta" ? "bg-leaf-600 text-white font-extrabold shadow-sm" : "text-ink-950/60"}`}>IN தமிழ்</button>
              <button onClick={() => changeLanguage("hi")} className={`px-2.5 py-1 rounded-lg transition-all ${lang === "hi" ? "bg-leaf-600 text-white font-extrabold shadow-sm" : "text-ink-950/60"}`}>IN हिंदी</button>
            </div>

            <button
              onClick={() => setShowAddFarmModal(true)}
              className="px-3 py-1.5 bg-leaf-600 hover:bg-leaf-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              <span>➕</span>
              <span className="hidden sm:inline">Add Farm</span>
            </button>

            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-sand-100 border border-sand-200 rounded-xl text-xs font-semibold text-ink-950/70">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{nowStr || "Live Session"}</span>
            </div>

            <UserBadge
              user={currentUser}
              onSwitch={() => setShowLoginModal(true)}
              onLogout={handleLogout}
              lang={lang}
            />
          </div>
        </header>

        <main className="flex-1 px-8 py-6">
          {connected === false && (
            <div className="mb-5 bg-rose-100 text-rose-600 text-xs font-bold rounded-xl px-4 py-3 border border-rose-200">
              Can't reach the backend server at {apiBase}. Make sure `uvicorn app.main:app` is running.
            </div>
          )}

          {!isAllowed ? (
            <AccessDeniedView lang={lang} userRole={role} tabKey={tab} />
          ) : (
            <>
              {tab === "dashboard" && <DashboardTab api={api} notify={notify} farms={farms} goTo={setTab} selectedFarmId={selectedFarmId} setSelectedFarmId={setSelectedFarmId} onAddFarm={() => setShowAddFarmModal(true)} lang={lang} currentUser={currentUser} />}
              {tab === "users" && <UsersTab api={api} notify={notify} lang={lang} />}
              {tab === "audit_logs" && <AuditLogsTab api={api} notify={notify} lang={lang} />}
              {tab === "my_farm" && <DigitalTwinTab api={api} notify={notify} farms={farms} selectedFarmId={selectedFarmId} setSelectedFarmId={setSelectedFarmId} onAddFarm={() => setShowAddFarmModal(true)} lang={lang} />}
              {tab === "regional_map" && <RegionalMapTab api={api} notify={notify} farms={farms} selectedFarmId={selectedFarmId} setSelectedFarmId={setSelectedFarmId} goTo={setTab} lang={lang} />}
              {tab === "digital_twin" && <DigitalTwinTab api={api} notify={notify} farms={farms} selectedFarmId={selectedFarmId} setSelectedFarmId={setSelectedFarmId} lang={lang} />}
              {tab === "analytics" && <AnalyticsTab api={api} notify={notify} lang={lang} />}
              {tab === "farm_network" && <FarmNetworkTab api={api} notify={notify} farms={farms} refreshFarms={refreshFarms} lang={lang} />}
              {tab === "recommendations" && <XaiTab api={api} notify={notify} farms={farms} selectedFarmId={selectedFarmId} lang={lang} />}
              {tab === "farms" && <FarmsTab api={api} notify={notify} farms={farms} refreshFarms={refreshFarms} selectedFarmId={selectedFarmId} setSelectedFarmId={setSelectedFarmId} lang={lang} currentUser={currentUser} />}
              {tab === "ingestion" && <IngestionTab api={api} notify={notify} farms={farms} selectedFarmId={selectedFarmId} setSelectedFarmId={setSelectedFarmId} lang={lang} />}
              {tab === "registry" && <RegistryTab api={api} notify={notify} selectedFarmId={selectedFarmId} lang={lang} />}
              {tab === "selection" && <SelectionTab api={api} notify={notify} farms={farms} lang={lang} />}
              {tab === "help" && <HelpTab lang={lang} />}
            </>
          )}
        </main>
      </div>

      {showLoginModal && (
        <LoginModal
          onLogin={handleLogin}
          onClose={() => setShowLoginModal(false)}
          lang={lang}
          apiBase={apiBase}
        />
      )}

      {showAddFarmModal && (
        <AddFarmModal
          onClose={() => setShowAddFarmModal(false)}
          onCreated={async (newFarm) => {
            await refreshFarms();
            if (newFarm && newFarm.id) {
              setSelectedFarmId(newFarm.id);
            }
          }}
          api={api}
          notify={notify}
        />
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
