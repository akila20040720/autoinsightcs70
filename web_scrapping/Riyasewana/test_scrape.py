from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
import time
from bs4 import BeautifulSoup

def test_basic_scrape():
    """Test basic scraping functionality"""
    print("🔍 Testing Riyasewana scraping...")
    
    try:
        # Setup Chrome with minimal options
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        
        print("✓ Setting up Chrome driver...")
        driver = webdriver.Chrome(options=chrome_options)
        driver.set_page_load_timeout(30)
        
        print("✓ Loading page...")
        url = "https://riyasewana.com/search?page=1"
        driver.get(url)
        
        print("✓ Waiting for content...")
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "ul li.item"))
        )
        time.sleep(2)
        
        print("✓ Parsing HTML...")
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        
        # Find items
        items = soup.find_all('li', class_='item')
        print(f"✓ Found {len(items)} vehicle items on page 1")
        
        if items:
            print("\n📋 Sample vehicle data:")
            for i, item in enumerate(items[:3], 1):  # Show first 3
                title_elem = item.find('h2', class_='more')
                if title_elem and title_elem.find('a'):
                    title = title_elem.find('a').get('title', '').strip()
                    url = title_elem.find('a').get('href', '')
                    print(f"  {i}. {title[:50]}... ({url[:40]}...)")
                    
                    # Check for boxtext
                    boxtext = item.find('div', class_='boxtext')
                    if boxtext:
                        boxtext_divs = boxtext.find_all('div', class_='boxintxt')
                        print(f"     Found {len(boxtext_divs)} boxtext divs")
                        for div in boxtext_divs:
                            text = div.get_text(strip=True)
                            print(f"       - {text}")
            
            print("\n✅ SCRAPING IS WORKING!")
            print("No issues detected with the website structure.")
        else:
            print("\n❌ ERROR: No items found!")
            print("The website structure may have changed.")
            
            # Debug: save page source
            with open('debug_page.html', 'w', encoding='utf-8') as f:
                f.write(driver.page_source)
            print("📄 Saved page source to debug_page.html for inspection")
        
        driver.quit()
        return len(items) > 0
        
    except TimeoutException as e:
        print(f"\n❌ TIMEOUT ERROR: Page took too long to load")
        print(f"Details: {e}")
        return False
    except Exception as e:
        print(f"\n❌ ERROR: {type(e).__name__}")
        print(f"Details: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_basic_scrape()
    if not success:
        print("\n⚠️  Scraping failed. Check the error messages above.")
    else:
        print("\n✅ Test completed successfully!")
