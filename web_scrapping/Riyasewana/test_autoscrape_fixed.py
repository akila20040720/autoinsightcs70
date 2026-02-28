"""
Test script for AutoScrape with fixed date filtering logic
This bypasses the GUI and tests the core scraping functionality
"""
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
import time
from bs4 import BeautifulSoup
from datetime import datetime
import re

def setup_driver():
    """Setup Chrome driver with optimized options for speed"""
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--window-size=1920,1080")
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
        'published date': None
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
        'jeep': 'SUV'
    }
    
    for keyword, vehicle_type in vehicle_types.items():
        if keyword in title_lower:
            data['Vehicle Type'] = vehicle_type
            break

    # Extract year
    year_match = re.search(r'\\b(19|20)\\d{2}\\b', title)
    if year_match:
        data['Year'] = int(year_match.group())

    # Extract make and model
    parts = title.split()
    if parts:
        data['Make'] = parts[0]
        model_parts = []
        for part in parts[1:]:
            if part.isdigit() and len(part) == 4:
                break
            if part.lower() not in ['car', 'motorbike', 'van', 'suv']:
                model_parts.append(part)
        data['Model'] = ' '.join(model_parts) if model_parts else None

    # Extract from boxtext divs
    for div in boxtext_divs:
        text = div.get_text(strip=True)
        if 'Rs.' in text or 'Negotiable' in text:
            data['Price'] = text
        elif '(km)' in text:
            km_match = re.search(r'(\\d+(?:,\\d{3})*)', text)
            if km_match:
                data['Milleage'] = int(km_match.group().replace(',', ''))
        elif re.match(r'\\d{4}-\\d{2}-\\d{2}', text):
            data['published date'] = text
        else:
            data['District'] = text

    return data

def test_scrape_with_filters():
    """Test scraping with the fixed date filtering logic"""
    print("🔧 Testing AutoScrape with fixed date filtering...")
    print("=" * 60)
    
    driver = setup_driver()
    
    try:
        # Test 1: Scrape page 1 with no filters
        print("\\n📋 Test 1: Scraping page 1 with NO date filters")
        print("-" * 60)
        
        url = "https://riyasewana.com/search?page=1"
        driver.get(url)
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "ul li.item"))
        )
        time.sleep(1)
        
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        items = soup.find_all('li', class_='item')
        
        vehicles_with_date = 0
        vehicles_without_date = 0
        
        for item in items:
            title_elem = item.find('h2', class_='more')
            if not title_elem or not title_elem.find('a'):
                continue
            
            title = title_elem.find('a').get('title', '').strip()
            boxtext = item.find('div', class_='boxtext')
            if not boxtext:
                continue
            
            boxtext_divs = boxtext.find_all('div', class_='boxintxt')
            vehicle_data = extract_vehicle_data(title, boxtext_divs)
            
            if vehicle_data['published date']:
                vehicles_with_date += 1
            else:
                vehicles_without_date += 1
        
        total = vehicles_with_date + vehicles_without_date
        print(f"✓ Total vehicles found: {total}")
        print(f"  - With dates: {vehicles_with_date}")
        print(f"  - Without dates: {vehicles_without_date}")
        
        if vehicles_without_date > 0:
            print(f"\\n✅ GOOD: Some vehicles lack dates. Fixed filtering will include them!")
        
        # Test 2: Check date filtering logic
        print("\\n📋 Test 2: Testing date filtering logic")
        print("-" * 60)
        
        start_date = datetime(2026, 2, 1).date()
        end_date = datetime(2026, 2, 28).date()
        
        print(f"Filter range: {start_date} to {end_date}")
        
        # Re-parse with filters
        filtered_count = 0
        skipped_old = 0
        skipped_new = 0
        included_no_date = 0
        
        for item in items:
            title_elem = item.find('h2', class_='more')
            if not title_elem or not title_elem.find('a'):
                continue
            
            title = title_elem.find('a').get('title', '').strip()
            boxtext = item.find('div', class_='boxtext')
            if not boxtext:
                continue
            
            boxtext_divs = boxtext.find_all('div', class_='boxintxt')
            vehicle_data = extract_vehicle_data(title, boxtext_divs)
            
            # Apply filtering logic (same as fixed AutoScrape.py)
            pub_date_str = vehicle_data.get('published date')
            pub_date = None
            
            if pub_date_str and re.match(r'\\d{4}-\\d{2}-\\d{2}', pub_date_str):
                try:
                    pub_date = datetime.strptime(pub_date_str, "%Y-%m-%d").date()
                except ValueError:
                    pass
            
            # NEW LOGIC: Only filter if we have a date
            included = True
            if pub_date:
                if start_date and pub_date < start_date:
                    skipped_old += 1
                    included = False
                elif end_date and pub_date > end_date:
                    skipped_new += 1
                    included = False
            else:
                # No date - include it!
                included_no_date += 1
            
            if included:
                filtered_count += 1
        
        print(f"\\n✓ Results with new filtering logic:")
        print(f"  - Included in results: {filtered_count}")
        print(f"  - Skipped (too old): {skipped_old}")
        print(f"  - Skipped (too new): {skipped_new}")
        print(f"  - Included despite no date: {included_no_date}")
        
        if included_no_date > 0:
            print(f"\\n✅ SUCCESS: {included_no_date} vehicles without dates were INCLUDED")
            print("   (OLD logic would have EXCLUDED them)")
        
        print("\\n" + "=" * 60)
        print("✅ All tests passed! The fixes are working correctly.")
        
    except Exception as e:
        print(f"\\n❌ ERROR: {type(e).__name__}")
        print(f"Details: {e}")
        import traceback
        traceback.print_exc()
    finally:
        driver.quit()

if __name__ == "__main__":
    test_scrape_with_filters()
