from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.edge.options import Options as EdgeOptions
from selenium.webdriver.edge.service import Service as EdgeService
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchDriverException, WebDriverException
import time
import re
from bs4 import BeautifulSoup
import csv
import os
import shutil
from datetime import datetime
from urllib.parse import urlparse, parse_qs
import signal
import sys
import json
from flask import Flask, Response, jsonify, request, stream_with_context

try:
    from flask_cors import CORS
except ModuleNotFoundError:
    def CORS(_app):
        print("Warning: flask-cors is not installed; CORS support is disabled.")



try:
    from webdriver_manager.chrome import ChromeDriverManager
except Exception:
    ChromeDriverManager = None

try:
    from webdriver_manager.microsoft import EdgeChromiumDriverManager
except Exception:
    EdgeChromiumDriverManager = None

# Global constants
CSV_FILENAME = 'riyasewana_vehicles.csv'
FIELD_NAMES = ['Vehicle Type', 'Make', 'Model', 'Year', 'Price', 'Milleage', 'District', 'published date', 'Vehicle URL']
ALLOWED_TYPE_SLUGS = ['cars', 'vans', 'pickups', 'suvs']

# Global stop flag (used by Ctrl+C handler)
stop_flag = False


def signal_handler(sig, frame):
    global stop_flag
    print("\n\n⚠️  Stopping scraper... (Ctrl+C detected)")
    stop_flag = True


import threading
if threading.current_thread() is threading.main_thread():
    try:
        signal.signal(signal.SIGINT, signal_handler)
    except ValueError:
        pass



app = Flask(__name__)
CORS(app)





# ─── URL helpers ────────────────────────────────────────────────────────────────

def slugify_search_part(value):
    text = (value or '').strip().lower()
    text = re.sub(r'[\s_]+', '-', text)
    text = re.sub(r'[^a-z0-9-]', '', text)
    return re.sub(r'-{2,}', '-', text).strip('-')


def build_search_url_template(filters):
    vehicle_type = (filters.get('vehicle_type') or 'cars').strip().lower()
    if vehicle_type not in ALLOWED_TYPE_SLUGS:
        vehicle_type = 'cars'

    make  = slugify_search_part(filters.get('make'))
    model = slugify_search_part(filters.get('model'))
    year  = (filters.get('year') or '').strip()

    path_parts = ['https://riyasewana.com/search', vehicle_type]
    if make:
        path_parts.append(make)
    if model:
        path_parts.append(model)

    query_parts = []
    if year:
        query_parts.append(f"year={year}")
    query_parts.append('page={page_num}')

    return f"{'/'.join(path_parts)}?{'&'.join(query_parts)}"


def parse_search_filters(url):
    parsed = urlparse(url)
    path_parts = [p for p in parsed.path.split('/') if p]
    result = {'vehicle_type': None, 'make': None, 'model': None, 'year': None}

    if 'search' in path_parts:
        idx = path_parts.index('search')
        if idx + 1 < len(path_parts):
            result['vehicle_type'] = path_parts[idx + 1].lower()
        if idx + 2 < len(path_parts):
            result['make'] = path_parts[idx + 2].lower()
        if idx + 3 < len(path_parts):
            result['model'] = path_parts[idx + 3].lower()

    query = parse_qs(parsed.query)
    year = (query.get('year') or [None])[0]
    if year:
        result['year'] = str(year).strip()

    return result


def normalize_match_text(value):
    normalized = (value or '').lower().replace('-', ' ')
    normalized = re.sub(r'[^a-z0-9\s]', ' ', normalized)
    return re.sub(r'\s+', ' ', normalized).strip()


def vehicle_type_from_slug(type_slug):
    return {'cars': 'Car', 'vans': 'Van', 'pickups': 'Pickup', 'suvs': 'SUV'}.get(
        (type_slug or '').lower()
    )


def parse_price_to_lkr(price_value):
    if price_value is None:
        return None
    if isinstance(price_value, (int, float)):
        return int(price_value)

    text = str(price_value).replace(',', '')
    match = re.search(r'(\d+(?:\.\d+)?)', text)
    if not match:
        return None

    try:
        return int(float(match.group(1)))
    except (TypeError, ValueError):
        return None


