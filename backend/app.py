"""Application Flask — factory create_app."""

from flask import Flask, request, session

from flask_cors import CORS

from backend.config import Config
from backend.responses import json_error
from backend.routes.api_accueil import bp as bp_accueil
from backend.routes.api_auth import bp as bp_auth
from backend.routes.api_health import bp as bp_health
from backend.routes.api_medecins import bp as bp_medecins
from backend.routes.api_patients import bp as bp_patients
from backend.routes.api_rendez_vous import bp as bp_rdv


def create_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = Config.SECRET_KEY
    app.config["SESSION_COOKIE_HTTPONLY"] = True
    app.config["SESSION_COOKIE_SAMESITE"] = "Lax"

    origins = [o.strip() for o in Config.CORS_ORIGINS.split(",") if o.strip()]
    CORS(
        app,
        supports_credentials=True,
        origins=origins,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    )

    app.register_blueprint(bp_health, url_prefix="/api")
    app.register_blueprint(bp_accueil, url_prefix="/api")
    app.register_blueprint(bp_auth, url_prefix="/api")
    app.register_blueprint(bp_patients, url_prefix="/api")
    app.register_blueprint(bp_medecins, url_prefix="/api")
    app.register_blueprint(bp_rdv, url_prefix="/api")

    @app.before_request
    def require_login():
        if request.method == "OPTIONS":
            return None
        path = request.path or ""
        if not path.startswith("/api"):
            return None
        if path.startswith("/api/health"):
            return None
        if path == "/api/auth/login" and request.method == "POST":
            return None
        if path == "/api/auth/register" and request.method == "POST":
            return None
        if path == "/api/auth/logout" and request.method == "POST":
            return None
        if session.get("user_id") is None:
            return json_error(
                "UNAUTHORIZED",
                "Authentification requise",
                status=401,
            )
        return None

    return app
