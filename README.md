# Stocky

A stock-rewards / fractional-portfolio tracker: a Dashboard, Portfolio, Rewards, and Today's Rewards view, backed by real (delayed) NSE stock prices. "Rewards" and "holdings" are the app's own bookkeeping — no real brokerage or money movement.

## Structure

```
frontend/       React + TypeScript + Vite + shadcn/ui web app, also packaged as an Android app via Capacitor
backend-go/     Core REST API: auth, holdings, rewards, portfolio, activity (Go + chi + SQLite for now)
backend-price/  Market-data service: fetches real NSE prices via yfinance (Python + Flask), internal only
```

## Local development

Runs as three native processes (no Docker/Postgres on this machine — see each service's README for why and how this differs from a typical cloud setup):

1. `cd backend-price && python -m venv .venv && .venv\Scripts\activate && pip install -r requirements.txt && python run.py` — starts the price service on `:5000`.
2. `cd backend-go && go run ./cmd/api` — starts the core API on `:8080` (creates/migrates `stocky.db` automatically).
3. `cd frontend && npm install && npm run dev` — starts the web app against the local backend (`localhost:5173` by default).

See `.env.example` for the environment variables each service reads.

## Android

See `frontend/README.md` for Capacitor build/packaging instructions once Phase 4 is reached.

## Status

Built incrementally in phases — see the project plan for the full architecture and phase breakdown:
1. Go API + Postgres (auth, holdings, rewards, portfolio) — prices seeded
2. Flask price service wired in — real NSE prices
3. Frontend rewired to real data + UI redesign
4. Capacitor Android packaging
