from flask import Blueprint, jsonify, request

from .prices import get_prices

bp = Blueprint("prices", __name__)


@bp.get("/health")
def health():
    return jsonify({"status": "ok"})


@bp.get("/prices")
def prices():
    symbols_param = request.args.get("symbols", "")
    symbols = [s.strip().upper() for s in symbols_param.split(",") if s.strip()]
    if not symbols:
        return jsonify({"error": "symbols query parameter is required, e.g. ?symbols=RELIANCE,TCS"}), 400

    return jsonify(get_prices(symbols))
