from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.edge.options import Options as EdgeOptions
from selenium.webdriver.edge.service import Service as EdgeService
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException, NoSuchDriverException, WebDriverException
import pandas as pd
import time
import re
from bs4 import BeautifulSoup
import tkinter as tk
from tkinter import ttk
import threading
import queue
import webbrowser
import csv
import os
import shutil
from datetime import datetime
from urllib.parse import urlparse, parse_qs

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
SEARCH_URL_TEMPLATE = "https://riyasewana.com/search/cars/toyota?page={page_num}"

ALLOWED_TYPE_SLUGS = ['cars', 'vans', 'pickups', 'suvs']


def get_search_make(url):
    """Extract make slug from a Riyasewana search URL."""
    match = re.search(r'/search/[^/]+/([^/?#]+)', url)
    if not match:
        return None
    return match.group(1).strip().lower()


def slugify_search_part(value):
    """Convert user input to URL slug format."""
    text = (value or '').strip().lower()
    text = re.sub(r'[\s_]+', '-', text)
    text = re.sub(r'[^a-z0-9-]', '', text)
    text = re.sub(r'-{2,}', '-', text).strip('-')
    return text


def build_search_url_template(filters):
    """Build Riyasewana search URL template from selected filters."""
    vehicle_type = (filters.get('vehicle_type') or 'cars').strip().lower()
    if vehicle_type not in ALLOWED_TYPE_SLUGS:
        vehicle_type = 'cars'

    make = slugify_search_part(filters.get('make'))
    model = slugify_search_part(filters.get('model'))
    year = (filters.get('year') or '').strip()

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
    """Extract search filters from Riyasewana URL."""
    parsed = urlparse(url)
    path_parts = [p for p in parsed.path.split('/') if p]

    result = {
        'vehicle_type': None,
        'make': None,
        'model': None,
        'year': None
    }

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
    """Normalize text for loose matching."""
    normalized = (value or '').lower().replace('-', ' ')
    normalized = re.sub(r'[^a-z0-9\s]', ' ', normalized)
    return re.sub(r'\s+', ' ', normalized).strip()


def vehicle_type_from_slug(type_slug):
    """Map URL type slug to display type."""
    mapping = {
        'cars': 'Car',
        'vans': 'Van',
        'pickups': 'Pickup',
        'suvs': 'SUV'
    }
    return mapping.get((type_slug or '').lower())

def setup_csv_file():
    """Create CSV file with headers if it doesn't exist"""
    if not os.path.exists(CSV_FILENAME):
        with open(CSV_FILENAME, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=FIELD_NAMES)
            writer.writeheader()
        print(f"Created new CSV file: {CSV_FILENAME}")
    else:
        print(f"Appending to existing CSV file: {CSV_FILENAME}")

def save_vehicle_to_csv(vehicle_data):
    """Append a single vehicle to CSV file"""
    try:
        with open(CSV_FILENAME, 'a', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=FIELD_NAMES)
            writer.writerow(vehicle_data)
    except Exception as e:
        print(f"Error saving to CSV: {e}")


def find_browser_binary(browser_name):
    """Find a browser executable path from env vars and common Windows locations."""
    env_map = {
        'chrome': ['CHROME_BINARY', 'GOOGLE_CHROME_BIN'],
        'edge': ['EDGE_BINARY', 'MS_EDGE_BINARY']
    }

    candidates = []
    for env_var in env_map.get(browser_name, []):
        value = os.environ.get(env_var)
        if value:
            candidates.append(value)

    if os.name == 'nt':
        program_files = [
            os.environ.get('PROGRAMFILES'),
            os.environ.get('PROGRAMFILES(X86)'),
            os.environ.get('LOCALAPPDATA'),
        ]

        if browser_name == 'chrome':
            for base in program_files:
                if not base:
                    continue
                candidates.append(os.path.join(base, 'Google', 'Chrome', 'Application', 'chrome.exe'))
        elif browser_name == 'edge':
            for base in program_files:
                if not base:
                    continue
                candidates.append(os.path.join(base, 'Microsoft', 'Edge', 'Application', 'msedge.exe'))

    for path in candidates:
        if path and os.path.exists(path):
            return path

    return None


def add_browser_binary_if_found(options, browser_name):
    """Set Selenium binary location if we can discover an installed browser."""
    binary_path = find_browser_binary(browser_name)
    if binary_path:
        options.binary_location = binary_path
        print(f"Using {browser_name} binary: {binary_path}")
    return options


