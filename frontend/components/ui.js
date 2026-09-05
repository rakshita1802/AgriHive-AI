// ---------------- shared UI atoms ----------------
function Badge({ tone = "default", children }) {
  const tones = {
    default: "bg-sand-100 text-ink-900/70",
    GLOBAL: "bg-leaf-100 text-leaf-700",
    LOCAL: "bg-amber-100 text-amber-600",
    CANDIDATE: "bg-sky-100 text-sky-600",
    EXCLUDED: "bg-rose-100 text-rose-600",
    KEEP: "bg-leaf-100 text-leaf-700",
    EXCLUDE: "bg-rose-100 text-rose-600",
    ok: "bg-leaf-100 text-leaf-700",
    error: "bg-rose-100 text-rose-600",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${tones[children] || tones[tone]}`}>{children}</span>;
}

function Card({ title, subtitle, actions, children, pad = "p-5" }) {
  return (
    <div className="bg-white border border-sand-200 rounded-2xl shadow-[0_1px_2px_rgba(20,30,20,0.04)]">
      {(title || actions) && (
        <div className="flex items-start justify-between px-5 pt-5 pb-3.5 border-b border-sand-100">
          <div>
            {title && <h3 className="text-[15px] font-bold text-ink-950">{title}</h3>}
            {subtitle && <p className="text-sm text-ink-950/45 mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div className="flex gap-2 shrink-0">{actions}</div>}
        </div>
      )}
      <div className={pad}>{children}</div>
    </div>
  );
}

function Button({ children, onClick, variant = "primary", disabled, type = "button", icon }) {
  const variants = {
    primary: "bg-leaf-600 text-white hover:bg-leaf-700 disabled:bg-sand-200 disabled:text-ink-950/30",
    secondary: "bg-sand-100 text-ink-900 hover:bg-sand-200",
    ghost: "text-leaf-700 hover:bg-leaf-100",
    danger: "text-rose-600 hover:bg-rose-100",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:cursor-not-allowed ${variants[variant]}`}>
      {icon}{children}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold uppercase tracking-wide text-ink-950/40 mb-1">{label}</span>
      {children}
    </label>
  );
}
const inputCls = "w-full rounded-lg border border-sand-200 bg-sand-50 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-leaf-500 focus:border-transparent";

function StatCard({ label, value, hint, tone = "leaf", icon }) {
  const tones = { leaf: "bg-leaf-100 text-leaf-700", amber: "bg-amber-100 text-amber-600", sky: "bg-sky-100 text-sky-600", rose: "bg-rose-100 text-rose-600" };
  return (
    <div className="bg-white border border-sand-200 rounded-2xl p-5 flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-950/40">{label}</p>
        <p className="text-2xl font-extrabold mt-1.5">{value}</p>
        {hint && <p className="text-xs text-ink-950/40 mt-1">{hint}</p>}
      </div>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${tones[tone]}`}>{icon}</div>
    </div>
  );
}

function Toast({ toast, onClose }) {
  if (!toast) return null;
  const tone = toast.type === "error" ? "bg-rose-600" : "bg-ink-900";
  return (
    <div className={`fixed bottom-5 right-5 ${tone} text-white px-4 py-3 rounded-xl shadow-lg text-sm max-w-md z-50 flex items-start gap-3`}>
      <span className="flex-1">{toast.msg}</span>
      <button onClick={onClose} className="opacity-70 hover:opacity-100"><IconX className="w-3.5 h-3.5" /></button>
    </div>
  );
}

function Sidebar({ nav, tab, setTab, currentUser, onSwitchAccount, onLogout, t }) {
  const role = currentUser?.role || "farmer";
  const roleLabel = role === "admin" ? "Administrator" : role === "officer" ? "Agricultural Officer" : "Farmer / Farm Owner";
  const roleIcon = role === "admin" ? "🌾" : role === "officer" ? "👩‍🌾" : "👨‍🌾";

  return (
    <aside className="w-64 bg-ink-950 text-sand-100 flex flex-col h-full border-r border-ink-900 shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-white/10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-leaf-600 text-white flex items-center justify-center shadow-lg font-extrabold text-xl">
          🌾
        </div>
        <div>
          <h1 className="font-black text-lg text-white tracking-tight leading-tight">AgriHive AI</h1>
          <p className="text-[10px] font-extrabold text-leaf-400 uppercase tracking-widest">Collaborative AI</p>
        </div>
      </div>

      {/* Current Role Badge Banner */}
      <div className="mx-4 my-4 p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{roleIcon}</span>
          <div>
            <p className="text-[11px] font-extrabold text-white leading-tight">{currentUser?.full_name || currentUser?.name || currentUser?.username || "User"}</p>
            <p className="text-[9px] font-extrabold text-leaf-400 uppercase tracking-wider mt-0.5">{roleLabel}</p>
          </div>
        </div>
      </div>

      {/* Navigation Link Items */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        <p className="px-3 pt-2 pb-1 text-[10px] font-black text-sand-400/50 uppercase tracking-widest">System Modules</p>
        {nav.map((item) => {
          const Icon = item.icon || IconGrid;
          const isActive = tab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                isActive
                  ? "bg-leaf-600 text-white shadow-md shadow-leaf-900/40"
                  : "text-sand-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-sand-400"}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Session Footer */}
      <div className="p-4 border-t border-white/10 bg-black/20">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-sand-400 text-[11px]">Logged in as <strong className="text-white">@{currentUser?.username || "farmer"}</strong></span>
          <button
            onClick={onLogout}
            className="text-rose-400 hover:text-rose-300 text-[11px] font-black hover:underline"
          >
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}

function UserBadge({ user, onLogout, lang }) {
  const role = user?.role || "farmer";
  const roleBadgeCls =
    role === "admin" ? "bg-purple-100 text-purple-800" : role === "officer" ? "bg-blue-100 text-blue-800" : "bg-leaf-100 text-leaf-800";
  const roleLabel = role === "admin" ? "ADMINISTRATOR" : role === "officer" ? "AGRICULTURAL OFFICER" : "FARMER";
  const displayName = user?.full_name || user?.name || user?.username || "User";
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-2.5 pl-3 border-l border-sand-200">
      <div className="w-8 h-8 rounded-full bg-leaf-700 text-white font-extrabold text-xs flex items-center justify-center shadow-sm uppercase">
        {avatarLetter}
      </div>
      <div className="hidden sm:block text-left">
        <p className="text-xs font-black text-ink-950 leading-tight">{displayName}</p>
        <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider ${roleBadgeCls}`}>
          {roleLabel}
        </span>
      </div>
    </div>
  );
}
