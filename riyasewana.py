import time
import requests
from bs4 import BeautifulSoup

# Minimal config
BASE_URL = "https://riyasewana.com"
SEARCH_PATH = "/search/cars/toyota/premio"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"

def simple_scraper():
    """Minimal scraper to extract boxintxt content"""
    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT})
    
    url = BASE_URL + SEARCH_PATH
    print(f"Fetching: {url}")
    
    try:
        response = session.get(url, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Find all elements with class "boxintxt"
            boxintxt_elements = soup.find_all('div', class_='boxintxt')
            
            print(f"Found {len(boxintxt_elements)} boxintxt elements:")
            
            for i, element in enumerate(boxintxt_elements, 1):
                text = element.get_text(strip=True)
                print(f"{i}. {text}")
                
            # Save HTML for debugging
            with open("debug_simple.html", "w", encoding="utf-8") as f:
                f.write(response.text)
            print("HTML saved to debug_simple.html")
            
        else:
            print(f"Failed to fetch page. Status: {response.status_code}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    simple_scraper()