def setup_driver():
    """Setup Chrome driver with optimized options for speed"""
    chrome_options = Options()
    chrome_options.add_argument("--headless")  # Run in background
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument("--disable-extensions")
    chrome_options.add_argument("--disable-plugins")
    # Disable images for faster loading but keep JavaScript
    prefs = {
        "profile.managed_default_content_settings.images": 2,
        "profile.default_content_setting_values.notifications": 2,
        "profile.managed_default_content_settings.media_stream": 2,
        "profile.managed_default_content_settings.stylesheets": 2,
    }
    chrome_options.add_experimental_option("prefs", prefs)
    chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
    add_browser_binary_if_found(chrome_options, 'chrome')

    edge_options = EdgeOptions()
    edge_options.add_argument("--headless")
    edge_options.add_argument("--disable-gpu")
    edge_options.add_argument("--no-sandbox")
    edge_options.add_argument("--disable-dev-shm-usage")
    edge_options.add_argument("--window-size=1920,1080")
    edge_options.add_argument("--disable-extensions")
    edge_options.add_argument("--disable-plugins")
    edge_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
    add_browser_binary_if_found(edge_options, 'edge')

    def apply_timeouts(driver_instance):
        driver_instance.set_page_load_timeout(30)
        driver_instance.set_script_timeout(30)
        return driver_instance

    try:
        driver = webdriver.Chrome(options=chrome_options)
        return apply_timeouts(driver)
    except (NoSuchDriverException, WebDriverException) as e:
        print(f"Default ChromeDriver setup failed: {e}")

        driver_candidates = []

        # User-provided explicit path
        env_driver_path = os.environ.get("CHROMEDRIVER_PATH")
        if env_driver_path:
            driver_candidates.append(env_driver_path)

        # Common local/project locations
        driver_candidates.extend([
            os.path.join(os.getcwd(), 'chromedriver.exe'),
            os.path.join(os.path.dirname(__file__), 'chromedriver.exe'),
            os.path.join(os.path.dirname(__file__), 'drivers', 'chromedriver.exe'),
        ])

        # Driver available on system PATH
        path_driver = shutil.which('chromedriver')
        if path_driver:
            driver_candidates.append(path_driver)

        # Deduplicate while preserving order
        seen = set()
        unique_candidates = []
        for path in driver_candidates:
            norm_path = os.path.normpath(path)
            if norm_path not in seen:
                seen.add(norm_path)
                unique_candidates.append(path)

        last_error = e
        for driver_path in unique_candidates:
            if not driver_path or not os.path.exists(driver_path):
                continue
            try:
                print(f"Trying ChromeDriver from: {driver_path}")
                service = Service(executable_path=driver_path)
                driver = webdriver.Chrome(service=service, options=chrome_options)
                return apply_timeouts(driver)
            except Exception as candidate_error:
                last_error = candidate_error

        # Automatic download/install fallback for Chrome driver
        if ChromeDriverManager:
            try:
                print("Trying webdriver-manager for ChromeDriver...")
                manager_path = ChromeDriverManager().install()
                service = Service(executable_path=manager_path)
                driver = webdriver.Chrome(service=service, options=chrome_options)
                print("Using webdriver-manager ChromeDriver.")
                return apply_timeouts(driver)
            except Exception as manager_error:
                last_error = manager_error
        else:
            print("webdriver-manager not installed for Chrome fallback. Install with: pip install webdriver-manager")

        print("Chrome setup failed. Trying Microsoft Edge WebDriver fallback...")

        # Try Edge via Selenium Manager first
        try:
            driver = webdriver.Edge(options=edge_options)
            print("Using Microsoft Edge WebDriver.")
            return apply_timeouts(driver)
        except Exception as edge_error:
            last_error = edge_error

        # Try explicit Edge driver paths
        edge_candidates = []
        env_edge_path = os.environ.get("EDGEDRIVER_PATH")
        if env_edge_path:
            edge_candidates.append(env_edge_path)

        edge_candidates.extend([
            os.path.join(os.getcwd(), 'msedgedriver.exe'),
            os.path.join(os.path.dirname(__file__), 'msedgedriver.exe'),
            os.path.join(os.path.dirname(__file__), 'drivers', 'msedgedriver.exe'),
        ])

        path_edge_driver = shutil.which('msedgedriver')
        if path_edge_driver:
            edge_candidates.append(path_edge_driver)

        seen = set()
        unique_edge_candidates = []
        for path in edge_candidates:
            norm_path = os.path.normpath(path)
            if norm_path not in seen:
                seen.add(norm_path)
                unique_edge_candidates.append(path)

        for edge_path in unique_edge_candidates:
            if not edge_path or not os.path.exists(edge_path):
                continue
            try:
                print(f"Trying EdgeDriver from: {edge_path}")
                service = EdgeService(executable_path=edge_path)
                driver = webdriver.Edge(service=service, options=edge_options)
                print("Using Microsoft Edge WebDriver.")
                return apply_timeouts(driver)
            except Exception as edge_path_error:
                last_error = edge_path_error

        # Automatic download/install fallback for Edge driver
        if EdgeChromiumDriverManager:
            try:
                print("Trying webdriver-manager for EdgeDriver...")
                manager_path = EdgeChromiumDriverManager().install()
                service = EdgeService(executable_path=manager_path)
                driver = webdriver.Edge(service=service, options=edge_options)
                print("Using webdriver-manager EdgeDriver.")
                return apply_timeouts(driver)
            except Exception as edge_manager_error:
                last_error = edge_manager_error
        else:
            print("webdriver-manager not installed for Edge fallback. Install with: pip install webdriver-manager")

        raise RuntimeError(
            "Unable to start browser driver. Ensure Chrome or Edge is installed and usable. "
            "You can set CHROME_BINARY/EDGE_BINARY and CHROMEDRIVER_PATH/EDGEDRIVER_PATH, "
            "or install webdriver-manager (pip install webdriver-manager) for automatic driver download."
        ) from last_error

