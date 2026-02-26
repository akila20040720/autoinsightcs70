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
import glob

# Global constants
FIELD_NAMES = ['Vehicle Type', 'Make', 'Model', 'Year', 'Price', 'Milleage', 'District', 'published date', 'Vehicle URL']

def find_latest_csv_with_date():
    """Find the latest CSV file with a date in the filename and extract the date."""
    # Get current directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Pattern to match riyasewana_vehicles_YYYY-MM-DD.csv
    pattern = os.path.join(current_dir, 'riyasewana_vehicles_*.csv')
    csv_files = glob.glob(pattern)
    
    if not csv_files:
        print("No existing CSV files found with date format.")
        return None, None
    
    # Extract dates from filenames
    date_files = []
    for csv_file in csv_files:
        filename = os.path.basename(csv_file)
        # Extract date from filename: riyasewana_vehicles_YYYY-MM-DD.csv
        match = re.search(r'riyasewana_vehicles_(\d{4}-\d{2}-\d{2})\.csv', filename)
        if match:
            date_str = match.group(1)
            try:
                date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
                date_files.append((date_obj, csv_file))
            except ValueError:
                continue
    
    if not date_files:
        print("No valid date found in CSV filenames.")
        return None, None
    
    # Sort by date and get the latest
    date_files.sort(reverse=True)
    latest_date, latest_file = date_files[0]
    
    print(f"Found existing file: {os.path.basename(latest_file)}")
    print(f"Extracted start date: {latest_date}")
    
    return latest_date, latest_file

def get_csv_filename(end_date=None):
    """Generate CSV filename with end date"""
    if end_date:
        # If end_date is a date object, convert to string
        if hasattr(end_date, 'strftime'):
            end_date_str = end_date.strftime('%Y-%m-%d')
        else:
            end_date_str = str(end_date)
        return f'riyasewana_vehicles_{end_date_str}.csv'
    else:
        # Use current date if no end date specified
        current_date = datetime.now().strftime('%Y-%m-%d')
        return f'riyasewana_vehicles_{current_date}.csv'

def get_date_range_from_terminal():
    """Find start date from existing CSV file and prompt user for end date."""
    print("\n=== Date Range Filter ===")
    
    # Find start date from existing file
    start_date, csv_file = find_latest_csv_with_date()
    
    if start_date:
        print(f"Using start date: {start_date} (from existing CSV)")
    else:
        # If no file found, ask for start date
        print("No existing CSV file found.")
        start_str = input("Enter start date (YYYY-MM-DD) [blank for none]: ").strip()
        if start_str:
            try:
                start_date = datetime.strptime(start_str, "%Y-%m-%d").date()
            except ValueError:
                print("Invalid start date format. Using no start date.")
                start_date = None
    
    # Ask for end date
    print("\nEnter end date in YYYY-MM-DD format.")
    end_str = input("End date (newest) [blank for today]: ").strip()
    
    end_date = None
    if end_str:
        try:
            end_date = datetime.strptime(end_str, "%Y-%m-%d").date()
        except ValueError:
            print("Invalid end date format. Using today's date.")
            end_date = datetime.now().date()
    else:
        # Default to today if blank
        end_date = datetime.now().date()
        print(f"Using today's date: {end_date}")
    
    if start_date and end_date and start_date > end_date:
        print("Warning: Start date is after end date. Swapping them.")
        start_date, end_date = end_date, start_date
    
    return start_date, end_date

def setup_csv_file(csv_filename):
    """Create CSV file with headers if it doesn't exist"""
    if not os.path.exists(csv_filename):
        with open(csv_filename, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=FIELD_NAMES)
            writer.writeheader()
        print(f"Created new CSV file: {csv_filename}")
    else:
        print(f"Appending to existing CSV file: {csv_filename}")

def save_vehicle_to_csv(vehicle_data, csv_filename):
    """Append a single vehicle to CSV file"""
    try:
        with open(csv_filename, 'a', newline='', encoding='utf-8') as csvfile:
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

