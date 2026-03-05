from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
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
from datetime import datetime

# Global constants
CSV_FILENAME = 'riyasewana_vehicles.csv'
FIELD_NAMES = ['Vehicle Type', 'Make', 'Model', 'Year', 'Price', 'Milleage', 'District', 'published date', 'Vehicle URL']

# Vehicle type slug mapping for Riyasewana URL paths
VEHICLE_TYPE_SLUGS = {
    'All':         '',
    'Car':         'cars',
    'SUV':         'suvs',
    'Van':         'vans',
    'Motorbike':   'motorcycles',
    'Lorry':       'lorries',
    'Three Wheel': 'three-wheels',
    'Pickup':      'pickups',
    'Heavy-Duty':  'heavy-duties',
    'Tractor':     'tractors',
    'Bicycle':     'bicycles',
}

def build_search_url(filters):
    """
    Build a Riyasewana search URL from filter dict.

    filters keys (all optional / may be empty string):
        vehicle_type  – one of the VEHICLE_TYPE_SLUGS keys
        make          – e.g. 'Toyota'
        model         – e.g. 'Corolla'
        year_from     – e.g. '2010'
        year_to       – e.g. '2020'
        price_min     – e.g. '1000000'
        price_max     – e.g. '10000000'
        district      – e.g. 'Colombo'

    URL structure
        Path  : /search[/{type_slug}[-{make}[-{model}]]]
        Params: minyear, maxyear, minprice, maxprice, dis  (only those provided)
    """
    vehicle_type = filters.get('vehicle_type', 'All').strip()
    make         = filters.get('make', '').strip().lower().replace(' ', '-')
    model        = filters.get('model', '').strip().lower().replace(' ', '-')

    type_slug = VEHICLE_TYPE_SLUGS.get(vehicle_type, '')

    # Build path
    path_parts = []
    if type_slug:
        segment = type_slug
        if make:
            segment += f'-{make}'
            if model:
                segment += f'-{model}'
        path_parts.append(segment)

    base_path = 'https://riyasewana.com/search'
    if path_parts:
        base_path += '/' + path_parts[0]

    # Build query params
    params = {}
    year_from = filters.get('year_from', '').strip()
    year_to   = filters.get('year_to', '').strip()
    price_min = filters.get('price_min', '').strip()
    price_max = filters.get('price_max', '').strip()
    district  = filters.get('district', '').strip().lower()

    if year_from.isdigit():
        params['minyear'] = year_from
    if year_to.isdigit():
        params['maxyear'] = year_to
    if price_min.isdigit():
        params['minprice'] = price_min
    if price_max.isdigit():
        params['maxprice'] = price_max
    if district:
        params['dis'] = district

    return base_path, params

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

    driver = webdriver.Chrome(options=chrome_options)
    driver.set_page_load_timeout(30)
    driver.set_script_timeout(30)
    return driver

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

def scrape_page(driver, page_num, base_url='https://riyasewana.com/search', extra_params=None):
    """Scrape a single page and return vehicle data"""
    vehicles = []
    try:
        params = dict(extra_params) if extra_params else {}
        params['page'] = page_num
        query_string = '&'.join(f'{k}={v}' for k, v in params.items())
        url = f"{base_url}?{query_string}"
        driver.get(url)

        # Wait for the content to load
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "ul li.item"))
        )

        # Add additional wait for content to fully render
        time.sleep(1)

        # Get page source and parse
        soup = BeautifulSoup(driver.page_source, 'html.parser')

        # Find all vehicle items
        items = soup.find_all('li', class_='item')

        for item in items:
            try:
                # Get title
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

                # Get boxtext divs
                boxtext = item.find('div', class_='boxtext')
                if not boxtext:
                    continue
                    
                boxtext_divs = boxtext.find_all('div', class_='boxintxt')

                # Extract data
                vehicle_data = extract_vehicle_data(title, boxtext_divs)
                vehicle_data['Vehicle URL'] = vehicle_url
                
                # Only add if we have at least make or model
                if vehicle_data['Make'] or vehicle_data['Model']:
                    vehicles.append(vehicle_data)

            except Exception as e:
                print(f"Error parsing item on page {page_num}: {e}")
                continue

    except TimeoutException:
        print(f"Timeout loading page {page_num}")
    except Exception as e:
        print(f"Error scraping page {page_num}: {e}")

    return vehicles