def extract_vehicle_data(title, boxtext_divs):
    """Extract vehicle data from title and boxtext divs"""
    data = {
        'Vehicle Type': None,
        'Make': None,
        'Model': None,
        'Year': None,
        'Price': None,
        'Milleage': None,
        'District': None,
        'published date': None,
        'Vehicle URL': None
    }

    title_lower = title.lower()
    
    # Vehicle Type detection
    vehicle_types = {
        'car': 'Car',
        'motorbike': 'Motorbike',
        'motorcycle': 'Motorbike',
        'three wheel': 'Three Wheel',
        'van': 'Van',
        'suv': 'SUV',
        'jeep': 'SUV',
        'lorry': 'Lorry',
        'bus': 'Bus',
        'pickup': 'Pickup',
        'tractor': 'Tractor',
        'bicycle': 'Bicycle'
    }
    
    for keyword, vehicle_type in vehicle_types.items():
        if keyword in title_lower:
            data['Vehicle Type'] = vehicle_type
            break

    # Extract year (4 digits)
    year_match = re.search(r'\b(19|20)\d{2}\b', title)
    if year_match:
        data['Year'] = int(year_match.group())

    # Extract make and model
    parts = title.split()
    if parts:
        data['Make'] = parts[0]
        model_parts = []
        for part in parts[1:]:
            if part.isdigit() and len(part) == 4 and 1900 <= int(part) <= 2030:
                break
            if part.lower() not in ['car', 'motorbike', 'motorcycle', 'three', 'wheel', 'van', 'suv', 'jeep', 'lorry', 'bus', 'pickup', 'heavy-duty', 'heavy', 'duty']:
                model_parts.append(part)
        data['Model'] = ' '.join(model_parts) if model_parts else None

    # Extract from boxtext divs
    for div in boxtext_divs:
        text = div.get_text(strip=True)
        if 'Rs.' in text or 'Negotiable' in text:
            data['Price'] = text
        elif '(km)' in text:
            km_match = re.search(r'(\d+(?:,\d{3})*)', text)
            if km_match:
                data['Milleage'] = int(km_match.group().replace(',', ''))
        elif re.match(r'\d{4}-\d{2}-\d{2}', text):
            data['published date'] = text
        elif not any(keyword in text.lower() for keyword in ['rs.', 'km', 'negotiable', 'price', 'mileage']) and len(text) > 2:
            data['District'] = text

    return data

