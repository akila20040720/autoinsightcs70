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
from tkinter import ttk, scrolledtext
import threading
import queue
import webbrowser
import csv
import os
from datetime import datetime
import json
from urllib.parse import urljoin
import concurrent.futures
from concurrent.futures import ThreadPoolExecutor, as_completed

# Global constants - Updated for ikman.lk
CSV_FILENAME = 'ikman_vehicles.csv'
FIELD_NAMES = ['Vehicle Type', 'Make', 'Model', 'Year', 'Price', 'Mileage', 'Location', 'Published Time', 'Vehicle URL']
BASE_URL = "https://ikman.lk/en/ads/sri-lanka/vehicles?sort=date&order=desc"
PROXIES = []  # Add proxies if needed: ['ip:port', 'ip:port']

class VehicleScraper:
    def __init__(self):
        self.scraped_urls = set()
        self.load_existing_urls()
    
    def load_existing_urls(self):
        """Load already scraped URLs to avoid duplicates"""
        if os.path.exists(CSV_FILENAME):
            try:
                df = pd.read_csv(CSV_FILENAME)
                if 'Vehicle URL' in df.columns:
                    self.scraped_urls = set(df['Vehicle URL'].dropna().tolist())
                print(f"Loaded {len(self.scraped_urls)} existing URLs from CSV")
            except Exception as e:
                print(f"Error loading existing URLs: {e}")
    
    def setup_csv_file(self):
        """Create CSV file with headers if it doesn't exist"""
        if not os.path.exists(CSV_FILENAME):
            with open(CSV_FILENAME, 'w', newline='', encoding='utf-8') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=FIELD_NAMES)
                writer.writeheader()
            print(f"Created new CSV file: {CSV_FILENAME}")
        else:
            print(f"Appending to existing CSV file: {CSV_FILENAME}")
    
    def save_vehicle_to_csv(self, vehicle_data):
        """Append a single vehicle to CSV file"""
        try:
            with open(CSV_FILENAME, 'a', newline='', encoding='utf-8') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=FIELD_NAMES)
                writer.writerow(vehicle_data)
            # Add to scraped URLs set
            if vehicle_data.get('Vehicle URL'):
                self.scraped_urls.add(vehicle_data['Vehicle URL'])
            return True
        except Exception as e:
            print(f"Error saving to CSV: {e}")
            return False

def setup_driver(headless=True):
    """Setup Chrome driver with optimized options"""
    chrome_options = Options()
    
    if headless:
        chrome_options.add_argument("--headless=new")  # New headless mode
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument("--disable-extensions")
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    
    # Reduce resource usage
    prefs = {
        "profile.managed_default_content_settings.images": 2,
        "profile.default_content_setting_values.notifications": 2,
        "profile.managed_default_content_settings.stylesheets": 2,
        "profile.managed_default_content_settings.cookies": 2,
        "profile.default_content_setting_values.popups": 2,
    }
    chrome_options.add_experimental_option("prefs", prefs)
    
    # Use realistic user agent
    chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
    
    # Add additional arguments for stability
    chrome_options.add_argument("--disable-web-security")
    chrome_options.add_argument("--allow-running-insecure-content")
    chrome_options.add_argument("--disable-features=VizDisplayCompositor")
    
    try:
        driver = webdriver.Chrome(options=chrome_options)
        driver.set_page_load_timeout(20)
        driver.set_script_timeout(20)
        return driver
    except Exception as e:
        print(f"Error setting up driver: {e}")
        return None

