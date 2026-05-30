# Visual Lab PRO v8

Frontend + Backend project for Visual Lab PRO — prompt engineering system for Midjourney v8.1 with CAV (Component Assembly Visualizer) panels, Kimi native translation, block library, mixer, and cloud sync.

## Structure

```
visual-lab-pro/
├── frontend/
│   └── index.html          # Single-file PWA (works offline)
├── backend/
│   ├── src/
│   │   ├── index.ts        # Express server entry
│   │   ├── db.ts           # SQLite persistence
│   │   └── routes/
│   │       ├── blocks.ts   # CRUD for prompt blocks
│   │       ├── logs.ts     # Experiment logging
│   │       ├── presets.ts  # Duo / group presets
│   │       ├── kimi.ts     # Kimi API proxy + translate
│   │       └── vcot.ts     # VCOT drift detection
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── render.yaml             # Render.com deploy config
└── README.md
```

## Frontend Features (v8)

- **100+ actresses** with ACTRESS_DESC descriptions
- **Favorites system** (★/☆) — sorts favs first in chip grid
- **Duo Presets** — 9 combos + Random Duo
- **Random Combo** — auto-picks 2–4 actresses
- **Group Dynamics** — formation, leader, energy (3+ subjects)
- **subj3 / subj4 blocks** with auto-scroll
- **Export / Import blocks** as JSON
- **Cloud Sync** — fetch API to backend (optional, works offline)
- **VCOT Drift Check** — detects prompt drift via backend
- **Kimi Enhance** button — prompt optimization via backend
- **8 original tabs**: Forge, Native, Builder, Vars, Comp, Blocks, Config, Log
- **Native translator** with offline fallback
- **Mixer** — block section recombination
- **CAV panels** — token assembly in Forge, Builder, Blocks tabs
- **Experiment log** — win/fail tracking with localStorage

## Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your KIMI_API_KEY and API_SECRET
npm install
npm run build
npm start
```

## Deploy to Render

1. Push this repo to GitHub
2. Connect repo on [render.com](https://render.com)
3. Render reads `render.yaml` automatically
4. Set `KIMI_API_KEY` environment variable in Render dashboard

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/blocks` | List all blocks |
| POST | `/api/blocks` | Create block |
| GET | `/api/logs` | List experiment logs |
| POST | `/api/logs` | Log experiment |
| GET | `/api/presets` | List duo presets |
| POST | `/api/kimi/translate` | Kimi translate prompt |
| POST | `/api/kimi/enhance` | Kimi enhance prompt |
| POST | `/api/vcot/drift-check` | VCOT drift detection |

## Frontend → Backend Headers

- `X-API-Secret` — must match `API_SECRET` env var
- `X-User-ID` — per-user identifier

## Offline Mode

Everything works without backend. Cloud features gracefully degrade to localStorage-only operation.

## License

Private / Personal use.
