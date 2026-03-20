from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any


def _env_bool(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def _env_int(name: str, default: int) -> int:
    raw = os.getenv(name)
    if raw is None:
        return default
    try:
        return int(raw)
    except (TypeError, ValueError):
        return default


def _load_json_env(name: str, default: dict[str, Any]) -> dict[str, Any]:
    raw = os.getenv(name)
    if not raw:
        return default
    try:
        value = json.loads(raw)
        return value if isinstance(value, dict) else default
    except json.JSONDecodeError:
        return default


BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BACKEND_DIR.parent
FRONTEND_DATA_DIR = PROJECT_DIR / "auto-frontend" / "src" / "data"
DATA_DIR = BACKEND_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)


@dataclass(frozen=True)
class Settings:
    source_mode: str
    manual_source_json: Path
    model_report_path: Path
    normalized_snapshot_path: Path
    fallback_snapshot_path: Path
    raw_snapshot_path: Path
    favorites_snapshot_path: Path
    image_cache_path: Path
    refresh_interval_seconds: int
    query_cache_ttl_seconds: int
    og_image_cache_ttl_seconds: int
    enable_scheduler: bool
    mongodb_uri: str
    mongodb_database: str
    mongodb_collection: str
    mongodb_favorites_collection: str
    scrape_filters: dict[str, Any]
    scrape_max_results: int
    stale_retention_seconds: int


def load_settings() -> Settings:
    default_source = FRONTEND_DATA_DIR / "scraped_vehicles_20_03_2026.json"
    return Settings(
        source_mode=os.getenv("PIPELINE_SOURCE_MODE", "scrape").strip().lower(),
        manual_source_json=Path(os.getenv("PIPELINE_SOURCE_JSON", str(default_source))),
        model_report_path=Path(
            os.getenv(
                "MODEL_REPORT_PATH",
                str(FRONTEND_DATA_DIR / "Model_Data_Report.xlsx"),
            )
        ),
        normalized_snapshot_path=Path(
            os.getenv(
                "NORMALIZED_SNAPSHOT_PATH",
                str(DATA_DIR / "normalized_listings.json"),
            )
        ),
        fallback_snapshot_path=Path(
            os.getenv(
                "FALLBACK_SNAPSHOT_PATH",
                str(DATA_DIR / "normalized_listings.fallback.json"),
            )
        ),
        raw_snapshot_path=Path(
            os.getenv(
                "RAW_SNAPSHOT_PATH",
                str(DATA_DIR / "raw_source_snapshot.json"),
            )
        ),
        favorites_snapshot_path=Path(
            os.getenv(
                "FAVORITES_SNAPSHOT_PATH",
                str(DATA_DIR / "favorites.json"),
            )
        ),
        image_cache_path=Path(
            os.getenv(
                "IMAGE_CACHE_PATH",
                str(DATA_DIR / "og_image_cache.json"),
            )
        ),
        refresh_interval_seconds=_env_int("PIPELINE_REFRESH_INTERVAL_SECONDS", 6 * 60 * 60),
        query_cache_ttl_seconds=_env_int("QUERY_CACHE_TTL_SECONDS", 300),
        og_image_cache_ttl_seconds=_env_int("OG_IMAGE_CACHE_TTL_SECONDS", 6 * 60 * 60),
        enable_scheduler=_env_bool("ENABLE_PIPELINE_SCHEDULER", False),
        mongodb_uri=os.getenv("MONGODB_URI", "").strip(),
        mongodb_database=os.getenv("MONGODB_DATABASE", "autoinsight").strip() or "autoinsight",
        mongodb_collection=os.getenv("MONGODB_COLLECTION", "vehicle_listings").strip() or "vehicle_listings",
        mongodb_favorites_collection=os.getenv("MONGODB_FAVORITES_COLLECTION", "favorites").strip() or "favorites",
        scrape_filters=_load_json_env(
            "SCRAPE_FILTERS_JSON",
            {"vehicle_type": "cars", "make": "", "model": "", "year": ""},
        ),
        scrape_max_results=_env_int("SCRAPE_MAX_RESULTS", 1000),
        stale_retention_seconds=_env_int("STALE_RETENTION_SECONDS", 3 * 24 * 60 * 60),
    )
