# Stocky

A stock-rewards / fractional-portfolio tracker: a Dashboard, Portfolio, Rewards, and Today's Rewards view, backed by real (delayed) NSE stock prices. "Rewards" and "holdings" are the app's own bookkeeping — no real brokerage or money movement.

## Structure

```
frontend/       React + TypeScript + Vite + shadcn/ui web app, also packaged as an Android app via Capacitor
backend-go/     Core REST API: auth, holdings, rewards, portfolio, activity (Go + chi + Postgres)
backend-price/  Market-data service: fetches real NSE prices via yfinance (Python + Flask)
docker-compose.yml   Runs Postgres + both backend services locally
```

## Local development

1. `cp .env.example .env` and adjust if needed.
2. `docker compose up --build` — starts Postgres, the Go API (`localhost:8080`), and the Flask price service (internal only).
3. `cd frontend && npm install && npm run dev` — starts the web app against the local backend (`localhost:5173` by default).

## Android

See `frontend/README.md` for Capacitor build/packaging instructions once Phase 4 is reached.

## Status

Built incrementally in phases — see the project plan for the full architecture and phase breakdown:
1. Go API + Postgres (auth, holdings, rewards, portfolio) — prices seeded
2. Flask price service wired in — real NSE prices
3. Frontend rewired to real data + UI redesign
4. Capacitor Android packaging
