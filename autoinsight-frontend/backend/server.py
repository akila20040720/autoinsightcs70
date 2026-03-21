from __future__ import annotations

import json
import threading
import time
from pathlib import Path
from typing import Any
from urllib.error import URLError
from urllib.parse import parse_qs, urljoin, urlparse
from urllib.request import Request, urlopen

from flask import Flask, jsonify, request

try:
    from flask_cors import CORS
except ModuleNotFoundError:  # pragma: no cover
    def CORS(_app: Flask) -> None:
        return None

try:
    from .config import Settings, load_settings
    from .pipeline import run_refresh_pipeline
    from .repository import FileListingRepository, MongoListingRepository, build_repository
except ImportError:  # pragma: no cover
    from config import Settings, load_settings  # type: ignore
    from pipeline import run_refresh_pipeline  # type: ignore
    from repository import FileListingRepository, MongoListingRepository, build_repository  # type: ignore


class QueryCache:
    def __init__(self, ttl_seconds: int):
        self.ttl_seconds = ttl_seconds
        self._lock = threading.Lock()
        self._items: dict[str, tuple[float, Any]] = {}

    def get(self, key: str) -> Any | None:
        with self._lock:
            value = self._items.get(key)
            if not value:
                return None
            stored_at, payload = value
            if (time.time() - stored_at) > self.ttl_seconds:
                self._items.pop(key, None)
                return None
            return payload

    def set(self, key: str, payload: Any) -> None:
        with self._lock:
            self._items[key] = (time.time(), payload)

    def clear(self) -> None:
        with self._lock:
            self._items.clear()


class OgImageCache:
    def __init__(self, cache_path: Path, ttl_seconds: int):
        self.cache_path = cache_path
        self.ttl_seconds = ttl_seconds
        self._lock = threading.Lock()
        self._items: dict[str, dict[str, Any]] = {}
        if cache_path.exists():
            try:
                payload = json.loads(cache_path.read_text(encoding="utf-8"))
                if isinstance(payload, dict):
                    self._items = payload
            except json.JSONDecodeError:
                self._items = {}

    def get(self, url: str) -> str | None | object:
        with self._lock:
            record = self._items.get(url)
            if not record:
                return _MISSING
            if (time.time() - float(record.get("ts", 0))) > self.ttl_seconds:
                self._items.pop(url, None)
                return _MISSING
            return record.get("image")

    def set(self, url: str, image_url: str | None) -> None:
        with self._lock:
            self._items[url] = {"ts": time.time(), "image": image_url}
            self.cache_path.parent.mkdir(parents=True, exist_ok=True)
            self.cache_path.write_text(
                json.dumps(self._items, ensure_ascii=True, indent=2),
                encoding="utf-8",
            )


_MISSING = object()


def _parse_int(name: str, value: str | None) -> int | None:
    if value in {None, ""}:
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        raise ValueError(f"{name} must be an integer.")


def _parse_array_param(name: str, source: Any) -> list[str]:
    values = source.getlist(name) + source.getlist(f"{name}[]")
    if len(values) == 1 and "," in values[0]:
        values = [part.strip() for part in values[0].split(",")]
    cleaned: list[str] = []
    seen: set[str] = set()
    for value in values:
        text = str(value).strip()
        if not text:
            continue
        key = text.lower()
        if key in seen:
            continue
        seen.add(key)
        cleaned.append(text)
    return cleaned


def parse_listing_filters(args: Any) -> dict[str, Any]:
    filters = {
        "vehicleType": _parse_array_param("vehicleType", args),
        "make": _parse_array_param("make", args),
        "model": _parse_array_param("model", args),
        "condition": _parse_array_param("condition", args),
        "district": _parse_array_param("district", args),
        "yearMin": _parse_int("yearMin", args.get("yearMin")),
        "yearMax": _parse_int("yearMax", args.get("yearMax")),
        "priceMin": _parse_int("priceMin", args.get("priceMin")),
        "priceMax": _parse_int("priceMax", args.get("priceMax")),
        "mileageMin": _parse_int("mileageMin", args.get("mileageMin")),
        "mileageMax": _parse_int("mileageMax", args.get("mileageMax")),
    }

    for min_key, max_key in (
        ("yearMin", "yearMax"),
        ("priceMin", "priceMax"),
        ("mileageMin", "mileageMax"),
    ):
        if filters[min_key] is not None and filters[max_key] is not None and filters[min_key] > filters[max_key]:
            raise ValueError(f"{min_key} cannot be greater than {max_key}.")

    return filters


