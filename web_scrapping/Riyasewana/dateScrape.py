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

def scrape_page(driver, page_num):
    """Scrape a single page and return vehicle data"""
    vehicles = []
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

def scrape_with_selenium():
    """Scrape using optimized Selenium and display progress in terminal"""
    driver = setup_driver()
    total_vehicles_scraped = 0
    start_time = time.time()
    
    print("\n" + "="*70)
    print("🚗 RIYASEWANA VEHICLE SCRAPER - TERMINAL MODE")
    print("="*70 + "\n")
    
    try:
        # Try to scrape many pages - will stop when no more content
        page = 1
        max_pages = 67000  # Upper limit for safety
        
        while page <= max_pages:
            print(f"\n📄 Scraping page {page}...")
            
            vehicles = scrape_page(driver, page)
            
            if not vehicles:
                print(f"❌ No vehicles found on page {page}. Stopping.")
                break
            
            print(f"✅ Found {len(vehicles)} vehicles on page {page}")
            
            # Process each vehicle
            for idx, vehicle in enumerate(vehicles, 1):
                # Save to CSV immediately
                save_vehicle_to_csv(vehicle)
                total_vehicles_scraped += 1
                
                # Display vehicle info in terminal
                print(f"  [{idx}] {vehicle.get('Year', 'N/A')} {vehicle.get('Make', 'N/A')} {vehicle.get('Model', 'N/A')} - {vehicle.get('Price', 'N/A')}")
                
                # Display progress stats every 10 vehicles
                if total_vehicles_scraped % 10 == 0:
                    elapsed = time.time() - start_time
                    vehicles_per_second = total_vehicles_scraped / elapsed if elapsed > 0 else 0
                    print(f"\n📊 Progress: {total_vehicles_scraped} vehicles | Page: {page} | Speed: {vehicles_per_second:.2f} veh/sec")
            
            # Display page summary
            elapsed = time.time() - start_time
            vehicles_per_second = total_vehicles_scraped / elapsed if elapsed > 0 else 0
            print(f"\n📈 Total so far: {total_vehicles_scraped} vehicles | Time: {elapsed:.1f}s | Speed: {vehicles_per_second:.2f} veh/sec")
            
            # Random delay between pages to avoid rate limiting
            delay = 1 + (time.time() % 2)  # Random between 1-3 seconds
            time.sleep(delay)
            
            page += 1
                
    except KeyboardInterrupt:
        print(f"\n\n⚠️ Scraping interrupted by user!")
        
    except Exception as e:
        print(f"\n❌ Error in scraping: {e}")
        
    finally:
        driver.quit()
        
        # Final summary
        elapsed = time.time() - start_time
        print("\n" + "="*70)
        print("📋 SCRAPING SUMMARY")
        print("="*70)
        print(f"✅ Total vehicles scraped: {total_vehicles_scraped}")
        print(f"⏱️  Time elapsed: {elapsed:.2f} seconds")
        if elapsed > 0:
            vehicles_per_second = total_vehicles_scraped / elapsed
            print(f"⚡ Average speed: {vehicles_per_second:.2f} vehicles/second")
        print(f"💾 Data saved to: {CSV_FILENAME}")
        print("="*70 + "\n")

# Main execution
if __name__ == "__main__":
    try:
        # Setup CSV file
        setup_csv_file()
        
        # Start scraping
        scrape_with_selenium()
        
    except KeyboardInterrupt:
        print("\n\n⚠️ Program interrupted by user. Exiting...\n")
    except Exception as e:
        print(f"\n❌ Fatal error: {e}\n")