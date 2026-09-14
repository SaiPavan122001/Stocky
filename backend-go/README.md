# backend-go

Core REST API for Stocky: auth, holdings, rewards, portfolio, activity. Go + chi + a hand-written SQL data-access layer over SQLite (local dev) via the pure-Go `modernc.org/sqlite` driver — no CGO/C compiler and no separate database server required.

## Run locally

```sh
cd backend-go
go run ./cmd/api
```

Listens on `:8080` by default and creates/migrates `stocky.db` (SQLite file) in the current directory on startup. Configure via environment variables (see `../.env.example`):

- `DATABASE_PATH` — SQLite file path (default `stocky.db`)
- `JWT_SECRET` — HMAC secret for signing access tokens (**change for anything beyond local dev**)
- `PORT` — HTTP port (default `8080`)
- `ALLOWED_ORIGINS` — comma-separated CORS allowlist (defaults cover the Vite dev server and the Android emulator's `10.0.2.2` alias)
- `PRICE_SERVICE_URL` — base URL of `backend-price` (used starting in Phase 2)

## Endpoints

See the project plan for the full list. `GET /health` is unauthenticated; everything under `/api/v1` requires `Authorization: Bearer <accessToken>` except `/api/v1/auth/*`.

## Background jobs

- **Reward settlement** (`internal/rewardworker`): every 10s, advances claimed rewards `pending → processing → credited` on fixed simulated delays, crediting the quantity into the user's holdings and logging a `recent_activity` row on completion. There's no real brokerage settlement to key off of, so this is deliberately simulated.
- **Portfolio snapshots**: every 60s, records each user's current total portfolio value so `GET /api/v1/portfolio/chart` has a real time series to render.

## Notes for later phases

- Prices are seeded with fixed placeholder values in the migration; Phase 2 adds a poller that calls `backend-price` and overwrites them via `UpsertPrice`.
- SQLite here is a deliberate local-dev simplification (no Docker/Postgres on this machine yet) — the schema (`internal/db/migrations/0001_init.sql`) is close enough to standard SQL that porting to Postgres for a cloud deployment later should be a small diff, not a rewrite.
