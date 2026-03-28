from __future__ import annotations

import json
import threading
from collections import Counter
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field

from scrape_all_to_csv import ALLOWED_TYPES, parse_types, scrape_all, write_csv

app = FastAPI(title="AutoInsight Scraper API", version="1.0.0")

BASE_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = BASE_DIR / "output"
LATEST_CSV = OUTPUT_DIR / "latest_all_vehicles.csv"
LATEST_JSON = OUTPUT_DIR / "latest_all_vehicles.json"
CACHE_META_JSON = OUTPUT_DIR / "latest_all_vehicles_meta.json"
SCRAPE_LOCK = threading.Lock()

# Cache expiration time (in hours)
CACHE_EXPIRATION_HOURS = 24


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _normalize_row(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "Vehicle Type": row.get("Vehicle Type"),
        "Make": row.get("Make"),
        "Model": row.get("Model"),
        "Year": row.get("Year"),
        "Price": row.get("Price"),
        "Milleage": row.get("Milleage"),
        "District": row.get("District"),
        "published date": row.get("published date"),
        "Vehicle URL": row.get("Vehicle URL"),
    }


def _load_cached_rows() -> list[dict[str, Any]]:
    if not LATEST_JSON.exists():
        return []
    try:
        with LATEST_JSON.open("r", encoding="utf-8") as file_obj:
            payload = json.load(file_obj)
        if isinstance(payload, list):
            return [item for item in payload if isinstance(item, dict)]
        return []
    except Exception:
        return []


def _write_cache_meta(total_records: int) -> None:
    meta = {
        "cached_at": _now_iso(),
        "total_records": int(total_records),
        "cache_expiration_hours": CACHE_EXPIRATION_HOURS,
    }
    with CACHE_META_JSON.open("w", encoding="utf-8") as file_obj:
        json.dump(meta, file_obj, ensure_ascii=False, indent=2)


def _write_json_cache(rows: list[dict[str, Any]], merge_existing: bool = True) -> tuple[int, int]:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    existing = _load_cached_rows() if merge_existing else []
    merged: dict[str, dict[str, Any]] = {}

    for row in existing:
        url = str(row.get("Vehicle URL") or "").strip()
        if url:
            merged[url] = _normalize_row(row)

    new_items = 0
    for row in rows:
        normalized = _normalize_row(row)
        url = str(normalized.get("Vehicle URL") or "").strip()
        if not url:
            continue
        if url not in merged:
            new_items += 1
        merged[url] = normalized

    merged_rows = list(merged.values())
    with LATEST_JSON.open("w", encoding="utf-8") as file_obj:
        json.dump(merged_rows, file_obj, ensure_ascii=False, indent=2)

    _write_cache_meta(len(merged_rows))
    return new_items, len(merged_rows)


def _read_cache_age() -> timedelta | None:
    if not CACHE_META_JSON.exists():
        return None
    try:
        with CACHE_META_JSON.open("r", encoding="utf-8") as file_obj:
            payload = json.load(file_obj)
        cached_at = str(payload.get("cached_at") or "").strip()
        if not cached_at:
            return None
        stamp = datetime.fromisoformat(cached_at)
        now = datetime.now(timezone.utc)
        if stamp.tzinfo is None:
            stamp = stamp.replace(tzinfo=timezone.utc)
        return now - stamp
    except Exception:
        return None


def _filter_rows(
    rows: list[dict[str, Any]],
    types: list[str] | None,
    make: str | None,
    model: str | None,
    year: str | None,
) -> list[dict[str, Any]]:
    normalized_types = {item.strip().lower() for item in (types or []) if item.strip()}
    normalized_make = (make or "").strip().lower()
    normalized_model = (model or "").strip().lower()
    normalized_year = (year or "").strip()

    type_map = {"car": "cars", "van": "vans", "pickup": "pickups", "suv": "suvs"}

    def matches(row: dict[str, Any]) -> bool:
        row_type = type_map.get(str(row.get("Vehicle Type") or "").strip().lower(), "")
        row_make = str(row.get("Make") or "").lower()
        row_model = str(row.get("Model") or "").lower()
        row_year = str(row.get("Year") or "").strip()

        if normalized_types and row_type not in normalized_types:
            return False
        if normalized_make and normalized_make not in row_make:
            return False
        if normalized_model and normalized_model not in row_model:
            return False
        if normalized_year and normalized_year != row_year:
            return False
        return True

    return [row for row in rows if matches(row)]


class ScrapeRequest(BaseModel):
    types: list[str] = Field(default_factory=lambda: ["cars"])
    make: str = ""
    model: str = ""
    year: str = ""
    max_pages_per_type: int = Field(default=3, ge=0, le=50)
    delay_seconds: float = Field(default=1.0, ge=0.0, le=10.0)
    headless: bool = True


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "scraper-api"}


