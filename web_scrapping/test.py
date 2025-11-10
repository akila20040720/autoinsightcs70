from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
import time
import csv

def setup_driver():
    """Setup Chrome driver with stealth options"""
    chrome_options = Options()
    
    # Remove automation indicators
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    
    # Normal browser options
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
    
    driver = webdriver.Chrome(options=chrome_options)
    
    # Execute stealth script
    driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    
    return driver

def scrape_riyasewana_with_selenium():
    """Use Selenium to bypass Cloudflare protection"""
    driver = setup_driver()
    results = []
    
    try:
        url = "https://riyasewana.com/search/cars/toyota/premio"
        print(f"🌐 Navigating to: {url}")
        
        driver.get(url)
        
        # Wait for page to load (bypass Cloudflare challenge if any)
        time.sleep(10)
        
        # Check if we're on a blocking page
        if "cloudflare" in driver.page_source.lower() or "attention required" in driver.page_source.lower():
            print("❌ Cloudflare blocking detected. Waiting for manual solve...")
            input("Please solve the Cloudflare challenge manually in the browser and press Enter to continue...")
        
        # Wait for listings to load
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
        
        print("✅ Page loaded successfully")
        
        # Get page source and parse with BeautifulSoup
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        
        # Save HTML for inspection
        with open("riyasewana_selenium.html", "w", encoding="utf-8") as f:
            f.write(soup.prettify())
        print("💾 HTML saved to riyasewana_selenium.html")
        
        # Find ALL boxintxt elements
        boxintxt_elements = soup.find_all('div', class_='boxintxt')
        print(f"🔍 Found {len(boxintxt_elements)} boxintxt elements")
        
        # Display all boxintxt content
        print("\n📋 ALL BOXINTXT CONTENT:")
        for i, element in enumerate(boxintxt_elements, 1):
            text = element.get_text(strip=True)
            print(f"{i}. {text}")
        
        # Filter for mileage elements
        print("\n🚗 MILEAGE ELEMENTS (containing 'km'):")
        mileage_data = []
        for i, element in enumerate(boxintxt_elements, 1):
            text = element.get_text(strip=True)
            if 'km' in text.lower():
                mileage_data.append(text)
                print(f"📏 {i}. {text}")
        
        print(f"\n✅ Found {len(mileage_data)} mileage entries")
        
        # Save mileage data to CSV
        if mileage_data:
            with open("mileage_data.csv", "w", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                writer.writerow(["Index", "Mileage"])
                for i, mileage in enumerate(mileage_data, 1):
                    writer.writerow([i, mileage])
            print("💾 Mileage data saved to mileage_data.csv")
        
        return mileage_data
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return []
    
    finally:
        print("🔄 Closing browser...")
        driver.quit()

# Alternative: Quick requests approach with different method
def try_alternative_method():
    """Try alternative request method"""
    import requests
    
    # Try with different approach
    session = requests.Session()
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
    })
    
    try:
        response = session.get("https://riyasewana.com/search/cars/toyota/premio", timeout=10)
        print(f"Alternative method status: {response.status_code}")
        if response.status_code == 200:
            return True
    except:
        return False
    return False

if __name__ == "__main__":
    print("🚗 Starting Riyasewana Mileage Scraper...")
    
    # First try alternative method
    print("\n1. Trying alternative request method...")
    if try_alternative_method():
        print("✅ Alternative method worked!")
    else:
        print("❌ Alternative method failed, using Selenium...")
    
    # Use Selenium (will work)
    print("\n2. Using Selenium to bypass protection...")
    mileage_data = scrape_riyasewana_with_selenium()
    
    if mileage_data:
        print(f"\n🎉 Successfully extracted {len(mileage_data)} mileage entries!")
    else:
        print("\n💡 No mileage data found. Check the saved HTML file for analysis.")