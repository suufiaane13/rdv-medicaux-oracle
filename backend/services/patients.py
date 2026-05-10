"""CRUD patients — SQL paramétré."""

import re

from backend.db.pool import get_pool
from backend.services.serialization import row_to_dict, rows_to_list

_CIN_RE = re.compile(r"^[A-Z]{1,2}[0-9]{5,6}$")


def parse_cin_input(raw):
    """Normalise et valide le CIN (optionnel). Retourne (valeur ou None, message d'erreur ou None)."""
    if raw is None:
        return None, None
    s = str(raw).strip()
    if not s:
        return None, None
    s = s.upper()
    if not _CIN_RE.fullmatch(s):
        return None, "Format attendu : 1 ou 2 lettres puis 5 ou 6 chiffres (ex. AB123456)."
    return s, None


def list_patients(q=None, page=1, page_size=20):
    pool = get_pool()
    page = max(1, int(page or 1))
    page_size = min(100, max(1, int(page_size or 20)))
    offset = (page - 1) * page_size

    if q and q.strip():
        pat = f"%{q.strip().upper()}%"
        where_sql = """(
            UPPER(nom) LIKE :pat OR UPPER(prenom) LIKE :pat
            OR UPPER(NVL(telephone, ' ')) LIKE :pat
            OR UPPER(NVL(cin, ' ')) LIKE :pat
        )"""
        binds_count = {"pat": pat}
        binds_list = {"pat": pat, "off": offset, "ps": page_size}
    else:
        where_sql = "1=1"
        binds_count = {}
        binds_list = {"off": offset, "ps": page_size}

    sql_count = f"SELECT COUNT(*) FROM patients WHERE {where_sql}"
    sql_list = f"""
        SELECT id, nom, prenom, cin, telephone, email FROM patients
        WHERE {where_sql}
        ORDER BY nom, prenom
        OFFSET :off ROWS FETCH NEXT :ps ROWS ONLY
    """

    with pool.acquire() as conn:
        with conn.cursor() as cur:
            if binds_count:
                cur.execute(sql_count, binds_count)
            else:
                cur.execute(sql_count)
            total = cur.fetchone()[0]
            cur.execute(sql_list, binds_list)
            rows = cur.fetchall()
            data = rows_to_list(cur, rows)

    meta = {"page": page, "page_size": page_size, "total": total}
    return data, meta


def get_patient_by_id(patient_id):
    pool = get_pool()
    sql = """
        SELECT id, nom, prenom, cin, telephone, email FROM patients WHERE id = :id
    """
    with pool.acquire() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, {"id": patient_id})
            row = cur.fetchone()
            if not row:
                return None
            return row_to_dict(cur, row)


def list_rdv_for_patient(patient_id):
    pool = get_pool()
    sql = """
        SELECT r.id, r.date_heure, r.motif, r.statut, r.duree_minutes,
               m.nom AS medecin_nom, m.specialite AS medecin_specialite
        FROM rendez_vous r
        JOIN medecins m ON m.id = r.medecin_id
        WHERE r.patient_id = :pid
        ORDER BY r.date_heure DESC
    """
    with pool.acquire() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, {"pid": patient_id})
            rows = cur.fetchall()
            return rows_to_list(cur, rows)


def create_patient(nom, prenom, telephone=None, email=None, cin=None):
    pool = get_pool()
    out_id = None
    with pool.acquire() as conn:
        with conn.cursor() as cur:
            rid = cur.var(int)
            cur.execute(
                """
                INSERT INTO patients (nom, prenom, cin, telephone, email)
                VALUES (:nom, :prenom, :cin, :telephone, :email)
                RETURNING id INTO :rid
                """,
                {
                    "nom": nom,
                    "prenom": prenom,
                    "telephone": telephone,
                    "email": email,
                    "cin": cin,
                    "rid": rid,
                },
            )
            out_id = int(rid.getvalue()[0])
            conn.commit()
    return get_patient_by_id(out_id)


def update_patient(patient_id, fields):
    """fields : dict avec clés optionnelles nom, prenom, telephone, email, cin."""
    allowed = {"nom", "prenom", "telephone", "email", "cin"}
    updates = {}
    for k in allowed:
        if k not in fields:
            continue
        if k == "cin":
            cin_val, cin_err = parse_cin_input(fields["cin"])
            if cin_err:
                raise ValueError(cin_err)
            updates["cin"] = cin_val
            continue
        updates[k] = fields[k]
    if not updates:
        return get_patient_by_id(patient_id)

    set_parts = []
    binds = {"pid": patient_id}
    for key in updates:
        set_parts.append(f"{key} = :{key}")
        binds[key] = updates[key]

    sql = f"UPDATE patients SET {', '.join(set_parts)} WHERE id = :pid"
    pool = get_pool()
    with pool.acquire() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, binds)
            if cur.rowcount == 0:
                return None
            conn.commit()
    return get_patient_by_id(patient_id)


def delete_patient(patient_id):
    """Supprime un patient si aucun RDV ne le référence.

    Retourne (True, None, 0) ou (False, raison, nb_rdv_si_blocage).
    """
    pool = get_pool()
    with pool.acquire() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT COUNT(*) FROM rendez_vous WHERE patient_id = :id",
                {"id": patient_id},
            )
            n_rdv = int(cur.fetchone()[0])
            if n_rdv > 0:
                return False, "HAS_RDV", n_rdv
            cur.execute("DELETE FROM patients WHERE id = :id", {"id": patient_id})
            if cur.rowcount == 0:
                return False, "NOT_FOUND", 0
            conn.commit()
    return True, None, 0