def _validate_riyasewana_url(raw_url: str) -> str | None:
    try:
        parsed = urlparse(raw_url.strip())
    except ValueError:
        return None

    if parsed.scheme not in {"http", "https"}:
        return None

    host = parsed.netloc.lower()
    if not (host.endswith("riyasewana.com") or host.endswith("www.riyasewana.com")):
        return None

    return raw_url.strip()


def _extract_og_image(html: str, page_url: str) -> str | None:
    import re
    from html import unescape

    meta_tag_re = re.compile(r"<meta\s+[^>]*>", re.IGNORECASE)
    attr_re = re.compile(r"([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*([\"'])(.*?)\2", re.IGNORECASE | re.DOTALL)

    for tag in meta_tag_re.findall(html):
        attrs = {key.lower(): unescape(value).strip() for key, _, value in attr_re.findall(tag)}
        prop = attrs.get("property", "").lower()
        name = attrs.get("name", "").lower()
        if prop == "og:image" or name in {"og:image", "twitter:image", "twitter:image:src"}:
            content = attrs.get("content")
            if content:
                return urljoin(page_url, content)
    return None


def _fetch_og_image(url: str, cache: OgImageCache) -> str | None:
    cached = cache.get(url)
    if cached is not _MISSING:
        return cached if isinstance(cached, str) else None

    request_obj = Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; AutoInsightOgBot/1.0)",
            "Accept": "text/html,application/xhtml+xml",
        },
    )

    try:
        with urlopen(request_obj, timeout=10) as response:
            content_type = response.headers.get("Content-Type", "")
            if "text/html" not in content_type:
                cache.set(url, None)
                return None
            html = response.read().decode("utf-8", errors="replace")
    except URLError:
        cache.set(url, None)
        return None

    image_url = _extract_og_image(html, url)
    cache.set(url, image_url)
    return image_url


