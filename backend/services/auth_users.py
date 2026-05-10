"""Utilisateurs applicatifs (connexion démo)."""

import re

from werkzeug.security import check_password_hash, generate_password_hash

from backend.db.pool import get_pool
from backend.services.serialization import row_to_dict

_USERNAME_RE = re.compile(r"^[a-zA-Z0-9_.-]{3,80}$")


class UsernameTakenError(Exception):
    """Identifiant déjà présent en base."""


def normalize_and_validate_username(username):
    u = (username or "").strip()
    if not _USERNAME_RE.fullmatch(u):
        raise ValueError(
            "Identifiant : 3 à 80 caractères (lettres, chiffres, tirets, underscores, points)."
        )
    return u


def validate_password_plain(password):
    if password is None or len(password) < 6:
        raise ValueError("Mot de passe : au moins 6 caractères.")
    if len(password) > 256:
        raise ValueError("Mot de passe trop long.")
    return password


def get_user_by_id(user_id):
    pool = get_pool()
    sql = "SELECT id, username FROM app_users WHERE id = :id"
    with pool.acquire() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, {"id": user_id})
            row = cur.fetchone()
            if not row:
                return None
            return row_to_dict(cur, row)


def get_user_with_hash(username):
    pool = get_pool()
    sql = "SELECT id, username, password_hash FROM app_users WHERE username = :u"
    with pool.acquire() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, {"u": username.strip()})
            row = cur.fetchone()
            if not row:
                return None
            return row_to_dict(cur, row)


def verify_credentials(username, password):
    user = get_user_with_hash(username)
    if user is None:
        return None
    stored = user.get("password_hash")
    if not stored:
        return None
    if not isinstance(stored, str):
        stored = str(stored)
    try:
        valid = check_password_hash(stored, password)
    except (ValueError, TypeError, AttributeError):
        return None
    if not valid:
        return None
    uid = user["id"]
    uid = int(uid) if uid is not None else None
    return {"id": uid, "username": str(user["username"])}


def create_user(username, password):
    """Crée un compte ; lève UsernameTakenError ou ValueError."""
    u = normalize_and_validate_username(username)
    validate_password_plain(password)
    if get_user_with_hash(u) is not None:
        raise UsernameTakenError()
    pwd_hash = generate_password_hash(password)
    pool = get_pool()
    out_id = None
    with pool.acquire() as conn:
        with conn.cursor() as cur:
            rid = cur.var(int)
            cur.execute(
                """
                INSERT INTO app_users (username, password_hash)
                VALUES (:u, :h)
                RETURNING id INTO :rid
                """,
                {"u": u, "h": pwd_hash, "rid": rid},
            )
            out_id = int(rid.getvalue()[0])
            conn.commit()
    return {"id": out_id, "username": u}
