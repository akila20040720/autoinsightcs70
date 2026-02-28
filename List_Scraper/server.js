const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Delay function for rate limiting
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Extract data from HTML using cheerio
function extractVehicleData($) {
  const result = {};

  // ----- 1. CONTACT -----
  const telLink = $('a[href^="tel:"]').first();
  if (telLink.length) {
    result.contact = telLink.attr('href').replace('tel:', '').replace(/\s+/g, '');
  } else {
    // Try alternative selectors
    const contactText = $('.contact-number, .phone-number, [class*="contact"]').first().text();
    result.contact = contactText.replace(/[^\d+]/g, '') || 'Not listed';
  }

  // ----- 2. PRICE -----
  let priceEl = $('.ad-price .amount, .ad-price, .price, [class*="price"]').first();
  if (!priceEl.length) {
    priceEl = $('meta[property="product:price"]');
    result.price = priceEl.attr('content') || 'Contact for price';
  } else {
    result.price = priceEl.text().trim().replace(/\s+/g, ' ') || 'Contact for price';
  }

  // ----- 3. SPECS from various possible structures -----
  const specRows = [];
  
  // Method 1: <dt><dd> pairs
  $('.ad-details dt, .ad-specs dt, .specs dt, dl dt').each((i, el) => {
    const label = $(el).text().trim().toLowerCase();
    const value = $(el).next('dd').text().trim();
    if (label && value) specRows.push({ label, value });
  });

  // Method 2: <tr> with <th> and <td>
  if (specRows.length === 0) {
    $('table tr').each((i, row) => {
      const cells = $(row).find('th, td');
      if (cells.length >= 2) {
        const label = $(cells[0]).text().trim().toLowerCase();
        const value = $(cells[1]).text().trim();
        if (label && value) specRows.push({ label, value });
      }
    });
  }

  // Method 3: Divs with specific classes
  if (specRows.length === 0) {
    $('.spec-row, .specification-item, [class*="spec-"]').each((i, el) => {
      const label = $(el).find('.spec-label, .label, strong, b').first().text().trim().toLowerCase();
      const value = $(el).find('.spec-value, .value, span').last().text().trim();
      if (label && value) specRows.push({ label, value });
    });
  }

  const getSpec = (keywords) => {
    const row = specRows.find(r => 
      keywords.some(k => r.label.includes(k.toLowerCase()))
    );
    return row ? row.value : null;
  };

  // Extract specs with fallbacks
  result.make = getSpec(['make', 'brand', 'manufacturer']) || 
                $('meta[property="product:brand"]').attr('content') || 
                'N/A';
  result.model = getSpec(['model', 'model name']) || 'N/A';
  result.yom = getSpec(['yom', 'year', 'year of manufacture', 'reg year', 'registered']) || 'N/A';
  result.mileage = getSpec(['mileage', 'km', 'kilometers', 'odometer', 'distance']) || 'N/A';
  result.gear = getSpec(['gear', 'transmission', 'gearbox']) || 'N/A';
  result.fuel = getSpec(['fuel', 'fuel type', 'petrol', 'diesel', 'hybrid', 'electric']) || 'N/A';
  result.engine = getSpec(['engine', 'cc', 'capacity', 'engine capacity', 'displacement']) || 'N/A';

  // ----- 4. OPTIONS / FEATURES -----
  const optionsList = [];
  $('.ad-features li, .features li, .feature-list li, [class*="feature"] li, [class*="option"] li').each((i, el) => {
    const text = $(el).text().trim();
    if (text && text.length > 0) optionsList.push(text);
  });
  result.options = optionsList.length ? optionsList.join(', ') : 'No additional options listed';

  // ----- 5. DESCRIPTION / DETAILS -----
  let descEl = $('.ad-description, .description, .vehicle-description, .details, [class*="description"]').first();
  if (!descEl.length) {
    descEl = $('meta[name="description"], meta[property="og:description"]');
    result.details = descEl.attr('content') || 'No description available';
  } else {
    result.details = descEl.text().trim() || 'No description available';
  }

  // Clean up formatting
  if (result.mileage !== 'N/A' && !result.mileage.toLowerCase().includes('km')) {
    result.mileage += ' km';
  }
  if (result.engine !== 'N/A' && !result.engine.toLowerCase().includes('cc')) {
    result.engine += ' cc';
  }
  
  // Remove excessive whitespace
  Object.keys(result).forEach(key => {
    if (typeof result[key] === 'string') {
      result[key] = result[key].replace(/\s+/g, ' ').trim();
    }
  });

  return result;
}

