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

# Global constants - Updated for ikman.lk
CSV_FILENAME = 'ikman_vehicles.csv'
FIELD_NAMES = ['Vehicle Type', 'Make', 'Model', 'Year', 'Price', 'Mileage', 'Location', 'Published Time', 'Vehicle URL']
BASE_URL = "https://ikman.lk/en/ads/sri-lanka/cars"

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
    # Use a realistic user-agent for ikman.lk
    chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

    driver = webdriver.Chrome(options=chrome_options)
    driver.set_page_load_timeout(30)
    driver.set_script_timeout(30)
    return driver

def extract_vehicle_data(listing_element):
    """Extract vehicle data from ikman.lk car listing <a> element"""

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
        # ===================== URL =====================
        href = listing_element.get('href')
        if href:
            data['Vehicle URL'] = "https://ikman.lk" + href

        # ===================== TITLE =====================
        title_elem = listing_element.find('h2')
        if title_elem:
            title = title_elem.get_text(strip=True)

            # --- Extract Year ---
            year_match = re.search(r'\b(19|20)\d{2}\b', title)
            if year_match:
                data['Year'] = int(year_match.group())

            # --- Make & Model Parsing ---
            common_makes = [
                'Toyota','Honda','Suzuki','Mitsubishi','Nissan','BMW','Audi',
                'Mercedes','Ford','Chevrolet','Hyundai','Kia','Volkswagen',
                'Mazda','Subaru','Lexus','Land Rover','MG','Proton','Daihatsu','Chery'
            ]

            for make in common_makes:
                if title.startswith(make):
                    data['Make'] = make
                    model_part = title.replace(make, '', 1)

                    if data['Year']:
                        model_part = model_part.replace(str(data['Year']), '')

                    data['Model'] = model_part.strip()
                    break

            # Fallback
            if not data['Make']:
                parts = title.split()
                data['Make'] = parts[0]
                data['Model'] = ' '.join(parts[1:])

        # ===================== ALL P TAGS =====================
        p_tags = listing_element.find_all('p')

        for p in p_tags:
            text = p.get_text(strip=True)

            # Price
            if 'Rs' in text:
                price_match = re.search(r'Rs\.?\s*([\d,]+)', text)
                if price_match:
                    data['Price'] = "Rs " + price_match.group(1)

            # Mileage
            km_match = re.search(r'(\d+(?:,\d{3})*)\s*km', text, re.I)
            if km_match:
                data['Mileage'] = int(km_match.group(1).replace(',', ''))

            # Published Time
            if re.search(r'(minute|hour|day|week|month|year)', text, re.I):
                data['Published Time'] = text

            # Location (Sri Lanka cities heuristic)
            if text in [
                'Colombo','Galle','Kandy','Kurunegala','Negombo',
                'Jaffna','Matara','Anuradhapura','Batticaloa'
            ]:
                data['Location'] = text

    except Exception as e:
        print("Error extracting listing:", e)

    return data

def scrape_page(driver, page_num):
    """Scrape a single page from ikman.lk and return vehicle data"""
    vehicles = []
    try:
        if page_num == 1:
            url = BASE_URL
        else:
            url = f"{BASE_URL}?page={page_num}"
        
        print(f"Scraping URL: {url}")
        driver.get(url)

        # Wait for the content to load - ikman.lk uses different selectors
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "div[class*='list--'], article, section, .listing, .ad-list"))
        )

        # Add additional wait for content to fully render
        time.sleep(2)

        # Get page source and parse
        soup = BeautifulSoup(driver.page_source, 'html.parser')

        # Find all vehicle listings - ikman.lk has different structure
        # Try multiple possible selectors for ikman.lk listings
        selectors = [
            'article', 
            'div[class*="list--"]', 
            'div[class*="ad-"]', 
            'div[class*="listing"]',
            'section',
            'div[class*="item"]'
        ]
        
        items = []
        for selector in selectors:
            items = soup.select(selector)
            if len(items) > 5:  # If we found a reasonable number of items
                print(f"Found {len(items)} items using selector: {selector}")
                break
        
        if not items:
            # Fallback: look for any elements that might contain vehicle data
            all_elements = soup.find_all(['div', 'article', 'section'])
            items = [elem for elem in all_elements if any(keyword in str(elem).lower() for keyword in ['rs', 'km', 'car', 'vehicle'])]
            print(f"Fallback found {len(items)} items")

        for item in items:
            try:
                item_text = item.get_text(strip=True)
                # Skip if doesn't look like a vehicle listing
                if not item_text or len(item_text) < 20:
                    continue
                
                # Check if it has vehicle-like content
                has_price = 'Rs' in item_text or 'rs' in item_text.lower()
                has_km = 'km' in item_text.lower()
                
                if not (has_price or has_km):
                    continue
                
                # Extract data using the new function
                vehicle_data = extract_vehicle_data(item)
                
                # Only add if we have at least make or price
                if vehicle_data['Make'] or vehicle_data['Price']:
                    vehicles.append(vehicle_data)
                    print(f"  Found: {vehicle_data['Make']} {vehicle_data['Model']} - {vehicle_data['Price']}")

            except Exception as e:
                print(f"Error parsing item: {e}")
                continue

    except TimeoutException:
        print(f"Timeout loading page {page_num}")
    except Exception as e:
        print(f"Error scraping page {page_num}: {e}")

    return vehicles

