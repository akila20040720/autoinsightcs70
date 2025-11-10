# app.py
import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from bs4 import BeautifulSoup
import time
from datetime import datetime
import re

# Configure Streamlit
st.set_page_config(
    page_title="🚗 Car Analytics Dashboard",
    page_icon="🚗",
    layout="wide",
    initial_sidebar_state="expanded"
)

class CarScraper:
    def __init__(self):
        self.driver = None
    
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
        """Scrape car listings"""
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
            
            # Look for listings - try multiple selectors
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
        price_patterns = [r'Rs\.?\s*([\d,]+)', r'LKR\s*([\d,]+)', r'([\d,]+)\s*(?:LKR|Rs)']
        for pattern in price_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return f"Rs. {match.group(1)}"
        return "Price not listed"
    
    def extract_numeric_price(self, text):
        """Extract numeric price for calculations"""
        match = re.search(r'([\d,]+)', self.extract_price(text))
        if match:
            return int(match.group(1).replace(',', ''))
        return 0
    
    def extract_year(self, text):
        """Extract manufacturing year"""
        match = re.search(r'\b(19|20)\d{2}\b', text)
        return match.group(0) if match else "Unknown"
    
    def extract_mileage(self, text):
        """Extract mileage"""
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

def create_matplotlib_charts(df):
    """Create charts using matplotlib"""
    if df.empty:
        return
    
    # Create tabs for different visualizations
    tab1, tab2, tab3 = st.tabs(["📊 Price Analysis", "🚗 Car Details", "📈 Trends"])
    
    with tab1:
        col1, col2 = st.columns(2)
        
        with col1:
            # Price distribution
            if df['price_numeric'].sum() > 0:
                st.subheader("Price Distribution")
                fig, ax = plt.subplots(figsize=(8, 4))
                df['price_numeric'].plot(kind='hist', bins=10, ax=ax, color='skyblue', edgecolor='black')
                ax.set_xlabel('Price (LKR)')
                ax.set_ylabel('Number of Cars')
                ax.grid(True, alpha=0.3)
                st.pyplot(fig)
        
        with col2:
            # Year vs Price scatter
            if 'year' in df.columns and df['year'].notna().any():
                df_clean = df[df['year'] != 'Unknown']
                if not df_clean.empty:
                    st.subheader("Year vs Price")
                    fig, ax = plt.subplots(figsize=(8, 4))
                    for year in df_clean['year'].unique():
                        year_data = df_clean[df_clean['year'] == year]
                        ax.scatter(year_data['year'], year_data['price_numeric'], alpha=0.6, s=60)
                    ax.set_xlabel('Year')
                    ax.set_ylabel('Price (LKR)')
                    ax.grid(True, alpha=0.3)
                    st.pyplot(fig)
    
    with tab2:
        col1, col2 = st.columns(2)
        
        with col1:
            # Transmission distribution
            st.subheader("Transmission Types")
            transmission_counts = df['transmission'].value_counts()
            fig, ax = plt.subplots(figsize=(6, 4))
            ax.pie(transmission_counts.values, labels=transmission_counts.index, autopct='%1.1f%%', startangle=90)
            ax.axis('equal')
            st.pyplot(fig)
        
        with col2:
            # Fuel type distribution
            st.subheader("Fuel Types")
            fuel_counts = df['fuel_type'].value_counts()
            fig, ax = plt.subplots(figsize=(6, 4))
            ax.pie(fuel_counts.values, labels=fuel_counts.index, autopct='%1.1f%%', startangle=90)
            ax.axis('equal')
            st.pyplot(fig)
    
    with tab3:
        # Location distribution
        st.subheader("Listings by Location")
        location_counts = df['location'].value_counts()
        fig, ax = plt.subplots(figsize=(10, 4))
        location_counts.plot(kind='bar', ax=ax, color='lightgreen', edgecolor='black')
        ax.set_xlabel('Location')
        ax.set_ylabel('Number of Listings')
        ax.tick_params(axis='x', rotation=45)
        ax.grid(True, alpha=0.3)
        st.pyplot(fig)

def create_streamlit_charts(df):
    """Create charts using only Streamlit built-in functions"""
    if df.empty:
        return
    
    st.header("📊 Data Analytics")
    
    # Price statistics using Streamlit metrics
    if df['price_numeric'].sum() > 0:
        st.subheader("Price Statistics")
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            avg_price = df['price_numeric'].mean()
            st.metric("Average Price", f"Rs. {avg_price:,.0f}")
        
        with col2:
            min_price = df['price_numeric'].min()
            st.metric("Minimum Price", f"Rs. {min_price:,.0f}")
        
        with col3:
            max_price = df['price_numeric'].max()
            st.metric("Maximum Price", f"Rs. {max_price:,.0f}")
        
        with col4:
            total_listings = len(df)
            st.metric("Total Listings", total_listings)
    
    # Distribution charts using Streamlit
    st.subheader("Distributions")
    
    col1, col2 = st.columns(2)
    
    with col1:
        # Transmission distribution
        st.write("**Transmission Types**")
        transmission_counts = df['transmission'].value_counts()
        st.bar_chart(transmission_counts)
    
    with col2:
        # Fuel type distribution
        st.write("**Fuel Types**")
        fuel_counts = df['fuel_type'].value_counts()
        st.bar_chart(fuel_counts)
    
    # Location distribution
    st.write("**Listings by Location**")
    location_counts = df['location'].value_counts()
    st.bar_chart(location_counts)
    
    # Price ranges
    if df['price_numeric'].sum() > 0:
        st.write("**Price Ranges**")
        # Create price ranges
        price_ranges = pd.cut(df['price_numeric'], bins=5)
        range_counts = price_ranges.value_counts().sort_index()
        st.bar_chart(range_counts)

# Initialize session state
if 'scraper' not in st.session_state:
    st.session_state.scraper = CarScraper()
if 'results' not in st.session_state:
    st.session_state.results = []
if 'search_made' not in st.session_state:
    st.session_state.search_made = False

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
    4. View analytics and charts
    5. Browser stays open for multiple searches
    """)

# Main content area
if st.session_state.search_made:
    if st.session_state.results:
        df = pd.DataFrame(st.session_state.results)
        
        # Display summary
        st.header("📈 Market Overview")
        
        # Create visualizations
        create_streamlit_charts(df)
        
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
    # Welcome screen
    st.header("Welcome to Car Analytics Dashboard")
    
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.markdown("""
        ### 📊 Analytics Features:
        
        - **Price Statistics** - Average, min, max prices
        - **Market Distribution** - Transmission, fuel types
        - **Location Analysis** - Where cars are listed
        - **Price Ranges** - Market segmentation
        - **Raw Data Export** - Download complete data
        
        ### 🎯 How to use:
        1. Enter car make and model in sidebar
        2. Click 'Start Scraping'
        3. Complete any browser verification if needed
        4. Explore analytics and charts
        5. Download data as CSV
        """)
    
    with col2:
        st.success("Ready to scrape!")

# Footer
st.markdown("---")
st.markdown("*Browser stays open for multiple searches. Close manually when done.*")