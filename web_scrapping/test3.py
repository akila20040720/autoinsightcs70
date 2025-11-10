# app.py
import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
import time
import threading
from datetime import datetime
import sys
import os

# Configure Streamlit to keep browser open
st.set_page_config(
    page_title="🚗 Car Analytics Dashboard",
    page_icon="🚗",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Global variable to control browser
browser_open = True

class CarScraper:
    def __init__(self):
        self.driver = None
        self.keep_alive = True
    
    def setup_driver(self):
        """Setup Chrome driver that stays open"""
        chrome_options = Options()
        chrome_options.add_experimental_option("detach", True)  # Keep browser open
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--window-size=1400,900")
        chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        
        self.driver = webdriver.Chrome(options=chrome_options)
        self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        return self.driver
    
    def scrape_riyasewana(self, make, model, max_listings=20):
        """Scrape car listings with enhanced data extraction"""
        if not self.driver:
            self.setup_driver()
            
        url = f"https://riyasewana.com/search/cars/{make}/{model}"
        
        try:
            self.driver.get(url)
            time.sleep(5)
            
            # Handle potential Cloudflare
            if "cloudflare" in self.driver.page_source.lower():
                st.warning("🛡️ Cloudflare detected. Please complete the verification in the browser window.")
                st.info("The browser will stay open. Complete the CAPTCHA and click 'Resume Scraping' below.")
                
                if st.button("🔄 Resume Scraping", key="resume_btn"):
                    st.rerun()
                return []
            
            soup = BeautifulSoup(self.driver.page_source, 'html.parser')
            
            # Enhanced listing detection
            listings = []
            possible_selectors = [
                'tr[width="100%"]',
                '.item', 
                '.listing',
                'div[style*="border"]',
                'table[width="100%"] tr'
            ]
            
            for selector in possible_selectors:
                elements = soup.select(selector)
                if len(elements) > 2:  # Likely actual listings
                    listings = elements[:max_listings]
                    break
            
            results = []
            for i, listing in enumerate(listings):
                try:
                    car_data = self.extract_car_data(listing, i+1)
                    if car_data:
                        results.append(car_data)
                except Exception as e:
                    continue
            
            return results
            
        except Exception as e:
            st.error(f"Scraping error: {e}")
            return []
    
    def extract_car_data(self, listing, index):
        """Extract structured car data from listing"""
        text_content = listing.get_text(" ", strip=True)
        
        # Enhanced data extraction
        data = {
            'id': index,
            'title': self.extract_title(listing),
            'price': self.extract_price(text_content),
            'price_numeric': self.extract_numeric_price(text_content),
            'year': self.extract_year(text_content),
            'mileage': self.extract_mileage(text_content),
            'location': self.extract_location(text_content),
            'transmission': self.extract_transmission(text_content),
            'fuel_type': self.extract_fuel_type(text_content),
            'scraped_at': datetime.now().strftime("%Y-%m-%d %H:%M")
        }
        
        # Only return if we have at least some data
        if data['price'] or data['year'] or data['mileage']:
            return data
        return None
    
    def extract_title(self, listing):
        """Extract car title"""
        title_selectors = ['h2', 'h3', 'b', 'strong', '.heading', '.title']
        for selector in title_selectors:
            element = listing.select_one(selector)
            if element:
                return element.get_text(strip=True)
        return "Unknown Car"
    
    def extract_price(self, text):
        """Extract price text"""
        import re
        price_patterns = [r'Rs\.?\s*([\d,]+)', r'LKR\s*([\d,]+)', r'([\d,]+)\s*(?:LKR|Rs)']
        for pattern in price_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return f"Rs. {match.group(1)}"
        return "Price not listed"
    
    def extract_numeric_price(self, text):
        """Extract numeric price for calculations"""
        import re
        match = re.search(r'([\d,]+)', self.extract_price(text))
        if match:
            return int(match.group(1).replace(',', ''))
        return 0
    
    def extract_year(self, text):
        """Extract manufacturing year"""
        import re
        match = re.search(r'\b(19|20)\d{2}\b', text)
        return match.group(0) if match else "Unknown"
    
    def extract_mileage(self, text):
        """Extract mileage"""
        import re
        match = re.search(r'(\d[\d,]*)\s*km', text, re.IGNORECASE)
        return f"{match.group(1)} km" if match else "Mileage not listed"
    
    def extract_location(self, text):
        """Extract location"""
        locations = ['Colombo', 'Kandy', 'Gampaha', 'Kurunegala', 'Galle', 'Matara']
        for location in locations:
            if location.lower() in text.lower():
                return location
        return "Location not specified"
    
    def extract_transmission(self, text):
        """Extract transmission type"""
        if 'auto' in text.lower():
            return 'Automatic'
        elif 'manual' in text.lower():
            return 'Manual'
        return 'Unknown'
    
    def extract_fuel_type(self, text):
        """Extract fuel type"""
        fuel_types = ['petrol', 'diesel', 'hybrid', 'electric']
        for fuel in fuel_types:
            if fuel in text.lower():
                return fuel.title()
        return 'Unknown'
    
    def close_driver(self):
        """Close the browser driver"""
        if self.driver:
            self.driver.quit()
            self.driver = None

# Initialize session state
if 'scraper' not in st.session_state:
    st.session_state.scraper = CarScraper()
if 'results' not in st.session_state:
    st.session_state.results = []
if 'search_made' not in st.session_state:
    st.session_state.search_made = False

def create_visualizations(df):
    """Create interactive visualizations"""
    if df.empty:
        return
    
    # Create tabs for different visualizations
    tab1, tab2, tab3, tab4 = st.tabs(["📊 Price Analysis", "🚗 Car Details", "📈 Trends", "🗺️ Location Map"])
    
    with tab1:
        col1, col2 = st.columns(2)
        
        with col1:
            # Price distribution
            if df['price_numeric'].sum() > 0:
                fig_price = px.histogram(df, x='price_numeric', 
                                       title='Price Distribution',
                                       labels={'price_numeric': 'Price (LKR)'})
                st.plotly_chart(fig_price, use_container_width=True)
        
        with col2:
            # Year vs Price scatter
            if 'year' in df.columns and df['year'].notna().any():
                df_clean = df[df['year'] != 'Unknown']
                if not df_clean.empty:
                    fig_scatter = px.scatter(df_clean, x='year', y='price_numeric',
                                           hover_data=['title'],
                                           title='Year vs Price')
                    st.plotly_chart(fig_scatter, use_container_width=True)
    
    with tab2:
        col1, col2 = st.columns(2)
        
        with col1:
            # Transmission distribution
            fig_trans = px.pie(df, names='transmission', 
                             title='Transmission Types')
            st.plotly_chart(fig_trans, use_container_width=True)
        
        with col2:
            # Fuel type distribution
            fig_fuel = px.pie(df, names='fuel_type',
                            title='Fuel Types')
            st.plotly_chart(fig_fuel, use_container_width=True)
    
    with tab3:
        # Price trends by year
        if 'year' in df.columns:
            yearly_avg = df.groupby('year')['price_numeric'].mean().reset_index()
            fig_trend = px.line(yearly_avg, x='year', y='price_numeric',
                              title='Average Price by Year')
            st.plotly_chart(fig_trend, use_container_width=True)
    
    with tab4:
        # Location distribution
        if df['location'].nunique() > 1:
            location_counts = df['location'].value_counts()
            fig_map = px.pie(values=location_counts.values, 
                           names=location_counts.index,
                           title='Listings by Location')
            st.plotly_chart(fig_map, use_container_width=True)

# Main App
st.title("🚗 Car Market Analytics Dashboard")
st.markdown("Real-time car market analysis with interactive visualizations")

# Sidebar for controls
with st.sidebar:
    st.header("🔍 Search Parameters")
    
    make = st.text_input("Car Make", "toyota", help="e.g., toyota, honda, nissan")
    model = st.text_input("Car Model", "premio", help="e.g., premio, aqua, civic")
    max_results = st.slider("Max Listings", 5, 50, 20)
    
    col1, col2 = st.columns(2)
    with col1:
        if st.button("🚀 Start Scraping", type="primary", use_container_width=True):
            with st.spinner("Scraping car listings..."):
                results = st.session_state.scraper.scrape_riyasewana(make, model, max_results)
                st.session_state.results = results
                st.session_state.search_made = True
                st.rerun()
    
    with col2:
        if st.button("🛑 Close Browser", type="secondary", use_container_width=True):
            st.session_state.scraper.close_driver()
            st.success("Browser closed successfully")
            st.rerun()
    
    st.markdown("---")
    st.header("ℹ️ Instructions")
    st.info("""
    1. Enter car make and model
    2. Click 'Start Scraping'
    3. If Cloudflare appears, complete verification in browser
    4. View interactive charts and analytics
    5. Browser stays open for multiple searches
    """)

# Main content area
if st.session_state.search_made:
    if st.session_state.results:
        df = pd.DataFrame(st.session_state.results)
        
        # Display summary metrics
        st.header("📈 Market Overview")
        
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            avg_price = df['price_numeric'].mean() if df['price_numeric'].sum() > 0 else 0
            st.metric("Average Price", f"Rs. {avg_price:,.0f}" if avg_price > 0 else "N/A")
        
        with col2:
            total_listings = len(df)
            st.metric("Total Listings", total_listings)
        
        with col3:
            latest_year = df[df['year'] != 'Unknown']['year'].max() if not df.empty else "N/A"
            st.metric("Latest Year", latest_year)
        
        with col4:
            common_location = df['location'].mode()[0] if not df['location'].mode().empty else "N/A"
            st.metric("Most Common Location", common_location)
        
        # Show visualizations
        st.header("📊 Interactive Analytics")
        create_visualizations(df)
        
        # Show raw data
        st.header("📋 Raw Data")
        st.dataframe(df.drop('id', axis=1), use_container_width=True)
        
        # Download option
        csv = df.to_csv(index=False)
        st.download_button(
            label="📥 Download CSV",
            data=csv,
            file_name=f"car_analytics_{make}_{model}_{datetime.now().strftime('%Y%m%d')}.csv",
            mime="text/csv"
        )
        
    else:
        st.warning("No listings found. Try different search terms or check the browser window for CAPTCHA.")
else:
    # Welcome screen with sample visualizations
    st.header("Welcome to Car Analytics Dashboard")
    
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.markdown("""
        ### 📊 What you'll get:
        
        - **Price Distribution** - See the range of prices
        - **Year vs Price Analysis** - Understand depreciation
        - **Market Trends** - Identify pricing patterns
        - **Location Insights** - See where cars are listed
        - **Transmission & Fuel Analysis** - Market preferences
        
        ### 🎯 How to use:
        1. Enter car make and model in sidebar
        2. Click 'Start Scraping'
        3. Complete any browser verification if needed
        4. Explore interactive charts
        5. Download data as CSV
        """)
    
    with col2:
        st.image("https://via.placeholder.com/300x200/4C78A8/FFFFFF?text=Car+Analytics", 
                caption="Interactive Dashboard Preview")

# Footer
st.markdown("---")
st.markdown("*Browser stays open for multiple searches. Close manually when done.*")

# Prevent automatic closure
def keep_alive():
    """Keep the streamlit app alive"""
    while True:
        time.sleep(1)

if __name__ == "__main__":
    # Run in a way that keeps the browser open
    st.rerun()