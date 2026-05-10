"""CRUD /api/medecins."""

from flask import Blueprint, request

from backend.responses import json_error, json_ok
from backend.services import medecins

bp = Blueprint("api_medecins", __name__)


@bp.route("/medecins", methods=["GET"])
def list_medecins():
    data = medecins.list_medecins()
    return json_ok(data)


@bp.route("/medecins/<int:medecin_id>", methods=["GET"])
def get_medecin(medecin_id):
    row = medecins.get_medecin_by_id(medecin_id)
    if row is None:
        return json_error("NOT_FOUND", "Médecin introuvable", status=404)
    return json_ok(row)


@bp.route("/medecins", methods=["POST"])
def create_medecin():
    body = request.get_json(silent=True) or {}
    nom = (body.get("nom") or "").strip()
    specialite = (body.get("specialite") or "").strip()
    if not nom or not specialite:
        return json_error(
            "VALIDATION_ERROR",
            "nom et spécialité obligatoires",
            status=400,
        )
    row = medecins.create_medecin(nom=nom, specialite=specialite)
    return json_ok(row, status=201)


@bp.route("/medecins/<int:medecin_id>", methods=["PATCH"])
def patch_medecin(medecin_id):
    body = request.get_json(silent=True) or {}
    if not body:
        return json_error("VALIDATION_ERROR", "Corps JSON vide", status=400)
    row = medecins.update_medecin(medecin_id, body)
    if row is None:
        return json_error("NOT_FOUND", "Médecin introuvable", status=404)
    return json_ok(row)


@bp.route("/medecins/<int:medecin_id>", methods=["DELETE"])
def delete_medecin(medecin_id):
    _ok, reason, n_rdv = medecins.delete_medecin(medecin_id)
    if reason == "NOT_FOUND":
        return json_error("NOT_FOUND", "Médecin introuvable", status=404)
    if reason == "HAS_RDV":
        msg = (
            f"Ce médecin ne peut pas être supprimé : {n_rdv} rendez-vous "
            "y sont encore liés. Supprimez ou modifiez ces RDV dans l’agenda, puis réessayez."
        )
        return json_error("CONFLICT", msg, status=409)
    return json_ok({"deleted_id": medecin_id})
