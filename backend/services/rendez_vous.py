"""Rendez-vous : listes, détail, création, mise à jour, chevauchement médecin."""

from datetime import datetime, timedelta, timezone

from backend.db.pool import get_pool
from backend.services import medecins, patients
from backend.services.serialization import row_to_dict, rows_to_list

STATUTS = ("planifie", "confirme", "annule", "termine")
STATUT_ANNULE = "annule"
DEFAULT_DUREE = 30


def _parse_iso_dt(value):
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    s = str(value).strip()
    if len(s) == 10 and s[4] == "-" and s[7] == "-":
        s = s + "T00:00:00"
    dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
    if dt.tzinfo is not None:
        dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


def list_rendez_vous(
    date_debut=None,
    date_fin=None,
    medecin_id=None,
    statut=None,
    patient_id=None,
):
    pool = get_pool()
    clauses = ["1=1"]
    binds = {}

    if date_debut is not None:
        clauses.append("r.date_heure >= :d_debut")
        binds["d_debut"] = _parse_iso_dt(date_debut)
    if date_fin is not None:
        clauses.append("r.date_heure < :d_fin")
        binds["d_fin"] = _parse_iso_dt(date_fin)
    if medecin_id is not None:
        clauses.append("r.medecin_id = :mid")
        binds["mid"] = int(medecin_id)
    if statut is not None:
        clauses.append("r.statut = :st")
        binds["st"] = statut
    if patient_id is not None:
        clauses.append("r.patient_id = :pid")
        binds["pid"] = int(patient_id)

    where_sql = " AND ".join(clauses)
    sql = f"""
        SELECT
            r.id,
            r.patient_id,
            r.medecin_id,
            r.date_heure,
            r.motif,
            r.statut,
            r.duree_minutes,
            p.nom AS patient_nom,
            p.prenom AS patient_prenom,
            m.nom AS medecin_nom,
            m.specialite AS medecin_specialite
        FROM rendez_vous r
        JOIN patients p ON p.id = r.patient_id
        JOIN medecins m ON m.id = r.medecin_id
        WHERE {where_sql}
        ORDER BY r.date_heure
    """
    with pool.acquire() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, binds)
            rows = cur.fetchall()
            return rows_to_list(cur, rows)


def get_rendez_vous_by_id(rdv_id):
    pool = get_pool()
    sql = """
        SELECT
            r.id,
            r.patient_id,
            r.medecin_id,
            r.date_heure,
            r.motif,
            r.statut,
            r.duree_minutes,
            p.nom AS patient_nom,
            p.prenom AS patient_prenom,
            p.telephone AS patient_telephone,
            m.nom AS medecin_nom,
            m.specialite AS medecin_specialite
        FROM rendez_vous r
        JOIN patients p ON p.id = r.patient_id
        JOIN medecins m ON m.id = r.medecin_id
        WHERE r.id = :id
    """
    with pool.acquire() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, {"id": rdv_id})
            row = cur.fetchone()
            if not row:
                return None
            return row_to_dict(cur, row)


def _overlap_count(conn, medecin_id, start, duration_min, exclude_id=None):
    """Deux créneaux [start, start+dur) et existants se croisent si intervalles se chevauchent."""
    end = start + timedelta(minutes=int(duration_min))
    exid = int(exclude_id) if exclude_id is not None else -1
    sql = """
        SELECT COUNT(*) FROM rendez_vous
        WHERE medecin_id = :mid
        AND statut <> :annule
        AND ( :exid < 0 OR id <> :exid )
        AND date_heure < :end_t
        AND date_heure + NUMTODSINTERVAL(NVL(duree_minutes, :defdur), 'MINUTE') > :start_t
    """
    with conn.cursor() as cur:
        cur.execute(
            sql,
            {
                "mid": medecin_id,
                "annule": STATUT_ANNULE,
                "exid": exid,
                "end_t": end,
                "start_t": start,
                "defdur": DEFAULT_DUREE,
            },
        )
        return cur.fetchone()[0]


def create_rendez_vous(patient_id, medecin_id, date_heure, motif=None, statut=None, duree_minutes=None):
    if patients.get_patient_by_id(patient_id) is None:
        return None, "NOT_FOUND", {"patient_id": "aucun patient avec cet id"}
    if medecins.get_medecin_by_id(medecin_id) is None:
        return None, "NOT_FOUND", {"medecin_id": "aucun médecin avec cet id"}

    start = _parse_iso_dt(date_heure)
    dur = int(duree_minutes) if duree_minutes is not None else DEFAULT_DUREE
    st = statut if statut in STATUTS else "planifie"

    pool = get_pool()
    with pool.acquire() as conn:
        if st != STATUT_ANNULE and _overlap_count(conn, medecin_id, start, dur, None) > 0:
            return None, "CONFLICT", None

        with conn.cursor() as cur:
            rid = cur.var(int)
            cur.execute(
                """
                INSERT INTO rendez_vous (
                    patient_id, medecin_id, date_heure, motif, statut, duree_minutes
                )
                VALUES (:pid, :mid, :dh, :motif, :st, :dur)
                RETURNING id INTO :rid
                """,
                {
                    "pid": patient_id,
                    "mid": medecin_id,
                    "dh": start,
                    "motif": motif,
                    "st": st,
                    "dur": dur,
                    "rid": rid,
                },
            )
            new_id = int(rid.getvalue()[0])
            conn.commit()

    return get_rendez_vous_by_id(new_id), None, None


