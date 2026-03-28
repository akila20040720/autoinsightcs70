#!/bin/bash
set -e

# 1. Scrape data (populate JSON cache)
echo "[Entrypoint] Running initial scrape..."
python3 scrape_all_to_csv.py --types cars,vans,pickups,suvs --max-pages-per-type 1 --headless true

# 2. Train the model (convert notebook to script if needed)
echo "[Entrypoint] Training model..."
if [ -f model_training_2_0.ipynb ]; then
    jupyter nbconvert --to script model_training_2_0.ipynb --output model_training_2_0.py
fi
python3 model_training_2_0.py || echo "[Entrypoint] Model training script failed or not present."

# 3. Predict (if prediction script exists)
echo "[Entrypoint] Running prediction..."
if [ -f app.py ]; then
    python3 app.py || echo "[Entrypoint] Prediction step skipped (no script or error)."
fi

# 4. Start API server
echo "[Entrypoint] Starting API server..."
exec uvicorn app:app --host 0.0.0.0 --port 8000
