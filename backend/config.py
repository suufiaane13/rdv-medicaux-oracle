"""Configuration chargée depuis l'environnement (.env)."""

import os


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-in-production")

    ORACLE_USER = os.environ.get("ORACLE_USER", "")
    ORACLE_PASSWORD = os.environ.get("ORACLE_PASSWORD", "")
    ORACLE_CONNECT_STRING = os.environ.get("ORACLE_CONNECT_STRING", "")

    # CORS : origines séparées par des virgules, ou * en dernier recours
    CORS_ORIGINS = os.environ.get(
        "CORS_ORIGINS",
        "http://127.0.0.1:5173,http://localhost:5173",
    )