def extract_vehicle_data_optimized(listing_element):
    """Extract vehicle data efficiently from listing element"""
    data = {
        'Vehicle Type': 'Car',
        'Make': None,
        'Model': None,
        'Year': None,
        'Price': None,
        'Mileage': None,
        'Location': None,
        'Published Time': None,
        'Vehicle URL': None
    }
    
    try:
        # Extract URL
        link = listing_element.find('a')
        if link and link.get('href'):
            url = link.get('href')
            if not url.startswith('http'):
                url = urljoin('https://ikman.lk', url)
            data['Vehicle URL'] = url
        
        # Extract title for make/model/year
        title_elem = listing_element.find('h2') or listing_element.find('h3') or listing_element.find('h4')
        if title_elem:
            title = title_elem.get_text(strip=True)
            
            # Extract year (more robust regex)
            year_match = re.search(r'\b(19[7-9]\d|20[0-2]\d)\b', title)
            if year_match:
                data['Year'] = int(year_match.group())
            
            # Extract make and model
            make_model = title.split()
            if make_model:
                common_makes = ['Toyota', 'Honda', 'Suzuki', 'Mitsubishi', 'Nissan', 
                               'BMW', 'Audi', 'Mercedes', 'Ford', 'Chevrolet']
                
                for make in common_makes:
                    if make.lower() in title.lower():
                        data['Make'] = make
                        # Remove make and year from title to get model
                        model_title = title.lower().replace(make.lower(), '')
                        if data['Year']:
                            model_title = model_title.replace(str(data['Year']), '')
                        data['Model'] = model_title.strip(' -')
                        break
        
        # Extract price
        price_elem = listing_element.find(string=re.compile(r'Rs\.?\s*[\d,]+'))
        if price_elem:
            price_match = re.search(r'Rs\.?\s*([\d,]+)', price_elem)
            if price_match:
                data['Price'] = f"Rs {price_match.group(1)}"
        
        # Extract mileage
        mileage_elem = listing_element.find(string=re.compile(r'\d+\s*km', re.I))
        if mileage_elem:
            km_match = re.search(r'(\d+(?:,\d{3})*)\s*km', mileage_elem, re.I)
            if km_match:
                try:
                    data['Mileage'] = int(km_match.group(1).replace(',', ''))
                except:
                    pass
        
        # Extract location
        location_patterns = [r'Colombo', r'Galle', r'Kandy', r'Kurunegala', r'Negombo']
        for pattern in location_patterns:
            loc_match = re.search(pattern, str(listing_element), re.I)
            if loc_match:
                data['Location'] = loc_match.group(0)
                break
        
        # Extract time
        time_patterns = [r'\d+\s*(minute|hour|day|week|month)s?\s*ago', 
                        r'\d+\s*(min|hr|day|wk|mon)s?\s*ago']
        for pattern in time_patterns:
            time_match = re.search(pattern, str(listing_element), re.I)
            if time_match:
                data['Published Time'] = time_match.group(0)
                break
    
    except Exception as e:
        pass  # Silently continue
    
    return data

def scrape_page_fast(driver, page_num, scraper):
    """Fast scraping of a single page"""
    vehicles = []
    url = f"{BASE_URL}&page={page_num}" if page_num > 1 else BASE_URL
    
    try:
        driver.get(url)
        
        # Wait for content - using more flexible wait
        try:
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "div[class*='list'], article, .listing, .ad-item"))
            )
        except TimeoutException:
            # Try alternative selectors
            try:
                WebDriverWait(driver, 5).until(
                    EC.presence_of_element_located((By.TAG_NAME, "body"))
                )
            except:
                return vehicles
        
        # Short sleep for JavaScript to render
        time.sleep(1.5)
        
        # Parse with BeautifulSoup
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        
        # Find listings - multiple selector attempts
        selectors = [
            'div[class*="list-item"]',
            'div[class*="ad-item"]',
            'article[class*="ad-"]',
            'div[class*="listing"]',
            'li[class*="item"]',
            'a[class*="card"]'
        ]
        
        listings = []
        for selector in selectors:
            found = soup.select(selector)
            if len(found) > 3:  # Reasonable threshold
                listings = found
                break
        
        # Fallback: find any div with price info
        if not listings:
            all_divs = soup.find_all('div')
            listings = [div for div in all_divs if 'Rs' in str(div) and len(str(div)) < 5000]
        
        print(f"Page {page_num}: Found {len(listings)} potential listings")
        
        # Process each listing
        for listing in listings[:50]:  # Limit to first 50 to avoid memory issues
            try:
                vehicle_data = extract_vehicle_data_optimized(listing)
                
                # Validate data
                if vehicle_data['Vehicle URL'] and vehicle_data['Vehicle URL'] not in scraper.scraped_urls:
                    # Only add if we have at least price or make
                    if vehicle_data['Price'] or vehicle_data['Make']:
                        vehicles.append(vehicle_data)
                        
            except Exception as e:
                continue
        
    except Exception as e:
        print(f"Error scraping page {page_num}: {str(e)[:100]}")
    
    return vehicles

