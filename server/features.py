"""Store features that need real server logic on top of the generic document
store: reviews (rating aggregation), wishlist (idempotent toggle), newsletter
(validated + deduped signup), a saved address book (single default), and
admin analytics (computed once on the server instead of in the browser).

Reads/writes stay scoped to the signed-in user's own rows, same rule as
crud.py and commerce.py.
"""

from __future__ import annotations

import re
import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field

from auth import current_user, require_admin
from db import db
from docstore import get_doc, insert_doc, iso_now, load_col, save_doc

router = APIRouter(prefix="/api")

_CANCELLED = {"cancelled", "refunded"}


# ── Reviews ─────────────────────────────────────────────────────────


def _recompute_rating(conn, user: dict, product_id: str) -> None:
    products = load_col(conn, user, "products")
    product = products.get(product_id)
    if not product:
        return
    reviews = [r for r in load_col(conn, user, "reviews").values() if r.get("productId") == product_id]
    product["reviewCount"] = len(reviews)
    product["rating"] = round(sum(float(r.get("rating", 0)) for r in reviews) / len(reviews), 2) if reviews else 0
    save_doc(conn, user, "products", product["id"], product)


class ReviewIn(BaseModel):
    productId: str
    author: str = Field(min_length=1, max_length=80)
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=1, max_length=2000)
    title: str | None = None


@router.post("/reviews", status_code=201)
def submit_review(body: ReviewIn, user: dict = Depends(current_user)) -> dict[str, Any]:
    """Create or update the signed-in user's review for a product, then
    recompute that product's rating/reviewCount from all reviews it has."""
    with db() as conn:
        products = load_col(conn, user, "products")
        if body.productId not in products:
            raise HTTPException(404, "product not found")

        orders = load_col(conn, user, "orders")
        verified = any(
            o.get("status") not in _CANCELLED and any(it.get("productId") == body.productId for it in o.get("items", []))
            for o in orders.values()
        )

        reviews = load_col(conn, user, "reviews")
        existing = next(
            (
                r
                for r in reviews.values()
                if r.get("productId") == body.productId and r.get("author", "").strip().lower() == body.author.strip().lower()
            ),
            None,
        )
        doc = {
            "productId": body.productId,
            "author": body.author.strip(),
            "rating": body.rating,
            "title": (body.title or "").strip() or None,
            "comment": body.comment.strip(),
            "date": iso_now()[:10],
            "verified": verified,
        }
        if existing:
            review_id = existing["id"]
            save_doc(conn, user, "reviews", review_id, doc)
        else:
            review_id = uuid.uuid4().hex
            insert_doc(conn, user, "reviews", review_id, doc)

        _recompute_rating(conn, user, body.productId)
        result = get_doc(conn, user, "reviews", review_id)
    return result


@router.delete("/reviews/{review_id}", status_code=204)
def delete_review(review_id: str, user: dict = Depends(current_user)) -> None:
    with db() as conn:
        review = get_doc(conn, user, "reviews", review_id)
        conn.execute(
            "DELETE FROM docs WHERE owner = ? AND col = 'reviews' AND id = ?", (user["id"], review_id)
        )
        _recompute_rating(conn, user, review["productId"])


# ── Wishlist ────────────────────────────────────────────────────────


class WishlistToggleIn(BaseModel):
    productId: str


@router.post("/wishlist/toggle")
def toggle_wishlist(body: WishlistToggleIn, user: dict = Depends(current_user)) -> dict[str, Any]:
    """Add the product if it isn't already saved, remove it if it is —
    one request either way, and never a duplicate entry for the same product."""
    with db() as conn:
        items = load_col(conn, user, "wishlist")
        existing = next((w for w in items.values() if w.get("productId") == body.productId), None)
        if existing:
            conn.execute(
                "DELETE FROM docs WHERE owner = ? AND col = 'wishlist' AND id = ?", (user["id"], existing["id"])
            )
            return {"saved": False, "productId": body.productId}
        wish_id = uuid.uuid4().hex
        insert_doc(conn, user, "wishlist", wish_id, {"productId": body.productId})
        return {"saved": True, "productId": body.productId, "id": wish_id}


# ── Newsletter ──────────────────────────────────────────────────────


class NewsletterIn(BaseModel):
    email: EmailStr


@router.post("/newsletter/subscribe", status_code=201)
def subscribe_newsletter(body: NewsletterIn, user: dict = Depends(current_user)) -> dict[str, Any]:
    email = str(body.email).strip().lower()
    with db() as conn:
        subs = load_col(conn, user, "newsletter")
        existing = next((s for s in subs.values() if str(s.get("email", "")).lower() == email), None)
        if existing:
            return {"email": email, "alreadySubscribed": True}
        sub_id = uuid.uuid4().hex
        insert_doc(conn, user, "newsletter", sub_id, {"email": email, "subscribedAt": iso_now()})
    return {"email": email, "alreadySubscribed": False}