def parse_mileage_to_int(mileage_value):
    if mileage_value is None:
        return None
    if isinstance(mileage_value, (int, float)):
        return int(mileage_value)

    text = str(mileage_value).replace(',', '')
    match = re.search(r'(\d+)', text)
    if not match:
        return None

    try:
        return int(match.group(1))
    except (TypeError, ValueError):
        return None


def infer_condition(text):
    normalized = (text or '').lower()
    if 'unregistered' in normalized or 'brand new' in normalized:
        return 'Brand New'
    if 'recondition' in normalized or 're-conditioned' in normalized:
        return 'Recondition'
    return 'Used'


def normalize_vehicle_for_api(vehicle, index=0):
    make = (vehicle.get('Make') or '').strip()
    model = (vehicle.get('Model') or '').strip()
    title = (vehicle.get('Title') or '').strip()
    source_text = ' '.join([make, model, title]).strip()

    price_lkr = parse_price_to_lkr(vehicle.get('Price'))
    mileage = parse_mileage_to_int(vehicle.get('Milleage'))

    year_raw = vehicle.get('Year')
    try:
        year = int(year_raw) if year_raw is not None else 0
    except (TypeError, ValueError):
        year = 0

    vehicle_url = (vehicle.get('Vehicle URL') or '').strip()

    return {
        'id': vehicle_url or f'live-{index}',
        'vehicleType': (vehicle.get('Vehicle Type') or 'Car'),
        'make': make,
        'model': model,
        'year': year,
        'priceLkr': price_lkr,
        'priceMillion': round((price_lkr or 0) / 1_000_000, 2),
        'mileage': mileage or 0,
        'district': (vehicle.get('District') or '').strip(),
        'publishedDate': (vehicle.get('published date') or '').strip(),
        'vehicleUrl': vehicle_url,
        'condition': infer_condition(source_text),
        'imageUrl': (vehicle.get('imageUrl') or '').strip() or None,
        'rawPrice': vehicle.get('Price'),
    }


def vehicle_matches_filters(vehicle, filters):
    district = (vehicle.get('district') or '').lower()
    condition = (vehicle.get('condition') or '').lower()

    year = vehicle.get('year') or 0
    mileage = vehicle.get('mileage') or 0
    price_lkr = vehicle.get('priceLkr')

    if filters.get('district') and district != filters['district'].lower():
        return False

    if filters.get('condition') and condition != filters['condition'].lower():
        return False

    min_year = filters.get('min_year')
    if min_year is not None and year < min_year:
        return False
    max_year = filters.get('max_year')
    if max_year is not None and year > max_year:
        return False

    min_mileage = filters.get('min_mileage')
    if min_mileage is not None and mileage < min_mileage:
        return False
    max_mileage = filters.get('max_mileage')
    if max_mileage is not None and mileage > max_mileage:
        return False

    min_price_lkr = filters.get('min_price_lkr')
    if min_price_lkr is not None:
        if price_lkr is None or price_lkr < min_price_lkr:
            return False
    max_price_lkr = filters.get('max_price_lkr')
    if max_price_lkr is not None:
        if price_lkr is None or price_lkr > max_price_lkr:
            return False

    return True


def parse_optional_int(payload, key):
    value = payload.get(key)
    if value is None or value == '':
        return None
    try:
        return int(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f'{key} must be an integer.') from exc


# ─── CSV helpers ────────────────────────────────────────────────────────────────

def setup_csv_file():
    if not os.path.exists(CSV_FILENAME):
        with open(CSV_FILENAME, 'w', newline='', encoding='utf-8') as f:
            csv.DictWriter(f, fieldnames=FIELD_NAMES).writeheader()
        print(f"Created new CSV file: {CSV_FILENAME}")
    else:
        print(f"Appending to existing CSV file: {CSV_FILENAME}")


def save_vehicle_to_csv(vehicle_data):
    try:
        with open(CSV_FILENAME, 'a', newline='', encoding='utf-8') as f:
            csv.DictWriter(f, fieldnames=FIELD_NAMES).writerow(vehicle_data)
    except Exception as e:
        print(f"Error saving to CSV: {e}")


# ─── Browser setup ──────────────────────────────────────────────────────────────

