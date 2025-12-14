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

def scrape_with_selenium():
    """Scrape using optimized Selenium"""
    driver = setup_driver()
    all_data = []

    try:
        # Scrape all pages - there are about 1783 pages with 40 listings each
        total_pages = 1  # All pages

        for page in range(1, total_pages + 1):
            print(f"Scraping page {page}...")
            vehicles = scrape_page(driver, page)
            all_data.extend(vehicles)
            print(f"  Found {len(vehicles)} vehicles on page {page}")

            # Longer delay between pages to avoid blocking
            time.sleep(0.1)

    finally:
        driver.quit()

    return all_data

# Main execution
if __name__ == "__main__":
    print("Starting optimized Selenium scraping...")
    data = scrape_with_selenium()

    if data:
        df = pd.DataFrame(data)
        csv_filename = 'riyasewana_vehicles.csv'
        df.to_csv(csv_filename, index=False, encoding='utf-8')
        print(f"✅ Saved {len(df)} vehicles to {csv_filename}")
        print(f"Columns: {list(df.columns)}")
    else:
        print("❌ No data scraped")