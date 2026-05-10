"""GET /api/accueil — vues v_accueil_resume, v_prochains_rdv."""

from flask import Blueprint, request

from backend.responses import json_error, json_ok
from backend.services import accueil

bp = Blueprint("api_accueil", __name__)


@bp.route("/accueil", methods=["GET"])
def get_resume():
    row = accueil.get_accueil_resume()
    if row is None:
        return json_error("NOT_FOUND", "Résumé indisponible", status=404)
    return json_ok(row)


@bp.route("/accueil/prochains-rdv", methods=["GET"])
def list_prochains_rdv():
    limit = request.args.get("limit", default=50, type=int)
    rows = accueil.list_prochains_rdv(limit=limit)
    return json_ok(rows)
