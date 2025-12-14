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
    chrome_options.add_argument("--disable-images")  # Disable images for faster loading
    chrome_options.add_argument("--disable-javascript")  # Wait, we need JS, but maybe not
    # Actually, keep JS but disable images
    prefs = {
        "profile.managed_default_content_settings.images": 2,
        "profile.default_content_setting_values.notifications": 2,
        "profile.managed_default_content_settings.media_stream": 2,
    }
    chrome_options.add_experimental_option("prefs", prefs)
    chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")

    driver = webdriver.Chrome(options=chrome_options)
    driver.set_page_load_timeout(30)  # Timeout for page load
    return driver

def extract_vehicle_data(title, boxtext_divs):
    """Extract vehicle data from title and boxtext divs"""
    # Initialize data
    data = {
        'Vehicle Type': None,
        'Make': None,
        'Model': None,
        'Year': None,
        'Price': None,
        'Milleage': None,
        'District': None,
        'published date': None
    }

    # Parse title for type, make, model, year
    # Title format: "Make Model Year VehicleType"
    title_lower = title.lower()

    # Vehicle Type
    if 'car' in title_lower:
        data['Vehicle Type'] = 'Car'
    elif 'motorbike' in title_lower or 'motorcycle' in title_lower:
        data['Vehicle Type'] = 'Motorbike'
    elif 'three wheel' in title_lower:
        data['Vehicle Type'] = 'Three Wheel'
    elif 'van' in title_lower:
        data['Vehicle Type'] = 'Van'
    elif 'suv' in title_lower or 'jeep' in title_lower:
        data['Vehicle Type'] = 'SUV'
    elif 'lorry' in title_lower:
        data['Vehicle Type'] = 'Lorry'
    elif 'bus' in title_lower:
        data['Vehicle Type'] = 'Bus'
    elif 'pickup' in title_lower:
        data['Vehicle Type'] = 'Pickup'
    elif 'tractor' in title_lower:
        data['Vehicle Type'] = 'Tractor'
    elif 'bicycle' in title_lower:
        data['Vehicle Type'] = 'Bicycle'

    # Extract year (4 digits)
    year_match = re.search(r'\b(19|20)\d{2}\b', title)
    if year_match:
        data['Year'] = int(year_match.group())

    # Split title to get make and model
    parts = title.split()
    if parts:
        data['Make'] = parts[0]  # First word is usually make
        # Model is everything between make and year/type
        model_parts = []
        for part in parts[1:]:
            if part.isdigit() and len(part) == 4 and 1900 <= int(part) <= 2030:
                break  # Stop at year
            if part.lower() not in ['car', 'motorbike', 'motorcycle', 'three', 'wheel', 'van', 'suv', 'jeep', 'lorry', 'bus', 'pickup', 'heavy-duty', 'heavy', 'duty']:
                model_parts.append(part)
        data['Model'] = ' '.join(model_parts) if model_parts else None

    # Extract from boxtext divs
    for div in boxtext_divs:
        text = div.get_text(strip=True)
        if 'Rs.' in text or 'Negotiable' in text:
            data['Price'] = text
        elif '(km)' in text:
            # Extract number
            km_match = re.search(r'(\d+(?:,\d{3})*)', text)
            if km_match:
                data['Milleage'] = int(km_match.group().replace(',', ''))
        elif re.match(r'\d{4}-\d{2}-\d{2}', text):  # Date format
            data['published date'] = text
        elif not any(keyword in text.lower() for keyword in ['rs.', 'km', 'negotiable']) and len(text) > 2:
            # Likely district/location
            data['District'] = text

    return data

def scrape_page(driver, page_num):
    """Scrape a single page and return vehicle data"""
    vehicles = []
    try:
        url = f"https://riyasewana.com/search?page={page_num}"
        driver.get(url)

        # Wait for the content to load - wait for the ul with items
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "ul li.item"))
        )

        # Get page source and parse
        soup = BeautifulSoup(driver.page_source, 'html.parser')

        # Find all vehicle items
        items = soup.find_all('li', class_='item')

        for item in items:
            try:
                # Get title
                title_elem = item.find('h2', class_='more').find('a')
                if not title_elem:
                    continue
                title = title_elem.get('title', '')

                # Get boxtext divs
                boxtext = item.find('div', class_='boxtext')
                if not boxtext:
                    continue
                boxtext_divs = boxtext.find_all('div', class_='boxintxt')

                # Extract data
                vehicle_data = extract_vehicle_data(title, boxtext_divs)
                if vehicle_data['Make'] or vehicle_data['Model']:  # At least some data
                    vehicles.append(vehicle_data)

            except Exception as e:
                print(f"Error parsing item: {e}")
                continue

    except Exception as e:
        print(f"Error scraping page {page_num}: {e}")

    return vehicles