def scrape_with_selenium_optimized(queue, stop_event, progress_callback=None, max_pages=10):
    """Optimized scraping function"""
    scraper = VehicleScraper()
    scraper.setup_csv_file()
    
    driver = setup_driver(headless=True)
    if not driver:
        return
    
    total_vehicles = 0
    start_time = time.time()
    page = 1
    
    try:
        while page <= max_pages and not stop_event.is_set():
            print(f"Scraping page {page}...")
            
            vehicles = scrape_page_fast(driver, page, scraper)
            
            if not vehicles:
                print(f"No vehicles found on page {page}. Stopping.")
                break
            
            # Process and save vehicles
            for vehicle in vehicles:
                if stop_event.is_set():
                    break
                
                # Save to CSV
                scraper.save_vehicle_to_csv(vehicle)
                
                # Add to queue for GUI
                queue.put(vehicle)
                total_vehicles += 1
            
            # Update progress
            if progress_callback:
                elapsed = time.time() - start_time
                speed = total_vehicles / elapsed if elapsed > 0 else 0
                progress_callback(total_vehicles, speed, page)
            
            # Smart delay
            delay = max(1.5, min(4, 2.5 + (page % 3)))
            time.sleep(delay)
            
            page += 1
            
            # Break if too few vehicles on last page
            if len(vehicles) < 5 and page > 3:
                print(f"Few vehicles ({len(vehicles)}) found. Stopping.")
                break
    
    except Exception as e:
        print(f"Scraping error: {e}")
    
    finally:
        driver.quit()
        
        # Final update
        if progress_callback:
            elapsed = time.time() - start_time
            speed = total_vehicles / elapsed if elapsed > 0 else 0
            progress_callback(total_vehicles, speed, page)
        
        print(f"Scraping complete. Total vehicles: {total_vehicles}")

