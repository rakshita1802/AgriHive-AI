# AgriHive AI — Frontend (Phase 1 & 2 Control Room)

A single-file React + Tailwind dashboard for the Phase 1 (Data Ingestion) and
Phase 2 (Feature Registry & Feature Selection Engine) backend. No Docker, no
`npm install`, no build step — matches the backend's "run directly" philosophy.
React, Tailwind, and Babel (for in-browser JSX) are all loaded from CDN inside
`index.html`.

Covers:
- **Farms** — register/list/remove farms, including the Section 11 "extra
  attribute" field for testing new-feature onboarding.
- **Ingestion** — trigger NASA POWER / Open-Meteo / SoilGrids pulls per farm,
  view raw weather & soil records.
- **Feature Registry** — seed, refresh, discover new farm features, view/edit
  status (GLOBAL / LOCAL / CANDIDATE / EXCLUDED).
- **Feature Selection Engine** — run the engine, browse past runs, and see a
  per-feature KEEP/EXCLUDE report with a Domain → Quality → Leakage →
  Redundancy → Model Evaluation step tracker (Section 8).

Later-phase UI (Virtual Farm, What-if simulation, SHAP, risk dashboards —
Phase 13 of the plan) is intentionally **not** included here, since that
backend doesn't exist yet in this build.

## 1. Start the backend first

```bash
cd ../backend
uvicorn app.main:app --reload --port 8000
```

CORS is already open (`allow_origins=["*"]` in `app/main.py`), so the
frontend can call it directly.

## 2. Serve the frontend

Any static file server works. From this `frontend/` folder:

```bash
python3 -m http.server 5500
```

Then open **http://localhost:5500** in your browser.

(Opening `index.html` directly by double-clicking also works in most
browsers, but a local server avoids occasional `file://` origin quirks —
serving it is the more reliable option.)

## 3. Point it at your API (if not localhost:8000)

The top bar has an editable API base URL field (defaults to
`http://localhost:8000`). Change it and click **Reconnect** if your backend
runs elsewhere or on a different port. The green/red dot next to it shows
connection status.

## Typical flow to try end-to-end

1. **Farms tab** — create 2–3 farms (try giving one an
   `extra_attributes_json` value like `{"canopy_temp_c": 28.4}`).
2. **Ingestion tab** — select a farm, click **Run all sources**.
3. **Feature Registry tab** — click **Seed**, then **Refresh**, then select
   the farm with the extra attribute and click **Discover**.
4. **Feature Selection tab** — click **Run engine**, then inspect the
   KEEP/EXCLUDE report per feature.
