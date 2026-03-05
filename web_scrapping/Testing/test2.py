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
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument("--disable-extensions")
    chrome_options.add_argument("--disable-plugins")
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

def build_search_url(filters, page):
    """
    Construct Riyasewana search URL from user filters.
    Example: https://riyasewana.com/search/car/toyota/corolla?year_min=2010&year_max=2015&price_min=1000000&price_max=5000000&district=colombo&page=1
    """
    base = "https://riyasewana.com/search"
    path_parts = []

    # Path segments: vehicle type / make / model (if provided)
    if filters.get('vehicle_type'):
        path_parts.append(filters['vehicle_type'].lower())
    if filters.get('make'):
        path_parts.append(filters['make'].lower())
    if filters.get('model'):
        path_parts.append(filters['model'].lower())

    path = "/".join(path_parts) if path_parts else ""

    # Query parameters
    query_params = {}
    if filters.get('year_min'):
        query_params['year_min'] = filters['year_min']
    if filters.get('year_max'):
        query_params['year_max'] = filters['year_max']
    if filters.get('price_min'):
        query_params['price_min'] = filters['price_min']
    if filters.get('price_max'):
        query_params['price_max'] = filters['price_max']
    if filters.get('district'):
        query_params['district'] = filters['district']
    query_params['page'] = page

    # Build full URL
    url = base
    if path:
        url += f"/{path}"
    if query_params:
        url += "?" + "&".join(f"{k}={v}" for k, v in query_params.items())
    return url

def scrape_page(driver, page_num, filters):
    """Scrape a single page and return vehicle data, using filters for URL"""
    vehicles = []
    try:
        url = build_search_url(filters, page_num)
        driver.get(url)

        # Wait for the content to load
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "ul li.item"))
        )
        time.sleep(1)

        soup = BeautifulSoup(driver.page_source, 'html.parser')
        items = soup.find_all('li', class_='item')

        for item in items:
            try:
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
                
                if vehicle_data['Make'] or vehicle_data['Model']:
                    vehicles.append(vehicle_data)

            except Exception as e:
                print(f"Error parsing item on page {page_num}: {e}")
                continue

    except TimeoutException:
        print(f"Timeout loading page {page_num} with filters {filters}")
    except Exception as e:
        print(f"Error scraping page {page_num}: {e}")

    return vehicles

