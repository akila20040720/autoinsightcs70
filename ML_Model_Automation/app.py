from __future__ import annotations

import csv
import threading
from collections import Counter
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field

from scrape_all_to_csv import ALLOWED_TYPES, parse_types, scrape_all, write_csv

app = FastAPI(title="AutoInsight Scraper API", version="1.0.0")

BASE_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = BASE_DIR / "output"
LATEST_CSV = OUTPUT_DIR / "latest_all_vehicles.csv"
SCRAPE_LOCK = threading.Lock()


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
        dated_path, latest_path = write_csv(rows, OUTPUT_DIR)
        counts_by_type = dict(Counter((row.get("Vehicle Type") or "Unknown") for row in rows))

        return {
            "total": len(rows),
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
            },
            "data": rows,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Scrape failed: {exc}") from exc
    finally:
        SCRAPE_LOCK.release()


@app.get("/vehicle-types")
def vehicle_types() -> dict[str, list[str]]:
    return {"types": ALLOWED_TYPES[:]}


@app.get("/vehicles")
def get_vehicles(
    make: str | None = Query(default=None),
    model: str | None = Query(default=None),
    year: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=2000),
) -> dict[str, Any]:
    if not LATEST_CSV.exists():
        raise HTTPException(
            status_code=404,
            detail="No scraped data yet. Run POST /scrape first.",
        )

    with LATEST_CSV.open("r", encoding="utf-8", newline="") as file_obj:
        reader = csv.DictReader(file_obj)
        rows = list(reader)

    def matches(row: dict[str, str]) -> bool:
        row_make = (row.get("Make") or "").lower()
        row_model = (row.get("Model") or "").lower()
        row_year = str(row.get("Year") or "").strip()

        if make and make.lower() not in row_make:
            return False
        if model and model.lower() not in row_model:
            return False
        if year and str(year).strip() != row_year:
            return False
        return True

    filtered = [row for row in rows if matches(row)]
    return {
        "total": len(filtered),
        "limit": limit,
        "filters": {"make": make, "model": model, "year": year},
        "data": filtered[:limit],
    }
