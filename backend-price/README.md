# backend-price

Internal-only market-data service: fetches real (delayed) NSE stock prices via `yfinance` and serves them to `backend-go`, which polls this service and caches results in its own database. The frontend never talks to this service directly.

## Run locally

```sh
cd backend-price
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
python run.py
```

Listens on `:5000` by default (`PRICE_SERVICE_PORT` env var to change it).

## Endpoints

- `GET /health` — liveness check.
- `GET /prices?symbols=RELIANCE,TCS,...` — real NSE tickers (no `.NS` suffix in the query; it's appended internally, matching how `stocks.symbol` is stored in backend-go). Returns `{ SYMBOL: { price, change, changePercent, asOf, stale } }`. Unresolvable symbols are silently omitted rather than failing the whole request; a symbol whose live fetch fails but has a previously-cached value comes back with `stale: true` instead of erroring.

## Notes

- Symbols must be real NSE tickers as recognized by Yahoo Finance's `<TICKER>.NS` convention — e.g. `HDFCBANK`, not `HDFC`; `ICICIBANK`, not `ICICI`. `backend-go`'s seed data was corrected to match after discovering this during Phase 2 testing.
- Data is end-of-day-ish and delayed, not tick-by-tick — `yfinance` scrapes/wraps Yahoo Finance, which is not an official real-time NSE feed.
- In-memory TTL cache (90s) avoids hammering Yahoo on every poll; a separate indefinite last-known-good cache is used as a fallback when a live fetch fails.
- `gunicorn` is listed in `requirements.txt` for a future Linux cloud deployment; it doesn't run on Windows, so local dev uses Flask's built-in dev server via `run.py`.
