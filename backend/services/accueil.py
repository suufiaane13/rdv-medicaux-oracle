"""Résumé accueil — lectures vues Oracle v_accueil_resume, v_prochains_rdv."""

from backend.db.pool import get_pool
from backend.services.serialization import row_to_dict, rows_to_list


def get_accueil_resume():
    pool = get_pool()
    sql = "SELECT * FROM v_accueil_resume"
    with pool.acquire() as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
            row = cur.fetchone()
            if not row:
                return None
            return row_to_dict(cur, row)


def list_prochains_rdv(limit=50):
    """Lignes de v_prochains_rdv triées par date (borne pour l’accueil)."""
    lim = max(1, min(int(limit), 200))
    pool = get_pool()
    sql = """
        SELECT * FROM v_prochains_rdv
        ORDER BY
            CASE WHEN TRUNC(date_heure) >= TRUNC(SYSTIMESTAMP) THEN 0 ELSE 1 END,
            CASE WHEN TRUNC(date_heure) >= TRUNC(SYSTIMESTAMP) THEN date_heure END ASC NULLS LAST,
            CASE WHEN TRUNC(date_heure) < TRUNC(SYSTIMESTAMP) THEN date_heure END DESC NULLS LAST
        FETCH FIRST :lim ROWS ONLY
    """
    with pool.acquire() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, {"lim": lim})
            rows = cur.fetchall()
            return rows_to_list(cur, rows)
