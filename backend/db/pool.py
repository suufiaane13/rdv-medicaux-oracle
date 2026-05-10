"""Pool de connexions Oracle (python-oracledb mode thin)."""

import oracledb

from backend.config import Config

_pool = None


def init_pool():
    global _pool
    if _pool is not None:
        return _pool
    if not Config.ORACLE_USER or not Config.ORACLE_CONNECT_STRING:
        raise RuntimeError(
            "Variables ORACLE_USER et ORACLE_CONNECT_STRING requises dans .env"
        )
    _pool = oracledb.create_pool(
        user=Config.ORACLE_USER,
        password=Config.ORACLE_PASSWORD or "",
        dsn=Config.ORACLE_CONNECT_STRING,
        min=1,
        max=5,
        increment=1,
    )
    return _pool


def get_pool():
    if _pool is None:
        return init_pool()
    return _pool
