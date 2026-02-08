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
from tkinter import ttk, scrolledtext, messagebox
import threading
import queue
import webbrowser
import csv
import os
from datetime import datetime
import json

# Global constants
CSV_FILENAME = 'ikman_vehicles.csv'
FIELD_NAMES = ['Vehicle Type', 'Make', 'Model', 'Year', 'Price', 'Mileage', 'Location', 'Published Time', 'Vehicle URL']
BASE_URL = "https://ikman.lk/en/ads/sri-lanka/vehicles"

class IkmanScraper:
    def __init__(self):
        self.scraped_urls = set()
        self.load_existing_urls()
    
    def load_existing_urls(self):
        """Load already scraped URLs from CSV"""
        if os.path.exists(CSV_FILENAME):
            try:
                df = pd.read_csv(CSV_FILENAME)
                if 'Vehicle URL' in df.columns:
                    self.scraped_urls = set(df['Vehicle URL'].dropna().tolist())
                    print(f"Loaded {len(self.scraped_urls)} existing URLs from CSV")
            except Exception as e:
                print(f"Error loading existing URLs: {e}")
    
    def setup_csv(self):
        """Create CSV file if it doesn't exist"""
        if not os.path.exists(CSV_FILENAME):
            with open(CSV_FILENAME, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=FIELD_NAMES)
                writer.writeheader()
    
    def save_to_csv(self, vehicle_data):
        """Save vehicle data to CSV"""
        try:
            with open(CSV_FILENAME, 'a', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=FIELD_NAMES)
                writer.writerow(vehicle_data)
            return True
        except Exception as e:
            print(f"Error saving to CSV: {e}")
            return False

