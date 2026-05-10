"""CRUD /api/rendez-vous."""

from flask import Blueprint, request

from backend.responses import json_error, json_ok
from backend.services import rendez_vous

bp = Blueprint("api_rendez_vous", __name__)


def _arg(name):
    v = request.args.get(name)
    return v if v not in ("", None) else None


@bp.route("/rendez-vous", methods=["GET"])
def list_rdv():
    rows = rendez_vous.list_rendez_vous(
        date_debut=_arg("date_debut"),
        date_fin=_arg("date_fin"),
        medecin_id=_arg("medecin_id"),
        statut=_arg("statut"),
        patient_id=_arg("patient_id"),
    )
    return json_ok(rows)


@bp.route("/rendez-vous/historique/suppressions", methods=["GET", "DELETE"])
def list_or_clear_historique_suppressions():
    if request.method == "DELETE":
        rendez_vous.delete_all_historique_suppressions()
        return json_ok({"cleared": True})
    rows = rendez_vous.list_historique_suppressions()
    return json_ok(rows)


@bp.route("/rendez-vous/historique/suppressions/<int:hist_id>", methods=["DELETE"])
def delete_historique_suppression(hist_id):
    ok = rendez_vous.delete_historique_suppression(hist_id)
    if not ok:
        return json_error("NOT_FOUND", "Entrée d'historique introuvable", status=404)
    return json_ok({"deleted_id": hist_id})


@bp.route("/rendez-vous/<int:rdv_id>", methods=["GET", "DELETE"])
def get_or_delete_rdv(rdv_id):
    if request.method == "DELETE":
        ok = rendez_vous.delete_rendez_vous(rdv_id)
        if not ok:
            return json_error("NOT_FOUND", "Rendez-vous introuvable", status=404)
        return json_ok({"deleted_id": rdv_id})
    row = rendez_vous.get_rendez_vous_by_id(rdv_id)
    if row is None:
        return json_error("NOT_FOUND", "Rendez-vous introuvable", status=404)
    return json_ok(row)


@bp.route("/rendez-vous", methods=["POST"])
def create_rdv():
    body = request.get_json(silent=True) or {}
    pid = body.get("patient_id")
    mid = body.get("medecin_id")
    dh = body.get("date_heure")
    if pid is None or mid is None or dh is None:
        return json_error(
            "VALIDATION_ERROR",
            "patient_id, medecin_id et date_heure sont obligatoires",
            status=400,
        )
    try:
        pid = int(pid)
        mid = int(mid)
    except (TypeError, ValueError):
        return json_error("VALIDATION_ERROR", "IDs invalides", status=400)

    row, err, fields = rendez_vous.create_rendez_vous(
        patient_id=pid,
        medecin_id=mid,
        date_heure=dh,
        motif=body.get("motif"),
        statut=body.get("statut"),
        duree_minutes=body.get("duree_minutes"),
    )
    if err == "NOT_FOUND":
        return json_error(
            "VALIDATION_ERROR",
            "Référence invalide",
            status=400,
            fields=fields,
        )
    if err == "CONFLICT":
        return json_error(
            "CONFLICT",
            "Ce créneau est déjà réservé pour ce médecin",
            status=409,
        )
    return json_ok(row, status=201)


@bp.route("/rendez-vous/<int:rdv_id>", methods=["PATCH"])
def patch_rdv(rdv_id):
    body = request.get_json(silent=True) or {}
    if not body:
        return json_error("VALIDATION_ERROR", "Corps JSON vide", status=400)
    row, err = rendez_vous.update_rendez_vous(rdv_id, body)
    if err == "NOT_FOUND":
        return json_error("NOT_FOUND", "Rendez-vous introuvable", status=404)
    if err == "CONFLICT":
        return json_error(
            "CONFLICT",
            "Ce créneau est déjà réservé pour ce médecin",
            status=409,
        )
    if err == "VALIDATION":
        return json_error("VALIDATION_ERROR", "statut invalide", status=400)
    if err == "BAD_PATIENT":
        return json_error(
            "VALIDATION_ERROR",
            "patient_id introuvable",
            status=400,
            fields={"patient_id": "aucun patient avec cet id"},
        )
    if err == "BAD_MED":
        return json_error(
            "VALIDATION_ERROR",
            "medecin_id introuvable",
            status=400,
            fields={"medecin_id": "aucun médecin avec cet id"},
        )
    return json_ok(row)
