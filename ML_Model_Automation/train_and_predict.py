import pandas as pd
import numpy as np
import json
import os
from sklearn.ensemble import RandomForestRegressor
from datetime import datetime, timedelta

# Paths
DATA_CSV = '../model_training/vehicle_statistics_with_predictions.csv'
OUTPUT_JSON = '../ML_Model_Automation/output/vehicle_statistics_with_predictions.json'

def load_data():
    df = pd.read_csv(DATA_CSV)
    return df

def train_and_predict(df):
    results = []
    grouped = df.groupby(['Make', 'Model', 'Year'])
    for (make, model, year), group in grouped:
        avg_price = group['Price'].mean()
        avg_mileage = group['Mileage'].mean()

        # Prepare features and target
        X = group[['Mileage']]
        y = group['Price']

        # Train model if enough data
        if len(group) > 2:
            model_rf = RandomForestRegressor(n_estimators=50, random_state=42)
            model_rf.fit(X, y)
            # Predict for next week and next month (simulate mileage increase)
            mileage_now = avg_mileage
            mileage_next_week = mileage_now + 200  # assume 200km/week
            mileage_next_month = mileage_now + 800  # assume 800km/month
            pred_next_week = float(model_rf.predict([[mileage_next_week]])[0])
            pred_next_month = float(model_rf.predict([[mileage_next_month]])[0])
        else:
            pred_next_week = avg_price
            pred_next_month = avg_price

        results.append({
            'Make': make,
            'Model': model,
            'Year': int(year),
            'Average_Price': round(avg_price, 2) if not np.isnan(avg_price) else None,
            'Average_Mileage': round(avg_mileage, 2) if not np.isnan(avg_mileage) else None,
            'Predicted_Next_Week_Price': round(pred_next_week, 2) if pred_next_week is not None else None,
            'Predicted_Next_Month_Price': round(pred_next_month, 2) if pred_next_month is not None else None
        })
    return results

def save_json(results):
    os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)
    with open(OUTPUT_JSON, 'w') as f:
        json.dump(results, f, indent=2)

def main():
    df = load_data()
    results = train_and_predict(df)
    save_json(results)
    print(f"Predictions saved to {OUTPUT_JSON}")

if __name__ == "__main__":
    main()
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error

# 1. Scrape data
print("[train_and_predict] Scraping vehicle data...")
rows = scrape_all(
    types=parse_types("cars,vans,pickups,suvs"),
    make="",
    model="",
    year="",
    max_pages_per_type=1,
    delay_seconds=1.0,
    headless=True,
    output_dir=OUTPUT_DIR,
)

# 2. Save to CSV for reference
_, latest_path = write_csv(rows, OUTPUT_DIR)

# 3. Load data into DataFrame
print(f"[train_and_predict] Loading data from {latest_path}")
df = pd.read_csv(latest_path)

# 4. Preprocess data (simple example: drop rows with missing values, encode categorical)
df = df.dropna(subset=["Year", "Price", "Milleage"])
df = df[df["Price"].str.contains("\d")]  # Keep rows with numeric price

def parse_price(x):
    try:
        return int(str(x).replace("Rs.", "").replace(",", "").strip())
    except:
        return None

df["Price"] = df["Price"].apply(parse_price)
df = df.dropna(subset=["Price"])

# Encode categorical features
for col in ["Vehicle Type", "Make", "Model", "District"]:
    df[col] = df[col].astype(str)
    df[col] = pd.factorize(df[col])[0]

# 5. Train/test split
X = df[["Vehicle Type", "Make", "Model", "Year", "Milleage", "District"]]
y = df["Price"]
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 6. Train model
print("[train_and_predict] Training RandomForestRegressor...")
model = RandomForestRegressor(n_estimators=50, random_state=42)
model.fit(X_train, y_train)

# 7. Predict on all data
print("[train_and_predict] Predicting prices...")
df["Predicted_Price"] = model.predict(X)

# 8. Save to JSON
output_json = OUTPUT_DIR / "vehicles_with_predictions.json"
print(f"[train_and_predict] Saving results to {output_json}")

# Convert DataFrame to list of dicts for JSON
result = df.to_dict(orient="records")
with open(output_json, "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print("[train_and_predict] Done! JSON with predictions is ready.")