def create_app(
    settings: Settings | None = None,
    repository: FileListingRepository | None = None,
    *,
    testing: bool = False,
) -> Flask:
    settings = settings or load_settings()
    repository = repository or build_repository(
        mongodb_uri=settings.mongodb_uri,
        mongodb_database=settings.mongodb_database,
        mongodb_collection=settings.mongodb_collection,
        mongodb_favorites_collection=settings.mongodb_favorites_collection,
        snapshot_path=settings.normalized_snapshot_path,
        favorites_path=settings.favorites_snapshot_path,
    )

    app = Flask(__name__)
    CORS(app)

    query_cache = QueryCache(settings.query_cache_ttl_seconds)
    image_cache = OgImageCache(settings.image_cache_path, settings.og_image_cache_ttl_seconds)

    app.config["SETTINGS"] = settings
    app.config["REPOSITORY"] = repository
    app.config["QUERY_CACHE"] = query_cache

    def refresh_repository(reason: str) -> dict[str, Any]:
        payload = run_refresh_pipeline(settings, repository=repository)
        query_cache.clear()
        return payload

    if not testing:
        should_refresh_on_startup = settings.source_mode == "scrape" or not settings.normalized_snapshot_path.exists()
        if should_refresh_on_startup:
            try:
                refresh_repository("startup")
            except Exception:
                pass

    if settings.enable_scheduler and not testing:
        def _scheduler() -> None:
            while True:
                time.sleep(settings.refresh_interval_seconds)
                try:
                    refresh_repository("scheduled")
                except Exception:
                    continue

        thread = threading.Thread(target=_scheduler, daemon=True, name="pipeline-scheduler")
        thread.start()

    @app.get("/api/health")
    def health() -> Any:
        storage = "mongo" if isinstance(repository, MongoListingRepository) else "file-fallback"
        return jsonify(
            {
                "ok": True,
                "service": "autoinsight-marketplace-api",
                "schedulerEnabled": settings.enable_scheduler,
                "sourceMode": settings.source_mode,
                "storage": storage,
            }
        )

    @app.get("/api/facets")
    def facets() -> Any:
        try:
            filters = parse_listing_filters(request.args)
        except ValueError as exc:
            return jsonify({"error": str(exc)}), 400
        cache_key = f"facets::{request.query_string.decode('utf-8')}"
        cached = query_cache.get(cache_key)
        if cached is not None:
            return jsonify(cached)
        payload = repository.get_facets(filters)
        query_cache.set(cache_key, payload)
        return jsonify(payload)

    @app.get("/api/listings")
    def listings() -> Any:
        try:
            filters = parse_listing_filters(request.args)
            limit = _parse_int("limit", request.args.get("limit")) or 24
            page = _parse_int("page", request.args.get("page")) or 1
        except ValueError as exc:
            return jsonify({"error": str(exc)}), 400

        limit = min(max(limit, 1), 100)
        page = max(page, 1)
        sort_by = request.args.get("sort", "newest").strip().lower()
        if sort_by not in {"newest", "price", "year", "mileage"}:
            sort_by = "newest"
        direction = request.args.get("direction", "").strip().lower() or None
        cursor = request.args.get("cursor")
        cache_key = f"list::{request.query_string.decode('utf-8')}"
        cached = query_cache.get(cache_key)
        if cached is not None:
            return jsonify(cached)
        payload = repository.query(
            filters,
            sort_by=sort_by,
            direction=direction,
            page=page,
            limit=limit,
            cursor=cursor,
        )
        query_cache.set(cache_key, payload)
        return jsonify(payload)

    @app.get("/api/listings/<path:listing_id>")
    def listing_detail(listing_id: str) -> Any:
        item = repository.get_listing(listing_id)
        if not item:
            return jsonify({"error": "Listing not found"}), 404
        return jsonify({"item": item})

    @app.post("/api/compare")
    def compare() -> Any:
        payload = request.get_json(silent=True) or {}
        listing_ids = payload.get("ids", [])
        if not isinstance(listing_ids, list):
            return jsonify({"error": "ids must be an array"}), 400
        cleaned = [str(item) for item in listing_ids[:3] if item]
        if len(cleaned) < 2:
            return jsonify({"error": "Provide at least 2 listing IDs"}), 400
        items = repository.get_many(cleaned)
        return jsonify({"items": items})

    @app.get("/api/favorites")
    def favorites_get() -> Any:
        user_key = request.args.get("userKey", "local-device").strip() or "local-device"
        ids = repository.get_favorites(user_key)
        items = repository.get_many(ids)
        return jsonify({"userKey": user_key, "listingIds": ids, "items": items})

    @app.put("/api/favorites")
    def favorites_put() -> Any:
        payload = request.get_json(silent=True) or {}
        user_key = str(payload.get("userKey") or "local-device").strip() or "local-device"
        listing_ids = payload.get("listingIds", [])
        if not isinstance(listing_ids, list):
            return jsonify({"error": "listingIds must be an array"}), 400
        saved = repository.save_favorites(user_key, [str(item) for item in listing_ids])
        return jsonify({"userKey": user_key, "listingIds": saved})

    @app.post("/api/admin/refresh")
    def refresh() -> Any:
        try:
            payload = refresh_repository("manual")
            return jsonify(payload)
        except FileNotFoundError as exc:
            return jsonify({"error": str(exc)}), 404
        except Exception as exc:  # pragma: no cover
            return jsonify({"error": str(exc)}), 500

    @app.get("/api/og-image")
    def og_image() -> Any:
        raw_url = request.args.get("url", "")
        valid_url = _validate_riyasewana_url(raw_url)
        if not valid_url:
            return jsonify({"error": "Only valid Riyasewana URLs are supported"}), 400
        image_url = _fetch_og_image(valid_url, image_cache)
        response = jsonify({"url": valid_url, "image": image_url})
        response.headers["Cache-Control"] = f"public, max-age={settings.og_image_cache_ttl_seconds}"
        return response

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
