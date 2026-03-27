from __future__ import annotations

import argparse
import csv
import re
import signal
import shutil
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlparse

from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.common.exceptions import TimeoutException, WebDriverException
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.edge.options import Options as EdgeOptions
from selenium.webdriver.edge.service import Service as EdgeService
from selenium.webdriver.support.ui import WebDriverWait

try:
    from webdriver_manager.chrome import ChromeDriverManager
except Exception:
    ChromeDriverManager = None

try:
    from webdriver_manager.microsoft import EdgeChromiumDriverManager
except Exception:
    EdgeChromiumDriverManager = None

ALLOWED_TYPES = ["cars", "vans", "pickups", "suvs"]
FIELDS = [
    "Vehicle Type",
    "Make",
    "Model",
    "Year",
    "Price",
    "Milleage",
    "District",
    "published date",
    "Vehicle URL",
]

STOP_REQUESTED = False


def _signal_stop_handler(_sig: int, _frame: Any) -> None:
    global STOP_REQUESTED
    STOP_REQUESTED = True
    print("\nStop requested. Finishing current page and saving data...")


signal.signal(signal.SIGINT, _signal_stop_handler)


def slugify(value: str | None) -> str:
    text = (value or "").strip().lower()
    text = re.sub(r"[\s_]+", "-", text)
    text = re.sub(r"[^a-z0-9-]", "", text)
    return re.sub(r"-{2,}", "-", text).strip("-")


def build_search_template(vehicle_type: str, make: str, model: str, year: str) -> str:
    make_slug = slugify(make)
    model_slug = slugify(model)

    parts = ["https://riyasewana.com/search", vehicle_type]
    if make_slug:
        parts.append(make_slug)
    if model_slug:
        parts.append(model_slug)

    query = []
    if year:
        query.append(f"year={year}")
    query.append("page={page_num}")

    return f"{'/'.join(parts)}?{'&'.join(query)}"


def parse_target(url: str) -> dict[str, str]:
    parsed = urlparse(url)
    path_parts = [part for part in parsed.path.split("/") if part]
    target: dict[str, str] = {"type": "", "make": "", "model": "", "year": ""}

    if "search" in path_parts:
        idx = path_parts.index("search")
        if idx + 1 < len(path_parts):
            target["type"] = path_parts[idx + 1].lower()
        if idx + 2 < len(path_parts):
            target["make"] = path_parts[idx + 2].lower()
        if idx + 3 < len(path_parts):
            target["model"] = path_parts[idx + 3].lower()

    year = (parse_qs(parsed.query).get("year") or [""])[0]
    target["year"] = str(year).strip()
    return target


def normalize_text(value: str | None) -> str:
    text = (value or "").lower().replace("-", " ")
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def parse_vehicle_type_label(type_slug: str) -> str:
    mapping = {"cars": "Car", "vans": "Van", "pickups": "Pickup", "suvs": "SUV"}
    return mapping.get(type_slug.lower(), "Car")


def extract_vehicle_data(title: str, boxtext_divs: list[Any]) -> dict[str, Any]:
    row: dict[str, Any] = {field: None for field in FIELDS}

    year_match = re.search(r"\b(19|20)\d{2}\b", title)
    if year_match:
        row["Year"] = int(year_match.group())

    tokens = title.split()
    if tokens:
        row["Make"] = tokens[0]
        skip_tokens = {
            "car",
            "motorbike",
            "motorcycle",
            "three",
            "wheel",
            "van",
            "suv",
            "jeep",
            "pickup",
            "lorry",
            "bus",
        }
        model_parts = [
            token
            for token in tokens[1:]
            if not (token.isdigit() and len(token) == 4 and 1900 <= int(token) <= 2035)
            and token.lower() not in skip_tokens
        ]
        row["Model"] = " ".join(model_parts) if model_parts else None

    for div in boxtext_divs:
        text = div.get_text(strip=True)
        if "Rs." in text or "Negotiable" in text:
            row["Price"] = text
        elif "(km)" in text:
            km_match = re.search(r"(\d+(?:,\d{3})*)", text)
            if km_match:
                row["Milleage"] = int(km_match.group(1).replace(",", ""))
        elif re.match(r"\d{4}-\d{2}-\d{2}", text):
            row["published date"] = text
        elif not any(key in text.lower() for key in ["rs.", "km", "price", "mileage", "negotiable"]):
            row["District"] = text

    return row