def scrape_page(driver, page_num, search_url_template):
    """Scrape a single page and return vehicle data"""
    vehicles = []
    try:
        url = search_url_template.format(page_num=page_num)
        target_filters = parse_search_filters(url)
        target_make = target_filters.get('make')
        target_model = target_filters.get('model')
        target_year = target_filters.get('year')
        target_vehicle_type = target_filters.get('vehicle_type')
        driver.get(url)

        # Wait for the content to load (supports old and new listing layouts)
        WebDriverWait(driver, 20).until(
            lambda d: len(d.find_elements(By.CSS_SELECTOR, "li.v-card, li.item")) > 0
        )

        # Add additional wait for content to fully render
        time.sleep(1)

        # Get page source and parse
        soup = BeautifulSoup(driver.page_source, 'html.parser')

        # Find all vehicle items (new and legacy layouts)
        items = soup.select('li.v-card, li.item')

        for item in items:
            try:
                title = ''
                classes = item.get('class', [])

                # New layout: li.v-card
                if 'v-card' in classes:
                    title_link = item.select_one('.v-card-title a') or item.find('a', href=True)
                    if not title_link:
                        continue

                    title = (title_link.get('title') or title_link.get_text(strip=True) or '').strip()
                    if not title:
                        continue

                    vehicle_url = title_link.get('href', '')
                    if vehicle_url and vehicle_url.startswith('//'):
                        vehicle_url = 'https:' + vehicle_url
                    elif vehicle_url and vehicle_url.startswith('/'):
                        vehicle_url = 'https://riyasewana.com' + vehicle_url

                    vehicle_data = extract_vehicle_data(title, [])

                    price_elem = item.select_one('.v-card-price')
                    if price_elem:
                        vehicle_data['Price'] = price_elem.get_text(' ', strip=True)

                    meta_elem = item.select_one('.v-card-meta')
                    if meta_elem:
                        meta_text = meta_elem.get_text(' ', strip=True)
                        km_match = re.search(r'(\d+(?:,\d{3})*)\s*km', meta_text, re.IGNORECASE)
                        if km_match:
                            vehicle_data['Milleage'] = int(km_match.group(1).replace(',', ''))

                        district = re.sub(r'\s*\d+(?:,\d{3})*\s*km\s*', ' ', meta_text, flags=re.IGNORECASE)
                        district = district.replace('·', ' ').strip()
                        district = re.sub(r'\s+', ' ', district)
                        if district:
                            vehicle_data['District'] = district

                    date_elem = item.select_one('.v-card-date')
                    if date_elem:
                        vehicle_data['published date'] = date_elem.get_text(' ', strip=True)

                    vehicle_data['Vehicle URL'] = vehicle_url

                # Legacy layout: li.item
                else:
                    title_elem = item.find('h2', class_='more')
                    if not title_elem:
                        continue

                    title_link = title_elem.find('a')
                    if not title_link:
                        continue

                    title = title_link.get('title', '').strip()
                    if not title:
                        continue

                    vehicle_url = title_link.get('href', '')
                    if vehicle_url and not vehicle_url.startswith('http'):
                        vehicle_url = 'https://riyasewana.com' + vehicle_url

                    boxtext = item.find('div', class_='boxtext')
                    if not boxtext:
                        continue

                    boxtext_divs = boxtext.find_all('div', class_='boxintxt')

                    vehicle_data = extract_vehicle_data(title, boxtext_divs)
                    vehicle_data['Vehicle URL'] = vehicle_url

                # Enforce make from URL and skip unrelated listings from mixed result blocks
                normalized_title = normalize_match_text(title)

                if target_make:
                    if normalize_match_text(target_make) not in normalized_title:
                        continue
                    vehicle_data['Make'] = target_make.replace('-', ' ').title()

                if target_model and normalize_match_text(target_model) not in normalized_title:
                    continue

                if target_model and not vehicle_data.get('Model'):
                    vehicle_data['Model'] = target_model.replace('-', ' ').title()

                if target_year:
                    if str(vehicle_data.get('Year') or '') != str(target_year):
                        continue

                if target_vehicle_type:
                    url_type = vehicle_type_from_slug(target_vehicle_type)
                    if url_type:
                        vehicle_data['Vehicle Type'] = url_type
                
                vehicles.append(vehicle_data)

            except Exception as e:
                print(f"Error parsing item on page {page_num}: {e}")
                continue

    except TimeoutException:
        print(f"Timeout loading page {page_num}")
    except Exception as e:
        print(f"Error scraping page {page_num}: {e}")

    return vehicles

