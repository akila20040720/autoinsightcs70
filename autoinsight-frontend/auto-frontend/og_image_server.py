#!/usr/bin/env python3
"""Tiny HTTP server that returns og:image for Riyasewana listing URLs."""

from __future__ import annotations

import json
import re
import threading
import time
from html import unescape
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urljoin, urlparse
from urllib.request import Request, urlopen

HOST = "127.0.0.1"
PORT = 8000
CACHE_TTL_SECONDS = 6 * 60 * 60
MISSING = object()

# URL -> (timestamp, image_url)
CACHE: dict[str, tuple[float, str | None]] = {}
CACHE_LOCK = threading.Lock()

META_TAG_RE = re.compile(r"<meta\\s+[^>]*>", re.IGNORECASE)
ATTR_RE = re.compile(r"([a-zA-Z_:][-a-zA-Z0-9_:.]*)\\s*=\\s*([\"'])(.*?)\\2", re.IGNORECASE | re.DOTALL)


def _extract_og_image(html: str, page_url: str) -> str | None:
    for tag in META_TAG_RE.findall(html):
        attrs = {k.lower(): unescape(v).strip() for k, _, v in ATTR_RE.findall(tag)}
        prop = attrs.get("property", "").lower()
        name = attrs.get("name", "").lower()

        if prop == "og:image" or name in {"og:image", "twitter:image", "twitter:image:src"}:
            content = attrs.get("content")
            if content:
                return urljoin(page_url, content)

    # Secondary fallback for pages where meta tags are generated unusually.
    pattern = re.compile(
        r'<meta[^>]+(?:property|name)=[\"\'](?:og:image|twitter:image|twitter:image:src)[\"\'][^>]+content=[\"\']([^\"\']+)[\"\']',
        re.IGNORECASE,
    )
    match = pattern.search(html)
    if match:
        return urljoin(page_url, unescape(match.group(1)).strip())
    return None


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


def _get_cached(url: str) -> str | None | object:
    with CACHE_LOCK:
        cached = CACHE.get(url)
        if not cached:
            return MISSING
        ts, image_url = cached
        if (time.time() - ts) > CACHE_TTL_SECONDS:
            CACHE.pop(url, None)
            return MISSING
        return image_url


def _set_cache(url: str, image_url: str | None) -> None:
    with CACHE_LOCK:
        CACHE[url] = (time.time(), image_url)


def fetch_og_image(listing_url: str) -> str | None:
    cached = _get_cached(listing_url)
    if cached is not MISSING:
        return cached

    request = Request(
        listing_url,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; AutoInsightOgBot/1.0)",
            "Accept": "text/html,application/xhtml+xml",
        },
    )

    with urlopen(request, timeout=10) as response:
        content_type = response.headers.get("Content-Type", "")
        if "text/html" not in content_type:
            _set_cache(listing_url, None)
            return None

        html = response.read().decode("utf-8", errors="replace")
        image_url = _extract_og_image(html, listing_url)
        _set_cache(listing_url, image_url)
        return image_url


class OgHandler(BaseHTTPRequestHandler):
    server_version = "AutoInsightOgServer/1.0"

    def _write_json(self, status: int, body: dict) -> None:
        payload = json.dumps(body).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(payload)

    def do_OPTIONS(self) -> None:  # noqa: N802
        self._write_json(200, {"ok": True})

    def do_GET(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)

        if parsed.path == "/health":
            self._write_json(200, {"status": "ok"})
            return

        if parsed.path != "/api/og-image":
            self._write_json(404, {"error": "Not found"})
            return

        params = parse_qs(parsed.query)
        raw_url = params.get("url", [""])[0]
        valid_url = _validate_riyasewana_url(raw_url)
        if not valid_url:
            self._write_json(400, {"error": "Only valid Riyasewana URLs are supported"})
            return

        try:
            image_url = fetch_og_image(valid_url)
            self._write_json(200, {"image": image_url, "url": valid_url})
        except Exception as exc:
            self._write_json(502, {"error": "Failed to fetch listing page", "details": str(exc)})

    def log_message(self, format: str, *args) -> None:  # noqa: A003
        return


def main() -> None:
    server = ThreadingHTTPServer((HOST, PORT), OgHandler)
    print(f"OG image server listening on http://{HOST}:{PORT}")
    server.serve_forever()


if __name__ == "__main__":
    main()
