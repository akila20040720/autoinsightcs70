from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
import pandas as pd
import time
import json

def setup_driver():
    """Setup Chrome driver with options"""
    chrome_options = Options()
    chrome_options.add_argument("--headless")  # Run in background
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
    
    # Disable images for faster loading
    prefs = {"profile.managed_default_content_settings.images": 2}
    chrome_options.add_experimental_option("prefs", prefs)
    
    driver = webdriver.Chrome(options=chrome_options)
    return driver

def scrape_with_selenium():
    """Scrape using Selenium to handle JavaScript"""
    driver = setup_driver()
    all_data = []
    
    try:
        for page in range(1, 3):  # 50 pages
            print(f"Scraping page {page}...")
            
            url = f"https://riyasewana.com/search/cars?page={page}"
            driver.get(url)
            
            # Wait for page to load
            time.sleep(2)  # Reduced wait time
            
            # Try to extract data from the page
            # Method 1: Look for script tags with data
            page_source = driver.page_source
            
            # Save first page for debugging
            if page == 1:
                with open('selenium_page1.html', 'w', encoding='utf-8') as f:
                    f.write(page_source)
            
            # Parse with BeautifulSoup
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(page_source, 'html.parser')
            
            # Look for interactive elements that might reveal data when clicked
            # This would require actual clicking, but let's first see what's available
            
            # Alternative: Try to execute JavaScript to get data
            try:
                # Execute JavaScript to get all text content
                js_script = """
                var vehicles = [];
                // Look for elements that might contain vehicle data
                var elements = document.querySelectorAll('div, li, article');
                elements.forEach(function(el) {
                    var text = el.innerText || el.textContent;
                    if (text && text.length > 50 && (text.includes('Rs') || text.includes('Vehicle'))) {
                        vehicles.push({
                            text: text.substring(0, 200),
                            html: el.outerHTML.substring(0, 500)
                        });
                    }
                });
                return vehicles;
                """
                
                vehicles = driver.execute_script(js_script)
                
                for vehicle in vehicles[:20]:  # Process first 20
                    text = vehicle['text']
                    
                    # Extract data using regex
                    import re
                    
                    price_match = re.search(r'Rs\.?\s*([\d,]+)', text, re.IGNORECASE)
                    year_match = re.search(r'\b(19[0-9]{2}|20[0-2][0-9])\b', text)
                    
                    if price_match or year_match:
                        all_data.append({
                            'Text': text[:150],
                            'Price': price_match.group() if price_match else None,
                            'Year': year_match.group() if year_match else None,
                            'Page': page
                        })
                        
            except Exception as e:
                print(f"JavaScript execution failed: {e}")
            
            print(f"  Found {len(all_data)} items so far")
            
            # Add small delay between pages
            time.sleep(1)
        
        return all_data
    
    finally:
        driver.quit()

# Quick test with Selenium
print("Testing Selenium approach...")
data = scrape_with_selenium()

if data:
    df = pd.DataFrame(data)
    df.to_csv('riyasewana_selenium.csv', index=False, encoding='utf-8')
    print(f"Saved {len(df)} items with Selenium")
else:
    print("Selenium approach failed")
    
    
    # Show results in terminal
if data:
    print("\n========== SCRAPED DATA ==========\n")
    for i, item in enumerate(data, start=1):
        print(f"{i}. Page: {item['Page']}")
        print(f"   Text : {item['Text']}")
        print(f"   Price: {item['Price']}")
        print(f"   Year : {item['Year']}")
        print("-" * 50)

    df = pd.DataFrame(data)
    df.to_csv('riyasewana_selenium.csv', index=False, encoding='utf-8')
    print(f"\n✅ Saved {len(df)} items with Selenium")
else:
    print("❌ Selenium approach failed")