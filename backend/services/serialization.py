"""Conversion lignes Oracle → dict JSON-friendly."""

from decimal import Decimal


def row_to_dict(cursor, row):
    cols = [d[0].lower() for d in cursor.description]
    out = {}
    for i, col in enumerate(cols):
        val = row[i]
        if hasattr(val, "isoformat"):
            out[col] = val.isoformat()
        elif isinstance(val, Decimal):
            out[col] = int(val) if val == int(val) else float(val)
        else:
            out[col] = val
    return out


def rows_to_list(cursor, rows):
    return [row_to_dict(cursor, row) for row in rows]