def find_browser_binary(browser_name):
    env_map = {
        'chrome': ['CHROME_BINARY', 'GOOGLE_CHROME_BIN'],
        'edge':   ['EDGE_BINARY',   'MS_EDGE_BINARY'],
    }
    candidates = [os.environ.get(v) for v in env_map.get(browser_name, []) if os.environ.get(v)]

    if os.name == 'nt':
        bases = [os.environ.get(k) for k in ('PROGRAMFILES', 'PROGRAMFILES(X86)', 'LOCALAPPDATA')]
        if browser_name == 'chrome':
            candidates += [os.path.join(b, 'Google', 'Chrome', 'Application', 'chrome.exe')
                           for b in bases if b]
        elif browser_name == 'edge':
            candidates += [os.path.join(b, 'Microsoft', 'Edge', 'Application', 'msedge.exe')
                           for b in bases if b]

    return next((p for p in candidates if p and os.path.exists(p)), None)


def _apply_timeouts(driver):
    driver.set_page_load_timeout(30)
    driver.set_script_timeout(30)
    return driver


def setup_driver():
    chrome_opts = Options()
    for arg in ("--headless", "--disable-gpu", "--no-sandbox",
                "--disable-dev-shm-usage", "--window-size=1920,1080",
                "--disable-extensions", "--disable-plugins",
                "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"):
        chrome_opts.add_argument(arg)
    chrome_opts.add_experimental_option("prefs", {
        "profile.managed_default_content_settings.images": 2,
        "profile.default_content_setting_values.notifications": 2,
        "profile.managed_default_content_settings.stylesheets": 2,
    })
    binary = find_browser_binary('chrome')
    if binary:
        chrome_opts.binary_location = binary

    edge_opts = EdgeOptions()
    for arg in ("--headless", "--disable-gpu", "--no-sandbox",
                "--disable-dev-shm-usage", "--window-size=1920,1080",
                "--disable-extensions", "--disable-plugins",
                "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"):
        edge_opts.add_argument(arg)
    binary_e = find_browser_binary('edge')
    if binary_e:
        edge_opts.binary_location = binary_e

    # 1. Selenium Manager (Chrome)
    try:
        return _apply_timeouts(webdriver.Chrome(options=chrome_opts))
    except (NoSuchDriverException, WebDriverException) as e:
        last_err = e

    # 2. Local / env chromedriver paths
    candidates = []
    if os.environ.get("CHROMEDRIVER_PATH"):
        candidates.append(os.environ["CHROMEDRIVER_PATH"])
    candidates += [
        os.path.join(os.getcwd(), 'chromedriver.exe'),
        os.path.join(os.path.dirname(__file__), 'chromedriver.exe'),
        os.path.join(os.path.dirname(__file__), 'drivers', 'chromedriver.exe'),
    ]
    sys_driver = shutil.which('chromedriver')
    if sys_driver:
        candidates.append(sys_driver)

    for path in dict.fromkeys(os.path.normpath(p) for p in candidates if p):
        if not os.path.exists(path):
            continue
        try:
            return _apply_timeouts(webdriver.Chrome(service=Service(path), options=chrome_opts))
        except Exception as err:
            last_err = err

    # 3. webdriver-manager (Chrome)
    if ChromeDriverManager:
        try:
            mgr_path = ChromeDriverManager().install()
            return _apply_timeouts(webdriver.Chrome(service=Service(mgr_path), options=chrome_opts))
        except Exception as err:
            last_err = err

    # 4. Edge fallback
    try:
        return _apply_timeouts(webdriver.Edge(options=edge_opts))
    except Exception as err:
        last_err = err

    if EdgeChromiumDriverManager:
        try:
            mgr_path = EdgeChromiumDriverManager().install()
            return _apply_timeouts(webdriver.Edge(service=EdgeService(mgr_path), options=edge_opts))
        except Exception as err:
            last_err = err

    raise RuntimeError(
        "Unable to start browser driver. Install Chrome/Edge or set "
        "CHROMEDRIVER_PATH/EDGEDRIVER_PATH, or: pip install webdriver-manager"
    ) from last_err


# ─── Scraping logic ─────────────────────────────────────────────────────────────

