"""
AWS Lambda function to scrape vehicle data and save to S3
Triggered daily by EventBridge (CloudWatch Events)
"""

import boto3
import csv
import json
import logging
import re
import time
from datetime import datetime
from io import StringIO
from typing import Any
from urllib.parse import parse_qs, urlparse

from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.common.exceptions import TimeoutException, WebDriverException
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.by import By

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3_client = boto3.client("s3")

# Configuration
S3_BUCKET = "autoinsight-data"  # Change to your bucket name
S3_PREFIX = "raw-data/"
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


def setup_chrome_driver():
    """Set up Chrome WebDriver for Lambda"""
    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument(
        "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    )
    
    # Lambda uses /tmp for temporary files
    chrome_options.add_argument("--temp-profile-dir=/tmp/chrome")
    
    try:
        driver = webdriver.Chrome(options=chrome_options)
        driver.set_page_load_timeout(40)
        return driver
    except Exception as e:
        logger.error(f"Failed to initialize Chrome driver: {e}")
        raise


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
            "car", "motorbike", "motorcycle", "three", "wheel", "van",
            "suv", "jeep", "pickup", "lorry", "bus",
        }
        model_parts = [
            token for token in tokens[1:]
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


def scrape_page(driver: webdriver.Remote, search_template: str, page_num: int, target_type: str) -> list[dict[str, Any]]:
    """Scrape a single page and return vehicle rows"""
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
    except (TimeoutException, WebDriverException):
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
        except Exception as e:
            logger.warning(f"Error parsing card: {e}")
            continue

    return rows


def scrape_all(
    types: list[str],
    make: str = "",
    model: str = "",
    year: str = "",
    max_pages_per_type: int = 5,  # Limited for Lambda's 15-minute timeout
    delay_seconds: float = 1.5,
) -> list[dict[str, Any]]:
    """Scrape all vehicle types and return rows"""
    driver = setup_chrome_driver()
    seen_urls: set[str] = set()
    all_rows: list[dict[str, Any]] = []

    try:
        for vehicle_type in types:
            search_template = build_search_template(vehicle_type, make, model, year)
            page = 1

            while True:
                if max_pages_per_type > 0 and page > max_pages_per_type:
                    break

                logger.info(f"[{vehicle_type}] scraping page {page}...")
                page_rows = scrape_page(driver, search_template, page, vehicle_type)

                if not page_rows:
                    logger.info(f"[{vehicle_type}] no more results at page {page}")
                    break

                added = 0
                for row in page_rows:
                    url = str(row.get("Vehicle URL") or "").strip()
                    if not url or url in seen_urls:
                        continue
                    seen_urls.add(url)
                    all_rows.append(row)
                    added += 1

                logger.info(f"[{vehicle_type}] page {page}: added {added}, total {len(all_rows)}")
                page += 1
                time.sleep(max(delay_seconds, 0.0))
    finally:
        driver.quit()

    return all_rows


def write_to_s3(rows: list[dict[str, Any]], bucket: str, prefix: str) -> tuple[str, str]:
    """Write CSV data to S3"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Generate CSV in memory
    csv_buffer = StringIO()
    writer = csv.DictWriter(csv_buffer, fieldnames=FIELDS)
    writer.writeheader()
    for row in rows:
        writer.writerow({field: row.get(field) for field in FIELDS})
    
    csv_content = csv_buffer.getvalue()
    
    # Save timestamped version
    dated_key = f"{prefix}all_vehicles_{timestamp}.csv"
    s3_client.put_object(Bucket=bucket, Key=dated_key, Body=csv_content)
    
    # Save latest version
    latest_key = f"{prefix}latest_all_vehicles.csv"
    s3_client.put_object(Bucket=bucket, Key=latest_key, Body=csv_content)
    
    logger.info(f"Saved {len(rows)} rows to S3: {dated_key} and {latest_key}")
    return dated_key, latest_key


def lambda_handler(event, context):
    """
    Lambda handler - triggered daily by EventBridge
    """
    try:
        logger.info("Starting vehicle scrape Lambda")
        
        # Parse event parameters (from EventBridge or manual invocation)
        vehicle_types = event.get("types", ALLOWED_TYPES)
        make = event.get("make", "")
        model = event.get("model", "")
        year = event.get("year", "")
        max_pages = event.get("max_pages_per_type", 5)
        
        logger.info(f"Parameters: types={vehicle_types}, make={make}, model={model}, year={year}")
        
        # Scrape data
        rows = scrape_all(
            types=vehicle_types,
            make=make,
            model=model,
            year=year,
            max_pages_per_type=max_pages,
        )
        
        if not rows:
            logger.warning("No vehicles scraped")
            return {
                "statusCode": 200,
                "body": json.dumps({"message": "No data scraped", "count": 0}),
            }
        
        # Upload to S3
        dated_key, latest_key = write_to_s3(rows, S3_BUCKET, S3_PREFIX)
        
        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": "Scrape completed successfully",
                "count": len(rows),
                "dated_file": dated_key,
                "latest_file": latest_key,
            }),
        }
    
    except Exception as e:
        logger.error(f"Lambda execution failed: {e}", exc_info=True)
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)}),
        }
