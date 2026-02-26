# riyasewana_scraper.py – adapted from successful open-source scrapers
import requests
from bs4 import BeautifulSoup
import time
import random
from fake_useragent import UserAgent

# Proxy pool – start with datacenter, upgrade to residential if blocked
PROXIES = [
    {'http': 'http://proxy1:port', 'https': 'http://proxy1:port'},
    {'http': 'http://proxy2:port', 'https': 'http://proxy2:port'},
    # Add 10-20 proxies
]

ua = UserAgent()

def scrape_listing(url):
    # Random proxy + random user-agent per request
    proxy = random.choice(PROXIES)
    headers = {
        'User-Agent': ua.random,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Referer': random.choice(['https://www.google.com/', 'https://www.yahoo.com/']),
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
    }
    
    # CRITICAL: Random delay 5-15 seconds
    time.sleep(random.uniform(5, 15))
    
    try:
        response = requests.get(
            url, 
            headers=headers, 
            proxies=proxy,
            timeout=30,
            allow_redirects=True
        )
        
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # EXTRACTION LOGIC – based on riya-crawler [citation:3]
            contact = soup.select_one('a[href^="tel:"]')
            contact = contact['href'].replace('tel:', '') if contact else None
            
            price = soup.select_one('.ad-price .amount, .ad-price')
            price = price.text.strip() if price else None
            
            # Specifications table
            specs = {}
            for dt in soup.select('.ad-details dt, .specs dt'):
                label = dt.text.strip().lower()
                dd = dt.find_next_sibling('dd')
                if dd:
                    specs[label] = dd.text.strip()
            
            return {
                'contact': contact,
                'price': price,
                'make': specs.get('make', 'Toyota'),
                'model': specs.get('model', 'C-HR NGX'),
                'yom': specs.get('yom') or specs.get('year'),
                'mileage': specs.get('mileage') or specs.get('km'),
                'gear': specs.get('gear') or specs.get('transmission'),
                'fuel': specs.get('fuel type'),
                'engine': specs.get('engine'),
                'options': ', '.join([li.text for li in soup.select('.ad-features li, .features li')]),
                'details': soup.select_one('.ad-description, .description').text.strip() if soup.select_one('.ad-description, .description') else None
            }
    except Exception as e:
        print(f"Error: {e}")
        return None

# Usage
result = scrape_listing('https://riyasewana.com/buy/toyota-chr-ngx-sale-kandy-11198404')
print(result)