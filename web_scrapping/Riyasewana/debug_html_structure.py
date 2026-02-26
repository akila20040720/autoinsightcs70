"""
Debug script to save actual HTML structure from Riyasewana
"""
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
from bs4 import BeautifulSoup
from datetime import datetime

def save_page_html():
    """Save the actual HTML structure from Riyasewana for inspection"""
    print("📥 Fetching current page HTML structure...")
    
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
    
    driver = webdriver.Chrome(options=chrome_options)
    driver.set_page_load_timeout(30)
    
    try:
        url = "https://riyasewana.com/search?page=1"
        print(f"Loading: {url}")
        driver.get(url)
        
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "ul li.item"))
        )
        time.sleep(2)
        
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        
        # Find first vehicle item
        items = soup.find_all('li', class_='item')
        print(f"Found {len(items)} vehicle items")
        
        if items:
            first_item = items[0]
            
            # Save first item HTML nicely formatted
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f'debug_vehicle_item_{timestamp}.html'
            
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(first_item.prettify())
            
            print(f"✓ Saved first vehicle item to: {filename}")
            
            # Also print structure analysis
            print("\\n📋 Structure Analysis:")
            print("-" * 60)
            
            # Check title
            title_elem = first_item.find('h2', class_='more')
            if title_elem:
                print("✓ Found title element (h2.more)")
                title_link = title_elem.find('a')
                if title_link:
                    title = title_link.get('title', '')
                    print(f"  Title: {title[:50]}...")
            
            # Check boxtext
            boxtext = first_item.find('div', class_='boxtext')
            if boxtext:
                print("✓ Found boxtext element")
                boxtext_divs = boxtext.find_all('div', class_='boxintxt')
                print(f"  Found {len(boxtext_divs)} boxintxt divs:")
                for i, div in enumerate(boxtext_divs, 1):
                    text = div.get_text(strip=True)
                    print(f"    {i}. {text}")
            
            # Check all text content
            print("\\n📝 All text content in item:")
            print("-" * 60)
            all_text = first_item.get_text(" | ", strip=True)
            print(all_text[:500])
            
        # Save full page HTML too
        full_filename = f'debug_full_page_{timestamp}.html'
        with open(full_filename, 'w', encoding='utf-8') as f:
            f.write(soup.prettify())
        print(f"\\n✓ Saved full page HTML to: {full_filename}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        driver.quit()

if __name__ == "__main__":
    save_page_html()
