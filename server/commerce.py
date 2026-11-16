"""Commerce logic that the generic document store can't safely express:
server-priced, server-stocked checkout; coupon validation; order-status
transitions with inventory restock; and real filtered product search.

Everything here still reads/writes only the signed-in user's own `docs` rows
(same `owner = user["id"]` rule as crud.py) — it just adds real business
logic on top instead of trusting whatever the browser sends.
"""

from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from auth import current_user
from db import db
from docstore import get_doc as _row
from docstore import insert_doc as _insert
from docstore import iso_now as _iso_now
from docstore import load_col as _load_col
from docstore import save_doc as _save

router = APIRouter(prefix="/api")

STANDARD_SHIPPING = 99.0
EXPRESS_SHIPPING = 249.0
FREE_SHIPPING_OVER = 2999.0

_RESTOCK_STATUSES = {"cancelled", "refunded"}
_VALID_STATUSES = {"pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"}


def _price_coupon(coupon: dict[str, Any], subtotal: float) -> float:
    if coupon["discountType"] == "percentage":
        discount = subtotal * float(coupon["discountValue"]) / 100
        cap = coupon.get("maximumDiscount")
        if cap:
            discount = min(discount, float(cap))
    else:
        discount = float(coupon["discountValue"])
    return round(min(max(discount, 0), subtotal), 2)


def _check_coupon(coupon: dict[str, Any] | None, code: str, subtotal: float) -> dict[str, Any]:
    if not coupon:
        raise HTTPException(404, f'coupon "{code}" was not found')
    if not coupon.get("active", True):
        raise HTTPException(400, "this coupon is no longer active")
    expiry = coupon.get("expiry")
    if expiry and str(expiry) < _iso_now():
        raise HTTPException(400, "this coupon has expired")
    min_order = float(coupon.get("minimumOrder") or 0)
    if subtotal < min_order:
        raise HTTPException(400, f"add ₹{min_order - subtotal:.0f} more to use this coupon")
    usage_limit = coupon.get("usageLimit")
    if usage_limit is not None and float(coupon.get("usageCount") or 0) >= float(usage_limit):
        raise HTTPException(400, "this coupon has reached its usage limit")
    return coupon


class CouponCheck(BaseModel):
    code: str
    subtotal: float = 0


@router.post("/coupons/validate")
def validate_coupon(body: CouponCheck, user: dict = Depends(current_user)) -> dict[str, Any]:
    code = body.code.strip().upper()
    if not code:
        raise HTTPException(400, "enter a coupon code")
    with db() as conn:
        coupons = _load_col(conn, user, "coupons")
    match = next((c for c in coupons.values() if str(c.get("code", "")).upper() == code), None)
    match = _check_coupon(match, code, body.subtotal)
    discount = _price_coupon(match, body.subtotal)
    return {
        "code": match["code"],
        "discountType": match["discountType"],
        "discountValue": match["discountValue"],
        "discount": discount,
    }


class CheckoutLine(BaseModel):
    productId: str
    qty: int
    color: str | None = None
    size: str | None = None


class CheckoutBody(BaseModel):
    items: list[CheckoutLine]
    address: dict[str, Any]
    delivery: str = "standard"
    paymentMethod: str = "cod"
    couponCode: str | None = None


