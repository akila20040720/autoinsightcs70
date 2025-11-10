# app.py
import streamlit as st
import pandas as pd
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
import time
import json
import requests

class UniversalCarScraper:
    def __init__(self):
        self.driver = None
        self.setup_driver()
    
    def setup_driver(self):
        """Setup Chrome driver"""
        chrome_options = Options()
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        
        self.driver = webdriver.Chrome(options=chrome_options)
        self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    
    def scrape_riyasewana(self, make, model):
        """Scrape Riyasewana for specific make and model"""
        url = f"https://riyasewana.com/search/cars/{make}/{model}"
        self.driver.get(url)
        
        # Wait for page load
        time.sleep(5)
        
        # Handle Cloudflare if needed
        if "cloudflare" in self.driver.page_source.lower():
            st.warning("Cloudflare detected. Please solve the challenge in the browser window and click Continue below.")
            st.button("Continue")
        
        soup = BeautifulSoup(self.driver.page_source, 'html.parser')
        
        # Extract listings (adapt selectors based on site structure)
        listings = []
        listing_elements = soup.find_all(['div', 'tr'], class_=lambda x: x and any(word in str(x).lower() for word in ['item', 'listing', 'result']))
        
        for item in listing_elements:
            try:
                listing_data = {
                    'title': self.extract_text(item, ['h2', 'h3', '.title', '.heading']),
                    'price': self.extract_text(item, ['.price', '.amount', '[class*="price"]']),
                    'year': self.extract_text(item, ['.year', '[class*="year"]']),
                    'mileage': self.extract_text(item, ['.boxintxt', '.mileage', '[class*="km"]']),
                    'location': self.extract_text(item, ['.location', '.city']),
                    'link': self.extract_link(item)
                }
                listings.append(listing_data)
            except Exception as e:
                continue
        
        return listings
    
    def extract_text(self, element, selectors):
        """Extract text using multiple possible selectors"""
        for selector in selectors:
            found = element.select_one(selector)
            if found:
                return found.get_text(strip=True)
        return ""
    
    def extract_link(self, element):
        """Extract link if available"""
        link = element.select_one('a')
        if link and link.get('href'):
            return f"https://riyasewana.com{link['href']}"
        return ""
    
    def close(self):
        """Close the driver"""
        if self.driver:
            self.driver.quit()

# Streamlit UI
st.set_page_config(page_title="Universal Car Scraper", page_icon="🚗", layout="wide")

st.title("🚗 Universal Car Scraper")
st.markdown("Search for cars across multiple platforms")

# Sidebar for inputs
with st.sidebar:
    st.header("Search Parameters")
    make = st.text_input("Car Make (e.g., toyota, honda)", "toyota")
    model = st.text_input("Car Model (e.g., premio, aqua)", "premio")
    site = st.selectbox("Select Website", ["riyasewana.com", "ikman.lk", "autolanka.com"])
    
    if st.button("🚀 Start Scraping", type="primary"):
        st.session_state.search_triggered = True

# Main content area
if st.session_state.get('search_triggered', False):
    scraper = None
    try:
        with st.spinner("🔄 Starting scraper... This may take a minute."):
            scraper = UniversalCarScraper()
            
            if site == "riyasewana.com":
                results = scraper.scrape_riyasewana(make, model)
            
            if results:
                st.success(f"✅ Found {len(results)} listings!")
                
                # Display results
                df = pd.DataFrame(results)
                st.dataframe(df, use_container_width=True)
                
                # Download options
                csv = df.to_csv(index=False)
                st.download_button(
                    label="📥 Download CSV",
                    data=csv,
                    file_name=f"car_listings_{make}_{model}.csv",
                    mime="text/csv"
                )
            else:
                st.warning("No listings found. Try different search terms.")
                
    except Exception as e:
        st.error(f"Error: {e}")
    finally:
        if scraper:
            scraper.close()
else:
    # Welcome message
    st.markdown("""
    ### How to use:
    1. Enter car make and model
    2. Select website to scrape
    3. Click 'Start Scraping'
    4. Solve any CAPTCHA in the browser window if needed
    
    ### Supported Sites:
    - 🇱🇰 riyasewana.com
    - 🇱🇰 ikman.lk (add support)
    - 🇱🇰 autolanka.com (add support)
    
    ### Features:
    - 🛡️ Bypass anti-bot protection
    - 📊 Export to CSV
    - 🔍 Universal search
    - ⚡ Real-time results
    """)

# Installation requirements file
# requirements.txt
"""
streamlit==1.28.0
selenium==4.15.0
beautifulsoup4==4.12.2
pandas==2.1.0
requests==2.31.0
webdriver-manager==4.0.0
"""