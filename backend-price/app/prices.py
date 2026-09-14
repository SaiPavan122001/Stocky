"""Fetches real (delayed) NSE stock prices via yfinance.

This is intentionally the only place that talks to Yahoo Finance. Callers
(routes.py) go through get_prices(), which never raises for a bad/failed
symbol — it either returns a fresh value, a stale cached value, or omits
the symbol, so one flaky ticker never fails the whole batch.
"""

import logging
import time
from dataclasses import dataclass

import yfinance as yf
from cachetools import TTLCache

logger = logging.getLogger(__name__)

NSE_SUFFIX = ".NS"
CACHE_TTL_SECONDS = 90


@dataclass
class PricePoint:
    price: float
    change: float
    change_percent: float
    as_of: float
    stale: bool = False

    def to_dict(self) -> dict:
        return {
            "price": round(self.price, 2),
            "change": round(self.change, 2),
            "changePercent": round(self.change_percent, 2),
            "asOf": self.as_of,
            "stale": self.stale,
        }


# Fresh, TTL-bounded results. Expires after CACHE_TTL_SECONDS so we don't
# hammer Yahoo on every request.
_fresh_cache: TTLCache = TTLCache(maxsize=256, ttl=CACHE_TTL_SECONDS)

# Last-known-good results, kept indefinitely as a fallback when a live
# fetch fails (network blip, symbol temporarily unavailable, etc).
_last_known: dict[str, PricePoint] = {}


def _fetch_one(symbol: str) -> PricePoint:
    ticker = yf.Ticker(symbol + NSE_SUFFIX)
    hist = ticker.history(period="5d", interval="1d")
    if hist.empty:
        raise ValueError(f"no price history returned for {symbol}")

    closes = hist["Close"].dropna()
    if len(closes) == 0:
        raise ValueError(f"no close prices for {symbol}")

    current = float(closes.iloc[-1])
    previous = float(closes.iloc[-2]) if len(closes) >= 2 else current
    change = current - previous
    change_percent = (change / previous * 100) if previous else 0.0

    return PricePoint(price=current, change=change, change_percent=change_percent, as_of=time.time())


def get_prices(symbols: list[str]) -> dict[str, dict]:
    """Returns {symbol: PricePoint.to_dict()} for every symbol we could
    resolve either freshly or from the last-known-good fallback. Symbols
    that have never successfully resolved are omitted entirely."""
    out: dict[str, dict] = {}

    for symbol in symbols:
        cached = _fresh_cache.get(symbol)
        if cached is not None:
            out[symbol] = cached.to_dict()
            continue

        try:
            point = _fetch_one(symbol)
            _fresh_cache[symbol] = point
            _last_known[symbol] = point
            out[symbol] = point.to_dict()
        except Exception as exc:  # noqa: BLE001 - deliberately broad: any yfinance/network failure falls back
            logger.warning("price fetch failed for %s: %s", symbol, exc)
            stale = _last_known.get(symbol)
            if stale is not None:
                stale_dict = stale.to_dict()
                stale_dict["stale"] = True
                out[symbol] = stale_dict
            # else: no fallback available yet, omit the symbol from the response

    return out
