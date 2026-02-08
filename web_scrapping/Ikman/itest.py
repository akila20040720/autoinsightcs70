from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import time

# Simple test to see if we can access ikman.lk
chrome_options = Options()
chrome_options.add_argument("--headless")  # Remove this to see browser
chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")

driver = webdriver.Chrome(options=chrome_options)

try:
    driver.get("https://ikman.lk")
    print(f"Title: {driver.title}")
    print(f"URL: {driver.current_url}")
    
    # Save page source
    with open("test_page.html", "w", encoding="utf-8") as f:
        f.write(driver.page_source)
    
    print("Page saved to test_page.html")
    
    # Take screenshot
    driver.save_screenshot("test_screenshot.png")
    print("Screenshot saved")
    
except Exception as e:
    print(f"Error: {e}")

finally:
    driver.quit()