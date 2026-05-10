"""CRUD médecins — SQL paramétré."""

from backend.db.pool import get_pool
from backend.services.serialization import row_to_dict, rows_to_list


def list_medecins():
    pool = get_pool()
    sql = """
        SELECT id, nom, specialite FROM medecins ORDER BY nom
    """
    with pool.acquire() as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
            rows = cur.fetchall()
            return rows_to_list(cur, rows)


def get_medecin_by_id(medecin_id):
    pool = get_pool()
    sql = "SELECT id, nom, specialite FROM medecins WHERE id = :id"
    with pool.acquire() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, {"id": medecin_id})
            row = cur.fetchone()
            if not row:
                return None
            return row_to_dict(cur, row)


def create_medecin(nom, specialite):
    pool = get_pool()
    with pool.acquire() as conn:
        with conn.cursor() as cur:
            rid = cur.var(int)
            cur.execute(
                """
                INSERT INTO medecins (nom, specialite)
                VALUES (:nom, :specialite)
                RETURNING id INTO :rid
                """,
                {"nom": nom, "specialite": specialite, "rid": rid},
            )
            new_id = int(rid.getvalue()[0])
            conn.commit()
    return get_medecin_by_id(new_id)


def update_medecin(medecin_id, fields):
    allowed = {"nom", "specialite"}
    updates = {k: fields[k] for k in allowed if k in fields}
    if not updates:
        return get_medecin_by_id(medecin_id)

    set_parts = []
    binds = {"mid": medecin_id}
    for key in updates:
        set_parts.append(f"{key} = :{key}")
        binds[key] = updates[key]

    sql = f"UPDATE medecins SET {', '.join(set_parts)} WHERE id = :mid"
    pool = get_pool()
    with pool.acquire() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, binds)
            if cur.rowcount == 0:
                return None
            conn.commit()
    return get_medecin_by_id(medecin_id)


def delete_medecin(medecin_id):
    """Supprime un médecin si aucun RDV ne le référence.

    Retourne (True, None, 0) ou (False, raison, nb_rdv_si_blocage).
    """
    pool = get_pool()
    with pool.acquire() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT COUNT(*) FROM rendez_vous WHERE medecin_id = :id",
                {"id": medecin_id},
            )
            n_rdv = int(cur.fetchone()[0])
            if n_rdv > 0:
                return False, "HAS_RDV", n_rdv
            cur.execute("DELETE FROM medecins WHERE id = :id", {"id": medecin_id})
            if cur.rowcount == 0:
                return False, "NOT_FOUND", 0
            conn.commit()
    return True, None, 0