def scrape_with_selenium(queue, stop_event, search_url_template, progress_callback=None):
    """Scrape using optimized Selenium and put data in queue"""
    driver = None
    total_vehicles_scraped = 0
    start_time = time.time()
    
    try:
        driver = setup_driver()

        # Try to scrape many pages - will stop when no more content
        page = 1
        max_pages = 67000  # Upper limit for safety
        
        while page <= max_pages and not stop_event.is_set():
            print(f"Scraping page {page}...")
            
            vehicles = scrape_page(driver, page, search_url_template)
            
            if not vehicles:
                print(f"No vehicles found on page {page}. Stopping.")
                break
            
            print(f"  Found {len(vehicles)} vehicles on page {page}")
            
            # Process each vehicle
            for vehicle in vehicles:
                if stop_event.is_set():
                    break
                    
                # Save to CSV immediately
                save_vehicle_to_csv(vehicle)
                
                # Put in queue for GUI update
                queue.put(vehicle)
                total_vehicles_scraped += 1
                
                # Update progress every 10 vehicles
                if total_vehicles_scraped % 10 == 0 and progress_callback:
                    elapsed = time.time() - start_time
                    vehicles_per_second = total_vehicles_scraped / elapsed if elapsed > 0 else 0
                    progress_callback(total_vehicles_scraped, vehicles_per_second, page)
            
            # Update progress for this page
            if progress_callback:
                elapsed = time.time() - start_time
                vehicles_per_second = total_vehicles_scraped / elapsed if elapsed > 0 else 0
                progress_callback(total_vehicles_scraped, vehicles_per_second, page)
            
            # Random delay between pages to avoid rate limiting
            delay = 1 + (time.time() % 2)  # Random between 1-3 seconds
            time.sleep(delay)
            
            page += 1
            
            # Occasionally check if we should stop
            if page % 10 == 0 and stop_event.is_set():
                break
                
    except Exception as e:
        print(f"Error in scraping thread: {e}")
        
    finally:
        if driver:
            driver.quit()
        
        # Final summary
        elapsed = time.time() - start_time
        if elapsed > 0:
            vehicles_per_second = total_vehicles_scraped / elapsed
            print(f"\n✅ Scraping completed!")
            print(f"   Total vehicles: {total_vehicles_scraped}")
            print(f"   Time elapsed: {elapsed:.2f} seconds")
            print(f"   Speed: {vehicles_per_second:.2f} vehicles/second")
            print(f"   Saved to: {CSV_FILENAME}")

class VehicleTableApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Riyasewana Vehicle Scraper - Real-time Updates")
        self.root.geometry("1300x750")

        # Store vehicle URLs mapped to tree items
        self.vehicle_urls = {}
        self.total_scraped = 0

        # Create main frame
        main_frame = tk.Frame(root)
        main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        # Create progress frame
        progress_frame = tk.Frame(main_frame)
        progress_frame.pack(fill=tk.X, pady=(0, 10))
        
        # Progress label
        self.progress_label = tk.Label(progress_frame, text="Ready to start scraping...", font=("Arial", 10))
        self.progress_label.pack(side=tk.LEFT)
        
        # Speed label
        self.speed_label = tk.Label(progress_frame, text="", font=("Arial", 10))
        self.speed_label.pack(side=tk.RIGHT)

        # Search filter frame
        filter_frame = tk.LabelFrame(main_frame, text="Search Filters", padx=10, pady=8)
        filter_frame.pack(fill=tk.X, pady=(0, 10))

        self.type_var = tk.StringVar(value='cars')
        self.make_var = tk.StringVar(value='toyota')
        self.model_var = tk.StringVar(value='')
        self.year_var = tk.StringVar(value='')

        tk.Label(filter_frame, text="Type").grid(row=0, column=0, sticky='w', padx=(0, 6))
        self.type_combo = ttk.Combobox(
            filter_frame,
            textvariable=self.type_var,
            values=ALLOWED_TYPE_SLUGS,
            state='readonly',
            width=10
        )
        self.type_combo.grid(row=0, column=1, padx=(0, 16), sticky='w')

        tk.Label(filter_frame, text="Make").grid(row=0, column=2, sticky='w', padx=(0, 6))
        self.make_entry = tk.Entry(filter_frame, textvariable=self.make_var, width=18)
        self.make_entry.grid(row=0, column=3, padx=(0, 16), sticky='w')

        tk.Label(filter_frame, text="Model").grid(row=0, column=4, sticky='w', padx=(0, 6))
        self.model_entry = tk.Entry(filter_frame, textvariable=self.model_var, width=18)
        self.model_entry.grid(row=0, column=5, padx=(0, 16), sticky='w')

        tk.Label(filter_frame, text="Year").grid(row=0, column=6, sticky='w', padx=(0, 6))
        self.year_entry = tk.Entry(filter_frame, textvariable=self.year_var, width=8)
        self.year_entry.grid(row=0, column=7, sticky='w')

        # Create treeview for table
        tree_frame = tk.Frame(main_frame)
        tree_frame.pack(fill=tk.BOTH, expand=True)
        
        self.tree = ttk.Treeview(tree_frame, columns=('Type', 'Make', 'Model', 'Year', 'Price', 'Mileage', 'District', 'Date', 'URL'), show='headings')
        
        # Define column headings
        columns = [
            ('Type', 'Vehicle Type', 100),
            ('Make', 'Make', 80),
            ('Model', 'Model', 150),
            ('Year', 'Year', 60),
            ('Price', 'Price', 120),
            ('Mileage', 'Mileage', 80),
            ('District', 'District', 100),
            ('Date', 'Published Date', 100),
            ('URL', 'URL Short', 100)
        ]
        
        for col_id, heading, width in columns:
            self.tree.heading(col_id, text=heading)
            self.tree.column(col_id, width=width)

        # Add scrollbars
        v_scrollbar = ttk.Scrollbar(tree_frame, orient=tk.VERTICAL, command=self.tree.yview)
        h_scrollbar = ttk.Scrollbar(tree_frame, orient=tk.HORIZONTAL, command=self.tree.xview)
        self.tree.configure(yscrollcommand=v_scrollbar.set, xscrollcommand=h_scrollbar.set)

        # Grid layout
        self.tree.grid(row=0, column=0, sticky='nsew')
        v_scrollbar.grid(row=0, column=1, sticky='ns')
        h_scrollbar.grid(row=1, column=0, sticky='ew')
        
        tree_frame.grid_rowconfigure(0, weight=1)
        tree_frame.grid_columnconfigure(0, weight=1)

        # Bind double-click event
        self.tree.bind('<Double-Button-1>', self.on_item_double_click)

        # Create button frame
        button_frame = tk.Frame(main_frame)
        button_frame.pack(fill=tk.X, pady=(10, 0))
        
        # Start button
        self.start_button = tk.Button(button_frame, text="▶️ Start Scraping", command=self.start_scraping, 
                                     bg='green', fg='white', font=("Arial", 10, 'bold'), padx=20)
        self.start_button.pack(side=tk.LEFT, padx=(0, 10))
        
        # Stop button
        self.stop_button = tk.Button(button_frame, text="■ Stop Scraping", command=self.stop_scraping, 
                                    bg='red', fg='white', font=("Arial", 10, 'bold'), padx=20, state=tk.DISABLED)
        self.stop_button.pack(side=tk.LEFT, padx=(0, 10))
        
        # Clear button
        self.clear_button = tk.Button(button_frame, text="🗑️ Clear Table", command=self.clear_table, 
                                     bg='orange', fg='white', font=("Arial", 10), padx=20)
        self.clear_button.pack(side=tk.LEFT)
        
        # Export button
        self.export_button = tk.Button(button_frame, text="💾 Export CSV", command=self.export_csv, 
                                      bg='blue', fg='white', font=("Arial", 10), padx=20)
        self.export_button.pack(side=tk.RIGHT)

        # Status label
        self.status_label = tk.Label(main_frame, text="Double-click any row to view on Riyasewana", 
                                    font=("Arial", 9), fg='gray')
        self.status_label.pack(side=tk.BOTTOM, fill=tk.X, pady=(5, 0))

        # Queue for data updates
        self.queue = queue.Queue()
        self.stop_event = threading.Event()

        # Setup CSV file
        setup_csv_file()

        # Start checking for updates
        self.check_queue()

    def update_progress(self, total_vehicles, vehicles_per_second, current_page):
        """Update progress display"""
        self.total_scraped = total_vehicles
        self.progress_label.config(text=f"Scraped: {total_vehicles:,} vehicles | Page: {current_page}")
        self.speed_label.config(text=f"Speed: {vehicles_per_second:.2f} vehicles/sec")

    def start_scraping(self):
        filters = {
            'vehicle_type': self.type_var.get().strip().lower(),
            'make': self.make_var.get().strip(),
            'model': self.model_var.get().strip(),
            'year': self.year_var.get().strip()
        }

        if not filters['make']:
            self.status_label.config(text="Make is required (e.g., toyota)", fg='orange')
            return

        if filters['year'] and not re.fullmatch(r'\d{4}', filters['year']):
            self.status_label.config(text="Year must be 4 digits (e.g., 2018)", fg='orange')
            return

        search_url_template = build_search_url_template(filters)

        self.start_button.config(state=tk.DISABLED)
        self.stop_button.config(state=tk.NORMAL)
        self.status_label.config(text=f"Scraping in progress... {search_url_template}", fg='green')
        
        # Reset stop event
        self.stop_event.clear()

        # Start scraping thread
        self.scraping_thread = threading.Thread(
            target=scrape_with_selenium, 
            args=(self.queue, self.stop_event, search_url_template, self.update_progress)
        )
        self.scraping_thread.daemon = True
        self.scraping_thread.start()

    def stop_scraping(self):
        self.stop_event.set()
        self.start_button.config(state=tk.NORMAL)
        self.stop_button.config(state=tk.DISABLED)
        self.status_label.config(text=f"Scraping stopped. Total: {self.total_scraped:,} vehicles", fg='red')

    def clear_table(self):
        """Clear the table view"""
        for item in self.tree.get_children():
            self.tree.delete(item)
        self.vehicle_urls.clear()
        self.total_scraped = 0
        self.progress_label.config(text="Table cleared")
        self.status_label.config(text="Table cleared. Ready to start scraping...", fg='gray')

    def export_csv(self):
        """Export current table view to a new CSV file"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        export_filename = f'vehicles_export_{timestamp}.csv'
        
        # Collect data from table
        data = []
        for item in self.tree.get_children():
            values = self.tree.item(item)['values']
            url = self.vehicle_urls.get(item, '')
            # Convert values back to dict format
            vehicle_data = {
                'Vehicle Type': values[0],
                'Make': values[1],
                'Model': values[2],
                'Year': values[3],
                'Price': values[4],
                'Milleage': values[5],
                'District': values[6],
                'published date': values[7],
                'Vehicle URL': url
            }
            data.append(vehicle_data)
        
        # Save to CSV
        if data:
            df = pd.DataFrame(data)
            df.to_csv(export_filename, index=False, encoding='utf-8')
            self.status_label.config(text=f"Exported {len(data)} vehicles to {export_filename}", fg='blue')
            print(f"Exported {len(data)} vehicles to {export_filename}")

    def check_queue(self):
        """Check for new data in queue and update table"""
        try:
            while True:
                vehicle = self.queue.get_nowait()
                self.add_vehicle_to_table(vehicle)
        except queue.Empty:
            pass

        # Schedule next check
        self.root.after(100, self.check_queue)

    def add_vehicle_to_table(self, vehicle):
        """Add a vehicle to the table"""
        # Create shortened URL for display
        url_display = vehicle.get('Vehicle URL', '')
        if len(url_display) > 30:
            url_display = url_display[:27] + "..."
        
        values = (
            vehicle.get('Vehicle Type', ''),
            vehicle.get('Make', ''),
            vehicle.get('Model', ''),
            vehicle.get('Year', ''),
            vehicle.get('Price', ''),
            vehicle.get('Milleage', ''),
            vehicle.get('District', ''),
            vehicle.get('published date', ''),
            url_display
        )
        
        item = self.tree.insert('', tk.END, values=values)
        
        # Store full vehicle URL for this item
        vehicle_url = vehicle.get('Vehicle URL', '')
        if vehicle_url:
            self.vehicle_urls[item] = vehicle_url

    def on_item_double_click(self, event):
        """Handle double-click on table row to open vehicle URL in browser"""
        selection = self.tree.selection()
        if selection:
            item = selection[0]
            url = self.vehicle_urls.get(item)
            if url:
                try:
                    webbrowser.open(url)
                    self.status_label.config(text=f"Opening: {url[:50]}...", fg='blue')
                except:
                    self.status_label.config(text="Error opening browser", fg='red')
            else:
                self.status_label.config(text="No URL available for this vehicle", fg='orange')

# Main execution
if __name__ == "__main__":
    root = tk.Tk()
    app = VehicleTableApp(root)
    
    # Set window icon and make it resizable
    root.resizable(True, True)
    
    # Start the GUI
    root.mainloop()