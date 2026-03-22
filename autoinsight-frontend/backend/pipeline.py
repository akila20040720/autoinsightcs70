from __future__ import annotations

import json
import re
import shutil
from datetime import UTC, datetime, timedelta
from json import JSONDecodeError
from pathlib import Path
from typing import Any

try:
    from .config import Settings
    from .model_validation import ModelValidator
except ImportError:  # pragma: no cover
    from config import Settings  # type: ignore
    from model_validation import ModelValidator  # type: ignore

def _write_json_atomic(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp_path = path.with_suffix(path.suffix + ".tmp")
    temp_path.write_text(json.dumps(payload, ensure_ascii=True, indent=2), encoding="utf-8")
    temp_path.replace(path)


def _to_int(value: object) -> int | None:
    if value is None or value == "":
        return None
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return int(value)
    text = str(value).replace(",", "")
    match = re.search(r"(\d+)", text)
    if not match:
        return None
    return int(match.group(1))


def _parse_price_lkr(value: object) -> int | None:
    if value is None or value == "":
        return None
    if isinstance(value, (int, float)):
        return int(value)
    text = str(value).replace(",", "")
    match = re.search(r"(\d+(?:\.\d+)?)", text)
    if not match:
        return None
    return int(float(match.group(1)))


def _normalize_condition(value: object) -> str:
    text = str(value or "").strip().lower()
    if "brand new" in text or "unregistered" in text:
        return "Brand New"
    if "recondition" in text:
        return "Recondition"
    return "Used"


def _normalize_vehicle_type(value: object) -> str:
    text = str(value or "").strip()
    return text or "Car"


def _parse_published_at(value: object, now: datetime) -> str:
    text = str(value or "").strip()
    if not text:
        return now.isoformat()

    relative_match = re.fullmatch(r"(\d+)\s*([mhdw])\s*ago", text.lower())
    if relative_match:
        amount = int(relative_match.group(1))
        unit = relative_match.group(2)
        delta_map = {
            "m": timedelta(minutes=amount),
            "h": timedelta(hours=amount),
            "d": timedelta(days=amount),
            "w": timedelta(weeks=amount),
        }
        return (now - delta_map[unit]).isoformat()

    for fmt in ("%Y-%m-%d", "%b %d", "%B %d"):
        try:
            parsed = datetime.strptime(text, fmt)
            if "%Y" not in fmt:
                parsed = parsed.replace(year=now.year)
                parsed = parsed.replace(tzinfo=UTC)
                if parsed > now + timedelta(days=2):
                    parsed = parsed.replace(year=now.year - 1)
                return parsed.isoformat()
            return parsed.replace(tzinfo=UTC).isoformat()
        except ValueError:
            continue

    return now.isoformat()


def _load_manual_source(source_path: Path) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    try:
        payload = json.loads(source_path.read_text(encoding="utf-8"))
    except (OSError, JSONDecodeError) as exc:
        raise ValueError(f"Invalid JSON in manual source file: {source_path}") from exc
    if isinstance(payload, dict):
        results = payload.get("results", [])
        meta = payload.get("meta", {})
        if isinstance(results, list):
            return [item for item in results if isinstance(item, dict)], meta if isinstance(meta, dict) else {}
    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)], {}
    raise ValueError(f"Unsupported JSON structure in {source_path}")


def _load_existing_snapshot(snapshot_path: Path) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    if not snapshot_path.exists():
        return [], {}
    try:
        payload = json.loads(snapshot_path.read_text(encoding="utf-8"))
    except (OSError, JSONDecodeError):
        return [], {}
    items = payload.get("items", [])
    meta = payload.get("meta", {})
    if not isinstance(items, list):
        return [], {}
    return [item for item in items if isinstance(item, dict)], meta if isinstance(meta, dict) else {}


def load_raw_source(settings: Settings) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    manual_exists = settings.manual_source_json.exists()
    if settings.source_mode in {"manual", "prefer-manual"} and manual_exists:
        items, meta = _load_manual_source(settings.manual_source_json)
        return items, {
            "source": "manual-json",
            "source_path": str(settings.manual_source_json),
            **meta,
        }

    if settings.source_mode == "manual" and not manual_exists:
        raise FileNotFoundError(f"Manual source JSON not found: {settings.manual_source_json}")

    try:
        from .scrape import scrape_filtered_vehicles
    except ImportError:  # pragma: no cover
        from scrape import scrape_filtered_vehicles  # type: ignore

    scraped = scrape_filtered_vehicles(settings.scrape_filters, max_results=settings.scrape_max_results)
    items = scraped.get("results", [])
    meta = scraped.get("meta", {})
    return [item for item in items if isinstance(item, dict)], {
        "source": "live-scrape",
        **(meta if isinstance(meta, dict) else {}),
    }


