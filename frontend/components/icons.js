// ---------------- icon set (inline SVG, stroke style) ----------------
const Icon = ({ path, className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {path}
  </svg>
);
const IconGrid = (p) => <Icon {...p} path={<><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>} />;
const IconSprout = (p) => <Icon {...p} path={<><path d="M12 21v-8"/><path d="M12 13c0-3.5-2.5-6-7-6 0 3.5 2.5 6 7 6Z"/><path d="M12 13c0-4 3-7 7-7 0 4-3 7-7 7Z"/></>} />;
const IconCloud = (p) => <Icon {...p} path={<><path d="M7 18a4 4 0 1 1 .5-7.97A5.5 5.5 0 0 1 18 12.5 3.5 3.5 0 0 1 17.5 19H7Z"/><path d="M12 12v6"/><path d="M9.5 15.5 12 18l2.5-2.5"/></>} />;
const IconLayers = (p) => <Icon {...p} path={<><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/></>} />;
const IconFilter = (p) => <Icon {...p} path={<path d="M4 5h16l-6.5 8v6l-3-2v-4L4 5Z"/>} />;
const IconDot = (p) => <Icon {...p} path={<circle cx="12" cy="12" r="4"/>} />;
const IconPlus = (p) => <Icon {...p} path={<><path d="M12 5v14"/><path d="M5 12h14"/></>} />;
const IconTrash = (p) => <Icon {...p} path={<><path d="M4 7h16"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/><path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/></>} />;
const IconRefresh = (p) => <Icon {...p} path={<><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/></>} />;
const IconCheck = (p) => <Icon {...p} path={<path d="m4 12 5 5L20 6"/>} />;
const IconX = (p) => <Icon {...p} path={<><path d="M6 6l12 12"/><path d="M18 6 6 18"/></>} />;
const IconChevron = (p) => <Icon {...p} path={<path d="m9 6 6 6-6 6"/>} />;

// New icons matching reference UI
const IconMap = (p) => <Icon {...p} path={<><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></>} />;
const IconCpu = (p) => <Icon {...p} path={<><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></>} />;
const IconBarChart = (p) => <Icon {...p} path={<><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></>} />;
const IconNetwork = (p) => <Icon {...p} path={<><rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/></>} />;
const IconBell = (p) => <Icon {...p} path={<><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>} />;
const IconShield = (p) => <Icon {...p} path={<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>} />;
const IconSliders = (p) => <Icon {...p} path={<><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></>} />;
const IconSettings = (p) => <Icon {...p} path={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></>} />;
const IconHelp = (p) => <Icon {...p} path={<><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></>} />;
const IconSearch = (p) => <Icon {...p} path={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>} />;
const IconDroplet = (p) => <Icon {...p} path={<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>} />;
const IconSun = (p) => <Icon {...p} path={<><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>} />;
const IconWind = (p) => <Icon {...p} path={<path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/>} />;
const IconThermometer = (p) => <Icon {...p} path={<path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>} />;
const IconArrowDown = (p) => <Icon {...p} path={<><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></>} />;
const IconArrowUp = (p) => <Icon {...p} path={<><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></>} />;
const IconLock = (p) => <Icon {...p} path={<><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>} />;
const IconUser = (p) => <Icon {...p} path={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>} />;
