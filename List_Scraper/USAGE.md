# Riyasewana Real-Time Vehicle Scraper

## Overview
This application scrapes vehicle listings from Riyasewana.com in real-time without redirecting users to the actual website. When a user clicks on a vehicle thumbnail, the app fetches all details directly from the listing page.

## Features
- ✅ **Real-time scraping** - No pre-stored data, everything is fetched live
- ✅ **No external redirects** - Users stay within your application
- ✅ **Comprehensive data extraction**:
  - Contact number
  - Price
  - Make & Model
  - Year of Manufacture (YOM)
  - Mileage
  - Transmission (Gear)
  - Fuel Type
  - Engine Capacity (cc)
  - Features & Options
  - Full vehicle description

## How to Use

### 1. Install Dependencies
```bash
cd List_Scraper
npm install
```

### 2. Start the Server
```bash
npm start
```
The server will run at `http://localhost:3000`

### 3. Open the Application
Open your browser and go to: `http://localhost:3000`

### 4. Scrape Vehicle Details
- You'll see a vehicle thumbnail with basic info
- Click anywhere on the card or the "SCRAPE LIVE DATA" button
- The app will fetch all details in real-time from Riyasewana
- View comprehensive information including contact, specs, and descriptions
- Click "Back" to return to the thumbnail view

## Customization

### Change the Target Listing URL
To scrape a different vehicle listing, edit the `LISTING_URL` constant in [public/index.html](public/index.html):

```javascript
const LISTING_URL = 'https://riyasewana.com/buy/your-listing-url-here';
```

### Multiple Listings Support
The backend supports multiple listings via query parameters:
```
http://localhost:3000/api/scrape?url=https://riyasewana.com/buy/...
```

You can extend the frontend to display multiple thumbnails and pass different URLs dynamically.

## API Endpoint

### GET `/api/scrape`
Scrapes a Riyasewana vehicle listing and returns structured data.

**Query Parameters:**
- `url` (optional) - The Riyasewana listing URL. If not provided, uses the default URL.

**Response:**
```json
{
  "success": true,
  "data": {
    "contact": "0771234567",
    "price": "Rs 11,500,000",
    "make": "Toyota",
    "model": "C-HR NGX",
    "yom": "2018",
    "mileage": "45000 km",
    "gear": "Automatic",
    "fuel": "Hybrid",
    "engine": "1800 cc",
    "options": "Power steering, Power windows, Air bags...",
    "details": "Full vehicle description..."
  },
  "scrapedUrl": "https://riyasewana.com/buy/..."
}
```

## Technical Details

### Backend (server.js)
- **Express.js** - Web server
- **Axios** - HTTP client for fetching pages
- **Cheerio** - HTML parsing and data extraction
- Multiple selector fallbacks for robust scraping

### Frontend (index.html)
- Pure JavaScript (no frameworks)
- Responsive design with glassmorphism effects
- Real-time loading states
- Error handling with user-friendly messages

## Troubleshooting

### "Scraping failed" Error
1. Make sure the server is running (`npm start`)
2. Check if the Riyasewana URL is accessible
3. The website may have changed its HTML structure - update selectors in server.js

### No Data Displayed
- The listing page might use different HTML classes/IDs
- Update the CSS selectors in the server.js scraping logic
- Check browser console for error messages

## Next Steps

1. **Image Extraction** - Add vehicle image scraping and display
2. **Multiple Listings** - Create a gallery view with multiple vehicles
3. **Search Functionality** - Allow users to search and scrape any listing
4. **Cache Layer** - Store scraped data temporarily to reduce requests
5. **Database Integration** - Save listings for comparison and tracking

## Notes
- Respect Riyasewana's terms of service
- Implement rate limiting for production use
- Consider using proxies for high-volume scraping
- Add error logging for monitoring