def setup_driver(debug=False):
    """Setup Chrome driver with debugging options"""
    chrome_options = Options()
    
    if not debug:
        chrome_options.add_argument("--headless")
    
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    
    # Important: Disable automation flags
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    
    # Set user agent
    chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
    
    try:
        driver = webdriver.Chrome(options=chrome_options)
        # Execute CDP commands to avoid detection
        driver.execute_cdp_cmd('Network.setUserAgentOverride', {
            "userAgent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })
        driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        
        return driver
    except Exception as e:
        print(f"Error setting up Chrome driver: {e}")
        return None

def save_debug_info(page_num, html_content, driver=None):
    """Save debug information for troubleshooting"""
    debug_dir = "debug_info"
    if not os.path.exists(debug_dir):
        os.makedirs(debug_dir)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Save HTML
    with open(f"{debug_dir}/page_{page_num}_{timestamp}.html", "w", encoding="utf-8") as f:
        f.write(html_content)
    
    # Take screenshot if driver is available
    if driver:
        try:
            driver.save_screenshot(f"{debug_dir}/page_{page_num}_{timestamp}.png")
        except:
            pass
    
    print(f"Debug info saved for page {page_num}")

def extract_ikman_data(listing):
    """Extract data from ikman.lk listing element"""
    vehicle = {
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
        link = listing.find('a', href=True)
        if link and link['href']:
            url = link['href']
            if not url.startswith('http'):
                url = f"https://ikman.lk{url}"
            vehicle['Vehicle URL'] = url
        
        # Extract title
        title_elem = listing.find(['h2', 'h3', 'h4'])
        if title_elem:
            title = title_elem.get_text(strip=True)
            
            # Extract year
            year_match = re.search(r'\b(19[7-9]\d|20[0-2]\d)\b', title)
            if year_match:
                vehicle['Year'] = int(year_match.group())
            
            # Extract make and model
            common_makes = [
                'Toyota', 'Honda', 'Suzuki', 'Mitsubishi', 'Nissan',
                'BMW', 'Audi', 'Mercedes-Benz', 'Mercedes', 'Ford',
                'Chevrolet', 'Hyundai', 'Kia', 'Volkswagen', 'Mazda',
                'Subaru', 'Lexus', 'Land Rover', 'MG', 'Proton',
                'Daihatsu', 'Chery', 'Isuzu', 'Tata', 'Mahindra'
            ]
            
            title_lower = title.lower()
            for make in common_makes:
                if make.lower() in title_lower:
                    vehicle['Make'] = make
                    # Try to extract model
                    model_start = title_lower.find(make.lower()) + len(make)
                    model_text = title[model_start:].strip()
                    # Remove year if present
                    if vehicle['Year']:
                        model_text = model_text.replace(str(vehicle['Year']), '')
                    vehicle['Model'] = model_text.strip(' -')
                    break
        
        # Extract price
        price_text = listing.get_text()
        price_match = re.search(r'Rs\.?\s*([\d,]+)', price_text)
        if price_match:
            vehicle['Price'] = f"Rs {price_match.group(1)}"
        
        # Extract mileage
        mileage_match = re.search(r'(\d+(?:,\d{3})*)\s*(?:km|KM|Km)', price_text)
        if mileage_match:
            try:
                mileage = mileage_match.group(1).replace(',', '')
                vehicle['Mileage'] = int(mileage)
            except:
                pass
        
        # Extract location
        location_match = re.search(r'\b(Colombo|Galle|Kandy|Kurunegala|Negombo|Jaffna|Matara|Anuradhapura|Batticaloa|Ratnapura|Gampaha|Kalutara)\b', price_text, re.I)
        if location_match:
            vehicle['Location'] = location_match.group(1)
        
        # Extract time
        time_match = re.search(r'(\d+\s*(?:minute|hour|day|week|month|year)s?\s*ago)', price_text, re.I)
        if time_match:
            vehicle['Published Time'] = time_match.group(1)
    
    except Exception as e:
        print(f"Error extracting data: {e}")
    
    return vehicle

def scrape_ikman_page(driver, page_num, debug=False):
    """Scrape a single page from ikman.lk"""
    vehicles = []
    
    # Build URL with pagination
    if page_num == 1:
        url = BASE_URL
    else:
        url = f"{BASE_URL}?sort=date&order=desc&page={page_num}"
    
    print(f"Scraping: {url}")
    
    try:
        # Navigate to page
        driver.get(url)
        
        # Wait for content to load
        try:
            # Wait for any listing to appear
            WebDriverWait(driver, 15).until(
                EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Rs') or contains(text(), 'Toyota') or contains(text(), 'Honda')]"))
            )
        except TimeoutException:
            print(f"Timeout waiting for content on page {page_num}")
            if debug:
                save_debug_info(page_num, driver.page_source, driver)
            return vehicles
        
        # Additional short wait for JavaScript
        time.sleep(2)
        
        # Get page source
        page_source = driver.page_source
        
        if debug and page_num == 1:
            save_debug_info(page_num, page_source, driver)
        
        # Parse with BeautifulSoup
        soup = BeautifulSoup(page_source, 'html.parser')
        
        # Save sample HTML for debugging
        if page_num == 1:
            with open("sample_listing.html", "w", encoding="utf-8") as f:
                # Find first potential listing
                for div in soup.find_all('div', class_=True)[:10]:
                    if len(str(div)) < 5000:  # Not too large
                        f.write(f"\n{'='*50}\n")
                        f.write(str(div.prettify()))
        
        # Try different selectors for ikman.lk
        listings = []
        
        # Strategy 1: Look for ads by class name patterns
        for class_name in ['list', 'item', 'card', 'ad', 'product']:
            elements = soup.find_all(class_=lambda x: x and class_name in x.lower())
            if elements:
                print(f"Found {len(elements)} elements with class containing '{class_name}'")
                listings.extend(elements)
        
        # Strategy 2: Look for divs with vehicle-like content
        if not listings:
            all_divs = soup.find_all(['div', 'article', 'section'])
            for div in all_divs:
                text = div.get_text(strip=True)
                if len(text) > 50 and ('Rs' in text or 'LKR' in text or 'Toyota' in text or 'Honda' in text):
                    listings.append(div)
        
        print(f"Total potential listings found: {len(listings)}")
        
        # Process each listing
        for i, listing in enumerate(listings[:50]):  # Limit to first 50
            try:
                vehicle = extract_ikman_data(listing)
                
                # Validate and add
                if vehicle['Vehicle URL']:
                    vehicles.append(vehicle)
                    
                    if len(vehicles) <= 3:  # Print first few for debugging
                        print(f"  Found vehicle {len(vehicles)}: {vehicle.get('Make', 'Unknown')} - {vehicle.get('Price', 'No price')}")
                
            except Exception as e:
                continue
        
        print(f"Successfully extracted {len(vehicles)} vehicles from page {page_num}")
        
    except Exception as e:
        print(f"Error scraping page {page_num}: {str(e)}")
        import traceback
        traceback.print_exc()
    
    return vehicles

def run_scraper(queue, stop_event, progress_callback=None, debug=False, max_pages=5):
    """Main scraping function"""
    scraper = IkmanScraper()
    scraper.setup_csv()
    
    print("Starting ikman.lk scraper...")
    print(f"Debug mode: {debug}")
    
    driver = setup_driver(debug=debug)
    if not driver:
        print("Failed to setup Chrome driver!")
        return
    
    total_vehicles = 0
    start_time = time.time()
    page = 1
    
    try:
        while page <= max_pages and not stop_event.is_set():
            print(f"\n{'='*60}")
            print(f"Scraping page {page}/{max_pages}")
            
            vehicles = scrape_ikman_page(driver, page, debug)
            
            if not vehicles:
                print(f"No vehicles found on page {page}. Stopping.")
                break
            
            # Process vehicles
            new_vehicles = 0
            for vehicle in vehicles:
                if stop_event.is_set():
                    break
                
                # Check if already scraped
                if vehicle['Vehicle URL'] in scraper.scraped_urls:
                    continue
                
                # Save to CSV
                if scraper.save_to_csv(vehicle):
                    # Add to scraped URLs
                    scraper.scraped_urls.add(vehicle['Vehicle URL'])
                    
                    # Send to GUI
                    queue.put(vehicle)
                    total_vehicles += 1
                    new_vehicles += 1
            
            print(f"Page {page}: {len(vehicles)} found, {new_vehicles} new")
            
            # Update progress
            if progress_callback:
                elapsed = time.time() - start_time
                speed = total_vehicles / elapsed if elapsed > 0 else 0
                progress_callback(total_vehicles, speed, page)
            
            # Random delay to avoid blocking
            if page < max_pages and not stop_event.is_set():
                delay = 3 + (time.time() % 3)  # 3-6 seconds
                print(f"Waiting {delay:.1f} seconds before next page...")
                time.sleep(delay)
            
            page += 1
    
    except Exception as e:
        print(f"Fatal error in scraper: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        driver.quit()
        elapsed = time.time() - start_time
        
        print(f"\n{'='*60}")
        print(f"Scraping completed!")
        print(f"Total vehicles scraped: {total_vehicles}")
        print(f"Time elapsed: {elapsed:.2f} seconds")
        if elapsed > 0:
            print(f"Speed: {total_vehicles/elapsed:.2f} vehicles/sec")
        print(f"Data saved to: {CSV_FILENAME}")
        print(f"{'='*60}")
        
        # Final progress update
        if progress_callback:
            progress_callback(total_vehicles, 0, page-1)

class DebugScraperGUI:
    """Simple GUI for debugging the scraper"""
    def __init__(self, root):
        self.root = root
        self.root.title("ikman.lk Scraper Debugger")
        self.root.geometry("1200x700")
        
        # Variables
        self.scraping = False
        self.stop_event = threading.Event()
        self.queue = queue.Queue()
        
        # Setup UI
        self.setup_ui()
        
        # Start queue checker
        self.check_queue()
    
    def setup_ui(self):
        """Setup the user interface"""
        # Main container
        main_frame = tk.Frame(self.root)
        main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Control panel
        control_frame = tk.Frame(main_frame)
        control_frame.pack(fill=tk.X, pady=(0, 10))
        
        # Start button
        self.start_btn = tk.Button(control_frame, text="▶ Start Scraping", 
                                  command=self.start_scraping, bg='green', fg='white',
                                  font=("Arial", 11, 'bold'), padx=20)
        self.start_btn.pack(side=tk.LEFT, padx=5)
        
        # Stop button
        self.stop_btn = tk.Button(control_frame, text="■ Stop", 
                                 command=self.stop_scraping, bg='red', fg='white',
                                 font=("Arial", 11), padx=20, state=tk.DISABLED)
        self.stop_btn.pack(side=tk.LEFT, padx=5)
        
        # Debug mode checkbox
        self.debug_var = tk.BooleanVar(value=True)
        self.debug_cb = tk.Checkbutton(control_frame, text="Debug Mode", 
                                      variable=self.debug_var, font=("Arial", 10))
        self.debug_cb.pack(side=tk.LEFT, padx=20)
        
        # Pages selector
        tk.Label(control_frame, text="Pages:", font=("Arial", 10)).pack(side=tk.LEFT, padx=(20, 5))
        self.pages_var = tk.StringVar(value="5")
        pages_spin = tk.Spinbox(control_frame, from_=1, to=50, textvariable=self.pages_var, 
                               width=5, font=("Arial", 10))
        pages_spin.pack(side=tk.LEFT)
        
        # Status frame
        status_frame = tk.Frame(main_frame, relief=tk.SUNKEN, bd=1)
        status_frame.pack(fill=tk.X, pady=(0, 10))
        
        self.status_label = tk.Label(status_frame, text="Ready to start scraping", 
                                    font=("Arial", 10, 'bold'), anchor=tk.W)
        self.status_label.pack(side=tk.LEFT, padx=10, pady=5, fill=tk.X, expand=True)
        
        self.count_label = tk.Label(status_frame, text="Vehicles: 0", font=("Arial", 10))
        self.count_label.pack(side=tk.RIGHT, padx=10, pady=5)
        
        # Log output
        log_frame = tk.LabelFrame(main_frame, text="Scraping Log", font=("Arial", 10, 'bold'))
        log_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 10))
        
        self.log_text = scrolledtext.ScrolledText(log_frame, wrap=tk.WORD, height=20)
        self.log_text.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # Results frame
        results_frame = tk.LabelFrame(main_frame, text="Scraped Vehicles", font=("Arial", 10, 'bold'))
        results_frame.pack(fill=tk.BOTH, expand=True)
        
        # Create treeview
        columns = ('ID', 'Make', 'Model', 'Year', 'Price', 'Mileage', 'Location', 'Time')
        self.tree = ttk.Treeview(results_frame, columns=columns, show='headings', height=8)
        
        # Define headings
        col_widths = [50, 100, 150, 60, 100, 80, 100, 120]
        for i, col in enumerate(columns):
            self.tree.heading(col, text=col)
            self.tree.column(col, width=col_widths[i])
        
        # Add scrollbars
        v_scroll = ttk.Scrollbar(results_frame, orient=tk.VERTICAL, command=self.tree.yview)
        h_scroll = ttk.Scrollbar(results_frame, orient=tk.HORIZONTAL, command=self.tree.xview)
        self.tree.configure(yscrollcommand=v_scroll.set, xscrollcommand=h_scroll.set)
        
        # Grid layout
        self.tree.grid(row=0, column=0, sticky='nsew')
        v_scroll.grid(row=0, column=1, sticky='ns')
        h_scroll.grid(row=1, column=0, sticky='ew')
        
        results_frame.grid_rowconfigure(0, weight=1)
        results_frame.grid_columnconfigure(0, weight=1)
        
        # Vehicle count
        self.vehicle_count = 0
    
    def log_message(self, message):
        """Add message to log"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.log_text.insert(tk.END, f"[{timestamp}] {message}\n")
        self.log_text.see(tk.END)
        self.root.update()
    
    def update_progress(self, total_vehicles, speed, current_page):
        """Update progress display"""
        self.vehicle_count = total_vehicles
        self.count_label.config(text=f"Vehicles: {total_vehicles}")
        
        if speed > 0:
            self.status_label.config(text=f"Page {current_page}: {total_vehicles} vehicles ({speed:.2f}/sec)")
        else:
            self.status_label.config(text=f"Page {current_page}: {total_vehicles} vehicles")
    
    def start_scraping(self):
        """Start scraping process"""
        if self.scraping:
            return
        
        self.scraping = True
        self.start_btn.config(state=tk.DISABLED)
        self.stop_btn.config(state=tk.NORMAL)
        self.stop_event.clear()
        
        # Clear log
        self.log_text.delete(1.0, tk.END)
        self.log_message("Starting ikman.lk scraper...")
        
        # Get settings
        debug_mode = self.debug_var.get()
        try:
            max_pages = int(self.pages_var.get())
        except:
            max_pages = 5
        
        self.log_message(f"Settings: Debug={debug_mode}, Max Pages={max_pages}")
        
        # Start scraping thread
        self.scraping_thread = threading.Thread(
            target=run_scraper,
            args=(self.queue, self.stop_event, self.update_progress, debug_mode, max_pages)
        )
        self.scraping_thread.daemon = True
        self.scraping_thread.start()
        
        self.log_message("Scraping thread started...")
    
    def stop_scraping(self):
        """Stop scraping process"""
        self.scraping = False
        self.stop_event.set()
        self.start_btn.config(state=tk.NORMAL)
        self.stop_btn.config(state=tk.DISABLED)
        self.log_message("Stopping scraper...")
    
    def check_queue(self):
        """Check for new vehicles in queue"""
        try:
            while True:
                vehicle = self.queue.get_nowait()
                self.add_vehicle_to_tree(vehicle)
        except queue.Empty:
            pass
        
        # Schedule next check
        self.root.after(100, self.check_queue)
    
    def add_vehicle_to_tree(self, vehicle):
        """Add vehicle to treeview"""
        # Create display values
        values = (
            len(self.tree.get_children()) + 1,
            vehicle.get('Make', 'Unknown'),
            vehicle.get('Model', 'Unknown'),
            vehicle.get('Year', ''),
            vehicle.get('Price', 'N/A'),
            f"{vehicle.get('Mileage', 'N/A'):,}" if isinstance(vehicle.get('Mileage'), int) else vehicle.get('Mileage', 'N/A'),
            vehicle.get('Location', 'Unknown'),
            vehicle.get('Published Time', 'Unknown')[:20]
        )
        
        # Insert into tree
        self.tree.insert('', tk.END, values=values)
        
        # Log
        self.log_message(f"Found: {vehicle.get('Make', 'Unknown')} - {vehicle.get('Price', 'No price')}")
    
    def on_closing(self):
        """Handle window closing"""
        if self.scraping:
            self.stop_scraping()
            time.sleep(1)
        self.root.destroy()

def test_scraper_manual():
    """Test scraper manually without GUI"""
    print("Testing ikman.lk scraper manually...")
    print("=" * 60)
    
    # Test with debug mode
    driver = setup_driver(debug=True)  # debug=True shows browser
    if not driver:
        print("Failed to setup Chrome!")
        return
    
    try:
        # Test first page
        vehicles = scrape_ikman_page(driver, 1, debug=True)
        
        print(f"\nFound {len(vehicles)} vehicles:")
        print("=" * 60)
        
        for i, vehicle in enumerate(vehicles[:10], 1):  # Show first 10
            print(f"{i}. {vehicle.get('Make', 'Unknown')} {vehicle.get('Model', 'Unknown')}")
            print(f"   Price: {vehicle.get('Price', 'N/A')}")
            print(f"   Year: {vehicle.get('Year', 'N/A')}")
            print(f"   URL: {vehicle.get('Vehicle URL', 'N/A')[:80]}...")
            print()
        
        # Save sample data
        if vehicles:
            df = pd.DataFrame(vehicles)
            df.to_csv('test_scrape_results.csv', index=False, encoding='utf-8')
            print(f"Saved results to 'test_scrape_results.csv'")
        
        # Ask if user wants to continue
        response = input("\nDo you want to scrape more pages? (y/n): ")
        if response.lower() == 'y':
            max_pages = int(input("How many pages? (1-10): "))
            
            all_vehicles = []
            scraper = IkmanScraper()
            scraper.setup_csv()
            
            for page in range(1, max_pages + 1):
                print(f"\nScraping page {page}...")
                vehicles = scrape_ikman_page(driver, page, debug=False)
                
                # Save new vehicles
                new_count = 0
                for vehicle in vehicles:
                    if vehicle['Vehicle URL'] not in scraper.scraped_urls:
                        if scraper.save_to_csv(vehicle):
                            scraper.scraped_urls.add(vehicle['Vehicle URL'])
                            new_count += 1
                            all_vehicles.append(vehicle)
                
                print(f"Page {page}: {len(vehicles)} found, {new_count} new")
                
                if page < max_pages:
                    time.sleep(3)
            
            print(f"\nTotal: {len(all_vehicles)} vehicles saved to {CSV_FILENAME}")
    
    except Exception as e:
        print(f"Error during testing: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        driver.quit()
        print("\nTest completed. Press Enter to exit.")
        input()

def main():
    """Main entry point"""
    print("ikman.lk Vehicle Scraper")
    print("=" * 50)
    print("1. Run with GUI (Recommended for debugging)")
    print("2. Run manual test (Shows browser)")
    print("3. Exit")
    
    choice = input("\nEnter choice (1-3): ")
    
    if choice == '1':
        root = tk.Tk()
        app = DebugScraperGUI(root)
        root.protocol("WM_DELETE_WINDOW", app.on_closing)
        root.mainloop()
    
    elif choice == '2':
        test_scraper_manual()
    
    else:
        print("Goodbye!")

if __name__ == "__main__":
    main()