@app.post("/scrape")
def scrape_now(payload: ScrapeRequest) -> dict[str, Any]:
    """Scrape vehicles and cache them in JSON."""
    if not SCRAPE_LOCK.acquire(blocking=False):
        raise HTTPException(status_code=409, detail="A scrape is already running")

    try:
        normalized_types = parse_types(",".join(payload.types))

        rows = scrape_all(
            types=normalized_types,
            make=payload.make,
            model=payload.model,
            year=payload.year,
            max_pages_per_type=payload.max_pages_per_type,
            delay_seconds=payload.delay_seconds,
            headless=payload.headless,
            output_dir=OUTPUT_DIR,
        )

        newly_inserted, total_cached = _write_json_cache(rows, merge_existing=True)
        dated_path, latest_path = write_csv(rows, OUTPUT_DIR)
        counts_by_type = dict(Counter((row.get("Vehicle Type") or "Unknown") for row in rows))

        return {
            "total": len(rows),
            "newly_inserted": newly_inserted,
            "total_cached": total_cached,
            "types": normalized_types,
            "counts_by_type": counts_by_type,
            "filters": {
                "make": payload.make,
                "model": payload.model,
                "year": payload.year,
            },
            "files": {
                "dated": str(dated_path),
                "latest": str(latest_path),
                "json": str(LATEST_JSON),
            },
            "source": "live_scrape",
            "cached": False,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Scrape failed: {exc}") from exc
    finally:
        SCRAPE_LOCK.release()


@app.get("/vehicle-types")
def vehicle_types() -> dict[str, list[str]]:
    return {"types": ALLOWED_TYPES[:]}


@app.get("/cache/status")
def cache_status() -> dict[str, Any]:
    """Get current JSON cache status."""
    rows = _load_cached_rows()
    age = _read_cache_age()

    return {
        "cached_records": len(rows),
        "json_path": str(LATEST_JSON),
        "json_exists": LATEST_JSON.exists(),
        "meta_exists": CACHE_META_JSON.exists(),
        "cache_age_minutes": int(age.total_seconds() / 60) if age else None,
        "cache_expiration_hours": CACHE_EXPIRATION_HOURS,
    }


@app.delete("/cache/clear")
def cache_clear() -> dict[str, str]:
    """Clear JSON cache files."""
    if not SCRAPE_LOCK.acquire(blocking=False):
        raise HTTPException(status_code=409, detail="A scrape is already running")

    try:
        for path in (LATEST_JSON, CACHE_META_JSON, LATEST_CSV):
            if path.exists():
                path.unlink()
        return {"status": "success", "message": "Cache cleared"}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to clear cache: {exc}") from exc
    finally:
        SCRAPE_LOCK.release()


@app.post("/scrape/smart")
def scrape_smart(payload: ScrapeRequest) -> dict[str, Any]:
    """Smart scrape: serve from JSON cache if fresh, otherwise scrape."""
    normalized_types = parse_types(",".join(payload.types))

    cache_age = _read_cache_age()
    cached_rows = _load_cached_rows()
    if cached_rows and cache_age and cache_age < timedelta(hours=CACHE_EXPIRATION_HOURS):
        filtered_rows = _filter_rows(cached_rows, normalized_types, payload.make, payload.model, payload.year)
        counts_by_type = dict(Counter((row.get("Vehicle Type") or "Unknown") for row in filtered_rows))

        return {
            "total": len(filtered_rows),
            "types": normalized_types,
            "counts_by_type": counts_by_type,
            "filters": {
                "make": payload.make,
                "model": payload.model,
                "year": payload.year,
            },
            "source": "json_cache",
            "cached": True,
            "cache_age_minutes": int(cache_age.total_seconds() / 60),
            "data": filtered_rows,
        }

    return scrape_now(payload)


@app.get("/vehicles")
def get_vehicles(
    types: str | None = Query(default=None, description="Comma-separated types: cars,vans,pickups,suvs"),
    make: str | None = Query(default=None),
    model: str | None = Query(default=None),
    year: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=2000),
) -> dict[str, Any]:
    """Get vehicles from JSON cache."""
    rows = _load_cached_rows()
    if not rows:
        raise HTTPException(
            status_code=404,
            detail="No cached JSON data available. Run POST /scrape first.",
        )

    requested_types = parse_types(types) if types is not None else None
    filtered = _filter_rows(rows, requested_types, make, model, year)

    return {
        "total": len(filtered),
        "limit": limit,
        "filters": {"types": requested_types, "make": make, "model": model, "year": year},
        "source": "json_cache",
        "data": filtered[:limit],
    }