def scrape_with_selenium(queue, stop_event):
    """Scrape using optimized Selenium and put data in queue"""
    driver = setup_driver()
    all_data = []

    try:
        total_pages = 200  # All pages

        for page in range(1, total_pages + 1):
            if stop_event.is_set():
                break

            print(f"Scraping page {page}...")
            vehicles = scrape_page(driver, page)
            all_data.extend(vehicles)
            print(f"  Found {len(vehicles)} vehicles on page {page}")

            # Put new vehicles in queue for GUI update
            for vehicle in vehicles:
                queue.put(vehicle)

            # Longer delay between pages to avoid blocking
            time.sleep(0.1)

    finally:
        driver.quit()

    # Save to CSV at the end
    if all_data:
        df = pd.DataFrame(all_data)
        csv_filename = 'riyasewana_vehicles.csv'
        df.to_csv(csv_filename, index=False, encoding='utf-8')
        print(f"✅ Saved {len(df)} vehicles to {csv_filename}")

class VehicleTableApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Riyasewana Vehicle Scraper - Real-time Updates")
        self.root.geometry("1200x700")

        # Create treeview for table
        self.tree = ttk.Treeview(root, columns=('Type', 'Make', 'Model', 'Year', 'Price', 'Mileage', 'District', 'Date'), show='headings')

        # Define column headings
        self.tree.heading('Type', text='Vehicle Type')
        self.tree.heading('Make', text='Make')
        self.tree.heading('Model', text='Model')
        self.tree.heading('Year', text='Year')
        self.tree.heading('Price', text='Price')
        self.tree.heading('Mileage', text='Mileage')
        self.tree.heading('District', text='District')
        self.tree.heading('Date', text='Published Date')

        # Define column widths
        self.tree.column('Type', width=100)
        self.tree.column('Make', width=80)
        self.tree.column('Model', width=150)
        self.tree.column('Year', width=60)
        self.tree.column('Price', width=100)
        self.tree.column('Mileage', width=80)
        self.tree.column('District', width=100)
        self.tree.column('Date', width=100)

        # Add scrollbar
        scrollbar = ttk.Scrollbar(root, orient=tk.VERTICAL, command=self.tree.yview)
        self.tree.configure(yscroll=scrollbar.set)

        # Pack widgets
        self.tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

        # Status label
        self.status_label = tk.Label(root, text="Starting scraper...", font=("Arial", 10))
        self.status_label.pack(side=tk.BOTTOM, fill=tk.X)

        # Start button
        self.start_button = tk.Button(root, text="Start Scraping", command=self.start_scraping)
        self.start_button.pack(side=tk.BOTTOM)

        # Stop button
        self.stop_button = tk.Button(root, text="Stop Scraping", command=self.stop_scraping, state=tk.DISABLED)
        self.stop_button.pack(side=tk.BOTTOM)

        # Queue for data updates
        self.queue = queue.Queue()
        self.stop_event = threading.Event()

        # Start checking for updates
        self.check_queue()

    def start_scraping(self):
        self.start_button.config(state=tk.DISABLED)
        self.stop_button.config(state=tk.NORMAL)
        self.status_label.config(text="Scraping in progress...")

        # Start scraping thread
        self.scraping_thread = threading.Thread(target=scrape_with_selenium, args=(self.queue, self.stop_event))
        self.scraping_thread.start()

    def stop_scraping(self):
        self.stop_event.set()
        self.start_button.config(state=tk.NORMAL)
        self.stop_button.config(state=tk.DISABLED)
        self.status_label.config(text="Scraping stopped")

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
        values = (
            vehicle.get('Vehicle Type', ''),
            vehicle.get('Make', ''),
            vehicle.get('Model', ''),
            vehicle.get('Year', ''),
            vehicle.get('Price', ''),
            vehicle.get('Milleage', ''),
            vehicle.get('District', ''),
            vehicle.get('published date', '')
        )
        self.tree.insert('', tk.END, values=values)

        # Update status
        item_count = len(self.tree.get_children())
        self.status_label.config(text=f"Total vehicles scraped: {item_count}")

# Main execution
if __name__ == "__main__":
    root = tk.Tk()
    app = VehicleTableApp(root)
    root.mainloop()