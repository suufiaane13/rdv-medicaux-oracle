"""CRUD /api/patients."""

from flask import Blueprint, request

from backend.responses import json_error, json_ok
from backend.services import patients

bp = Blueprint("api_patients", __name__)


@bp.route("/patients", methods=["GET"])
def list_patients():
    q = request.args.get("q")
    try:
        page = int(request.args.get("page", 1))
    except (TypeError, ValueError):
        page = 1
    try:
        page_size = int(request.args.get("page_size", 20))
    except (TypeError, ValueError):
        page_size = 20
    data, meta = patients.list_patients(q=q, page=page, page_size=page_size)
    return json_ok(data, meta=meta)


@bp.route("/patients/<int:patient_id>", methods=["GET"])
def get_patient(patient_id):
    row = patients.get_patient_by_id(patient_id)
    if row is None:
        return json_error("NOT_FOUND", "Patient introuvable", status=404)
    rdv = patients.list_rdv_for_patient(patient_id)
    out = {**row, "rendez_vous": rdv}
    return json_ok(out)


@bp.route("/patients", methods=["POST"])
def create_patient():
    body = request.get_json(silent=True) or {}
    nom = (body.get("nom") or "").strip()
    prenom = (body.get("prenom") or "").strip()
    if not nom or not prenom:
        return json_error(
            "VALIDATION_ERROR",
            "nom et prénom obligatoires",
            status=400,
            fields={
                "nom": "obligatoire" if not nom else None,
                "prenom": "obligatoire" if not prenom else None,
            },
        )
    cin_val, cin_err = patients.parse_cin_input(body.get("cin"))
    if cin_err:
        return json_error(
            "VALIDATION_ERROR",
            cin_err,
            status=400,
            fields={"cin": cin_err},
        )
    row = patients.create_patient(
        nom=nom,
        prenom=prenom,
        telephone=(body.get("telephone") or "").strip() or None,
        email=(body.get("email") or "").strip() or None,
        cin=cin_val,
    )
    return json_ok(row, status=201)


@bp.route("/patients/<int:patient_id>", methods=["PATCH"])
def patch_patient(patient_id):
    body = request.get_json(silent=True) or {}
    if not body:
        return json_error("VALIDATION_ERROR", "Corps JSON vide", status=400)
    try:
        row = patients.update_patient(patient_id, body)
    except ValueError as e:
        msg = str(e)
        return json_error(
            "VALIDATION_ERROR",
            msg,
            status=400,
            fields={"cin": msg},
        )
    if row is None:
        return json_error("NOT_FOUND", "Patient introuvable", status=404)
    return json_ok(row)


@bp.route("/patients/<int:patient_id>", methods=["DELETE"])
def delete_patient(patient_id):
    _ok, reason, n_rdv = patients.delete_patient(patient_id)
    if reason == "NOT_FOUND":
        return json_error("NOT_FOUND", "Patient introuvable", status=404)
    if reason == "HAS_RDV":
        msg = (
            f"Ce patient ne peut pas être supprimé : {n_rdv} rendez-vous "
            "y sont encore liés. Supprimez ou modifiez ces RDV dans l’agenda, puis réessayez."
        )
        return json_error("CONFLICT", msg, status=409)
    return json_ok({"deleted_id": patient_id})