def extract_vehicle_data(title, boxtext_divs):
    data = {k: None for k in FIELD_NAMES}

    title_lower = title.lower()
    for kw, vt in {
        'car': 'Car', 'motorbike': 'Motorbike', 'motorcycle': 'Motorbike',
        'three wheel': 'Three Wheel', 'van': 'Van', 'suv': 'SUV', 'jeep': 'SUV',
        'lorry': 'Lorry', 'bus': 'Bus', 'pickup': 'Pickup',
        'tractor': 'Tractor', 'bicycle': 'Bicycle',
    }.items():
        if kw in title_lower:
            data['Vehicle Type'] = vt
            break

    m = re.search(r'\b(19|20)\d{2}\b', title)
    if m:
        data['Year'] = int(m.group())

    parts = title.split()
    if parts:
        data['Make'] = parts[0]
        skip = {'car','motorbike','motorcycle','three','wheel','van','suv','jeep',
                'lorry','bus','pickup','heavy-duty','heavy','duty'}
        model_parts = [p for p in parts[1:]
                       if not (p.isdigit() and len(p) == 4 and 1900 <= int(p) <= 2030)
                       and p.lower() not in skip]
        data['Model'] = ' '.join(model_parts) or None

    for div in boxtext_divs:
        text = div.get_text(strip=True)
        if 'Rs.' in text or 'Negotiable' in text:
            data['Price'] = text
        elif '(km)' in text:
            km = re.search(r'(\d+(?:,\d{3})*)', text)
            if km:
                data['Milleage'] = int(km.group().replace(',', ''))
        elif re.match(r'\d{4}-\d{2}-\d{2}', text):
            data['published date'] = text
        elif not any(k in text.lower() for k in ['rs.','km','negotiable','price','mileage']) and len(text) > 2:
            data['District'] = text

    return data


def scrape_page(driver, page_num, search_url_template):
    vehicles = []
    try:
        url = search_url_template.format(page_num=page_num)
        target = parse_search_filters(url)
        target_make         = target.get('make')
        target_model        = target.get('model')
        target_year         = target.get('year')
        target_vehicle_type = target.get('vehicle_type')

        driver.get(url)
        WebDriverWait(driver, 20).until(
            lambda d: len(d.find_elements(By.CSS_SELECTOR, "li.v-card, li.item")) > 0
        )
        time.sleep(1)

        soup  = BeautifulSoup(driver.page_source, 'html.parser')
        items = soup.select('li.v-card, li.item')

        for item in items:
            try:
                title   = ''
                classes = item.get('class', [])

                img_src = None
                img_el = item.find('img')
                if img_el and img_el.get('src'):
                    img_src = img_el.get('src').strip()
                    if img_src.startswith('//'):
                        img_src = 'https:' + img_src
                    elif img_src.startswith('/'):
                        img_src = 'https://riyasewana.com' + img_src

                if 'v-card' in classes:
                    link = item.select_one('.v-card-title a') or item.find('a', href=True)
                    if not link:
                        continue
                    title = (link.get('title') or link.get_text(strip=True) or '').strip()
                    if not title:
                        continue

                    href = link.get('href', '')
                    if href.startswith('//'):
                        href = 'https:' + href
                    elif href.startswith('/'):
                        href = 'https://riyasewana.com' + href

                    vd = extract_vehicle_data(title, [])

                    price_el = item.select_one('.v-card-price')
                    if price_el:
                        vd['Price'] = price_el.get_text(' ', strip=True)

                    meta_el = item.select_one('.v-card-meta')
                    if meta_el:
                        meta_text = meta_el.get_text(' ', strip=True)
                        km = re.search(r'(\d+(?:,\d{3})*)\s*km', meta_text, re.IGNORECASE)
                        if km:
                            vd['Milleage'] = int(km.group(1).replace(',', ''))
                        district = re.sub(r'\s*\d+(?:,\d{3})*\s*km\s*', ' ', meta_text, flags=re.IGNORECASE)
                        district = re.sub(r'\s+', ' ', district.replace('·', ' ')).strip()
                        if district:
                            vd['District'] = district

                    date_el = item.select_one('.v-card-date')
                    if date_el:
                        vd['published date'] = date_el.get_text(' ', strip=True)

                    vd['Vehicle URL'] = href

                else:  # legacy li.item
                    h2 = item.find('h2', class_='more')
                    if not h2:
                        continue
                    link = h2.find('a')
                    if not link:
                        continue
                    title = link.get('title', '').strip()
                    if not title:
                        continue

                    href = link.get('href', '')
                    if href and not href.startswith('http'):
                        href = 'https://riyasewana.com' + href

                    boxtext = item.find('div', class_='boxtext')
                    if not boxtext:
                        continue

                    vd = extract_vehicle_data(title, boxtext.find_all('div', class_='boxintxt'))
                    vd['Vehicle URL'] = href

                # Filter enforcement
                norm_title = normalize_match_text(title)
                vd['Title'] = title

                if target_make:
                    if normalize_match_text(target_make) not in norm_title:
                        continue
                    vd['Make'] = target_make.replace('-', ' ').title()

                if target_model and normalize_match_text(target_model) not in norm_title:
                    continue
                if target_model and not vd.get('Model'):
                    vd['Model'] = target_model.replace('-', ' ').title()

                if target_year and str(vd.get('Year') or '') != str(target_year):
                    continue

                if target_vehicle_type:
                    url_type = vehicle_type_from_slug(target_vehicle_type)
                    if url_type:
                        vd['Vehicle Type'] = url_type

                if img_src:
                    vd['imageUrl'] = img_src

                vehicles.append(vd)

            except Exception as e:
                print(f"  ⚠️  Error parsing item on page {page_num}: {e}")

    except TimeoutException:
        print(f"  ⏱  Timeout loading page {page_num}")
    except Exception as e:
        print(f"  ❌ Error scraping page {page_num}: {e}")

    return vehicles