def scrape_with_selenium(queue, stop_event, progress_callback=None):
    """Scrape ikman.lk using optimized Selenium and put data in queue"""
    driver = setup_driver()
    total_vehicles_scraped = 0
    start_time = time.time()
    
    try:
        # Start from page 1
        page = 1
        max_pages = 50  # Reasonable limit for ikman.lk
        
        while page <= max_pages and not stop_event.is_set():
            print(f"\n{'='*50}")
            print(f"Scraping page {page} of ikman.lk...")
            
            vehicles = scrape_page(driver, page)
            
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
                
                # Update progress every 5 vehicles
                if total_vehicles_scraped % 5 == 0 and progress_callback:
                    elapsed = time.time() - start_time
                    vehicles_per_second = total_vehicles_scraped / elapsed if elapsed > 0 else 0
                    progress_callback(total_vehicles_scraped, vehicles_per_second, page)
            
            # Update progress for this page
            if progress_callback:
                elapsed = time.time() - start_time
                vehicles_per_second = total_vehicles_scraped / elapsed if elapsed > 0 else 0
                progress_callback(total_vehicles_scraped, vehicles_per_second, page)
            
            # Delay between pages to avoid rate limiting (be respectful)
            delay = 3 + (time.time() % 4)  # Random between 3-7 seconds
            print(f"Waiting {delay:.1f} seconds before next page...")
            time.sleep(delay)
            
            page += 1
            
            # Check if we should stop
            if page % 5 == 0 and stop_event.is_set():
                break
                
    except Exception as e:
        print(f"Error in scraping thread: {e}")
        import traceback
        traceback.print_exc()
        
    finally:
        driver.quit()
        
        # Final summary
        elapsed = time.time() - start_time
        if elapsed > 0:
            vehicles_per_second = total_vehicles_scraped / elapsed
            print(f"\n{'='*50}")
            print(f"✅ Scraping completed!")
            print(f"   Total vehicles: {total_vehicles_scraped}")
            print(f"   Time elapsed: {elapsed:.2f} seconds")
            print(f"   Speed: {vehicles_per_second:.2f} vehicles/second")
            print(f"   Saved to: {CSV_FILENAME}")
            print(f"{'='*50}")

class VehicleTableApp:
    def __init__(self, root):
        self.root = root
        self.root.title("ikman.lk Vehicle Scraper - Real-time Updates")
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
        self.progress_label = tk.Label(progress_frame, text="Ready to start scraping ikman.lk...", font=("Arial", 10))
        self.progress_label.pack(side=tk.LEFT)
        
        # Speed label
        self.speed_label = tk.Label(progress_frame, text="", font=("Arial", 10))
        self.speed_label.pack(side=tk.RIGHT)

        # Create treeview for table
        tree_frame = tk.Frame(main_frame)
        tree_frame.pack(fill=tk.BOTH, expand=True)
        
        self.tree = ttk.Treeview(tree_frame, columns=('Type', 'Make', 'Model', 'Year', 'Price', 'Mileage', 'Location', 'Time', 'URL'), show='headings')
        
        # Define column headings
        columns = [
            ('Type', 'Vehicle Type', 100),
            ('Make', 'Make', 80),
            ('Model', 'Model', 150),
            ('Year', 'Year', 60),
            ('Price', 'Price', 120),
            ('Mileage', 'Mileage', 80),
            ('Location', 'Location', 100),
            ('Time', 'Published', 100),
            ('URL', 'URL Short', 120)
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
        self.start_button = tk.Button(button_frame, text="▶ Start Scraping ikman.lk", command=self.start_scraping, 
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
        self.status_label = tk.Label(main_frame, text="Double-click any row to view on ikman.lk", 
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
        self.start_button.config(state=tk.DISABLED)
        self.stop_button.config(state=tk.NORMAL)
        self.status_label.config(text="Scraping ikman.lk in progress...", fg='green')
        
        # Reset stop event
        self.stop_event.clear()

        # Start scraping thread
        self.scraping_thread = threading.Thread(
            target=scrape_with_selenium, 
            args=(self.queue, self.stop_event, self.update_progress)
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
        self.status_label.config(text="Table cleared. Ready to start scraping ikman.lk...", fg='gray')

    def export_csv(self):
        """Export current table view to a new CSV file"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        export_filename = f'ikman_vehicles_export_{timestamp}.csv'
        
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
                'Mileage': values[5],
                'Location': values[6],
                'Published Time': values[7],
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
            vehicle.get('Mileage', ''),
            vehicle.get('Location', ''),
            vehicle.get('Published Time', ''),
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