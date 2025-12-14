import cloudscraper
from bs4 import BeautifulSoup
import pandas as pd
import re
import time
import random

def scrape_riyasewana():
    """Main scraping function"""
    scraper = cloudscraper.create_scraper(
        browser={
            'browser': 'chrome',
            'platform': 'windows',
            'mobile': False
        }
    )
    
    all_data = []
    
    for page in range(1, 11):  # Start with 10 pages
        try:
            print(f"Scraping page {page}...")
            
            url = f"https://riyasewana.com/search/cars?page={page}"
            response = scraper.get(url)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Save first page for analysis
                if page == 1:
                    with open("page_1_detailed.html", "w", encoding="utf-8") as f:
                        f.write(response.text)
                
                # TRY DIFFERENT SELECTOR PATTERNS
                listings = []
                
                # Pattern 1: Look for divs with car listings
                for div in soup.find_all('div', class_=True):
                    classes = ' '.join(div.get('class', []))
                    if any(word in classes.lower() for word in ['item', 'list', 'car', 'vehicle']):
                        listings.append(('div', div))
                
                # Pattern 2: Look for list items
                for li in soup.find_all('li', class_=True):
                    classes = ' '.join(li.get('class', []))
                    if any(word in classes.lower() for word in ['item', 'list', 'car', 'vehicle']):
                        listings.append(('li', li))
                
                # Pattern 3: Look for articles
                for article in soup.find_all('article'):
                    listings.append(('article', article))
                
                print(f"  Found {len(listings)} potential listings")
                
                # Process each potential listing
                for tag_type, item in listings:
                    try:
                        full_text = item.get_text(' ', strip=True)
                        
                        # Skip if too short
                        if len(full_text) < 30:
                            continue
                        
                        # Extract data using regex patterns
                        
                        # Title - look for the first meaningful text
                        title = None
                        # Try to find h2, h3 tags
                        title_tag = item.find(['h2', 'h3', 'h4'])
                        if title_tag:
                            title = title_tag.get_text(strip=True)
                        else:
                            # Extract first meaningful words
                            words = full_text.split()
                            if len(words) > 2:
                                title = ' '.join(words[:4])
                        
                        # Price
                        price = None
                        price_match = re.search(r'Rs\.?\s*([\d,]+)', full_text, re.IGNORECASE)
                        if price_match:
                            price = price_match.group()
                        
                        # Year
                        year = None
                        year_match = re.search(r'\b(19[0-9]{2}|20[0-2][0-9])\b', full_text)
                        if year_match:
                            year = year_match.group()
                        
                        # Fuel type
                        fuel = None
                        fuel_types = ['petrol', 'diesel', 'hybrid', 'electric', 'cng']
                        for ft in fuel_types:
                            if ft in full_text.lower():
                                fuel = ft.title()
                                break
                        
                        # Engine/Transmission
                        engine = None
                        # Look for engine capacity
                        engine_match = re.search(r'(\d+(\.\d+)?)\s*(L|l|litre|cc)', full_text, re.IGNORECASE)
                        if engine_match:
                            engine = engine_match.group()
                        
                        # Transmission
                        transmission = None
                        for trans in ['auto', 'automatic', 'manual', 'cvt']:
                            if trans in full_text.lower():
                                transmission = trans.title()
                                break
                        
                        # URL
                        url = None
                        link = item.find('a', href=True)
                        if link:
                            href = link['href']
                            if href.startswith('/'):
                                url = f"https://riyasewana.com{href}"
                            elif 'riyasewana.com' in href:
                                url = href
                        
                        # Posted date
                        posted = None
                        # Look for date patterns
                        date_patterns = [
                            r'\d{1,2}\s+(hour|hr|day|week|month|year)s?\s+ago',
                            r'\d{1,2}/\d{1,2}/\d{2,4}',
                            r'\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b'
                        ]
                        for pattern in date_patterns:
                            date_match = re.search(pattern, full_text, re.IGNORECASE)
                            if date_match:
                                posted = date_match.group()
                                break
                        
                        # Only add if we have reasonable data
                        if title and (price or year):
                            all_data.append({
                                'Title': title,
                                'Price': price,
                                'Year': year,
                                'Fuel': fuel,
                                'Engine': engine,
                                'Transmission': transmission,
                                'Posted': posted,
                                'URL': url,
                                'Page': page,
                                'Source': tag_type,
                                'Full_Text': full_text[:200]
                            })
                            
                    except Exception as e:
                        continue
                
                # Add delay between pages
                time.sleep(random.uniform(2, 4))
                
            else:
                print(f"  Failed with status: {response.status_code}")
                
        except Exception as e:
            print(f"  Error on page {page}: {e}")
            continue
    
    return all_data

# Run the scraper
print("Starting Riyasewana scraper...")
data = scrape_riyasewana()

if data:
    df = pd.DataFrame(data)
    
    # Clean the data
    if 'Price' in df.columns:
        df['Price_Numeric'] = df['Price'].str.extract(r'([\d,]+)').fillna('0')
        df['Price_Numeric'] = df['Price_Numeric'].str.replace(',', '').astype(int)
    
    # Save to CSV
    df.to_csv('riyasewana_scraped.csv', index=False, encoding='utf-8')
    
    print(f"\nScraped {len(df)} listings")
    print("\nSample data:")
    print(df[['Title', 'Price', 'Year', 'Fuel']].head(10).to_string())
    
    # Also save a simplified version
    simple_cols = [col for col in df.columns if col not in ['Full_Text', 'Source']]
    df[simple_cols].to_csv('riyasewana_final.csv', index=False, encoding='utf-8')
    print(f"\nSaved to 'riyasewana_final.csv'")
    
else:
    print("No data scraped!")

# Also create a diagnostic file
print("\n" + "=" * 80)
print("DIAGNOSTIC INFORMATION")
print("=" * 80)

# Open and analyze the saved HTML
try:
    with open("page_1_detailed.html", "r", encoding="utf-8") as f:
        html_content = f.read()
    
    soup = BeautifulSoup(html_content, 'html.parser')
    
    print("\n1. Page structure summary:")
    print(f"   Total characters: {len(html_content)}")
    print(f"   Title tag: {soup.title.string if soup.title else 'No title'}")
    
    print("\n2. Counting elements:")
    print(f"   Div elements: {len(soup.find_all('div'))}")
    print(f"   List items: {len(soup.find_all('li'))}")
    print(f"   Links: {len(soup.find_all('a'))}")
    
    print("\n3. Looking for common patterns:")
    # Search for common class names
    all_classes = set()
    for tag in soup.find_all(class_=True):
        all_classes.update(tag.get('class', []))
    
    # Filter for likely listing classes
    listing_classes = [cls for cls in all_classes if any(word in cls.lower() 
                      for word in ['item', 'list', 'car', 'vehicle', 'ad', 'post'])]
    
    print(f"   Potential listing classes found: {listing_classes[:20]}")
    
    print("\n4. Search for 'Rs.' patterns:")
    rs_matches = re.findall(r'Rs\.\s*[\d,]+', html_content)
    print(f"   Found {len(rs_matches)} price mentions")
    if rs_matches:
        print(f"   Sample prices: {list(set(rs_matches[:10]))}")
    
except FileNotFoundError:
    print("Diagnostic file not found. Run scraper first.")