class VehicleTableApp:
    def __init__(self, root):
        self.root = root
        self.root.title("ikman.lk Vehicle Scraper - Real-time")
        self.root.geometry("1400x800")
        
        # Configure styles
        self.setup_styles()
        
        # Variables
        self.vehicle_urls = {}
        self.total_scraped = 0
        self.scraping_active = False
        self.scraped_vehicles = []  # Store vehicle data
        self.current_sort_column = None
        self.sort_reverse = False
        
        # Setup UI
        self.setup_ui()
        
        # Threading
        self.queue = queue.Queue()
        self.stop_event = threading.Event()
        
        # Start queue checker
        self.check_queue()
        
        # Bind closing event
        self.root.protocol("WM_DELETE_WINDOW", self.on_closing)
    
    def setup_styles(self):
        """Configure ttk styles"""
        style = ttk.Style()
        style.theme_use('clam')
        
        # Configure treeview
        style.configure("Treeview",
                       background="white",
                       foreground="black",
                       rowheight=25,
                       fieldbackground="white")
        style.map('Treeview', background=[('selected', '#0078D7')])
        
        # Configure buttons
        style.configure('Green.TButton', background='green', foreground='white')
        style.configure('Red.TButton', background='red', foreground='white')
        style.configure('Blue.TButton', background='blue', foreground='white')
    
    def setup_ui(self):
        """Setup the user interface"""
        # Main container
        main_container = tk.Frame(self.root, bg='#f0f0f0')
        main_container.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Top control panel
        control_frame = tk.Frame(main_container, bg='#f0f0f0')
        control_frame.pack(fill=tk.X, pady=(0, 10))
        
        # Progress info
        self.progress_frame = tk.Frame(control_frame, bg='#e0e0e0', relief=tk.RIDGE, bd=1)
        self.progress_frame.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 10))
        
        self.progress_label = tk.Label(self.progress_frame, text="Ready to start scraping", 
                                      font=("Arial", 10, 'bold'), bg='#e0e0e0')
        self.progress_label.pack(side=tk.LEFT, padx=10, pady=5)
        
        self.speed_label = tk.Label(self.progress_frame, text="", font=("Arial", 9), 
                                   bg='#e0e0e0', fg='green')
        self.speed_label.pack(side=tk.RIGHT, padx=10, pady=5)
        
        # Control buttons
        button_container = tk.Frame(control_frame, bg='#f0f0f0')
        button_container.pack(side=tk.RIGHT)
        
        self.start_btn = ttk.Button(button_container, text="▶ Start Scraping", 
                                   command=self.start_scraping, style='Green.TButton')
        self.start_btn.pack(side=tk.LEFT, padx=2)
        
        self.stop_btn = ttk.Button(button_container, text="■ Stop", 
                                  command=self.stop_scraping, style='Red.TButton', state='disabled')
        self.stop_btn.pack(side=tk.LEFT, padx=2)
        
        self.clear_btn = ttk.Button(button_container, text="🗑️ Clear", 
                                   command=self.clear_table)
        self.clear_btn.pack(side=tk.LEFT, padx=2)
        
        self.export_btn = ttk.Button(button_container, text="💾 Export", 
                                    command=self.export_csv, style='Blue.TButton')
        self.export_btn.pack(side=tk.LEFT, padx=2)
        
        # Search frame
        search_frame = tk.Frame(main_container, bg='#f0f0f0')
        search_frame.pack(fill=tk.X, pady=(0, 5))
        
        tk.Label(search_frame, text="Search:", bg='#f0f0f0').pack(side=tk.LEFT, padx=(0, 5))
        self.search_var = tk.StringVar()
        self.search_var.trace('w', self.on_search_changed)
        search_entry = tk.Entry(search_frame, textvariable=self.search_var, width=40)
        search_entry.pack(side=tk.LEFT, padx=5)
        
        # Stats frame
        self.stats_label = tk.Label(main_container, text="Vehicles: 0 | Filtered: 0", 
                                   font=("Arial", 9), bg='#f0f0f0', fg='blue')
        self.stats_label.pack(anchor=tk.W, pady=(0, 5))
        
        # Treeview with scrollbars
        tree_frame = tk.Frame(main_container)
        tree_frame.pack(fill=tk.BOTH, expand=True)
        
        # Create treeview
        self.tree = ttk.Treeview(tree_frame, columns=('ID', 'Type', 'Make', 'Model', 'Year', 'Price', 'Mileage', 'Location', 'Time'), 
                                show='headings', height=20)
        
        # Define columns
        columns = [
            ('ID', 'ID', 50),
            ('Type', 'Type', 80),
            ('Make', 'Make', 100),
            ('Model', 'Model', 150),
            ('Year', 'Year', 60),
            ('Price', 'Price', 120),
            ('Mileage', 'Mileage', 100),
            ('Location', 'Location', 120),
            ('Time', 'Published', 120)
        ]
        
        for col_id, heading, width in columns:
            self.tree.heading(col_id, text=heading, command=lambda c=col_id: self.sort_treeview(c))
            self.tree.column(col_id, width=width, minwidth=50)
        
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
        
        # Bind events
        self.tree.bind('<Double-Button-1>', self.on_item_double_click)
        self.tree.bind('<ButtonRelease-1>', self.on_tree_select)
        
        # Status bar
        self.status_bar = tk.Label(main_container, text="Double-click to open in browser | Right-click for options", 
                                  bd=1, relief=tk.SUNKEN, anchor=tk.W, bg='#e0e0e0')
        self.status_bar.pack(fill=tk.X, pady=(10, 0))
        
        # Context menu
        self.setup_context_menu()
    
    def setup_context_menu(self):
        """Setup right-click context menu"""
        self.context_menu = tk.Menu(self.root, tearoff=0)
        self.context_menu.add_command(label="Open in Browser", command=self.open_selected_url)
        self.context_menu.add_command(label="Copy URL", command=self.copy_selected_url)
        self.context_menu.add_separator()
        self.context_menu.add_command(label="View Details", command=self.view_details)
        
        self.tree.bind('<Button-3>', self.show_context_menu)
    
    def show_context_menu(self, event):
        """Show context menu on right-click"""
        item = self.tree.identify_row(event.y)
        if item:
            self.tree.selection_set(item)
            self.context_menu.post(event.x_root, event.y_root)
    
    def open_selected_url(self):
        """Open selected vehicle URL in browser"""
        selection = self.tree.selection()
        if selection:
            item = selection[0]
            url = self.vehicle_urls.get(item)
            if url:
                webbrowser.open(url)
                self.status_bar.config(text=f"Opened: {url[:50]}...")
    
    def copy_selected_url(self):
        """Copy URL to clipboard"""
        selection = self.tree.selection()
        if selection:
            item = selection[0]
            url = self.vehicle_urls.get(item)
            if url:
                self.root.clipboard_clear()
                self.root.clipboard_append(url)
                self.status_bar.config(text="URL copied to clipboard!")
    
    def view_details(self):
        """Show vehicle details in a popup"""
        selection = self.tree.selection()
        if selection:
            item = selection[0]
            values = self.tree.item(item)['values']
            if len(values) >= 9:
                details = f"""
                Make: {values[2]}
                Model: {values[3]}
                Year: {values[4]}
                Price: {values[5]}
                Mileage: {values[6]}
                Location: {values[7]}
                Published: {values[8]}
                """
                self.show_popup("Vehicle Details", details)
    
    def show_popup(self, title, message):
        """Show a popup message"""
        popup = tk.Toplevel(self.root)
        popup.title(title)
        popup.geometry("400x300")
        
        text = scrolledtext.ScrolledText(popup, wrap=tk.WORD, width=50, height=15)
        text.pack(padx=10, pady=10, fill=tk.BOTH, expand=True)
        text.insert(tk.END, message)
        text.config(state='disabled')
        
        btn = ttk.Button(popup, text="Close", command=popup.destroy)
        btn.pack(pady=(0, 10))
    
    def sort_treeview(self, col):
        """Sort treeview by column"""
        data = [(self.tree.set(child, col), child) for child in self.tree.get_children('')]
        
        # Try to convert to appropriate type for sorting
        try:
            data.sort(key=lambda x: int(re.sub(r'[^\d]', '', x[0]) if x[0] else 0), reverse=self.sort_reverse)
        except:
            try:
                data.sort(key=lambda x: float(re.sub(r'[^\d.]', '', x[0]) if x[0] else 0), reverse=self.sort_reverse)
            except:
                data.sort(reverse=self.sort_reverse)
        
        for index, (val, child) in enumerate(data):
            self.tree.move(child, '', index)
        
        # Reverse sort order for next time
        self.sort_reverse = not self.sort_reverse
    
    def on_search_changed(self, *args):
        """Handle search text changes"""
        search_term = self.search_var.get().lower()
        self.filter_treeview(search_term)
    
    def filter_treeview(self, search_term):
        """Filter treeview based on search term"""
        for child in self.tree.get_children():
            values = [str(v).lower() for v in self.tree.item(child)['values']]
            if any(search_term in value for value in values):
                self.tree.item(child, tags=('visible',))
            else:
                self.tree.item(child, tags=('hidden',))
        
        # Configure tags
        self.tree.tag_configure('visible', background='white')
        self.tree.tag_configure('hidden', background='#f0f0f0')
        
        # Update stats
        visible_count = len(self.tree.get_children()) - len(self.tree.get_children('', 'hidden'))
        self.stats_label.config(text=f"Vehicles: {len(self.tree.get_children())} | Filtered: {visible_count}")
    
    def on_tree_select(self, event):
        """Handle tree selection"""
        selection = self.tree.selection()
        if selection:
            item = selection[0]
            url = self.vehicle_urls.get(item)
            if url:
                self.status_bar.config(text=f"Selected: {url[:60]}...")
    
    def start_scraping(self):
        """Start the scraping process"""
        if self.scraping_active:
            return
        
        self.scraping_active = True
        self.start_btn.config(state='disabled')
        self.stop_btn.config(state='normal')
        self.clear_btn.config(state='disabled')
        self.status_bar.config(text="Scraping started...", fg='green')
        
        # Clear stop event
        self.stop_event.clear()
        
        # Start scraping thread
        self.scraping_thread = threading.Thread(
            target=scrape_with_selenium_optimized,
            args=(self.queue, self.stop_event, self.update_progress, 20)
        )
        self.scraping_thread.daemon = True
        self.scraping_thread.start()
    
    def stop_scraping(self):
        """Stop the scraping process"""
        self.scraping_active = False
        self.stop_event.set()
        self.start_btn.config(state='normal')
        self.stop_btn.config(state='disabled')
        self.clear_btn.config(state='normal')
        self.status_bar.config(text=f"Scraping stopped. Total vehicles: {self.total_scraped}", fg='red')
    
    def update_progress(self, total_vehicles, vehicles_per_second, current_page):
        """Update progress display - called from scraping thread"""
        self.total_scraped = total_vehicles
        
        # Schedule GUI update in main thread
        self.root.after(0, self._update_progress_gui, total_vehicles, vehicles_per_second, current_page)
    
    def _update_progress_gui(self, total_vehicles, vehicles_per_second, current_page):
        """Update GUI elements (must run in main thread)"""
        self.progress_label.config(text=f"Scraped: {total_vehicles:,} vehicles | Page: {current_page}")
        if vehicles_per_second > 0:
            self.speed_label.config(text=f"Speed: {vehicles_per_second:.2f} vehicles/sec")
    
    def add_vehicle_to_table(self, vehicle):
        """Add a vehicle to the table"""
        # Create unique ID
        item_id = f"v{len(self.tree.get_children()) + 1:04d}"
        
        # Prepare values for display
        values = (
            item_id,
            vehicle.get('Vehicle Type', 'Car'),
            vehicle.get('Make', 'Unknown'),
            vehicle.get('Model', 'Unknown'),
            vehicle.get('Year', ''),
            vehicle.get('Price', 'N/A'),
            f"{vehicle.get('Mileage', 'N/A'):,}" if isinstance(vehicle.get('Mileage'), (int, float)) else vehicle.get('Mileage', 'N/A'),
            vehicle.get('Location', 'Unknown'),
            vehicle.get('Published Time', 'Unknown')
        )
        
        # Insert into tree
        item = self.tree.insert('', tk.END, values=values, tags=('visible',))
        
        # Store URL
        vehicle_url = vehicle.get('Vehicle URL', '')
        if vehicle_url:
            self.vehicle_urls[item] = vehicle_url
        
        # Add to stored vehicles
        self.scraped_vehicles.append(vehicle)
        
        # Update stats
        self.stats_label.config(text=f"Vehicles: {len(self.tree.get_children())} | Filtered: {len(self.tree.get_children())}")
        
        # Auto-scroll to new item
        self.tree.see(item)
    
    def clear_table(self):
        """Clear the table"""
        for item in self.tree.get_children():
            self.tree.delete(item)
        
        self.vehicle_urls.clear()
        self.scraped_vehicles.clear()
        self.total_scraped = 0
        self.progress_label.config(text="Ready to start scraping")
        self.speed_label.config(text="")
        self.stats_label.config(text="Vehicles: 0 | Filtered: 0")
        self.status_bar.config(text="Table cleared")
    
    def export_csv(self):
        """Export data to CSV"""
        if not self.scraped_vehicles:
            self.status_bar.config(text="No data to export!", fg='red')
            return
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"ikman_export_{timestamp}.csv"
        
        try:
            df = pd.DataFrame(self.scraped_vehicles)
            df.to_csv(filename, index=False, encoding='utf-8')
            self.status_bar.config(text=f"Exported {len(df)} vehicles to {filename}", fg='blue')
        except Exception as e:
            self.status_bar.config(text=f"Export error: {str(e)[:50]}", fg='red')
    
    def on_item_double_click(self, event):
        """Handle double-click on vehicle row"""
        item = self.tree.identify_row(event.y)
        if item:
            url = self.vehicle_urls.get(item)
            if url:
                webbrowser.open(url)
                self.status_bar.config(text=f"Opening in browser...", fg='green')
    
    def check_queue(self):
        """Check queue for new vehicles (runs in main thread)"""
        try:
            while True:
                vehicle = self.queue.get_nowait()
                self.add_vehicle_to_table(vehicle)
        except queue.Empty:
            pass
        
        # Schedule next check
        self.root.after(100, self.check_queue)
    
    def on_closing(self):
        """Handle window closing"""
        if self.scraping_active:
            self.stop_scraping()
            time.sleep(1)  # Give thread time to stop
        
        self.root.destroy()

def main():
    """Main entry point"""
    root = tk.Tk()
    
    # Set window icon and properties
    root.title("ikman.lk Vehicle Scraper")
    root.geometry("1400x800")
    
    # Create and run app
    app = VehicleTableApp(root)
    
    # Start GUI
    root.mainloop()

if __name__ == "__main__":
    main()