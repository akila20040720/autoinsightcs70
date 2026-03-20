from __future__ import annotations

import base64
import json
import re
import threading
from copy import deepcopy
from pathlib import Path
from typing import Any

try:
    from pymongo import ASCENDING, DESCENDING, MongoClient
except ModuleNotFoundError:  # pragma: no cover
    MongoClient = None
    ASCENDING = 1
    DESCENDING = -1


SORT_MAP: dict[str, tuple[str, int]] = {
    "newest": ("listedAt", -1),
    "price": ("priceLkr", 1),
    "year": ("year", -1),
    "mileage": ("mileage", 1),
}


def encode_cursor(offset: int) -> str:
    payload = json.dumps({"offset": max(offset, 0)}).encode("utf-8")
    return base64.urlsafe_b64encode(payload).decode("ascii")


def decode_cursor(cursor: str | None) -> int:
    if not cursor:
        return 0
    try:
        payload = json.loads(base64.urlsafe_b64decode(cursor.encode("ascii")).decode("utf-8"))
        return max(int(payload.get("offset", 0)), 0)
    except Exception:
        return 0


def _normalize_array(values: list[str]) -> list[str]:
    cleaned: list[str] = []
    seen: set[str] = set()
    for value in values:
        text = value.strip()
        if not text:
            continue
        key = text.lower()
        if key in seen:
            continue
        seen.add(key)
        cleaned.append(text)
    return cleaned


def _matches_array(value: str, selected: list[str]) -> bool:
    if not selected:
        return True
    return value.lower() in {item.lower() for item in selected}


def _matches_filters(item: dict[str, Any], filters: dict[str, Any]) -> bool:
    if item.get("isActive") is False:
        return False
    if not _matches_array(str(item.get("vehicleType") or ""), filters.get("vehicleType", [])):
        return False
    if not _matches_array(str(item.get("make") or ""), filters.get("make", [])):
        return False
    if not _matches_array(str(item.get("model") or ""), filters.get("model", [])):
        return False
    if not _matches_array(str(item.get("condition") or ""), filters.get("condition", [])):
        return False
    if not _matches_array(str(item.get("district") or ""), filters.get("district", [])):
        return False

    year = int(item.get("year") or 0)
    price = int(item.get("priceLkr") or 0)
    mileage = int(item.get("mileage") or 0)

    year_min = filters.get("yearMin")
    year_max = filters.get("yearMax")
    price_min = filters.get("priceMin")
    price_max = filters.get("priceMax")
    mileage_min = filters.get("mileageMin")
    mileage_max = filters.get("mileageMax")

    if year_min is not None and year < year_min:
        return False
    if year_max is not None and year > year_max:
        return False
    if price_min is not None and price < price_min:
        return False
    if price_max is not None and price > price_max:
        return False
    if mileage_min is not None and mileage < mileage_min:
        return False
    if mileage_max is not None and mileage > mileage_max:
        return False

    return True


def _sort_items(items: list[dict[str, Any]], sort_by: str, direction: str | None = None) -> list[dict[str, Any]]:
    field, default_direction = SORT_MAP.get(sort_by, SORT_MAP["newest"])
    reverse = default_direction < 0
    if direction == "asc":
        reverse = False
    elif direction == "desc":
        reverse = True

    return sorted(
        items,
        key=lambda item: (item.get(field), item.get("id")),
        reverse=reverse,
    )