# ── Address book ────────────────────────────────────────────────────


_PINCODE_RE = re.compile(r"^\d{4,10}$")


class AddressIn(BaseModel):
    fullName: str = Field(min_length=1, max_length=120)
    email: str = ""
    line1: str = Field(min_length=1, max_length=200)
    city: str = Field(min_length=1, max_length=80)
    state: str = Field(min_length=1, max_length=80)
    pincode: str
    phone: str = Field(min_length=1, max_length=20)
    isDefault: bool = False

    def clean_pincode(self) -> str:
        p = self.pincode.strip()
        if not _PINCODE_RE.match(p):
            raise HTTPException(400, "enter a valid pincode")
        return p


def _unset_other_defaults(conn, user: dict, except_id: str | None = None) -> None:
    addrs = load_col(conn, user, "addresses")
    for a in addrs.values():
        if a["id"] != except_id and a.get("isDefault"):
            a["isDefault"] = False
            save_doc(conn, user, "addresses", a["id"], a)


@router.post("/addresses", status_code=201)
def create_address(body: AddressIn, user: dict = Depends(current_user)) -> dict[str, Any]:
    with db() as conn:
        addrs = load_col(conn, user, "addresses")
        make_default = body.isDefault or not addrs
        doc = {**body.model_dump(), "pincode": body.clean_pincode(), "isDefault": make_default}
        addr_id = uuid.uuid4().hex
        insert_doc(conn, user, "addresses", addr_id, doc)
        if make_default:
            _unset_other_defaults(conn, user, except_id=addr_id)
        result = get_doc(conn, user, "addresses", addr_id)
    return result


@router.put("/addresses/{address_id}")
def update_address(address_id: str, body: AddressIn, user: dict = Depends(current_user)) -> dict[str, Any]:
    with db() as conn:
        get_doc(conn, user, "addresses", address_id)  # 404s if missing/not owned
        doc = {**body.model_dump(), "pincode": body.clean_pincode()}
        save_doc(conn, user, "addresses", address_id, doc)
        if doc["isDefault"]:
            _unset_other_defaults(conn, user, except_id=address_id)
        result = get_doc(conn, user, "addresses", address_id)
    return result


@router.delete("/addresses/{address_id}", status_code=204)
def delete_address(address_id: str, user: dict = Depends(current_user)) -> None:
    with db() as conn:
        get_doc(conn, user, "addresses", address_id)
        conn.execute("DELETE FROM docs WHERE owner = ? AND col = 'addresses' AND id = ?", (user["id"], address_id))


# ── Admin analytics ─────────────────────────────────────────────────


@router.get("/admin/stats")
def admin_stats(user: dict = Depends(require_admin)) -> dict[str, Any]:
    with db() as conn:
        products = list(load_col(conn, user, "products").values())
        orders = list(load_col(conn, user, "orders").values())

    live_orders = [o for o in orders if o.get("status") not in _CANCELLED]
    revenue = round(sum(float(o.get("total", 0)) for o in live_orders), 2)
    pending = sum(1 for o in orders if o.get("status") == "pending")

    by_category: dict[str, float] = {}
    for p in products:
        cat = p.get("category") or "Other"
        by_category[cat] = by_category.get(cat, 0) + int(p.get("stock", 0))

    low_stock = sorted(
        [{"id": p["id"], "name": p["name"], "stock": int(p.get("stock", 0))} for p in products if int(p.get("stock", 0)) <= 10],
        key=lambda p: p["stock"],
    )[:10]

    top_products: dict[str, dict[str, Any]] = {}
    for o in live_orders:
        for it in o.get("items", []):
            row = top_products.setdefault(it["productId"], {"productId": it["productId"], "name": it["name"], "unitsSold": 0, "revenue": 0.0})
            row["unitsSold"] += int(it.get("qty", 0))
            row["revenue"] += float(it.get("price", 0)) * int(it.get("qty", 0))
    top_sorted = sorted(top_products.values(), key=lambda r: -r["revenue"])[:5]

    return {
        "revenue": revenue,
        "orderCount": len(orders),
        "pending": pending,
        "productCount": len(products),
        "byCategory": [{"label": k, "value": v} for k, v in sorted(by_category.items(), key=lambda kv: -kv[1])],
        "lowStock": low_stock,
        "topProducts": top_sorted,
    }