def normalize_listing(
    raw: dict[str, Any],
    validator: ModelValidator,
    sequence: int,
    refreshed_at: datetime,
) -> dict[str, Any]:
    vehicle_url = str(raw.get("vehicleUrl") or raw.get("Vehicle URL") or "").strip()
    make = str(raw.get("make") or raw.get("Make") or "").strip()
    model = str(raw.get("model") or raw.get("Model") or "").strip()
    year = _to_int(raw.get("year") or raw.get("Year"))
    price_lkr = _parse_price_lkr(raw.get("priceLkr") or raw.get("Price"))
    mileage = _to_int(raw.get("mileage") or raw.get("Milleage")) or 0
    published_date = str(raw.get("publishedDate") or raw.get("published date") or "").strip()
    listed_at = _parse_published_at(published_date, refreshed_at)

    listing: dict[str, Any] = {
        "id": str(raw.get("id") or vehicle_url or f"listing-{sequence}"),
        "vehicleType": _normalize_vehicle_type(raw.get("vehicleType") or raw.get("Vehicle Type")),
        "make": make,
        "model": model,
        "year": year or 0,
        "priceLkr": price_lkr or 0,
        "priceMillion": round((price_lkr or 0) / 1_000_000, 2),
        "mileage": mileage,
        "district": str(raw.get("district") or raw.get("District") or "").strip(),
        "publishedDate": published_date,
        "listedAt": listed_at,
        "vehicleUrl": vehicle_url,
        "condition": _normalize_condition(raw.get("condition") or raw.get("Title") or raw.get("Condition")),
        "imageUrl": str(raw.get("imageUrl") or "").strip() or None,
        "rawPrice": str(raw.get("rawPrice") or raw.get("Price") or "").strip(),
        "sourceSequence": sequence,
        "refreshedAt": refreshed_at.isoformat(),
    }
    listing.update(validator.validate_listing(listing))
    return listing


def _dedupe_listings_by_id(listings: list[dict[str, Any]]) -> list[dict[str, Any]]:
    deduped_by_id: dict[str, dict[str, Any]] = {}
    for listing in listings:
        listing_id = str(listing.get("id") or "").strip()
        if not listing_id:
            continue
        deduped_by_id[listing_id] = listing
    return list(deduped_by_id.values())


def run_refresh_pipeline(
    settings: Settings,
    repository: Any | None = None,
) -> dict[str, Any]:
    refreshed_at = datetime.now(tz=UTC)
    validator = ModelValidator.from_workbook(settings.model_report_path)
    raw_items, source_meta = load_raw_source(settings)
    previous_items, previous_meta = _load_existing_snapshot(settings.normalized_snapshot_path)
    previous_by_id = {
        str(item.get("id")): item for item in previous_items if item.get("id")
    }

    normalized_items: list[dict[str, Any]] = []
    current_ids: set[str] = set()
    for index, raw in enumerate(raw_items):
        listing = normalize_listing(raw, validator=validator, sequence=index + 1, refreshed_at=refreshed_at)
        listing_id = str(listing["id"])
        current_ids.add(listing_id)
        previous = previous_by_id.get(listing_id)
        if previous:
            listing["firstSeenAt"] = str(previous.get("firstSeenAt") or previous.get("refreshedAt") or refreshed_at.isoformat())
        else:
            listing["firstSeenAt"] = refreshed_at.isoformat()
        listing["isActive"] = True
        listing["staleAt"] = None
        listing["staleReason"] = None
        normalized_items.append(listing)

    normalized_items = _dedupe_listings_by_id(normalized_items)
    current_ids = {str(item.get("id")) for item in normalized_items if item.get("id")}

    stale_items: list[dict[str, Any]] = []
    retention_deadline = refreshed_at - timedelta(seconds=max(settings.stale_retention_seconds, 0))
    for item_id, previous in previous_by_id.items():
        if item_id in current_ids:
            continue

        stale_item = dict(previous)
        stale_item["isActive"] = False
        stale_item["staleReason"] = "missing_from_latest_refresh"
        stale_item["staleAt"] = str(previous.get("staleAt") or refreshed_at.isoformat())
        stale_item["lastSeenAt"] = str(previous.get("refreshedAt") or previous.get("lastSeenAt") or refreshed_at.isoformat())

        stale_at_text = str(stale_item.get("staleAt") or refreshed_at.isoformat())
        try:
            stale_at = datetime.fromisoformat(stale_at_text.replace("Z", "+00:00"))
        except ValueError:
            stale_at = refreshed_at

        if stale_at >= retention_deadline:
            stale_items.append(stale_item)

    combined_items = normalized_items + stale_items

    snapshot_payload = {
        "meta": {
            "refreshedAt": refreshed_at.isoformat(),
            "sourceMeta": source_meta,
            "total": len(combined_items),
            "activeTotal": len(normalized_items),
            "staleTotal": len(stale_items),
            "previousSnapshotMeta": previous_meta,
        },
        "items": combined_items,
    }

    if settings.normalized_snapshot_path.exists():
        shutil.copyfile(settings.normalized_snapshot_path, settings.fallback_snapshot_path)

    _write_json_atomic(
        settings.raw_snapshot_path,
        {
            "meta": {
                "refreshedAt": refreshed_at.isoformat(),
                **source_meta,
            },
            "items": raw_items,
        },
    )
    _write_json_atomic(settings.normalized_snapshot_path, snapshot_payload)
    if not settings.fallback_snapshot_path.exists():
        _write_json_atomic(settings.fallback_snapshot_path, snapshot_payload)

    if repository is not None:
        repository.replace_all(combined_items, snapshot_payload["meta"])

    return snapshot_payload
