"""Réponses JSON homogènes (cahier des charges §8.6)."""

from flask import jsonify


def json_ok(data=None, meta=None, status=200):
    body = {"ok": True, "data": data}
    if meta is not None:
        body["meta"] = meta
    return jsonify(body), status


def json_error(code, message, status=400, fields=None):
    err = {"code": code, "message": message}
    if fields:
        err["fields"] = fields
    return jsonify({"ok": False, "error": err}), status