# ─── Terminal printing ──────────────────────────────────────────────────────────

DIVIDER = "─" * 90

def print_vehicle(vehicle, index):
    """Pretty-print a single vehicle to the terminal."""
    print(DIVIDER)
    print(f"  #{index:>4}  {vehicle.get('Make', 'N/A')} {vehicle.get('Model', '')}  "
          f"({vehicle.get('Year', 'N/A')})  |  {vehicle.get('Vehicle Type', 'N/A')}")
    print(f"         Price    : {vehicle.get('Price', 'N/A')}")
    print(f"         Mileage  : {str(vehicle.get('Milleage', 'N/A'))} km")
    print(f"         District : {vehicle.get('District', 'N/A')}")
    print(f"         Listed   : {vehicle.get('published date', 'N/A')}")
    print(f"         URL      : {vehicle.get('Vehicle URL', 'N/A')}")


def print_summary_header(filters, url_template):
    print("\n" + "═" * 90)
    print("  🚗  RIYASEWANA VEHICLE SCRAPER")
    print("═" * 90)
    print(f"  Type   : {filters.get('vehicle_type', 'cars').upper()}")
    print(f"  Make   : {filters.get('make') or '(any)'}")
    print(f"  Model  : {filters.get('model') or '(any)'}")
    print(f"  Year   : {filters.get('year') or '(any)'}")
    print(f"  URL    : {url_template.format(page_num=1)}")
    print("═" * 90)
    print("  Press Ctrl+C at any time to stop.\n")


# ─── Main scrape loop ───────────────────────────────────────────────────────────

def run_scraper(filters):
    global stop_flag
    stop_flag = False

    url_template = build_search_url_template(filters)
    print_summary_header(filters, url_template)

    setup_csv_file()

    driver = None
    total  = 0
    start  = time.time()

    try:
        print("⏳  Starting browser...")
        driver = setup_driver()
        print("✅  Browser ready.\n")

        page = 1
        while page <= 67000 and not stop_flag:
            print(f"📄  Scraping page {page}...")
            vehicles = scrape_page(driver, page, url_template)

            if not vehicles:
                print(f"\n  No vehicles found on page {page}. End of results.")
                break

            for v in vehicles:
                if stop_flag:
                    break
                total += 1
                save_vehicle_to_csv(v)
                print_vehicle(v, total)

            elapsed = time.time() - start
            speed   = total / elapsed if elapsed > 0 else 0
            print(f"\n  ✔  Page {page} done | Total so far: {total} | "
                  f"Speed: {speed:.2f} v/s | Elapsed: {elapsed:.0f}s\n")

            delay = 1 + (time.time() % 2)
            time.sleep(delay)
            page += 1

    except RuntimeError as e:
        print(f"\n❌  Browser setup failed:\n    {e}")
    except Exception as e:
        print(f"\n❌  Unexpected error: {e}")
    finally:
        if driver:
            driver.quit()

        elapsed = time.time() - start
        speed   = total / elapsed if elapsed > 0 else 0
        print("\n" + "═" * 90)
        print("  SCRAPE COMPLETE")
        print(f"  Total vehicles : {total:,}")
        print(f"  Time elapsed   : {elapsed:.1f} seconds")
        print(f"  Speed          : {speed:.2f} vehicles/second")
        print(f"  Saved to       : {CSV_FILENAME}")
        print("═" * 90 + "\n")


