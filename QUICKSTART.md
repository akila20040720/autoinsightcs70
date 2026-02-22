# Quick Start Guide - XGBoost Price Prediction

## Step 1: Install Required Packages (if not already installed)
```python
# Run this in a cell or terminal:
!pip install xgboost scikit-learn matplotlib seaborn pandas numpy
```

## Step 2: Import and Load Data
```python
import pandas as pd
import numpy as np

# Load the dataset
df = pd.read_csv('clean#1 (1).csv')
df['published date'] = pd.to_datetime(df['published date'])

print(f"Dataset loaded: {df.shape}")
print(f"Columns: {df.columns.tolist()}")
```

## Step 3: Run the Full Training Script
```python
# Execute the complete training script
%run XGBoost_Price_Prediction.py
```

## Step 4: Load and Use Trained Models
```python
import pickle
import xgboost as xgb

# Load the trained models
with open('xgboost_next_week_model.pkl', 'rb') as f:
    model_next_week = pickle.load(f)

with open('xgboost_next_month_model.pkl', 'rb') as f:
    model_next_month = pickle.load(f)

# Load encoders
with open('label_encoders.pkl', 'rb') as f:
    encoders = pickle.load(f)
    
print("Models loaded successfully!")
print(f"Next Week Model: {model_next_week}")
print(f"Next Month Model: {model_next_month}")
```

## Step 5: Make Predictions on New Data
```python
# Example: Prepare a new vehicle listing for prediction
# (You would need to prepare features in the same format as training)

# For demonstration, let's use a sample from test set
# predictions_week = model_next_week.predict(X_test_features)
# predictions_month = model_next_month.predict(X_test_features)

print("To make predictions, prepare features matching the training format!")
```

## Alternative: Run in Terminal
```bash
cd "d:\AutoInsight Dashboard\autoinsightcs70"
python XGBoost_Price_Prediction.py
```

This will:
1. Load and clean the data
2. Consolidate vehicle names
3. Filter vehicles with ≥20 listings
4. Create time-based and statistical features
5. Train two XGBoost models (next week & next month)
6. Evaluate performance
7. Save the trained models

## Expected Output
You should see:
- Data processing steps
- List of top vehicles (with ≥20 listings)
- Model training progress
- Performance metrics (RMSE, MAE, R²)
- Feature importance rankings
- Saved model files confirmation