// Allow cross-origin requests (if you open the HTML directly)
app.use(cors());

// Serve static frontend files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// ----- SCRAPE API ENDPOINT -----
// Allow dynamic URL via query parameter: /api/scrape?url=...
app.get('/api/scrape', async (req, res) => {
  try {
    const targetUrl = req.query.url || 'https://riyasewana.com/buy/toyota-chr-ngx-sale-kandy-11198404';
    
    // Validate URL is from riyasewana.com
    if (!targetUrl.includes('riyasewana.com')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid URL. Only Riyasewana listings are supported.' 
      });
    }

    // Retry logic with exponential backoff
    let lastError;
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Add delay between retries to avoid rate limiting
        if (attempt > 1) {
          const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`Retry attempt ${attempt} after ${delayMs}ms delay...`);
          await delay(delayMs);
        }

        // Enhanced headers to bypass bot detection
        const response = await axios.get(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9,si-LK;q=0.8,si;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Sec-Ch-Ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
            'Sec-Ch-Ua-Mobile': '?0',
           'Sec-Ch-Ua-Platform': '"Windows"',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Referer': 'https://riyasewana.com/',
            'DNT': '1'
          },
          timeout: 20000,
          maxRedirects: 5,
          validateStatus: function (status) {
            return status >= 200 && status < 500;
          },
          // Important: Handle cookies
          withCredentials: false
        });

        // Check if we got a valid response
        if (response.status !== 200) {
          throw new Error(`Server returned status ${response.status}`);
        }

        // Check if we got HTML content
        const contentType = response.headers['content-type'] || '';
        if (!contentType.includes('text/html')) {
          throw new Error('Response is not HTML');
        }

        const $ = cheerio.load(response.data);
        
        // Quick check if we got the actual page content
        const bodyText = $('body').text();
        if (bodyText.length < 100) {
          throw new Error('Page content seems incomplete');
        }

        const result = extractVehicleData($);
        
        return res.json({ 
          success: true, 
          data: result, 
          scrapedUrl: targetUrl,
          attempt
        });

      } catch (error) {
        lastError = error;
        console.error(`Attempt ${attempt} failed:`, error.message);
        
        // If it's a timeout or connection error, retry
        if (attempt < maxRetries && 
            (error.code === 'ECONNABORTED' || 
             error.code === 'ETIMEDOUT' || 
             error.code === 'ECONNRESET' ||
             error.response?.status === 429 ||
             error.response?.status === 503)) {
          continue; // Retry
        }
        
        // For other errors, break and return error
        break;
      }
    }

    // All retries failed
    throw lastError;

  } catch (error) {
    console.error('Scrape error:', error.message);
    
    // More detailed error information
    let errorMessage = 'Failed to scrape. ';
    
    if (error.response) {
      // Server responded with error status
      if (error.response.status === 403) {
        errorMessage += 'Access forbidden - possible bot detection. Try again in a moment.';
      } else if (error.response.status === 429) {
        errorMessage += 'Too many requests. Please wait before trying again.';
      } else if (error.response.status === 404) {
        errorMessage += 'Listing not found. The URL may be incorrect or the listing was removed.';
      } else {
        errorMessage += `Server returned status ${error.response.status}.`;
      }
    } else if (error.code === 'ECONNABORTED') {
      errorMessage += 'Request timeout. The site may be slow or blocking requests.';
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      errorMessage += 'Cannot reach riyasewana.com. Check your internet connection.';
    } else {
      errorMessage += 'Site may be blocking bots or changed layout.';
    }
    
    res.status(500).json({ 
      success: false, 
      error: errorMessage,
      details: error.message
    });
  }
});

// Everything else (root, unknown routes) -> serve the frontend
// This also handles direct navigation to http://localhost:3000/
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`   → API: http://localhost:${PORT}/api/scrape`);
  console.log(`   → Frontend: http://localhost:${PORT} (this shows the thumbnail page)`);
});