@router.post("/checkout", status_code=201)
def checkout(body: CheckoutBody, user: dict = Depends(current_user)) -> dict[str, Any]:
    if not body.items:
        raise HTTPException(400, "your bag is empty")
    if body.delivery not in ("standard", "express"):
        raise HTTPException(400, "invalid delivery method")
    if body.paymentMethod not in ("cod", "online"):
        raise HTTPException(400, "invalid payment method")

    with db() as conn:
        products = _load_col(conn, user, "products")
        order_items: list[dict[str, Any]] = []
        subtotal = 0.0
        for line in body.items:
            if line.qty <= 0:
                raise HTTPException(400, "quantity must be at least 1")
            p = products.get(line.productId)
            if not p:
                raise HTTPException(400, "one of the items in your bag is no longer available")
            available = int(p.get("stock", 0))
            if available < line.qty:
                raise HTTPException(409, f'"{p["name"]}" only has {available} left in stock')
            price = float(p.get("dealPrice") or p["price"])
            subtotal += price * line.qty
            order_items.append(
                {
                    "productId": p["id"],
                    "name": p["name"],
                    "price": price,
                    "qty": line.qty,
                    "image": (p.get("images") or [""])[0],
                    "color": line.color,
                    "size": line.size,
                }
            )
        subtotal = round(subtotal, 2)

        shipping = EXPRESS_SHIPPING if body.delivery == "express" else (0.0 if subtotal >= FREE_SHIPPING_OVER else STANDARD_SHIPPING)

        discount = 0.0
        coupon_match: dict[str, Any] | None = None
        code = (body.couponCode or "").strip().upper()
        if code:
            coupons = _load_col(conn, user, "coupons")
            match = next((c for c in coupons.values() if str(c.get("code", "")).upper() == code), None)
            coupon_match = _check_coupon(match, code, subtotal)
            discount = _price_coupon(coupon_match, subtotal)

        total = round(max(subtotal - discount + shipping, 0), 2)

        for line in body.items:
            p = products[line.productId]
            p["stock"] = int(p.get("stock", 0)) - line.qty
            _save(conn, user, "products", p["id"], p)

        if coupon_match:
            coupon_match["usageCount"] = int(coupon_match.get("usageCount") or 0) + 1
            _save(conn, user, "coupons", coupon_match["id"], coupon_match)

        order_id = uuid.uuid4().hex
        order_doc = {
            "orderNumber": f"NX{uuid.uuid4().hex[:8].upper()}",
            "items": order_items,
            "subtotal": subtotal,
            "shipping": shipping,
            "discount": discount,
            "couponCode": coupon_match["code"] if coupon_match else None,
            "total": total,
            "address": body.address,
            "delivery": body.delivery,
            "paymentMethod": body.paymentMethod,
            "paymentStatus": "paid" if body.paymentMethod == "online" else "pending",
            "status": "pending",
            "placedAt": _iso_now(),
        }
        _insert(conn, user, "orders", order_id, order_doc)
        result = _row(conn, user, "orders", order_id)

    return result


class StatusBody(BaseModel):
    status: str


@router.put("/orders/{order_id}/status")
def update_order_status(order_id: str, body: StatusBody, user: dict = Depends(current_user)) -> dict[str, Any]:
    if body.status not in _VALID_STATUSES:
        raise HTTPException(400, f"status must be one of {sorted(_VALID_STATUSES)}")
    with db() as conn:
        order = _row(conn, user, "orders", order_id)
        prev = order.get("status")
        if prev in _RESTOCK_STATUSES:
            raise HTTPException(400, f"this order is already {prev} and can't be changed")
        order["status"] = body.status
        if body.status in _RESTOCK_STATUSES:
            products = _load_col(conn, user, "products")
            for it in order.get("items", []):
                p = products.get(it["productId"])
                if p:
                    p["stock"] = int(p.get("stock", 0)) + int(it["qty"])
                    _save(conn, user, "products", p["id"], p)
        _save(conn, user, "orders", order_id, order)
        result = _row(conn, user, "orders", order_id)
    return result


@router.get("/products/search")
def search_products(
    q: str = "",
    category: str | None = None,
    subcategory: str | None = None,
    brand: str | None = None,
    minPrice: float | None = None,
    maxPrice: float | None = None,
    minRating: float | None = None,
    inStock: bool | None = None,
    color: str | None = None,
    size: str | None = None,
    sort: str = "relevance",
    limit: int = Query(200, ge=1, le=500),
    user: dict = Depends(current_user),
) -> list[dict[str, Any]]:
    with db() as conn:
        products = list(_load_col(conn, user, "products").values())

    needle = q.strip().lower()

    def matches(p: dict[str, Any]) -> bool:
        if needle:
            hay = " ".join(
                [
                    str(p.get("name", "")),
                    str(p.get("brand", "")),
                    str(p.get("category", "")),
                    str(p.get("subcategory", "")),
                    str(p.get("description", "")),
                    " ".join(p.get("tags") or []),
                ]
            ).lower()
            if needle not in hay:
                return False
        if category and p.get("category") != category:
            return False
        if subcategory and p.get("subcategory") != subcategory:
            return False
        if brand and p.get("brand") != brand:
            return False
        if minPrice is not None and float(p.get("price", 0)) < minPrice:
            return False
        if maxPrice is not None and float(p.get("price", 0)) > maxPrice:
            return False
        if minRating is not None and float(p.get("rating", 0)) < minRating:
            return False
        if inStock and int(p.get("stock", 0)) <= 0:
            return False
        if color and not any(c.get("name") == color for c in (p.get("colors") or [])):
            return False
        if size and size not in (p.get("sizes") or []):
            return False
        return True

    results = [p for p in products if matches(p)]
    if sort == "price-asc":
        results.sort(key=lambda p: float(p.get("price", 0)))
    elif sort == "price-desc":
        results.sort(key=lambda p: -float(p.get("price", 0)))
    elif sort == "rating":
        results.sort(key=lambda p: -float(p.get("rating", 0)))
    elif sort == "newest":
        results.sort(key=lambda p: -(p.get("_created") or 0))
    else:
        results.sort(key=lambda p: -int(bool(p.get("featured"))))
    return results[:limit]