def scrape_page(driver, page_num, start_date=None, end_date=None):
    """
    Scrape a single page and return filtered vehicles.
    Returns: (vehicles_list, has_items) where has_items indicates if any vehicle items were found on the page.
    """
    vehicles = []
    has_items = False
    try:
        url = f"https://riyasewana.com/search?page={page_num}"
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
        has_items = len(items) > 0

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

                # Parse published date for filtering
                pub_date_str = vehicle_data.get('published date')
                pub_date = None
                if pub_date_str and re.match(r'\d{4}-\d{2}-\d{2}', pub_date_str):
                    try:
                        pub_date = datetime.strptime(pub_date_str, "%Y-%m-%d").date()
                    except ValueError:
                        pass

                # Apply date filtering
                if start_date and pub_date and pub_date < start_date:
                    continue  # too old
                if end_date and pub_date and pub_date > end_date:
                    continue  # too new
                # If date is missing and any filter is active, skip (can't verify)
                if (start_date or end_date) and pub_date is None:
                    continue

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

    return vehicles, has_items

def scrape_with_selenium(queue, stop_event, csv_filename, progress_callback=None, start_date=None, end_date=None):
    """Scrape using optimized Selenium and put data in queue"""
    driver = setup_driver()
    total_vehicles_scraped = 0
    start_time = time.time()
    
    try:
        # Try to scrape many pages - will stop when no more content or when past date range
        page = 1
        max_pages = 67000  # Upper limit for safety
        
        while page <= max_pages and not stop_event.is_set():
            print(f"Scraping page {page}...")
            
            vehicles, has_items = scrape_page(driver, page, start_date, end_date)
            
            if not has_items:
                print(f"No items found on page {page}. Stopping.")
                break
            
            # If we have a start_date and we got no vehicles but there were items, assume we've passed the range
            if start_date and not vehicles and has_items:
                print(f"All items on page {page} are older than {start_date}. Stopping.")
                break
            
            print(f"  Found {len(vehicles)} vehicles within range on page {page}")
            
            # Process each vehicle
            for vehicle in vehicles:
                if stop_event.is_set():
                    break
                    
                # Save to CSV immediately
                save_vehicle_to_csv(vehicle, csv_filename)
                
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
            print(f"   Total vehicles within range: {total_vehicles_scraped}")
            print(f"   Time elapsed: {elapsed:.2f} seconds")
            print(f"   Speed: {vehicles_per_second:.2f} vehicles/second")
            print(f"   Saved to: {csv_filename}")

class VehicleTableApp:
    def __init__(self, root, start_date=None, end_date=None):
        self.root = root
        self.root.title("Riyasewana Vehicle Scraper - Real-time Updates")
        self.root.geometry("1300x750")

        self.start_date = start_date
        self.end_date = end_date
        self.csv_filename = get_csv_filename(end_date)

        # Store vehicle URLs mapped to tree items
        self.vehicle_urls = {}
        self.total_scraped = 0

        # Create main frame
        main_frame = tk.Frame(root)
        main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        # Create progress frame
        progress_frame = tk.Frame(main_frame)
        progress_frame.pack(fill=tk.X, pady=(0, 10))
        
        # Filter label
        filter_text = "Date filter: "
        if start_date and end_date:
            filter_text += f"{start_date} to {end_date}"
        elif start_date:
            filter_text += f"from {start_date} onward"
        elif end_date:
            filter_text += f"up to {end_date}"
        else:
            filter_text += "None"
        
        self.filter_label = tk.Label(progress_frame, text=filter_text, font=("Arial", 9, 'italic'))
        self.filter_label.pack(side=tk.TOP, anchor=tk.W)
        
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
        setup_csv_file(self.csv_filename)
        print(f"\nData will be saved to: {self.csv_filename}")

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
        self.status_label.config(text="Scraping in progress...", fg='green')
        
        # Reset stop event
        self.stop_event.clear()

        # Start scraping thread with date range
        self.scraping_thread = threading.Thread(
            target=scrape_with_selenium, 
            args=(self.queue, self.stop_event, self.csv_filename, self.update_progress, self.start_date, self.end_date)
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
    # Get date range from terminal before starting GUI
    start_date, end_date = get_date_range_from_terminal()
    
    root = tk.Tk()
    app = VehicleTableApp(root, start_date, end_date)
    
    # Set window icon and make it resizable
    root.resizable(True, True)
    
    # Start the GUI
    root.mainloop()