# Riyasewana Web Scraper

A Python-based web scraping tool with a GUI interface for collecting vehicle listings from Riyasewana.com.

## Features

- 🚗 Scrapes vehicle data including type, make, model, year, price, mileage, and location
- 🎨 Real-time GUI with Tkinter showing scraping progress
- 💾 Automatic CSV export for data persistence
- 🔄 Pause/resume and stop functionality
- 🌐 Double-click any row to open the vehicle listing in your browser
- ⚡ Optimized with headless Chrome for fast scraping

## Prerequisites

- Python 3.7 or higher
- Google Chrome browser installed
- ChromeDriver (compatible with your Chrome version)

## Installation

1. Install the required Python packages:

```bash
pip install -r requirements.txt
```

2. Install ChromeDriver:
   - Download ChromeDriver from: https://chromedriver.chromium.org/
   - Or use `webdriver-manager`: `pip install webdriver-manager`
   - Ensure ChromeDriver is in your system PATH

## Usage

Run the scraper:

```bash
python riyasewana_scraper.py
```

### GUI Controls

- **▶ Start Scraping**: Begin scraping vehicle data
- **■ Stop Scraping**: Stop the scraping process
- **🗑️ Clear Table**: Clear the displayed data (doesn't affect CSV)
- **💾 Export CSV**: Export current table view to a timestamped CSV file

### Output

- Main CSV file: `riyasewana_vehicles.csv` (appends data on each run)
- Exported CSV files: `vehicles_export_YYYYMMDD_HHMMSS.csv`

## Data Fields

The scraper collects the following information:

- **Vehicle Type**: Car, Motorbike, Van, SUV, Three Wheel, etc.
- **Make**: Vehicle manufacturer
- **Model**: Vehicle model
- **Year**: Manufacturing year
- **Price**: Listed price (in Rs. or "Negotiable")
- **Mileage**: Kilometers driven
- **District**: Location in Sri Lanka
- **Published Date**: When the listing was posted
- **Vehicle URL**: Direct link to the listing

## Important Notes

⚠️ **Ethical Web Scraping**

- This tool is for educational and personal use only
- Respect the website's terms of service and robots.txt
- Use reasonable delays between requests (built-in rate limiting)
- Do not overload the server with excessive requests
- Always comply with Riyasewana.com's terms of use

## Troubleshooting

### ChromeDriver Issues

If you encounter ChromeDriver errors:

```bash
# Install webdriver-manager for automatic driver management
pip install webdriver-manager
```

Then modify `riyasewana_scraper.py` to use webdriver-manager:

```python
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service

# In setup_driver() function, replace:
driver = webdriver.Chrome(options=chrome_options)

# With:
service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service, options=chrome_options)
```

### GUI Not Displaying

- Ensure you have a display available (not running in a headless server environment)
- For Linux servers, you may need to install tkinter: `sudo apt-get install python3-tk`

## Performance

- Scraping speed: ~2-5 vehicles per second (depending on network and system)
- Includes automatic rate limiting to be respectful to the website
- Runs in headless mode for better performance

## Contributing

Feel free to submit issues or pull requests to improve this tool.

## License

MIT License - See LICENSE file in the repository root.

## Disclaimer

This tool is provided as-is for educational purposes. The authors are not responsible for any misuse or violation of Riyasewana.com's terms of service. Always ensure you have permission to scrape a website and comply with all applicable laws and regulations.
