#!/bin/bash
set -e

# 1. Scrape data (populate JSON cache)
echo "[Entrypoint] Running initial scrape..."
python3 scrape_all_to_csv.py --types cars,vans,pickups,suvs --max-pages-per-type 1 --headless true


# 2. Train and predict (generate vehicle_statistics_with_predictions.json)
echo "[Entrypoint] Training and predicting..."
python3 train_and_predict.py || echo "[Entrypoint] train_and_predict.py failed or not present."

# 4. Start API server
echo "[Entrypoint] Starting API server..."
exec uvicorn app:app --host 0.0.0.0 --port 8000
