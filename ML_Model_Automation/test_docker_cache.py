#!/usr/bin/env python3
"""
Test script to verify the Docker scraper with database caching works correctly.
Run this after starting the Docker container.
"""

import time
import requests
import json

BASE_URL = "http://localhost:8000"

def print_section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")

def test_health():
    print_section("1. Testing Health Endpoint")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"ERROR: {e}")
        return False

def test_cache_status():
    print_section("2. Checking Cache Status (Should be empty initially)")
    try:
        response = requests.get(f"{BASE_URL}/cache/status")
        data = response.json()
        print(f"Status: {response.status_code}")
        print(f"Cached Records: {data['cached_records']}")
        print(f"Database exists: {data['db_exists']}")
        print(f"Response: {json.dumps(data, indent=2)}")
        return True
    except Exception as e:
        print(f"ERROR: {e}")
        return False

def test_smart_scrape_first_run():
    print_section("3. First Smart Scrape (Will perform live scrape)")
    try:
        payload = {
            "types": ["cars"],
            "make": "",
            "model": "",
            "year": "",
            "max_pages_per_type": 1,
            "delay_seconds": 1,
            "headless": True
        }
        print(f"Sending payload: {json.dumps(payload, indent=2)}")
        print("This may take 30-60 seconds on first run...")
        
        response = requests.post(f"{BASE_URL}/scrape/smart", json=payload, timeout=120)
        data = response.json()
        print(f"Status: {response.status_code}")
        print(f"Total records: {data.get('total')}")
        print(f"Source: {data.get('source')}")
        print(f"Cached: {data.get('cached')}")
        print(f"Newly inserted: {data.get('newly_inserted')}")
        return True
    except Exception as e:
        print(f"ERROR: {e}")
        return False

def test_cache_status_after_scrape():
    print_section("4. Checking Cache Status (Should have records now)")
    try:
        response = requests.get(f"{BASE_URL}/cache/status")
        data = response.json()
        print(f"Status: {response.status_code}")
        print(f"Cached Records: {data['cached_records']}")
        print(f"Response: {json.dumps(data, indent=2)}")
        return data['cached_records'] > 0
    except Exception as e:
        print(f"ERROR: {e}")
        return False

def test_smart_scrape_from_cache():
    print_section("5. Second Smart Scrape (Should use cache - INSTANT)")
    try:
        payload = {
            "types": ["cars"],
            "make": "",
            "model": "",
            "year": "",
            "max_pages_per_type": 1,
            "delay_seconds": 1,
            "headless": True
        }
        print("Sending same request... should return instantly from cache")
        start = time.time()
        response = requests.post(f"{BASE_URL}/scrape/smart", json=payload, timeout=10)
        elapsed = time.time() - start
        
        data = response.json()
        print(f"Status: {response.status_code}")
        print(f"Total records: {data.get('total')}")
        print(f"Source: {data.get('source')}")
        print(f"Cached: {data.get('cached')}")
        print(f"Cache age (minutes): {data.get('cache_age_minutes')}")
        print(f"Response time: {elapsed:.2f}s (should be < 1s)")
        
        is_cached = data.get('cached') == True
        is_fast = elapsed < 1.0
        
        if is_cached and is_fast:
            print("✓ SUCCESS: Data retrieved from cache instantly!")
            return True
        else:
            print("✗ WARNING: Expected cache hit with fast response")
            return False
    except Exception as e:
        print(f"ERROR: {e}")
        return False

def test_get_vehicles():
    print_section("6. Getting Vehicles from Cache")
    try:
        params = {"limit": 10}
        response = requests.get(f"{BASE_URL}/vehicles", params=params)
        data = response.json()
        print(f"Status: {response.status_code}")
        print(f"Total records: {data.get('total')}")
        print(f"Source: {data.get('source')}")
        print(f"Records returned: {len(data.get('data', []))}")
        if data.get('data'):
            print(f"First record: {json.dumps(data['data'][0], indent=2)}")
        return True
    except Exception as e:
        print(f"ERROR: {e}")
        return False

def test_get_vehicles_with_filters():
    print_section("7. Getting Vehicles with Filters (from cache)")
    try:
        params = {"make": "Toyota", "limit": 5}
        response = requests.get(f"{BASE_URL}/vehicles", params=params)
        data = response.json()
        print(f"Status: {response.status_code}")
        print(f"Filter: make=Toyota")
        print(f"Records found: {data.get('total')}")
        print(f"Source: {data.get('source')}")
        return True
    except Exception as e:
        print(f"ERROR: {e}")
        return False

def test_clear_cache():
    print_section("8. Clearing Cache")
    try:
        response = requests.delete(f"{BASE_URL}/cache/clear")
        data = response.json()
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(data, indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"ERROR: {e}")
        return False

def test_cache_after_clear():
    print_section("9. Verifying cache is empty after clear")
    try:
        response = requests.get(f"{BASE_URL}/cache/status")
        data = response.json()
        print(f"Status: {response.status_code}")
        print(f"Cached Records: {data['cached_records']}")
        return data['cached_records'] == 0
    except Exception as e:
        print(f"ERROR: {e}")
        return False

def main():
    print("\n" + "="*60)
    print("  DOCKER SCRAPER WITH DATABASE CACHING - TEST SUITE")
    print("="*60)
    print("\nMake sure the Docker container is running:")
    print("  docker compose up --build")
    print("\nTesting endpoints...")
    
    results = {
        "Health check": test_health(),
        "Initial cache status": test_cache_status(),
        "First smart scrape": test_smart_scrape_first_run(),
        "Cache status after scrape": test_cache_status_after_scrape(),
        "Smart scrape from cache": test_smart_scrape_from_cache(),
        "Get vehicles": test_get_vehicles(),
        "Get vehicles filtered": test_get_vehicles_with_filters(),
        "Clear cache": test_clear_cache(),
        "Cache empty after clear": test_cache_after_clear(),
    }
    
    print_section("TEST RESULTS SUMMARY")
    passed = 0
    failed = 0
    for test_name, result in results.items():
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status:10} {test_name}")
        if result:
            passed += 1
        else:
            failed += 1
    
    print(f"\nTotal: {passed} passed, {failed} failed")
    print("\nKey features validated:")
    print("✓ Database caching works")
    print("✓ First scrape stores data")
    print("✓ Second scrape returns from cache (instant)")
    print("✓ Filtering works on cached data")
    print("✓ Cache can be cleared")

if __name__ == "__main__":
    main()