class FileListingRepository:
    def __init__(self, snapshot_path: Path, favorites_path: Path):
        self.snapshot_path = snapshot_path
        self.favorites_path = favorites_path
        self._lock = threading.RLock()
        self._items: list[dict[str, Any]] = []
        self._items_by_id: dict[str, dict[str, Any]] = {}
        self._meta: dict[str, Any] = {}
        self._favorites: dict[str, list[str]] = {}
        self._load_snapshot()
        self._load_favorites()

    def _load_snapshot(self) -> None:
        if not self.snapshot_path.exists():
            return
        payload = json.loads(self.snapshot_path.read_text(encoding="utf-8"))
        items = payload.get("items", [])
        meta = payload.get("meta", {})
        if not isinstance(items, list):
            return
        self.replace_all(items, meta if isinstance(meta, dict) else {})

    def _load_favorites(self) -> None:
        if not self.favorites_path.exists():
            return
        payload = json.loads(self.favorites_path.read_text(encoding="utf-8"))
        if isinstance(payload, dict):
            self._favorites = {
                str(key): [str(item) for item in value if item]
                for key, value in payload.items()
                if isinstance(value, list)
            }

    def _write_favorites(self) -> None:
        self.favorites_path.parent.mkdir(parents=True, exist_ok=True)
        self.favorites_path.write_text(
            json.dumps(self._favorites, ensure_ascii=True, indent=2),
            encoding="utf-8",
        )

    def replace_all(self, items: list[dict[str, Any]], meta: dict[str, Any]) -> None:
        with self._lock:
            self._items = [deepcopy(item) for item in items]
            self._items_by_id = {str(item["id"]): item for item in self._items}
            self._meta = deepcopy(meta)

    def query(
        self,
        filters: dict[str, Any],
        *,
        sort_by: str,
        direction: str | None,
        page: int,
        limit: int,
        cursor: str | None,
    ) -> dict[str, Any]:
        with self._lock:
            filtered = [item for item in self._items if _matches_filters(item, filters)]
            sorted_items = _sort_items(filtered, sort_by, direction)
            total = len(sorted_items)
            start = decode_cursor(cursor) if cursor else max((page - 1) * limit, 0)
            end = start + limit
            page_items = sorted_items[start:end]
            next_cursor = encode_cursor(end) if end < total else None
            stats = self._stats(filtered)
            return {
                "items": deepcopy(page_items),
                "meta": {
                    "total": total,
                    "activeTotal": int(self._meta.get("activeTotal", total)),
                    "staleTotal": int(self._meta.get("staleTotal", 0)),
                    "page": (start // limit) + 1 if limit else 1,
                    "limit": limit,
                    "cursor": cursor,
                    "nextCursor": next_cursor,
                    "hasNext": next_cursor is not None,
                    "snapshot": deepcopy(self._meta),
                },
                "stats": stats,
            }

    def _stats(self, items: list[dict[str, Any]]) -> dict[str, Any]:
        if not items:
            return {
                "avgPriceLkr": 0,
                "avgPriceMillion": 0,
                "avgMileage": 0,
                "marketAnalysis": {
                    "previousMonthPriceLkr": 0,
                    "nextWeekPriceLkr": 0,
                    "avgPriceLkr": 0,
                    "avgMileage": 0,
                    "priceTrend": [],
                },
            }
        avg_price = round(sum(int(item.get("priceLkr") or 0) for item in items) / len(items))
        avg_mileage = round(sum(int(item.get("mileage") or 0) for item in items) / len(items))
        market_analysis = self._market_analysis(items, fallback_avg_price=avg_price, fallback_avg_mileage=avg_mileage)
        return {
            "avgPriceLkr": avg_price,
            "avgPriceMillion": round(avg_price / 1_000_000, 2),
            "avgMileage": avg_mileage,
            "marketAnalysis": market_analysis,
        }

    def _market_analysis(
        self,
        items: list[dict[str, Any]],
        *,
        fallback_avg_price: int,
        fallback_avg_mileage: int,
    ) -> dict[str, Any]:
        previous_values: list[int] = []
        next_week_values: list[int] = []
        avg_price_values: list[int] = []
        avg_mileage_values: list[int] = []
        trend_accumulator: dict[str, dict[str, Any]] = {}

        for item in items:
            analysis = item.get("market_analysis") or item.get("marketAnalysis") or {}
            if not isinstance(analysis, dict):
                continue

            previous = analysis.get("previousMonthPriceLkr")
            next_week = analysis.get("nextWeekPriceLkr")
            analysis_avg_price = analysis.get("avgPriceLkr")
            analysis_avg_mileage = analysis.get("avgMileage")

            if isinstance(previous, (int, float)):
                previous_values.append(int(previous))
            if isinstance(next_week, (int, float)):
                next_week_values.append(int(next_week))
            if isinstance(analysis_avg_price, (int, float)):
                avg_price_values.append(int(analysis_avg_price))
            if isinstance(analysis_avg_mileage, (int, float)):
                avg_mileage_values.append(int(analysis_avg_mileage))

            trend_points = analysis.get("priceTrend")
            if not isinstance(trend_points, list):
                continue
            for point in trend_points:
                if not isinstance(point, dict):
                    continue
                label = str(point.get("label") or "").strip()
                value = point.get("valueLkr")
                if not label or not isinstance(value, (int, float)):
                    continue
                bucket = trend_accumulator.setdefault(
                    label,
                    {"total": 0, "count": 0, "predicted": bool(point.get("predicted"))},
                )
                bucket["total"] += int(value)
                bucket["count"] += 1
                bucket["predicted"] = bucket["predicted"] or bool(point.get("predicted"))

        def _avg(values: list[int], fallback: int = 0) -> int:
            return round(sum(values) / len(values)) if values else fallback

        ordered_trend = [
            {
                "label": label,
                "valueLkr": round(bucket["total"] / bucket["count"]),
                "predicted": bool(bucket["predicted"]),
            }
            for label, bucket in trend_accumulator.items()
            if bucket["count"] > 0
        ]

        return {
            "previousMonthPriceLkr": _avg(previous_values, fallback_avg_price),
            "nextWeekPriceLkr": _avg(next_week_values, fallback_avg_price),
            "avgPriceLkr": _avg(avg_price_values, fallback_avg_price),
            "avgMileage": _avg(avg_mileage_values, fallback_avg_mileage),
            "priceTrend": ordered_trend,
        }

    def get_listing(self, listing_id: str) -> dict[str, Any] | None:
        with self._lock:
            item = self._items_by_id.get(listing_id)
            if not item or item.get("isActive") is False:
                return None
            return deepcopy(item)

    def get_many(self, listing_ids: list[str]) -> list[dict[str, Any]]:
        with self._lock:
            items = [
                self._items_by_id[item_id]
                for item_id in listing_ids
                if item_id in self._items_by_id and self._items_by_id[item_id].get("isActive") is not False
            ]
            return [deepcopy(item) for item in items]

    def get_facets(self, filters: dict[str, Any]) -> dict[str, list[dict[str, Any]]]:
        with self._lock:
            filtered = [item for item in self._items if _matches_filters(item, filters)]
            return {
                "vehicleTypes": self._facet(filtered, "vehicleType"),
                "makes": self._facet(filtered, "make"),
                "models": self._facet(filtered, "model"),
                "conditions": self._facet(filtered, "condition"),
                "districts": self._facet(filtered, "district"),
            }

    def _facet(self, items: list[dict[str, Any]], field: str) -> list[dict[str, Any]]:
        counts: dict[str, int] = {}
        for item in items:
            value = str(item.get(field) or "").strip()
            if not value:
                continue
            counts[value] = counts.get(value, 0) + 1
        return [
            {"value": key, "count": counts[key]}
            for key in sorted(counts, key=lambda candidate: (-counts[candidate], candidate.lower()))
        ]

    def get_favorites(self, user_key: str) -> list[str]:
        with self._lock:
            return list(self._favorites.get(user_key, []))

    def save_favorites(self, user_key: str, listing_ids: list[str]) -> list[str]:
        with self._lock:
            cleaned = [item for item in listing_ids if item in self._items_by_id]
            self._favorites[user_key] = cleaned
            self._write_favorites()
            return list(cleaned)


class MongoListingRepository(FileListingRepository):
    def __init__(
        self,
        mongodb_uri: str,
        database_name: str,
        collection_name: str,
        favorites_collection_name: str,
        model_reference_collection_name: str,
        snapshot_path: Path,
        favorites_path: Path,
    ):
        super().__init__(snapshot_path=snapshot_path, favorites_path=favorites_path)
        if not mongodb_uri or MongoClient is None:
            raise RuntimeError("MongoDB support requires pymongo and MONGODB_URI.")
        self.client = MongoClient(mongodb_uri)
        self.collection = self.client[database_name][collection_name]
        self.favorites_collection = self.client[database_name][favorites_collection_name]
        self.model_reference_collection = self.client[database_name][model_reference_collection_name]
        self._ensure_indexes()
        self._mirror_snapshot_to_memory()

    def _ensure_indexes(self) -> None:
        self.collection.create_index([("id", ASCENDING)], unique=True)
        self.collection.create_index([("vehicleType", ASCENDING), ("make", ASCENDING), ("model", ASCENDING)])
        self.collection.create_index([("condition", ASCENDING), ("district", ASCENDING)])
        self.collection.create_index([("priceLkr", ASCENDING), ("year", DESCENDING)])
        self.collection.create_index([("mileage", ASCENDING), ("listedAt", DESCENDING)])
        self.favorites_collection.create_index([("userKey", ASCENDING)], unique=True)
        self.model_reference_collection.create_index(
            [("makeNorm", ASCENDING), ("modelNorm", ASCENDING), ("yearMin", ASCENDING), ("yearMax", ASCENDING)]
        )
        try:
            self.model_reference_collection.create_index([("rowId", ASCENDING)], unique=True)
        except Exception:
            # Keep repository usable even if imported reference data has duplicate row IDs.
            pass

    @staticmethod
    def _normalize_lookup_text(value: object) -> str:
        text = str(value or "").strip().lower()
        text = text.replace("&", " and ").replace("-", " ")
        text = re.sub(r"[^a-z0-9\s]", " ", text)
        return re.sub(r"\s+", " ", text).strip()

    @staticmethod
    def _as_int(value: object) -> int | None:
        if value is None or value == "":
            return None
        if isinstance(value, bool):
            return None
        if isinstance(value, (int, float)):
            return int(value)
        try:
            return int(str(value).strip())
        except (TypeError, ValueError):
            return None

    def _resolve_reference_market_analysis(
        self,
        *,
        make_norm: str,
        model_norm: str,
        year: int | None,
    ) -> dict[str, Any] | None:
        if not make_norm or not model_norm:
            return None

        key_filter: dict[str, Any] = {
            "makeNorm": make_norm,
            "modelNorm": model_norm,
        }
        candidates = list(self.model_reference_collection.find(key_filter, {"_id": 0, "market_analysis": 1, "yearMin": 1, "yearMax": 1}))
        if not candidates:
            return None

        def _score(candidate: dict[str, Any]) -> tuple[int, int, int]:
            year_min = self._as_int(candidate.get("yearMin"))
            year_max = self._as_int(candidate.get("yearMax"))
            if year_min is None and year_max is None:
                # Lowest priority: unconstrained rows.
                return (2, 10_000, 10_000)

            if year is None:
                span = abs((year_max or year_min or 0) - (year_min or year_max or 0))
                return (1, span, year_min or 0)

            min_bound = year_min if year_min is not None else year
            max_bound = year_max if year_max is not None else year
            if min_bound <= year <= max_bound:
                span = abs(max_bound - min_bound)
                return (0, span, abs((min_bound + max_bound) // 2 - year))

            distance = min(abs(year - min_bound), abs(year - max_bound))
            return (3, distance, abs(max_bound - min_bound))

        best = min(candidates, key=_score)
        analysis = best.get("market_analysis")
        return analysis if isinstance(analysis, dict) else None

    def _market_analysis(
        self,
        items: list[dict[str, Any]],
        *,
        fallback_avg_price: int,
        fallback_avg_mileage: int,
    ) -> dict[str, Any]:
        cache: dict[tuple[str, str, int | None], dict[str, Any] | None] = {}
        mapped_items: list[dict[str, Any]] = []

        for item in items:
            make_norm = self._normalize_lookup_text(item.get("make"))
            model_norm = self._normalize_lookup_text(item.get("model"))
            year = self._as_int(item.get("year"))
            cache_key = (make_norm, model_norm, year)

            if cache_key not in cache:
                cache[cache_key] = self._resolve_reference_market_analysis(
                    make_norm=make_norm,
                    model_norm=model_norm,
                    year=year,
                )

            analysis = cache[cache_key]
            if analysis:
                mapped_items.append({"market_analysis": analysis})
        
        if not mapped_items:
            return {
                "available": False,
                "reason": "Insufficient data to analyze",
                "previousMonthPriceLkr": 0,
                "nextWeekPriceLkr": 0,
                "avgPriceLkr": 0,
                "avgMileage": 0,
                "priceTrend": [],
            }
        
        result = FileListingRepository._market_analysis(
            self,
            mapped_items,
            fallback_avg_price=0,
            fallback_avg_mileage=0,
        )
        result["available"] = True
        return result

    def _mirror_snapshot_to_memory(self) -> None:
        items = list(self.collection.find({}, {"_id": 0}))
        if items:
            self.replace_all(items, self._meta)

    def replace_all(self, items: list[dict[str, Any]], meta: dict[str, Any]) -> None:
        super().replace_all(items, meta)
        self.collection.delete_many({})
        if items:
            self.collection.insert_many([deepcopy(item) for item in items], ordered=False)

    def get_favorites(self, user_key: str) -> list[str]:
        record = self.favorites_collection.find_one({"userKey": user_key}, {"_id": 0, "listingIds": 1})
        if record and isinstance(record.get("listingIds"), list):
            return [str(item) for item in record["listingIds"]]
        return super().get_favorites(user_key)

    def save_favorites(self, user_key: str, listing_ids: list[str]) -> list[str]:
        cleaned = super().save_favorites(user_key, listing_ids)
        self.favorites_collection.update_one(
            {"userKey": user_key},
            {"$set": {"listingIds": cleaned}},
            upsert=True,
        )
        return cleaned


def build_repository(
    *,
    mongodb_uri: str,
    mongodb_database: str,
    mongodb_collection: str,
    mongodb_favorites_collection: str,
    snapshot_path: Path,
    favorites_path: Path,
    mongodb_model_reference_collection: str = "model_reference_rows",
) -> FileListingRepository:
    if mongodb_uri and MongoClient is not None:
        try:
            return MongoListingRepository(
                mongodb_uri=mongodb_uri,
                database_name=mongodb_database,
                collection_name=mongodb_collection,
                favorites_collection_name=mongodb_favorites_collection,
                model_reference_collection_name=mongodb_model_reference_collection,
                snapshot_path=snapshot_path,
                favorites_path=favorites_path,
            )
        except Exception:
            pass
    return FileListingRepository(snapshot_path=snapshot_path, favorites_path=favorites_path)