def scrape_filtered_vehicles(filters, max_results=200):
    """Scrape all available pages and return in-memory results for API use."""
    if max_results < 1:
        max_results = 1
    if max_results > 1000:
        max_results = 1000

    url_template = build_search_url_template(filters)
    driver = None
    results = []
    pages_scraped = 0
    started_at = time.time()
    sequence = 0

    try:
        driver = setup_driver()
        page = 1
        while len(results) < max_results:
            vehicles = scrape_page(driver, page, url_template)
            pages_scraped += 1

            if not vehicles:
                break

            for vehicle in vehicles:
                sequence += 1
                normalized = normalize_vehicle_for_api(vehicle, index=sequence)
                if not vehicle_matches_filters(normalized, filters):
                    continue
                results.append(normalized)
                if len(results) >= max_results:
                    break

            page += 1

    finally:
        if driver:
            driver.quit()

    elapsed = time.time() - started_at
    return {
        'results': results,
        'meta': {
            'pages_scraped': pages_scraped,
            'elapsed_seconds': round(elapsed, 2),
            'result_count': len(results),
        },
    }


def parse_api_filters(payload):
    condition_raw = (payload.get('condition') or '').strip().lower()
    condition_map = {
        'registered': 'Used',
        'used': 'Used',
        'unregistered': 'Brand New',
        'brand new': 'Brand New',
        'recondition': 'Recondition',
        'reconditioned': 'Recondition',
    }
    condition = ''
    if condition_raw:
        condition = condition_map.get(condition_raw)
        if not condition:
            raise ValueError('condition must be one of Used, Recondition, Brand New.')

    year_exact = (payload.get('year') or '').strip()
    min_year = parse_optional_int(payload, 'min_year')
    max_year = parse_optional_int(payload, 'max_year')
    if year_exact:
        if not re.fullmatch(r'\d{4}', year_exact):
            raise ValueError('Year must be exactly 4 digits.')
        min_year = int(year_exact)
        max_year = int(year_exact)

    filters = {
        'vehicle_type': (payload.get('vehicle_type') or 'cars').strip().lower(),
        'make': (payload.get('make') or '').strip(),
        'model': (payload.get('model') or '').strip(),
        'year': year_exact,
        'condition': condition,
        'district': (payload.get('district') or '').strip(),
        'min_year': min_year,
        'max_year': max_year,
        'min_mileage': parse_optional_int(payload, 'min_mileage'),
        'max_mileage': parse_optional_int(payload, 'max_mileage'),
        'min_price_lkr': parse_optional_int(payload, 'min_price_lkr'),
        'max_price_lkr': parse_optional_int(payload, 'max_price_lkr'),
    }

    if filters['vehicle_type'] not in ALLOWED_TYPE_SLUGS:
        filters['vehicle_type'] = 'cars'

    if filters['min_year'] is not None and filters['max_year'] is not None and filters['min_year'] > filters['max_year']:
        raise ValueError('min_year cannot be greater than max_year.')

    if filters['min_mileage'] is not None and filters['max_mileage'] is not None and filters['min_mileage'] > filters['max_mileage']:
        raise ValueError('min_mileage cannot be greater than max_mileage.')

    if filters['min_price_lkr'] is not None and filters['max_price_lkr'] is not None and filters['min_price_lkr'] > filters['max_price_lkr']:
        raise ValueError('min_price_lkr cannot be greater than max_price_lkr.')

    return filters


@app.get('/api/health')
def api_health():
    return jsonify({'ok': True, 'service': 'riyasewana-scraper-api'})


