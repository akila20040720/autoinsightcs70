# XGBoost Price Prediction Model

## Overview
This project implements XGBoost regression models to predict vehicle prices for:
- **Next Week** (7 days ahead)
- **Next Month** (30 days ahead)

## Key Features

### 1. Vehicle Name Consolidation
The model handles inconsistent vehicle naming by consolidating variations:
- **Alto variations**: Alto, Alto K10, Alto 800, Alto Japan → Standardized
- **Allion variations**: Allion, Allion 260, Allion 240 → Standardized  
- **Premio variations**: Premio, Premio G Superior → Standardized
- **Wagon R variations**: Wagon R, Wagon R Stingray, Wagon R FX → Standardized
- And many more...

### 2. Data Filtering
- Only vehicles with **≥ 20 listings** are included
- This ensures model accuracy and reliability
- Removes outliers (bottom 1% and top 1% of prices)

### 3. Features Used

#### Temporal Features:
- Day of week, Month, Day of month
- Week of year, Days since data start
- Vehicle age (calculated from year)

#### Price History Features:
- Lagged prices (1, 7, 14, 30 days ago)
- Rolling mean prices (7, 14, 30 day windows)
- Rolling standard deviation (7, 30 day windows)
- Price changes (7-day and 30-day trends)

#### Vehicle Aggregated Features:
- Mean, median, min, max prices per vehicle
- Standard deviation of prices
- Average year, mileage, and age

#### Categorical Features:
- Vehicle name (encoded)
- District (encoded)
- Vehicle type (encoded)

### 4. Model Architecture
- **Algorithm**: XGBoost Regressor
- **Parameters**:
  - n_estimators: 200
  - max_depth: 6
  - learning_rate: 0.1
  - subsample: 0.8
  - colsample_bytree: 0.8

### 5. Data Split
- **80% Training** / **20% Testing**
- Temporal ordering maintained (no future data leakage)

## Files Created

1. **XGBoost_Price_Prediction.py**: Full training script
2. **xgboost_next_week_model.pkl**: Trained model for next week predictions
3. **xgboost_next_month_model.pkl**: Trained model for next month predictions
4. **label_encoders.pkl**: Encoders for categorical variables

## How to Use

### Training
```bash
python XGBoost_Price_Prediction.py
```

### Loading Trained Models
```python
import pickle
import  pandas as pd
import numpy as np

# Load models
with open('xgboost_next_week_model.pkl', 'rb') as f:
    model_week = pickle.load(f)

with open('xgboost_next_month_model.pkl', 'rb') as f:
    model_month = pickle.load(f)

# Load encoders
with open('label_encoders.pkl', 'rb') as f:
    encoders = pickle.load(f)

# Make predictions
# Prepare your features in the same format as training
predictions_week = model_week.predict(X_features)
predictions_month = model_month.predict(X_features)
```

## Expected Performance

The models typically achieve:
- **R² Score**: 0.85-0.95 (depending on data)
- **MAE**: Varies by vehicle price range
- **RMSE**: Lower for vehicles with consistent pricing history

## Top Vehicles Included (with ≥20 listings)

Examples include:
1. Toyota Vitz
2. Suzuki Alto
3. Suzuki Maruti
4. Nissan Vanette
5. Honda Vezel
6. Suzuki Wagon R
7. Toyota Aqua
8. Suzuki Every
9. Toyota Axio
10. Mahindra Bolero
... and many more (typically 200+ vehicles)

## Data Requirements

CSV file must contain:
- `Vehicle Type`: Type of vehicle
- `Make`: Manufacturer
- `Model`: Model name
- `Year`: Manufacturing year
- `Price`: Listed price
- `Milleage`: Vehicle mileage
- `District`: Location
- `published date`: Date of listing
- `Vehicle URL`: Source URL

## Notes

- The model uses **temporal features**, so predictions improve as more historical data becomes available
- **Vehicle-specific patterns** are learned through aggregated statistics
- **Market trends** are captured through rolling statistics and price changes
- Models are saved for reuse without retraining