def scrape_with_selenium(queue, stop_event, progress_callback=None, filters=None):
    """Scrape using optimized Selenium and put data in queue"""
    driver = setup_driver()
    total_vehicles_scraped = 0
    start_time = time.time()

    # Build URL components from filters
    if filters:
        base_url, extra_params = build_search_url(filters)
    else:
        base_url, extra_params = 'https://riyasewana.com/search', {}

    print(f"🔍 Search URL: {base_url}  params: {extra_params}")
    
    try:
        # Try to scrape many pages - will stop when no more content
        page = 1
        max_pages = 67000  # Upper limit for safety
        
        while page <= max_pages and not stop_event.is_set():
            print(f"Scraping page {page}...")
            
            vehicles = scrape_page(driver, page, base_url, extra_params)
            
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
        self.root.geometry("1300x820")

        # Store vehicle URLs mapped to tree items
        self.vehicle_urls = {}
        self.total_scraped = 0

        # Create main frame
        main_frame = tk.Frame(root)
        main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        # ── Filter Panel ──────────────────────────────────────────────────────
        filter_outer = tk.LabelFrame(main_frame, text="Search Filters",
                                     font=("Arial", 10, 'bold'), padx=8, pady=6)
        filter_outer.pack(fill=tk.X, pady=(0, 8))

        # Row 1: Vehicle Type | Make | Model | District
        row1 = tk.Frame(filter_outer)
        row1.pack(fill=tk.X, pady=(0, 4))

        tk.Label(row1, text="Vehicle Type:", font=("Arial", 9)).grid(row=0, column=0, sticky='w', padx=(0, 4))
        self.filter_type = ttk.Combobox(row1, width=14, state='readonly',
                                        values=list(VEHICLE_TYPE_SLUGS.keys()))
        self.filter_type.set('All')
        self.filter_type.grid(row=0, column=1, padx=(0, 14))

        tk.Label(row1, text="Make:", font=("Arial", 9)).grid(row=0, column=2, sticky='w', padx=(0, 4))
        self.filter_make = tk.Entry(row1, width=14)
        self.filter_make.grid(row=0, column=3, padx=(0, 14))

        tk.Label(row1, text="Model:", font=("Arial", 9)).grid(row=0, column=4, sticky='w', padx=(0, 4))
        self.filter_model = tk.Entry(row1, width=14)
        self.filter_model.grid(row=0, column=5, padx=(0, 14))

        tk.Label(row1, text="District:", font=("Arial", 9)).grid(row=0, column=6, sticky='w', padx=(0, 4))
        self.filter_district = tk.Entry(row1, width=14)
        self.filter_district.grid(row=0, column=7)

        # Row 2: Year From | Year To | Min Price | Max Price | active-filter preview
        row2 = tk.Frame(filter_outer)
        row2.pack(fill=tk.X)

        tk.Label(row2, text="Year From:", font=("Arial", 9)).grid(row=0, column=0, sticky='w', padx=(0, 4))
        self.filter_year_from = tk.Entry(row2, width=8)
        self.filter_year_from.grid(row=0, column=1, padx=(0, 14))

        tk.Label(row2, text="Year To:", font=("Arial", 9)).grid(row=0, column=2, sticky='w', padx=(0, 4))
        self.filter_year_to = tk.Entry(row2, width=8)
        self.filter_year_to.grid(row=0, column=3, padx=(0, 14))

        tk.Label(row2, text="Min Price (Rs):", font=("Arial", 9)).grid(row=0, column=4, sticky='w', padx=(0, 4))
        self.filter_price_min = tk.Entry(row2, width=12)
        self.filter_price_min.grid(row=0, column=5, padx=(0, 14))

        tk.Label(row2, text="Max Price (Rs):", font=("Arial", 9)).grid(row=0, column=6, sticky='w', padx=(0, 4))
        self.filter_price_max = tk.Entry(row2, width=12)
        self.filter_price_max.grid(row=0, column=7, padx=(0, 14))

        tk.Button(row2, text="Clear Filters", font=("Arial", 9),
                  command=self.clear_filters, bg='#e0e0e0', padx=8).grid(row=0, column=8)

        # Active URL preview label
        self.url_preview_label = tk.Label(filter_outer,
                                          text="URL: https://riyasewana.com/search",
                                          font=("Arial", 8), fg='#555555', anchor='w')
        self.url_preview_label.pack(fill=tk.X, pady=(4, 0))

        # Bind filter change events to update URL preview
        for widget in (self.filter_make, self.filter_model, self.filter_district,
                       self.filter_year_from, self.filter_year_to,
                       self.filter_price_min, self.filter_price_max):
            widget.bind('<KeyRelease>', self._update_url_preview)
        self.filter_type.bind('<<ComboboxSelected>>', self._update_url_preview)
        # ──────────────────────────────────────────────────────────────────────

        # Create progress frame
        progress_frame = tk.Frame(main_frame)
        progress_frame.pack(fill=tk.X, pady=(0, 6))
        
        # Progress label
        self.progress_label = tk.Label(progress_frame, text="Ready to start scraping...", font=("Arial", 10))
        self.progress_label.pack(side=tk.LEFT)
        
        # Speed label
        self.speed_label = tk.Label(progress_frame, text="", font=("Arial", 10))
        self.speed_label.pack(side=tk.RIGHT)

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
        self.start_button = tk.Button(button_frame, text="▶ Start Scraping", command=self.start_scraping, 
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

    def _collect_filters(self):
        """Collect current filter values from GUI widgets."""
        return {
            'vehicle_type': self.filter_type.get(),
            'make':         self.filter_make.get(),
            'model':        self.filter_model.get(),
            'year_from':    self.filter_year_from.get(),
            'year_to':      self.filter_year_to.get(),
            'price_min':    self.filter_price_min.get(),
            'price_max':    self.filter_price_max.get(),
            'district':     self.filter_district.get(),
        }

    def _update_url_preview(self, _event=None):
        """Refresh the URL preview label when any filter changes."""
        filters = self._collect_filters()
        base_url, params = build_search_url(filters)
        if params:
            qs = '&'.join(f'{k}={v}' for k, v in params.items())
            preview = f"{base_url}?{qs}&page=N"
        else:
            preview = f"{base_url}?page=N"
        # Truncate long URLs for display
        if len(preview) > 90:
            preview = preview[:87] + '...'
        self.url_preview_label.config(text=f"URL: {preview}")

    def clear_filters(self):
        """Reset all filter fields to defaults."""
        self.filter_type.set('All')
        for widget in (self.filter_make, self.filter_model, self.filter_district,
                       self.filter_year_from, self.filter_year_to,
                       self.filter_price_min, self.filter_price_max):
            widget.delete(0, tk.END)
        self._update_url_preview()

    def update_progress(self, total_vehicles, vehicles_per_second, current_page):
        """Update progress display"""
        self.total_scraped = total_vehicles
        self.progress_label.config(text=f"Scraped: {total_vehicles:,} vehicles | Page: {current_page}")
        self.speed_label.config(text=f"Speed: {vehicles_per_second:.2f} vehicles/sec")

    def start_scraping(self):
        self.start_button.config(state=tk.DISABLED)
        self.stop_button.config(state=tk.NORMAL)
        self.status_label.config(text="Scraping in progress...", fg='green')
        
        # Collect active filters
        filters = self._collect_filters()

        # Show active URL
        self._update_url_preview()

        # Reset stop event
        self.stop_event.clear()

        # Start scraping thread
        self.scraping_thread = threading.Thread(
            target=scrape_with_selenium, 
            args=(self.queue, self.stop_event, self.update_progress, filters)
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