@app.get('/api/vehicle-types')
def api_vehicle_types():
    return jsonify({'vehicle_types': ALLOWED_TYPE_SLUGS})


@app.post('/api/search')
def api_search():
    payload = request.get_json(silent=True) or {}

    try:
        filters = parse_api_filters(payload)
    except ValueError as exc:
        return jsonify({'error': str(exc)}), 400

    max_results = payload.get('max_results', 200)

    try:
        max_results = int(max_results)
    except (TypeError, ValueError):
        return jsonify({'error': 'max_results must be an integer.'}), 400

    try:
        data = scrape_filtered_vehicles(filters, max_results=max_results)
        return jsonify({
            'filters': filters,
            'results': data['results'],
            'meta': data['meta'],
        })
    except RuntimeError as exc:
        return jsonify({'error': f'Browser setup failed: {exc}'}), 500
    except Exception as exc:
        return jsonify({'error': f'Unexpected error: {exc}'}), 500


@app.get('/api/search/stream')
def api_search_stream():
    try:
        filters = parse_api_filters(request.args.to_dict())
    except ValueError as exc:
        return jsonify({'error': str(exc)}), 400

    max_results_raw = request.args.get('max_results', 200)
    try:
        max_results = int(max_results_raw)
    except (TypeError, ValueError):
        return jsonify({'error': 'max_results must be an integer.'}), 400

    if max_results < 1:
        max_results = 1
    if max_results > 1000:
        max_results = 1000

    def generate():
        driver = None
        total = 0
        pages_scraped = 0
        sequence = 0
        started_at = time.time()
        try:
            driver = setup_driver()
            url_template = build_search_url_template(filters)
            page = 1
            while total < max_results:
                vehicles = scrape_page(driver, page, url_template)
                pages_scraped += 1
                if not vehicles:
                    break
                for v in vehicles:
                    sequence += 1
                    normalized = normalize_vehicle_for_api(v, index=sequence)
                    if not vehicle_matches_filters(normalized, filters):
                        continue
                    yield f"data: {json.dumps(normalized, default=str)}\n\n"
                    total += 1
                    if total >= max_results:
                        break
                page += 1
            elapsed = round(time.time() - started_at, 2)
            yield f"event: done\ndata: {json.dumps({'total': total, 'pages_scraped': pages_scraped, 'elapsed_seconds': elapsed})}\n\n"
        except Exception as exc:
            yield f"event: scrape_error\ndata: {json.dumps({'error': str(exc)})}\n\n"
        finally:
            if driver:
                driver.quit()

    return Response(
        stream_with_context(generate()),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no',
            'Connection': 'keep-alive',
        },
    )


# ─── User input ─────────────────────────────────────────────────────────────────

def prompt_filters():
    print("\n" + "═" * 90)
    print("  🚗  RIYASEWANA VEHICLE SCRAPER  —  Search Setup")
    print("═" * 90)
    print(f"  Vehicle types: {', '.join(ALLOWED_TYPE_SLUGS)}\n")

    # Vehicle type
    while True:
        vtype = input(f"  Vehicle type [{'/'.join(ALLOWED_TYPE_SLUGS)}] (default: cars): ").strip().lower()
        if not vtype:
            vtype = 'cars'
        if vtype in ALLOWED_TYPE_SLUGS:
            break
        print(f"  ⚠️  Please enter one of: {', '.join(ALLOWED_TYPE_SLUGS)}")

    # Make (required)
    while True:
        make = input("  Make (e.g. toyota, honda, bmw) [required]: ").strip()
        if make:
            break
        print("  ⚠️  Make is required.")

    model = input("  Model (e.g. corolla, civic) [optional, press Enter to skip]: ").strip()

    # Year (optional, 4 digits)
    while True:
        year = input("  Year (e.g. 2018) [optional, press Enter to skip]: ").strip()
        if not year:
            break
        if re.fullmatch(r'\d{4}', year):
            break
        print("  ⚠️  Year must be exactly 4 digits.")

    return {'vehicle_type': vtype, 'make': make, 'model': model, 'year': year}


# ─── Entry point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    if '--api' in sys.argv:
        app.run(host='0.0.0.0', port=5000, debug=True)
    else:
        filters = prompt_filters()
        run_scraper(filters)