def scrape_with_selenium(queue, stop_event, filters, progress_callback=None):
    """Scrape using optimized Selenium and put data in queue, with filters applied"""
    driver = setup_driver()
    total_vehicles_scraped = 0
    start_time = time.time()
    
    try:
        page = 1
        max_pages = 67000  # Upper limit for safety
        
        while page <= max_pages and not stop_event.is_set():
            print(f"Scraping page {page} with filters {filters}...")
            
            vehicles = scrape_page(driver, page, filters)
            
            if not vehicles:
                print(f"No vehicles found on page {page}. Stopping.")
                break
            
            print(f"  Found {len(vehicles)} vehicles on page {page}")
            
            for vehicle in vehicles:
                if stop_event.is_set():
                    break
                    
                save_vehicle_to_csv(vehicle)
                queue.put(vehicle)
                total_vehicles_scraped += 1
                
                if total_vehicles_scraped % 10 == 0 and progress_callback:
                    elapsed = time.time() - start_time
                    vehicles_per_second = total_vehicles_scraped / elapsed if elapsed > 0 else 0
                    progress_callback(total_vehicles_scraped, vehicles_per_second, page)
            
            if progress_callback:
                elapsed = time.time() - start_time
                vehicles_per_second = total_vehicles_scraped / elapsed if elapsed > 0 else 0
                progress_callback(total_vehicles_scraped, vehicles_per_second, page)
            
            delay = 1 + (time.time() % 2)
            time.sleep(delay)
            page += 1
            
            if page % 10 == 0 and stop_event.is_set():
                break
                
    except Exception as e:
        print(f"Error in scraping thread: {e}")
        
    finally:
        driver.quit()
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
        self.root.title("Riyasewana Vehicle Scraper - Real-time Updates with Filters")
        self.root.geometry("1400x800")

        self.vehicle_urls = {}
        self.total_scraped = 0
        self.current_filters = {}  # will hold active filters

        main_frame = tk.Frame(root)
        main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        # Add filter panel
        self.create_filter_frame(main_frame)

        # Progress frame
        progress_frame = tk.Frame(main_frame)
        progress_frame.pack(fill=tk.X, pady=(0, 10))
        
        self.progress_label = tk.Label(progress_frame, text="Ready to start scraping...", font=("Arial", 10))
        self.progress_label.pack(side=tk.LEFT)
        
        self.speed_label = tk.Label(progress_frame, text="", font=("Arial", 10))
        self.speed_label.pack(side=tk.RIGHT)

        # Treeview table
        tree_frame = tk.Frame(main_frame)
        tree_frame.pack(fill=tk.BOTH, expand=True)
        
        self.tree = ttk.Treeview(tree_frame, columns=('Type', 'Make', 'Model', 'Year', 'Price', 'Mileage', 'District', 'Date', 'URL'), show='headings')
        
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

        v_scrollbar = ttk.Scrollbar(tree_frame, orient=tk.VERTICAL, command=self.tree.yview)
        h_scrollbar = ttk.Scrollbar(tree_frame, orient=tk.HORIZONTAL, command=self.tree.xview)
        self.tree.configure(yscrollcommand=v_scrollbar.set, xscrollcommand=h_scrollbar.set)

        self.tree.grid(row=0, column=0, sticky='nsew')
        v_scrollbar.grid(row=0, column=1, sticky='ns')
        h_scrollbar.grid(row=1, column=0, sticky='ew')
        
        tree_frame.grid_rowconfigure(0, weight=1)
        tree_frame.grid_columnconfigure(0, weight=1)

        self.tree.bind('<Double-Button-1>', self.on_item_double_click)

        # Button frame
        button_frame = tk.Frame(main_frame)
        button_frame.pack(fill=tk.X, pady=(10, 0))
        
        self.start_button = tk.Button(button_frame, text="▶ Start Scraping", command=self.start_scraping, 
                                     bg='green', fg='white', font=("Arial", 10, 'bold'), padx=20)
        self.start_button.pack(side=tk.LEFT, padx=(0, 10))
        
        self.stop_button = tk.Button(button_frame, text="■ Stop Scraping", command=self.stop_scraping, 
                                    bg='red', fg='white', font=("Arial", 10, 'bold'), padx=20, state=tk.DISABLED)
        self.stop_button.pack(side=tk.LEFT, padx=(0, 10))
        
        self.clear_button = tk.Button(button_frame, text="🗑️ Clear Table", command=self.clear_table, 
                                     bg='orange', fg='white', font=("Arial", 10), padx=20)
        self.clear_button.pack(side=tk.LEFT)
        
        self.export_button = tk.Button(button_frame, text="💾 Export CSV", command=self.export_csv, 
                                      bg='blue', fg='white', font=("Arial", 10), padx=20)
        self.export_button.pack(side=tk.RIGHT)

        self.status_label = tk.Label(main_frame, text="Double-click any row to view on Riyasewana", 
                                    font=("Arial", 9), fg='gray')
        self.status_label.pack(side=tk.BOTTOM, fill=tk.X, pady=(5, 0))

        self.queue = queue.Queue()
        self.stop_event = threading.Event()

        setup_csv_file()

        self.check_queue()

    def create_filter_frame(self, parent):
        """Create the filter input panel"""
        filter_frame = tk.LabelFrame(parent, text="Search Filters", padx=5, pady=5)
        filter_frame.pack(fill=tk.X, pady=(0, 10))

        # Row 1: Vehicle Type, Make, Model
        tk.Label(filter_frame, text="Vehicle Type:").grid(row=0, column=0, sticky='w')
        self.vehicle_type_var = tk.StringVar()
        vehicle_type_combo = ttk.Combobox(filter_frame, textvariable=self.vehicle_type_var, 
                                          values=['', 'Car', 'Motorbike', 'Three Wheel', 'Van', 'SUV', 'Lorry', 'Bus', 'Pickup', 'Tractor', 'Bicycle'], 
                                          width=15)
        vehicle_type_combo.grid(row=0, column=1, padx=(0,10))

        tk.Label(filter_frame, text="Make:").grid(row=0, column=2, sticky='w')
        self.make_var = tk.StringVar()
        tk.Entry(filter_frame, textvariable=self.make_var, width=15).grid(row=0, column=3, padx=(0,10))

        tk.Label(filter_frame, text="Model:").grid(row=0, column=4, sticky='w')
        self.model_var = tk.StringVar()
        tk.Entry(filter_frame, textvariable=self.model_var, width=15).grid(row=0, column=5)

        # Row 2: Year Min, Year Max, Price Min, Price Max
        tk.Label(filter_frame, text="Year Min:").grid(row=1, column=0, sticky='w', pady=(5,0))
        self.year_min_var = tk.StringVar()
        tk.Entry(filter_frame, textvariable=self.year_min_var, width=8).grid(row=1, column=1, sticky='w', padx=(0,10), pady=(5,0))

        tk.Label(filter_frame, text="Year Max:").grid(row=1, column=2, sticky='w', pady=(5,0))
        self.year_max_var = tk.StringVar()
        tk.Entry(filter_frame, textvariable=self.year_max_var, width=8).grid(row=1, column=3, sticky='w', padx=(0,10), pady=(5,0))

        tk.Label(filter_frame, text="Price Min:").grid(row=1, column=4, sticky='w', pady=(5,0))
        self.price_min_var = tk.StringVar()
        tk.Entry(filter_frame, textvariable=self.price_min_var, width=10).grid(row=1, column=5, sticky='w', padx=(0,10), pady=(5,0))

        tk.Label(filter_frame, text="Price Max:").grid(row=1, column=6, sticky='w', pady=(5,0))
        self.price_max_var = tk.StringVar()
        tk.Entry(filter_frame, textvariable=self.price_max_var, width=10).grid(row=1, column=7, sticky='w', pady=(5,0))

        # Row 3: District and Apply button
        tk.Label(filter_frame, text="District:").grid(row=2, column=0, sticky='w', pady=(5,0))
        self.district_var = tk.StringVar()
        tk.Entry(filter_frame, textvariable=self.district_var, width=20).grid(row=2, column=1, columnspan=2, sticky='w', padx=(0,10), pady=(5,0))

        self.apply_filters_btn = tk.Button(filter_frame, text="Apply Filters", command=self.apply_filters, bg='lightblue')
        self.apply_filters_btn.grid(row=2, column=6, columnspan=2, pady=(5,0))

    def apply_filters(self):
        """Read filter values and store them in self.current_filters"""
        self.current_filters = {
            'vehicle_type': self.vehicle_type_var.get().strip() or None,
            'make': self.make_var.get().strip() or None,
            'model': self.model_var.get().strip() or None,
            'year_min': self.year_min_var.get().strip() or None,
            'year_max': self.year_max_var.get().strip() or None,
            'price_min': self.price_min_var.get().strip() or None,
            'price_max': self.price_max_var.get().strip() or None,
            'district': self.district_var.get().strip() or None,
        }
        self.status_label.config(text=f"Filters applied. Click Start Scraping to begin.", fg='green')

    def update_progress(self, total_vehicles, vehicles_per_second, current_page):
        self.total_scraped = total_vehicles
        self.progress_label.config(text=f"Scraped: {total_vehicles:,} vehicles | Page: {current_page}")
        self.speed_label.config(text=f"Speed: {vehicles_per_second:.2f} vehicles/sec")

    def start_scraping(self):
        self.start_button.config(state=tk.DISABLED)
        self.stop_button.config(state=tk.NORMAL)
        self.status_label.config(text="Scraping in progress...", fg='green')
        self.stop_event.clear()

        # Use current filters (if any)
        filters = self.current_filters

        self.scraping_thread = threading.Thread(
            target=scrape_with_selenium, 
            args=(self.queue, self.stop_event, filters, self.update_progress)
        )
        self.scraping_thread.daemon = True
        self.scraping_thread.start()

    def stop_scraping(self):
        self.stop_event.set()
        self.start_button.config(state=tk.NORMAL)
        self.stop_button.config(state=tk.DISABLED)
        self.status_label.config(text=f"Scraping stopped. Total: {self.total_scraped:,} vehicles", fg='red')

    def clear_table(self):
        for item in self.tree.get_children():
            self.tree.delete(item)
        self.vehicle_urls.clear()
        self.total_scraped = 0
        self.progress_label.config(text="Table cleared")
        self.status_label.config(text="Table cleared. Ready to start scraping...", fg='gray')

    def export_csv(self):
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        export_filename = f'vehicles_export_{timestamp}.csv'
        
        data = []
        for item in self.tree.get_children():
            values = self.tree.item(item)['values']
            url = self.vehicle_urls.get(item, '')
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
        
        if data:
            df = pd.DataFrame(data)
            df.to_csv(export_filename, index=False, encoding='utf-8')
            self.status_label.config(text=f"Exported {len(data)} vehicles to {export_filename}", fg='blue')
            print(f"Exported {len(data)} vehicles to {export_filename}")

    def check_queue(self):
        try:
            while True:
                vehicle = self.queue.get_nowait()
                self.add_vehicle_to_table(vehicle)
        except queue.Empty:
            pass
        self.root.after(100, self.check_queue)

    def add_vehicle_to_table(self, vehicle):
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
        vehicle_url = vehicle.get('Vehicle URL', '')
        if vehicle_url:
            self.vehicle_urls[item] = vehicle_url

    def on_item_double_click(self, event):
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

if __name__ == "__main__":
    root = tk.Tk()
    app = VehicleTableApp(root)
    root.resizable(True, True)
    root.mainloop()