"""Shared helpers for reading/writing the generic per-user `docs` table with
real objects instead of raw SQL — used by any router that needs business
logic on top of a user's collections (commerce.py, features.py).

Every function here still enforces the same rule as crud.py: all reads and
writes are scoped to `owner = user["id"]`, so one signed-in user can never
see or touch another's documents.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any

from db import now


def iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def load_col(conn, user: dict, col: str) -> dict[str, dict[str, Any]]:
    rows = conn.execute("SELECT * FROM docs WHERE owner = ? AND col = ?", (user["id"], col)).fetchall()
    out: dict[str, dict[str, Any]] = {}
    for r in rows:
        d = json.loads(r["body"])
        d["id"] = r["id"]
        d["_created"] = r["created"]
        d["_updated"] = r["updated"]
        out[r["id"]] = d
    return out


def save_doc(conn, user: dict, col: str, doc_id: str, doc: dict[str, Any]) -> None:
    body = {k: v for k, v in doc.items() if k not in ("id", "_created", "_updated")}
    payload = json.dumps(body, separators=(",", ":"), default=str)
    conn.execute(
        "UPDATE docs SET body = ?, updated = ? WHERE owner = ? AND col = ? AND id = ?",
        (payload, now(), user["id"], col, doc_id),
    )


def insert_doc(conn, user: dict, col: str, doc_id: str, doc: dict[str, Any]) -> None:
    payload = json.dumps(doc, separators=(",", ":"), default=str)
    t = now()
    conn.execute(
        "INSERT INTO docs (col, id, owner, body, created, updated) VALUES (?,?,?,?,?,?)",
        (col, doc_id, user["id"], payload, t, t),
    )


def get_doc(conn, user: dict, col: str, doc_id: str) -> dict[str, Any]:
    r = conn.execute(
        "SELECT * FROM docs WHERE owner = ? AND col = ? AND id = ?", (user["id"], col, doc_id)
    ).fetchone()
    d = json.loads(r["body"])
    d["id"] = r["id"]
    d["_created"] = r["created"]
    d["_updated"] = r["updated"]
    return d


def delete_doc(conn, user: dict, col: str, doc_id: str) -> None:
    conn.execute("DELETE FROM docs WHERE owner = ? AND col = ? AND id = ?", (user["id"], col, doc_id))
