"""GET /api/health — ping Oracle."""

from flask import Blueprint

from backend.db.pool import get_pool
from backend.responses import json_error, json_ok

bp = Blueprint("api_health", __name__)


@bp.route("/health", methods=["GET"])
def health():
    try:
        pool = get_pool()
        with pool.acquire() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1 FROM dual")
                cur.fetchone()
    except Exception as e:
        return json_error(
            "DATABASE_ERROR",
            str(e),
            status=503,
        )
    return json_ok({"status": "ok", "database": "reachable"})
