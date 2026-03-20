from __future__ import annotations

import sys
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
PACKAGE_ROOT = BACKEND_DIR.parent
if str(PACKAGE_ROOT) not in sys.path:
    sys.path.insert(0, str(PACKAGE_ROOT))

from backend.config import Settings  # type: ignore  # noqa: E402
from backend.model_validation import ModelValidator  # type: ignore  # noqa: E402
from backend.pipeline import run_refresh_pipeline  # type: ignore  # noqa: E402
from backend.repository import FileListingRepository  # type: ignore  # noqa: E402
from backend.server import create_app  # type: ignore  # noqa: E402


def create_test_app(snapshot_path: Path, favorites_path: Path):
    settings = Settings(
        source_mode="manual",
        manual_source_json=snapshot_path,
        model_report_path=snapshot_path,
        normalized_snapshot_path=snapshot_path,
        fallback_snapshot_path=snapshot_path.with_suffix(".fallback.json"),
        raw_snapshot_path=snapshot_path.with_suffix(".raw.json"),
        favorites_snapshot_path=favorites_path,
        image_cache_path=snapshot_path.with_suffix(".images.json"),
        refresh_interval_seconds=21600,
        query_cache_ttl_seconds=5,
        og_image_cache_ttl_seconds=21600,
        enable_scheduler=False,
        mongodb_uri="",
        mongodb_database="test",
        mongodb_collection="vehicle_listings",
        mongodb_favorites_collection="favorites",
        scrape_filters={"vehicle_type": "cars", "make": "", "model": "", "year": ""},
        scrape_max_results=100,
        stale_retention_seconds=259200,
    )
    repository = FileListingRepository(snapshot_path=snapshot_path, favorites_path=favorites_path)
    return create_app(settings=settings, repository=repository, testing=True)


def load_validator(workbook_path: Path) -> ModelValidator:
    return ModelValidator.from_workbook(workbook_path)


def run_pipeline(settings: Settings):
    return run_refresh_pipeline(settings)
