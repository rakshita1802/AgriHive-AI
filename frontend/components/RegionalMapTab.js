// ================= Google Maps Styled Interactive Regional Map Tab =================
function RegionalMapTab({ api, notify, farms, selectedFarmId, setSelectedFarmId, goTo, lang = "en" }) {
  const { useState, useEffect, useCallback, useMemo, useRef } = React;
  const t = (key) => getTranslation(lang, key);
  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef({});

  const [farmDataMap, setFarmDataMap] = useState({});
  const [xaiDataMap, setXaiDataMap] = useState({});
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tileMode, setTileMode] = useState("roadmap"); // "roadmap" | "hybrid" | "terrain" | "osm"

  const loadAllFarmData = useCallback(async () => {
    try {
      setLoading(true);
      const states = {};
      const xais = {};

      await Promise.all(
        farms.map(async (f) => {
          try {
            const [st, xai] = await Promise.all([
              api(`/virtual-farm/state/${f.id}`).catch(() => null),
              api(`/xai/explain/${f.id}`).catch(() => null),
            ]);
            if (st) states[f.id] = st;
            if (xai) xais[f.id] = xai;
          } catch (e) { }
        })
      );

      setFarmDataMap(states);
      setXaiDataMap(xais);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [api, farms]);

  useEffect(() => {
    loadAllFarmData();
  }, [loadAllFarmData]);

  // Build structured farm list with real coordinates
  const mapFarms = useMemo(() => {
    return farms.map((f) => {
      const st = farmDataMap[f.id];
      const xai = xaiDataMap[f.id];
      const diseaseRisk = st?.current_metrics?.disease_risk_pct || 30;
      const waterStress = st?.current_metrics?.water_stress_pct || 25;
      const nutrientStatus = st?.current_metrics?.nutrient_status_pct || 60;
      const riskLabel = diseaseRisk >= 70 ? "High Risk" : diseaseRisk >= 45 ? "Medium Risk" : "Low Risk";

      return {
        id: f.id,
        name: f.name,
        crop: f.crop || "Rice",
        lat: f.latitude || 10.8,
        lon: f.longitude || 78.7,
        location: f.management_history ? f.management_history.split(".")[0] : "Tamil Nadu Region",
        risk: riskLabel,
        disease: diseaseRisk,
        water: waterStress,
        nutrient: nutrientStatus,
        xai: xai,
        state: st,
      };
    });
  }, [farms, farmDataMap, xaiDataMap]);

  useEffect(() => {
    if (!selectedFarm && mapFarms.length) {
      const match = mapFarms.find((f) => f.id === selectedFarmId) || mapFarms[0];
      setSelectedFarm(match);
    }
  }, [mapFarms, selectedFarm, selectedFarmId]);

  // Initialize and update Google Maps Tiles via Leaflet Engine
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (typeof L === "undefined") {
      console.warn("Leaflet library not loaded yet.");
      return;
    }

    if (!leafletMapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [10.8, 78.7],
        zoom: 7,
        zoomControl: false,
      });

      L.control.zoom({ position: "topleft" }).addTo(map);
      leafletMapRef.current = map;

      setTimeout(() => {
        map.invalidateSize();
      }, 300);
    }

    const map = leafletMapRef.current;

    // Remove existing tile layer
    if (map.__currentTileLayer) {
      map.removeLayer(map.__currentTileLayer);
    }

    // Google Maps Tile URLs
    let tileUrl = "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}";
    let attribution = "&copy; Google Maps";

    if (tileMode === "hybrid") {
      tileUrl = "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}";
    } else if (tileMode === "terrain") {
      tileUrl = "https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}";
    } else if (tileMode === "osm") {
      tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
      attribution = "&copy; OpenStreetMap contributors";
    }

    const tileLayer = L.tileLayer(tileUrl, { attribution, maxZoom: 20, subdomains: ["mt0", "mt1", "mt2", "mt3"] }).addTo(map);
    map.__currentTileLayer = tileLayer;

    // Clear old markers
    Object.values(markersRef.current).forEach((m) => map.removeLayer(m));
    markersRef.current = {};

    const latLngs = [];

    mapFarms.forEach((f) => {
      latLngs.push([f.lat, f.lon]);

      const isHigh = f.risk === "High Risk";
      const isMed = f.risk === "Medium Risk";
      const colorHex = isHigh ? "#dc2626" : isMed ? "#d97706" : "#16a34a";
      const isSelected = selectedFarm?.id === f.id;

      // Highlighted Selected Marker Pin HTML
      const markerHtml = `
        <div style="position: relative; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: ${isSelected ? "100" : "10"};">
          ${isSelected ? `<div style="position: absolute; width: 56px; height: 56px; border-radius: 50%; background: rgba(234, 179, 8, 0.45); border: 2px solid #eab308; animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ""}
          ${isHigh && !isSelected ? `<div style="position: absolute; width: 42px; height: 42px; border-radius: 50%; background: rgba(220,38,38,0.35); animation: ping 1.4s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ""}
          <div style="
            background: ${isSelected ? "#1e293b" : colorHex};
            color: #ffffff;
            padding: ${isSelected ? "7px 14px" : "5px 12px"};
            border-radius: 24px;
            font-size: ${isSelected ? "12px" : "11px"};
            font-weight: 800;
            font-family: Manrope, sans-serif;
            box-shadow: ${isSelected ? "0 0 20px rgba(234, 179, 8, 0.9), 0 8px 20px rgba(0,0,0,0.5)" : "0 6px 16px rgba(0,0,0,0.35)"};
            border: ${isSelected ? "3px solid #eab308" : "2px solid #ffffff"};
            transform: ${isSelected ? "scale(1.2)" : "scale(1.0)"};
            transition: all 0.25s ease;
            display: flex;
            align-items: center;
            gap: 6px;
            white-space: nowrap;
          ">
            <span style="font-size: 14px;">${isSelected ? "🎯" : "🌾"}</span>
            <span>${f.name}</span>
            ${isSelected ? `<span style="background: #eab308; color: #0f172a; padding: 1px 6px; border-radius: 999px; font-size: 9px; font-weight: 900;">SELECTED</span>` : ""}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: `google-map-marker-pin ${isSelected ? "marker-selected-active" : ""}`,
        iconSize: [140, 42],
        iconAnchor: [70, 21],
      });

      const marker = L.marker([f.lat, f.lon], { icon: customIcon, zIndexOffset: isSelected ? 1000 : 0 }).addTo(map);

      const popupHtml = `
        <div style="font-family: Manrope, sans-serif; padding: 6px; min-width: 190px;">
          <h4 style="margin: 0; font-size: 14px; font-weight: 900; color: #0E1712;">${f.name} (${f.crop})</h4>
          <p style="margin: 3px 0 8px 0; font-size: 11px; color: #555; font-weight: 600;">📍 ${f.location}</p>
          <div style="display: flex; flex-wrap: wrap; gap: 4px; font-size: 10px; font-weight: 800;">
            <span style="background: ${colorHex}; color: #fff; padding: 3px 8px; border-radius: 6px;">${f.risk}</span>
            <span style="background: #f1efe7; color: #0E1712; padding: 3px 8px; border-radius: 6px;">Disease: ${f.disease}%</span>
            <span style="background: #f1efe7; color: #0E1712; padding: 3px 8px; border-radius: 6px;">Water: ${f.water}%</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on("click", () => {
        setSelectedFarm(f);
        if (setSelectedFarmId) setSelectedFarmId(f.id);
      });

      markersRef.current[f.id] = marker;
    });

    if (latLngs.length > 0 && !map.__boundsSet) {
      map.fitBounds(latLngs, { padding: [50, 50] });
      map.__boundsSet = true;
    }

    map.invalidateSize();
  }, [mapFarms, tileMode, selectedFarm, setSelectedFarmId]);

  // Handle selected farm highlighting & smooth map flyTo
  const handleSelectFarm = (f) => {
    setSelectedFarm(f);
    if (setSelectedFarmId) setSelectedFarmId(f.id);

    if (leafletMapRef.current && f.lat && f.lon) {
      leafletMapRef.current.flyTo([f.lat, f.lon], 11, {
        animate: true,
        duration: 1.2,
      });

      const marker = markersRef.current[f.id];
      if (marker) {
        setTimeout(() => marker.openPopup(), 600);
      }
    }
  };

  const activeFarm = selectedFarm || mapFarms[0] || {
    id: 1, name: "Farm A", crop: "Rice", risk: "Low Risk", disease: 24, water: 20, nutrient: 65,
  };

  const activeFactors = activeFarm.xai?.top_contributing_factors || [
    { factor: "High Humidity", score: 0.28 },
    { factor: "High Temperature", score: 0.22 },
    { factor: "Soil Moisture Deficit", score: 0.18 },
  ];

  return (
    <div className="space-y-4 h-[calc(100vh-140px)] flex flex-col">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-sand-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-ink-950 flex items-center gap-2">
            <span>🗺️</span> Google Maps Interactive Regional GIS
          </h2>
          <p className="text-xs text-ink-950/50 mt-0.5">
            Select a farm below or click any marker on the Google Map to highlight its location & live telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Select Highlight Dropdown */}
          <select
            value={activeFarm.id}
            onChange={(e) => {
              const fid = parseInt(e.target.value, 10);
              const found = mapFarms.find((f) => f.id === fid);
              if (found) handleSelectFarm(found);
            }}
            className="text-xs font-extrabold bg-sand-100 border border-sand-200 rounded-xl px-3 py-1.5 text-ink-950 shadow-sm"
          >
            {mapFarms.map((f) => (
              <option key={f.id} value={f.id}>
                🎯 Highlight {f.name} ({f.crop})
              </option>
            ))}
          </select>

          {/* Google Maps Layer Switcher */}
          <div className="flex items-center bg-sand-100 p-1 rounded-xl border border-sand-200 text-xs font-bold">
            <button
              onClick={() => setTileMode("roadmap")}
              className={`px-3 py-1 rounded-lg transition-all ${tileMode === "roadmap" ? "bg-leaf-600 text-white font-extrabold shadow-sm" : "text-ink-950/60 hover:text-ink-950"}`}
            >
              🗺️ Google Map
            </button>
            <button
              onClick={() => setTileMode("hybrid")}
              className={`px-3 py-1 rounded-lg transition-all ${tileMode === "hybrid" ? "bg-leaf-600 text-white font-extrabold shadow-sm" : "text-ink-950/60 hover:text-ink-950"}`}
            >
              🛰️ Satellite Hybrid
            </button>
          </div>
        </div>
      </div>

      {/* Main Map & Side Details */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        {/* Real Google Maps Container */}
        <div className="lg:col-span-2 bg-sand-100 rounded-3xl border border-sand-200 overflow-hidden shadow-inner relative flex flex-col min-h-[480px]">
          <div ref={mapContainerRef} className="w-full h-full min-h-[480px] z-10"></div>
        </div>

        {/* Selected Farm Detail Panel */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-sand-200 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between border-b border-sand-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎯</span>
                  <h3 className="text-lg font-extrabold text-ink-950">{activeFarm.name}</h3>
                </div>
                <p className="text-xs text-ink-950/50 mt-0.5">
                  📍 {activeFarm.location} ({activeFarm.lat?.toFixed(4)}°N, {activeFarm.lon?.toFixed(4)}°E)
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-extrabold text-white ${activeFarm.risk === "High Risk" ? "bg-rose-600" : activeFarm.risk === "Medium Risk" ? "bg-amber-500" : "bg-leaf-600"}`}>
                {activeFarm.risk}
              </span>
            </div>

            {/* Farm Selector List Cards */}
            <div className="mt-4 space-y-1.5">
              <p className="text-[11px] font-extrabold text-ink-950/50 uppercase tracking-wider">Quick Select Farm to Highlight:</p>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {mapFarms.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => handleSelectFarm(f)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${activeFarm.id === f.id ? "bg-ink-950 text-amber-400 shadow-md ring-2 ring-amber-400" : "bg-sand-100 text-ink-950/70 hover:bg-sand-200"}`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Risk Summary Progress Bars */}
            <div className="mt-5 space-y-4">
              <h4 className="text-xs font-extrabold text-ink-950/50 uppercase tracking-wider">Live Predictive Risk Summary</h4>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Disease Risk</span>
                  <span className="text-rose-600">{activeFarm.disease}%</span>
                </div>
                <div className="w-full h-2.5 bg-sand-100 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-600 rounded-full" style={{ width: `${activeFarm.disease}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Water Stress</span>
                  <span className="text-sky-600">{activeFarm.water}%</span>
                </div>
                <div className="w-full h-2.5 bg-sand-100 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-600 rounded-full" style={{ width: `${activeFarm.water}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Nutrient Status</span>
                  <span className="text-amber-600">{activeFarm.nutrient}%</span>
                </div>
                <div className="w-full h-2.5 bg-sand-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${activeFarm.nutrient}%` }}></div>
                </div>
              </div>
            </div>

            {/* SHAP Predominant Factors */}
            <div className="mt-6 space-y-2">
              <h4 className="text-xs font-extrabold text-ink-950/50 uppercase tracking-wider mb-2">SHAP Predominant Factors</h4>
              <div className="space-y-1.5 text-xs font-semibold text-ink-950">
                {activeFactors.slice(0, 4).map((fact, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-sand-50 border border-sand-100 text-rose-600">
                    <div className="flex items-center gap-2">
                      <span>💧</span>
                      <span>{fact.factor || fact.feature}</span>
                    </div>
                    <span className="font-mono text-[11px] font-bold">+{typeof fact.score === "number" ? fact.score.toFixed(2) : fact.impact}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              if (setSelectedFarmId) setSelectedFarmId(activeFarm.id);
              goTo("recommendations");
            }}
            className="w-full mt-6 py-3 bg-leaf-600 hover:bg-leaf-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-colors"
          >
            View Farm XAI Attributions →
          </button>
        </div>
      </div>
    </div>
  );
}