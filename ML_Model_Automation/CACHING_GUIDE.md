# AutoInsight Scraper API - Database Caching Guide

## Overview

The scraper now uses **SQLite database caching** to dramatically improve performance on subsequent runs. Instead of scraping from the website every time, it stores data locally and retrieves it from the database.

### Key Benefits
- **First Run**: Full web scrape → saves to database
- **Subsequent Runs**: Returns cached data → instant response (< 100ms)
- **Smart Refresh**: Auto-refresh if data older than 24 hours
- **Persistent Storage**: Data survives container restarts

## New Endpoints

### 1. **GET /cache/status** - Check Cache Status
Returns information about the current cache.

```bash
curl http://localhost:8000/cache/status
```

**Response:**
```json
{
  "cached_records": 1250,
  "db_path": "/app/vehicles.db",
  "db_exists": true,
  "cache_expiration_hours": 24
}
```

### 2. **POST /scrape/smart** - Smart Scrape (Recommended)
Automatically checks cache age and only scrapes if data is older than 24 hours.

```bash
curl -X POST http://localhost:8000/scrape/smart \
  -H "Content-Type: application/json" \
  -d '{
    "types": ["cars"],
    "make": "Toyota",
    "max_pages_per_type": 1,
    "headless": true
  }'
```

**Response (from cache):**
```json
{
  "total": 150,
  "cached": true,
  "source": "database_cache",
  "cache_age_minutes": 120
}
```

**Response (fresh scrape):**
```json
{
  "total": 150,
  "cached": false,
  "source": "live_scrape",
  "newly_inserted": 45
}
```

### 3. **POST /scrape** - Force Fresh Scrape
Always performs a new scrape and updates the database.

```bash
curl -X POST http://localhost:8000/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "types": ["cars", "vans"],
    "max_pages_per_type": 3,
    "headless": true
  }'
```

### 4. **GET /vehicles** - Get Cached Data
Retrieves vehicles from database cache with optional filters.

```bash
curl "http://localhost:8000/vehicles?make=Toyota&model=Axio&limit=50"
```

**Response:**
```json
{
  "total": 45,
  "limit": 50,
  "source": "database_cache",
  "filters": {
    "make": "Toyota",
    "model": "Axio",
    "year": null
  },
  "data": [...]
}
```

### 5. **DELETE /cache/clear** - Clear All Cache
Removes all cached data from database.

```bash
curl -X DELETE http://localhost:8000/cache/clear
```

**Response:**
```json
{
  "status": "success",
  "message": "Cache cleared"
}
```

## Usage Examples

### PowerShell - First Run (Scrape & Cache)
```powershell
$body = @{
  types = @("cars", "vans")
  make = "Toyota"
  max_pages_per_type = 5
  delay_seconds = 1
  headless = $true
} | ConvertTo-Json

$response = Invoke-RestMethod -Method Post `
  -Uri "http://localhost:8000/scrape/smart" `
  -Body $body `
  -ContentType "application/json"

Write-Host "Records: $($response.total)"
Write-Host "Source: $($response.source)"
Write-Host "Cached: $($response.cached)"
```

### PowerShell - Check Cache Status
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/cache/status"
```

### PowerShell - Get Data from Cache
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/vehicles?make=Toyota&limit=100"
```

### Bash/cURL - Smart Scrape
```bash
curl -X POST http://localhost:8000/scrape/smart \
  -H "Content-Type: application/json" \
  -d '{
    "types": ["cars"],
    "make": "Toyota",
    "max_pages_per_type": 3
  }' | jq .
```

## Docker Compose Changes

The `docker-compose.yml` now includes:
```yaml
volumes:
  - ./output:/app/output          # CSV files
  - ./vehicles.db:/app/vehicles.db # SQLite database (NEW)
```

This ensures the database persists between container restarts.

### Start the Service
```bash
docker compose up --build
```

### Verify Cache is Working
```bash
# Check file persistence
ls -lh vehicles.db

# Monitor logs in real-time
docker compose logs -f scraper-api

# View cache status
curl http://localhost:8000/cache/status
```

## Database Schema

### `vehicles` Table
Stores individual vehicle records:
```
- id (INTEGER, PRIMARY KEY)
- vehicle_type (TEXT)
- make (TEXT)
- model (TEXT)
- year (INTEGER)
- price (TEXT)
- mileage (INTEGER)
- district (TEXT)
- published_date (TEXT)
- vehicle_url (TEXT, UNIQUE)
- scraped_at (TIMESTAMP)
```

### `scrape_metadata` Table
Tracks scrape operations:
```
- id (INTEGER, PRIMARY KEY)
- scrape_type (TEXT)
- make (TEXT)
- model (TEXT)
- year (TEXT)
- total_records (INTEGER)
- scraped_at (TIMESTAMP)
```

## Configuration

### Cache Expiration
Edit `app.py` to change cache expiration time:
```python
CACHE_EXPIRATION_HOURS = 24  # Change to your desired value
```

### Recommended Strategy
1. **First Request**: Use `/scrape` endpoint with desired filters
2. **Subsequent Requests**: Use `/scrape/smart` for automatic cache management
3. **Manual refresh**: Call `/scrape` again when needed
4. **Clear old data**: Use `/cache/clear` before fresh sync

## Performance Improvements

### Before (CSV-based)
- Every request: Full web scrape required
- Response time: 5-30 minutes per scrape
- No data reuse

### After (Database cached)
- First run: Web scrape → cached (5-30 minutes)
- Subsequent runs: Database query (< 100ms)
- 3000x+ faster on cache hits
- Automatic 24-hour refresh cycle

## Troubleshooting

### "No cached data available" Error
**Solution**: Call `/scrape` or `/scrape/smart` first to populate database

### Database file not persisting
**Check**: Ensure volume is mounted in docker-compose.yml
```yaml
volumes:
  - ./vehicles.db:/app/vehicles.db
```

### Cache not updating
**Solution**: Call `/cache/clear` then `/scrape` to force refresh

### Too much data in database
**Solution**: Use `/cache/clear` to reset, or adjust retention in `database.py`:
```python
db.clear_old_data(days=7)  # Delete data older than 7 days
```

## Files Modified
- `database.py` - New SQLite cache module
- `app.py` - Updated with caching logic
- `docker-compose.yml` - Added database volume
- `requirements-api.txt` - Added sqlite3 reference