def update_rendez_vous(rdv_id, fields):
    current = get_rendez_vous_by_id(rdv_id)
    if current is None:
        return None, "NOT_FOUND"

    def _as_int(x):
        return int(x) if x is not None else None

    patient_id = (
        _as_int(fields["patient_id"]) if "patient_id" in fields else _as_int(current["patient_id"])
    )
    medecin_id = (
        _as_int(fields["medecin_id"]) if "medecin_id" in fields else _as_int(current["medecin_id"])
    )
    motif = fields.get("motif", current.get("motif"))
    statut = fields.get("statut", current.get("statut"))
    duree_minutes = fields.get("duree_minutes", current.get("duree_minutes"))
    if "date_heure" in fields:
        date_heure = fields["date_heure"]
    else:
        date_heure = current["date_heure"]

    if isinstance(date_heure, str):
        start = _parse_iso_dt(date_heure)
    else:
        start = _parse_iso_dt(date_heure)

    dur = int(duree_minutes) if duree_minutes is not None else DEFAULT_DUREE
    if statut is not None and statut not in STATUTS:
        return None, "VALIDATION"

    if patient_id != _as_int(current["patient_id"]):
        if patients.get_patient_by_id(patient_id) is None:
            return None, "BAD_PATIENT"
    if medecin_id != _as_int(current["medecin_id"]):
        if medecins.get_medecin_by_id(medecin_id) is None:
            return None, "BAD_MED"

    eff_statut = statut if statut is not None else current.get("statut")
    pool = get_pool()
    with pool.acquire() as conn:
        if eff_statut != STATUT_ANNULE and _overlap_count(
            conn, medecin_id, start, dur, rdv_id
        ) > 0:
            return None, "CONFLICT"

        set_parts = []
        binds = {"rid": rdv_id}
        if "patient_id" in fields:
            set_parts.append("patient_id = :pid")
            binds["pid"] = patient_id
        if "medecin_id" in fields:
            set_parts.append("medecin_id = :mid")
            binds["mid"] = medecin_id
        if "motif" in fields:
            set_parts.append("motif = :motif")
            binds["motif"] = motif
        if "statut" in fields:
            set_parts.append("statut = :st")
            binds["st"] = statut
        if "duree_minutes" in fields:
            set_parts.append("duree_minutes = :dur")
            binds["dur"] = dur
        if "date_heure" in fields:
            set_parts.append("date_heure = :dh")
            binds["dh"] = start

        if not set_parts:
            return current, None

        sql = f"UPDATE rendez_vous SET {', '.join(set_parts)} WHERE id = :rid"
        with conn.cursor() as cur:
            cur.execute(sql, binds)
            if cur.rowcount == 0:
                return None, "NOT_FOUND"
            conn.commit()

    return get_rendez_vous_by_id(rdv_id), None


def delete_rendez_vous(rdv_id):
    """Suppression physique du RDV. L’historisation dans rdv_suppressions_historique est faite par le trigger Oracle
    tr_rdv_hist_after_delete (voir sql/01_installation/02_database.sql), pas par l’API.
    """
    pool = get_pool()
    rid = int(rdv_id)
    sql_del = "DELETE FROM rendez_vous WHERE id = :id"
    with pool.acquire() as conn:
        with conn.cursor() as cur:
            cur.execute(sql_del, {"id": rid})
            if cur.rowcount == 0:
                conn.rollback()
                return False
            conn.commit()
    return True


def list_historique_suppressions():
    pool = get_pool()
    sql = """
        SELECT
            h.id,
            h.ancien_rdv_id,
            h.patient_id,
            h.medecin_id,
            h.date_heure,
            h.motif,
            h.statut,
            h.duree_minutes,
            h.supprime_le,
            p.nom AS patient_nom,
            p.prenom AS patient_prenom,
            m.nom AS medecin_nom,
            m.specialite AS medecin_specialite
        FROM rdv_suppressions_historique h
        LEFT JOIN patients p ON p.id = h.patient_id
        LEFT JOIN medecins m ON m.id = h.medecin_id
        ORDER BY h.supprime_le DESC
    """
    with pool.acquire() as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
            rows = cur.fetchall()
            return rows_to_list(cur, rows)


def delete_historique_suppression(hist_id):
    pool = get_pool()
    with pool.acquire() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM rdv_suppressions_historique WHERE id = :id",
                {"id": hist_id},
            )
            if cur.rowcount == 0:
                return False
            conn.commit()
    return True


def delete_all_historique_suppressions():
    pool = get_pool()
    with pool.acquire() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM rdv_suppressions_historique")
            conn.commit()
    return True
