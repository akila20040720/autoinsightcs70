# AWS Architecture Diagram (Text Format)

## Complete Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AUTOINSIGHT AWS SYSTEM                               │
├─────────────────────────────────────────────────────────────────────────────┤

TIME: 2 AM Daily
EVENT: EventBridge Trigger (cron)
    │
    ▼
┌─────────────────────────────────────────────┐
│   Lambda: lambda_scrape_to_s3               │
│   ├─ Timeout: 15 minutes                    │
│   ├─ Memory: 3 GB                           │
│   ├─ Runtime: Python 3.11                   │
│   └─ Dependencies:                          │
│       ├─ selenium (web scraping)            │
│       ├─ beautifulsoup4 (HTML parsing)      │
│       └─ webdriver-manager (Chrome)         │
│                                             │
│   FLOW:                                     │
│   1. Start Chrome webdriver                 │
│   2. For each vehicle type (cars/vans/etc)  │
│       3. Loop through 1-5 pages             │
│       4. Extract vehicle data               │
│       5. Remove duplicates                  │
│   6. Generate CSV in memory                 │
│   7. Upload to S3 (raw-data/)               │
└─────────────────────────────────────────────┘
    │
    │ Outputs: ✓ s3://autoinsight-data/raw-data/all_vehicles_20260327_020000.csv
    │          ✓ s3://autoinsight-data/raw-data/latest_all_vehicles.csv
    │
    ▼
    [s3://autoinsight-data/ bucket]
    
THEN: Step Functions Trigger
    │
    ▼
┌─────────────────────────────────────────────┐
│   Lambda: lambda_data_cleaning              │
│   ├─ Timeout: 5 minutes                     │
│   ├─ Memory: 1 GB                           │
│   ├─ Runtime: Python 3.11                   │
│   └─ Dependencies:                          │
│       ├─ pandas (data manipulation)         │
│       └─ numpy (numerical ops)              │
│                                             │
│   FLOW:                                     │
│   1. Read latest_all_vehicles.csv from S3   │
│   2. Parse numeric columns                  │
│       ├─ Price: "Rs. 5900000" → 5900000    │
│       └─ Mileage: "50,000" → 50000         │
│   3. Remove invalid rows:                   │
│       ├─ Price < 100K or > 30M              │
│       ├─ Mileage > 1M km                    │
│       └─ Missing Make/Model/Year            │
│   4. Remove duplicates by URL               │
│   5. Generate cleaned CSV                   │
│   6. Upload to S3 (cleaned-data/)           │
└─────────────────────────────────────────────┘
    │
    │ Outputs: ✓ s3://autoinsight-data/cleaned-data/cleaned_vehicles_20260327_020500.csv
    │          ✓ s3://autoinsight-data/cleaned-data/latest_cleaned_vehicles.csv
    │          ✓ Statistics: 1500 → 1200 rows (cleaned)
    │
    ▼
    [s3://autoinsight-data/ bucket]
    
THEN: Step Functions Trigger
    │
    ▼
┌─────────────────────────────────────────────┐
│   Lambda: lambda_model_training             │
│   ├─ Timeout: 10 minutes                    │
│   ├─ Memory: 3 GB                           │
│   ├─ Runtime: Python 3.11                   │
│   └─ Dependencies:                          │
│       ├─ pandas + numpy                     │
│       ├─ lightgbm (gradient boosting)       │
│       └─ scikit-learn (preprocessing)       │
│                                             │
│   FLOW:                                     │
│   1. Read cleaned CSV from S3               │
│   2. Engineer features:                     │
│       ├─ vehicle_age = current_year - year  │
│       ├─ Extract month/day from date        │
│       └─ Count per make/model               │
│   3. Encode categorical variables:          │
│       ├─ Make → [1, 2, 3, ...]             │
│       ├─ Model → [1, 2, 3, ...]            │
│       └─ District → [1, 2, 3, ...]         │
│   4. Train/Test split (90 days back)        │
│   5. Train LightGBM model                   │
│   6. Evaluate: R² = 0.92, MAE = 150K        │
│   7. Serialize model to pickle              │
│   8. Upload to S3 (models/)                 │
└─────────────────────────────────────────────┘
    │
    │ Outputs: ✓ s3://autoinsight-data/models/lgbm_model_20260327_021000.pkl
    │          ✓ s3://autoinsight-data/metadata/model_metadata_20260327_021000.json
    │          ✓ Metrics: R²=0.924, MAE=142K, RMSE=285K
    │
    ▼
    [s3://autoinsight-data/ bucket]

═══════════════════════════════════════════════════════════════════════════════

ON-DEMAND: API Prediction
    │
    User: "What's the price of a 2020 Toyota Prius?"
    │
    ▼
    [React Frontend]
    │ ?make=Toyota&model=Prius&year=2020&mileage=50000
    │
    ▼
┌─────────────────────────────────────────────┐
│   API Gateway (REST)                        │
│   Endpoint: /predict                        │
│   Method: GET                               │
│   CORS: Enabled                             │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│   Lambda: lambda_prediction_api             │
│   ├─ Timeout: 1 minute                      │
│   ├─ Memory: 1 GB                           │
│   ├─ Runtime: Python 3.11                   │
│   └─ Dependencies:                          │
│       ├─ lightgbm (model inference)         │
│       ├─ pandas + numpy                     │
│       └─ scikit-learn (encoding)            │
│                                             │
│   FLOW:                                     │
│   1. Load latest model from S3 (cached)     │
│   2. Load latest cleaned data from S3       │
│   3. Parse query params:                    │
│       ├─ make: "Toyota"                     │
│       ├─ model: "Prius"                     │
│       ├─ year: 2020                         │
│       └─ mileage: 50000                     │
│   4. Prepare feature vector:                │
│       ├─ Encode categorical values          │
│       ├─ Calculate vehicle_age              │
│       └─ Get market statistics              │
│   5. Predict: model.predict(features)       │
│       → Output: 5,850,000 LKR               │
│   6. Get market analysis:                   │
│       ├─ Avg price of similar vehicles      │
│       ├─ Price trend (RISING/FALLING)       │
│       └─ Number of listings                 │
│   7. Return JSON response                   │
└─────────────────────────────────────────────┘
    │
    │ Returns:
    │ {
    │   "prediction": {
    │     "make": "Toyota",
    │     "model": "Prius",
    │     "year": 2020,
    │     "predicted_price": 5850000,
    │     "predicted_price_formatted": "5,850,000 LKR"
    │   },
    │   "market_analysis": {
    │     "avg_price": 5930000,
    │     "prev_month_price": 5860000,
    │     "price_trend": "RISING",
    │     "total_listings": 12,
    │     "avg_mileage": 52000
    │   }
    │ }
    │
    ▼
    [React Frontend]
    └─ Display price card showing 5.85M LKR
    └─ Show market trend: RISING
    └─ Show listings available: 12

═══════════════════════════════════════════════════════════════════════════════

STORAGE
    │
    └─ S3 Bucket: autoinsight-data
    │   ├─ raw-data/
    │   │   ├─ all_vehicles_20260327_020000.csv (raw scrape)
    │   │   ├─ all_vehicles_20260326_020000.csv
    │   │   └─ latest_all_vehicles.csv (symlink)
    │   │
    │   ├─ cleaned-data/
    │   │   ├─ cleaned_vehicles_20260327_020500.csv (validated)
    │   │   ├─ cleaned_vehicles_20260326_020500.csv
    │   │   └─ latest_cleaned_vehicles.csv (symlink)
    │   │
    │   ├─ models/
    │   │   ├─ lgbm_model_20260327_021000.pkl (trained model)
    │   │   ├─ lgbm_model_20260326_021000.pkl
    │   │   └─ (Latest loaded automatically)
    │   │
    │   └─ metadata/
    │       ├─ model_metadata_20260327_021000.json
    │       └─ model_metadata_20260326_021000.json

═══════════════════════════════════════════════════════════════════════════════

MONITORING & LOGGING
    │
    └─ CloudWatch Logs
    │   ├─ /aws/lambda/autoinsight-scrape
    │   │   └─ [2026-03-27 02:00:15] Starting scrape...
    │   │   └─ [2026-03-27 02:01:30] [cars] page 1: added 145, total 145
    │   │   └─ [2026-03-27 02:15:22] Saved 1200 rows to S3
    │   │
    │   ├─ /aws/lambda/autoinsight-clean
    │   │   └─ [2026-03-27 02:20:00] Cleaned 1200 → 1050 rows
    │   │
    │   ├─ /aws/lambda/autoinsight-train
    │   │   └─ [2026-03-27 02:25:00] Model metrics R²=0.924
    │   │
    │   └─ /aws/lambda/autoinsight-api
    │       └─ [2026-03-27 10:35:10] Predicted 5,850,000 for Toyota Prius 2020

═══════════════════════════════════════════════════════════════════════════════

ESTIMATED COSTS (Monthly)
    
    Lambda Execution:
    ├─ Scrape: 1 × 15 min/month @ $0.0000166/sec = $0.50
    ├─ Clean:  1 × 3 min/month @ $0.0000067/sec = $0.10
    ├─ Train:  1 × 8 min/month @ $0.0000166/sec = $0.40
    └─ API:    ~3000 calls/month × 0.5s @ $0.0000166/sec = $0.10
    
    Storage:
    ├─ S3 Storage: 100 GB @ $0.023/GB = $2.30
    ├─ S3 Requests: ~10,000 requests @ $0.0004/1K = $0.04
    
    API Gateway:
    └─ API Calls: 3000 @ $0.0035 = $10.50
    
    Total: ~$14/month
    
    (Single-user system, hence low API costs)

────────────────────────────────────────────────────────────────────────────────
```

## Performance Characteristics

```
Latency:
├─ Prediction API: 100-500ms (usually <200ms)
├─ Scraping (per page): 3-5 seconds
└─ Full pipeline (24h cycle): 15 min scrape + 3 min clean + 8 min train = 26 min

Throughput:
├─ Scraping: ~100-200 vehicles per page
├─ Rate: 3-5 pages per vehicle type (configurable)
└─ Total daily: ~1000-1500 vehicles

Data Volume:
├─ Raw CSV: 50-100 MB per day
├─ Cleaned CSV: 30-60 MB per day
└─ Model file: 2-5 MB

Memory Usage:
├─ Lambda scrape: 1.5-2.5 GB
├─ Lambda clean: 0.8-1.2 GB
├─ Lambda train: 1.5-2.5 GB
└─ Lambda API: 0.2-0.4 GB
```

## Scaling Options

```
If you need more data:
├─ Increase max_pages_per_type from 5 to 10-20
├─ Cost increase: ~2-4x Lambda execution time
└─ Benefit: 2000-4000 vehicles/day instead of 1000

If prediction is too slow:
├─ Enable API caching (DynamoDB)
├─ Pre-warm Lambda with Provisioned Concurrency
└─ Use CloudFront CDN for API responses

If model is inaccurate:
├─ Increase training frequency to 2x daily
├─ Collect more historical data
└─ Add feature engineering (seasonal, location-based)
```