def find_browser_binary(browser_name: str) -> str | None:
    if sys.platform.startswith("win"):
        local_app_data = str(Path.home() / "AppData" / "Local")
        candidates: list[str] = []
        if browser_name == "chrome":
            candidates.extend(
                [
                    str(Path("C:/Program Files/Google/Chrome/Application/chrome.exe")),
                    str(Path("C:/Program Files (x86)/Google/Chrome/Application/chrome.exe")),
                    str(Path(local_app_data) / "Google/Chrome/Application/chrome.exe"),
                ]
            )
        else:
            candidates.extend(
                [
                    str(Path("C:/Program Files/Microsoft/Edge/Application/msedge.exe")),
                    str(Path("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe")),
                    str(Path(local_app_data) / "Microsoft/Edge/Application/msedge.exe"),
                ]
            )

        for path in candidates:
            if Path(path).exists():
                return path
    return None


def setup_driver(headless: bool) -> webdriver.Remote:
    chrome_opts = Options()
    if headless:
        chrome_opts.add_argument("--headless=new")
    chrome_opts.add_argument("--disable-gpu")
    chrome_opts.add_argument("--no-sandbox")
    chrome_opts.add_argument("--disable-dev-shm-usage")
    chrome_opts.add_argument("--window-size=1920,1080")
    chrome_opts.add_argument(
        "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    )

    chrome_binary = find_browser_binary("chrome")
    if chrome_binary:
        chrome_opts.binary_location = chrome_binary

    edge_opts = EdgeOptions()
    if headless:
        edge_opts.add_argument("--headless=new")
    edge_opts.add_argument("--disable-gpu")
    edge_opts.add_argument("--no-sandbox")
    edge_opts.add_argument("--disable-dev-shm-usage")
    edge_opts.add_argument("--window-size=1920,1080")

    edge_binary = find_browser_binary("edge")
    if edge_binary:
        edge_opts.binary_location = edge_binary

    last_error: Exception | None = None

    try:
        driver = webdriver.Chrome(options=chrome_opts)
        driver.set_page_load_timeout(40)
        return driver
    except Exception as exc:
        last_error = exc

    chromedriver_path = shutil.which("chromedriver")
    if chromedriver_path:
        try:
            driver = webdriver.Chrome(service=Service(chromedriver_path), options=chrome_opts)
            driver.set_page_load_timeout(40)
            return driver
        except Exception as exc:
            last_error = exc

    if ChromeDriverManager is not None:
        try:
            manager_path = ChromeDriverManager().install()
            driver = webdriver.Chrome(service=Service(manager_path), options=chrome_opts)
            driver.set_page_load_timeout(40)
            return driver
        except Exception as exc:
            last_error = exc

    try:
        driver = webdriver.Edge(options=edge_opts)
        driver.set_page_load_timeout(40)
        return driver
    except Exception as exc:
        last_error = exc

    if EdgeChromiumDriverManager is not None:
        try:
            manager_path = EdgeChromiumDriverManager().install()
            driver = webdriver.Edge(service=EdgeService(manager_path), options=edge_opts)
            driver.set_page_load_timeout(40)
            return driver
        except Exception as exc:
            last_error = exc

    raise RuntimeError("Unable to start Chrome/Edge webdriver") from last_error


def scrape_page(driver: webdriver.Remote, search_template: str, page_num: int, target_type: str) -> list[dict[str, Any]]:
    url = search_template.format(page_num=page_num)
    target = parse_target(url)
    target_make = normalize_text(target.get("make"))
    target_model = normalize_text(target.get("model"))
    target_year = target.get("year")

    rows: list[dict[str, Any]] = []

    try:
        driver.get(url)
        WebDriverWait(driver, 25).until(
            lambda d: len(d.find_elements(By.CSS_SELECTOR, "li.v-card, li.item")) > 0
        )
        time.sleep(1)
    except TimeoutException:
        return rows
    except WebDriverException:
        return rows

    soup = BeautifulSoup(driver.page_source, "html.parser")
    cards = soup.select("li.v-card, li.item")

    for card in cards:
        try:
            row: dict[str, Any]
            classes = card.get("class", [])

            if "v-card" in classes:
                link = card.select_one(".v-card-title a") or card.find("a", href=True)
                if not link:
                    continue

                title = (link.get("title") or link.get_text(strip=True) or "").strip()
                if not title:
                    continue

                href = (link.get("href") or "").strip()
                if href.startswith("//"):
                    href = "https:" + href
                elif href.startswith("/"):
                    href = "https://riyasewana.com" + href

                row = extract_vehicle_data(title, [])

                price_el = card.select_one(".v-card-price")
                if price_el:
                    row["Price"] = price_el.get_text(" ", strip=True)

                meta_el = card.select_one(".v-card-meta")
                if meta_el:
                    meta_text = meta_el.get_text(" ", strip=True)
                    km_match = re.search(r"(\d+(?:,\d{3})*)\s*km", meta_text, re.IGNORECASE)
                    if km_match:
                        row["Milleage"] = int(km_match.group(1).replace(",", ""))

                    district = re.sub(r"\s*\d+(?:,\d{3})*\s*km\s*", " ", meta_text, flags=re.IGNORECASE)
                    district = re.sub(r"\s+", " ", district.replace("·", " ")).strip()
                    if district:
                        row["District"] = district

                date_el = card.select_one(".v-card-date")
                if date_el:
                    row["published date"] = date_el.get_text(" ", strip=True)

                row["Vehicle URL"] = href
            else:
                title_node = card.find("h2", class_="more")
                if not title_node:
                    continue
                link = title_node.find("a")
                if not link:
                    continue

                title = (link.get("title") or "").strip()
                if not title:
                    continue

                href = (link.get("href") or "").strip()
                if href and not href.startswith("http"):
                    href = "https://riyasewana.com" + href

                boxtext = card.find("div", class_="boxtext")
                if not boxtext:
                    continue

                row = extract_vehicle_data(title, boxtext.find_all("div", class_="boxintxt"))
                row["Vehicle URL"] = href

            row["Vehicle Type"] = parse_vehicle_type_label(target_type)
            normalized_title = normalize_text(title)

            if target_make and target_make not in normalized_title:
                continue
            if target_model and target_model not in normalized_title:
                continue
            if target_year and str(row.get("Year") or "") != str(target_year):
                continue

            if not row.get("Make") and target_make:
                row["Make"] = target_make.title()
            if not row.get("Model") and target_model:
                row["Model"] = target_model.title()

            rows.append(row)
        except Exception:
            continue

    return rows


def scrape_all(
    types: list[str],
    make: str,
    model: str,
    year: str,
    max_pages_per_type: int,
    delay_seconds: float,
    headless: bool,
    output_dir: Path,
) -> list[dict[str, Any]]:
    driver = setup_driver(headless=headless)
    seen_urls: set[str] = set()
    all_rows: list[dict[str, Any]] = []

    try:
        for vehicle_type in types:
            if STOP_REQUESTED:
                break

            search_template = build_search_template(vehicle_type, make, model, year)
            page = 1

            while True:
                if STOP_REQUESTED:
                    break

                if max_pages_per_type > 0 and page > max_pages_per_type:
                    break

                print(f"[{vehicle_type}] scraping page {page} ...")
                page_rows = scrape_page(driver, search_template, page, vehicle_type)

                if not page_rows:
                    print(f"[{vehicle_type}] no more results at page {page}")
                    break

                added = 0
                for row in page_rows:
                    url = str(row.get("Vehicle URL") or "").strip()
                    if not url or url in seen_urls:
                        continue
                    seen_urls.add(url)
                    all_rows.append(row)
                    added += 1

                print(f"[{vehicle_type}] page {page}: added {added}, total {len(all_rows)}")
                if added > 0:
                    write_partial_csv(all_rows, output_dir)
                page += 1
                time.sleep(max(delay_seconds, 0.0))
    finally:
        driver.quit()

    return all_rows


def write_csv(rows: list[dict[str, Any]], output_dir: Path) -> tuple[Path, Path]:
    output_dir.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    dated_path = output_dir / f"all_vehicles_{timestamp}.csv"
    latest_path = output_dir / "latest_all_vehicles.csv"

    with dated_path.open("w", newline="", encoding="utf-8") as file_obj:
        writer = csv.DictWriter(file_obj, fieldnames=FIELDS)
        writer.writeheader()
        for row in rows:
            writer.writerow({field: row.get(field) for field in FIELDS})

    shutil.copyfile(dated_path, latest_path)
    return dated_path, latest_path


def write_partial_csv(rows: list[dict[str, Any]], output_dir: Path) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    partial_path = output_dir / "partial_latest_all_vehicles.csv"

    with partial_path.open("w", newline="", encoding="utf-8") as file_obj:
        writer = csv.DictWriter(file_obj, fieldnames=FIELDS)
        writer.writeheader()
        for row in rows:
            writer.writerow({field: row.get(field) for field in FIELDS})

    return partial_path


def parse_types(value: str | None) -> list[str]:
    if not value:
        return ALLOWED_TYPES[:]

    raw = [part.strip().lower() for part in value.split(",") if part.strip()]
    valid = [item for item in raw if item in ALLOWED_TYPES]
    return valid if valid else ALLOWED_TYPES[:]


def parse_bool(value: str) -> bool:
    return value.strip().lower() in {"1", "true", "yes", "on"}


def main() -> int:
    parser = argparse.ArgumentParser(description="Isolated full vehicle scraper to CSV")
    parser.add_argument("--types", default=",".join(ALLOWED_TYPES), help="Comma-separated types: cars,vans,pickups,suvs")
    parser.add_argument("--make", default="", help="Optional make filter")
    parser.add_argument("--model", default="", help="Optional model filter")
    parser.add_argument("--year", default="", help="Optional year filter, e.g., 2018")
    parser.add_argument("--max-pages-per-type", type=int, default=0, help="0 means scrape until no pages remain")
    parser.add_argument("--delay-seconds", type=float, default=1.5, help="Delay between pages")
    parser.add_argument("--headless", default="true", help="true or false")

    args = parser.parse_args()

    types = parse_types(args.types)
    output_dir = Path(__file__).resolve().parent / "output"

    print("Starting isolated scrape")
    print(f"Types: {types}")
    if args.make:
        print(f"Make filter: {args.make}")
    if args.model:
        print(f"Model filter: {args.model}")
    if args.year:
        print(f"Year filter: {args.year}")

    rows = scrape_all(
        types=types,
        make=args.make,
        model=args.model,
        year=args.year,
        max_pages_per_type=args.max_pages_per_type,
        delay_seconds=args.delay_seconds,
        headless=parse_bool(args.headless),
        output_dir=output_dir,
    )

    dated_path, latest_path = write_csv(rows, output_dir)

    if STOP_REQUESTED:
        print("Scrape stopped by user. Saved partial dataset.")
    else:
        print("Scrape complete")
    print(f"Rows: {len(rows)}")
    print(f"Saved: {dated_path}")
    print(f"Latest copy: {latest_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
