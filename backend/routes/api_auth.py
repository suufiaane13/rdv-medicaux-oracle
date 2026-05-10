"""POST /api/auth/login, register, logout — GET /api/auth/me."""

from flask import Blueprint, current_app, request, session

from backend.responses import json_error, json_ok
from backend.services import auth_users

bp = Blueprint("api_auth", __name__)


@bp.route("/auth/login", methods=["POST"])
def login():
    body = request.get_json(silent=True) or {}
    username = body.get("username")
    password = body.get("password")
    if not username or not password:
        return json_error(
            "VALIDATION_ERROR",
            "username et password requis",
            status=400,
            fields={"username": "obligatoire", "password": "obligatoire"},
        )
    try:
        user = auth_users.verify_credentials(username, password)
    except Exception as e:
        current_app.logger.exception("Erreur lors de la connexion")
        detail = str(e) if current_app.debug else "Erreur serveur (voir les logs Flask)."
        return json_error("SERVER_ERROR", detail, status=500)
    if user is None:
        return json_error(
            "INVALID_CREDENTIALS",
            "Identifiant ou mot de passe incorrect",
            status=401,
        )
    session.clear()
    session["user_id"] = int(user["id"])
    session.permanent = True
    return json_ok(user)


@bp.route("/auth/register", methods=["POST"])
def register():
    body = request.get_json(silent=True) or {}
    username = body.get("username")
    password = body.get("password")
    password_confirm = body.get("password_confirm")
    if password != password_confirm:
        return json_error(
            "VALIDATION_ERROR",
            "Les mots de passe ne correspondent pas",
            status=400,
            fields={"password_confirm": "doit être identique au mot de passe"},
        )
    if not username or not password:
        return json_error(
            "VALIDATION_ERROR",
            "username et password requis",
            status=400,
            fields={
                "username": "obligatoire" if not (username or "").strip() else None,
                "password": "obligatoire" if not password else None,
            },
        )
    try:
        user = auth_users.create_user(username, password)
    except auth_users.UsernameTakenError:
        return json_error(
            "USERNAME_TAKEN",
            "Cet identifiant est déjà utilisé",
            status=409,
            fields={"username": "déjà utilisé"},
        )
    except ValueError as e:
        msg = str(e)
        return json_error(
            "VALIDATION_ERROR",
            msg,
            status=400,
            fields={"username": msg if "Identifiant" in msg else None,
                    "password": msg if "Mot de passe" in msg else None},
        )
    except Exception as e:
        current_app.logger.exception("Erreur lors de l'inscription")
        detail = str(e) if current_app.debug else "Erreur serveur (voir les logs Flask)."
        return json_error("SERVER_ERROR", detail, status=500)
    session.clear()
    session["user_id"] = int(user["id"])
    session.permanent = True
    return json_ok(user, status=201)


@bp.route("/auth/logout", methods=["POST"])
def logout():
    session.clear()
    return json_ok({"logged_out": True})


@bp.route("/auth/me", methods=["GET"])
def me():
    uid = session.get("user_id")
    if uid is None:
        return json_error("UNAUTHORIZED", "Non connecté", status=401)
    user = auth_users.get_user_by_id(uid)
    if user is None:
        session.clear()
        return json_error("UNAUTHORIZED", "Session invalide", status=401)
    return json_ok(user)
