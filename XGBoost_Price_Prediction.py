# XGBoost Price Prediction Model for Next Week and Next Month
# This script predicts vehicle prices for best-selling vehicles with at least 20 listings

import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
from sklearn.preprocessing import LabelEncoder
import matplotlib.pyplot as plt
import seaborn as sns
import warnings
import pickle
warnings.filterwarnings('ignore')

print("="*70)
print("XGBOOST PRICE PREDICTION MODEL")
print("Predicting Next Week and Next Month Prices")
print("="*70)

# Load the data
print("\n[Step 1] Loading data...")
df = pd.read_csv('clean#1 (1).csv')
df['published date'] = pd.to_datetime(df['published date'])

print(f"Dataset shape: {df.shape}")
print(f"Date range: {df['published date'].min()} to {df['published date'].max()}")

# Function to consolidate vehicle names (handle inconsistencies)
def consolidate_model_name(model):
    """Consolidate model names to handle inconsistencies"""
    if pd.isna(model):
        return 'Unknown'
    
    model = str(model).strip()
    model_lower = model.lower()
    
    # Consolidate Alto variations
    if 'alto' in model_lower:
        if 'k10' in model_lower:
            return 'Alto K10'
        elif '800' in model_lower:
            return 'Alto 800'
        elif 'japan' in model_lower:
            return 'Alto Japan'
        else:
            return 'Alto'
    
    # Consolidate Allion variations
    elif 'allion' in model_lower:
        if '260' in model_lower:
            return 'Allion 260'
        elif '240' in model_lower:
            return 'Allion 240'
        else:
            return 'Allion'
    
    # Consolidate Premio variations
    elif 'premio' in model_lower:
        if 'superior' in model_lower or 'g superior' in model_lower:
            return 'Premio G Superior'
        else:
            return 'Premio'
    
    # Consolidate Wagon R variations
    elif 'wagon r' in model_lower or 'wagonr' in model_lower:
        if 'stingray' in model_lower:
            return 'Wagon R Stingray'
        elif 'fx' in model_lower:
            return 'Wagon R FX'
        else:
            return 'Wagon R'
    
    # Consolidate Corolla variations
    elif 'corolla' in model_lower:
        if '121' in model_lower:
            return 'Corolla 121'
        elif '141' in model_lower:
            return 'Corolla 141'
        else:
            return 'Corolla'
    
    # Consolidate Montero variations
    elif 'montero' in model_lower:
        if 'sport' in model_lower:
            return 'Montero Sport'
        else:
            return 'Montero'
    
    # Consolidate March variations
    elif 'march' in model_lower:
        if 'k11' in model_lower:
            return 'March K11'
        else:
            return 'March'
    
    # Consolidate FB variations
    elif model_lower.startswith('fb'):
        if '15' in model_lower:
            return 'FB15'
        elif '14' in model_lower:
            return 'FB14'
        else:
            return 'FB'
    
    return model

print("\n[Step 2] Consolidating vehicle names...")
df['Model_Consolidated'] = df['Model'].apply(consolidate_model_name)
df['Vehicle_Name'] = df['Make'] + ' ' + df['Model_Consolidated']

print(f"Original unique models: {df['Model'].nunique()}")
print(f"Consolidated unique models: {df['Model_Consolidated'].nunique()}")

# Identify best-selling vehicles with at least 20 listings
print("\n[Step 3] Identifying best-selling vehicles (min 20 listings)...")
vehicle_counts = df['Vehicle_Name'].value_counts()
qualifying_vehicles = vehicle_counts[vehicle_counts >= 20]

print(f"Vehicles with at least 20 listings: {len(qualifying_vehicles)}")
print(f"\nTop 20 best-selling vehicles:")
for i, (vehicle, count) in enumerate(qualifying_vehicles.head(20).items(), 1):
    print(f"  {i:2d}. {vehicle:<35s} - {count:4d} listings")

# Filter dataset for qualifying vehicles
df_qualified = df[df['Vehicle_Name'].isin(qualifying_vehicles.index)].copy()
print(f"\nFiltered dataset shape: {df_qualified.shape}")
print(f"Records retained: {len(df_qualified)/len(df)*100:.2f}%")

# Data cleaning
print("\n[Step 4] Cleaning data...")
df_qualified = df_qualified.dropna(subset=['Price', 'Year', 'Milleage'])

# Remove outliers
Q1 = df_qualified['Price'].quantile(0.01)
Q3 = df_qualified['Price'].quantile(0.99)
df_qualified = df_qualified[(df_qualified['Price'] >= Q1) & (df_qualified['Price'] <= Q3)]

print(f"After cleaning shape: {df_qualified.shape}")

# Create features
print("\n[Step 5] Creating features...")
df_qualified = df_qualified.sort_values('published date').reset_index(drop=True)

# Time-based features
df_qualified['day_of_week'] = df_qualified['published date'].dt.dayofweek
df_qualified['month'] = df_qualified['published date'].dt.month
df_qualified['day_of_month'] = df_qualified['published date'].dt.day
df_qualified['week_of_year'] = df_qualified['published date'].dt.isocalendar().week
df_qualified['days_since_start'] = (df_qualified['published date'] - df_qualified['published date'].min()).dt.days
df_qualified['vehicle_age'] = 2026 - df_qualified['Year']

# Aggregated features per vehicle
vehicle_stats = df_qualified.groupby('Vehicle_Name').agg({
    'Price': ['mean', 'std', 'median', 'min', 'max'],
    'Year': 'mean',
    'Milleage': 'mean',
    'vehicle_age': 'mean'
}).reset_index()

vehicle_stats.columns = ['Vehicle_Name', 'price_mean', 'price_std', 'price_median', 
                         'price_min', 'price_max', 'year_mean', 'milleage_mean', 'age_mean']

df_qualified = df_qualified.merge(vehicle_stats, on='Vehicle_Name', how='left')

# Price prediction features
def create_price_prediction_features(df, vehicle_col='Vehicle_Name', date_col='published date', price_col='Price'):
    """Create features for price prediction"""
    df = df.sort_values([vehicle_col, date_col]).reset_index(drop=True)
    
    # Lagged prices
    df['price_lag_1'] = df.groupby(vehicle_col)[price_col].shift(1)
    df['price_lag_7'] = df.groupby(vehicle_col)[price_col].shift(7)
    df['price_lag_14'] = df.groupby(vehicle_col)[price_col].shift(14)
    df['price_lag_30'] = df.groupby(vehicle_col)[price_col].shift(30)
    
    # Rolling mean
    df['price_roll_mean_7'] = df.groupby(vehicle_col)[price_col].transform(
        lambda x: x.shift(1).rolling(window=7, min_periods=1).mean()
    )
    df['price_roll_mean_14'] = df.groupby(vehicle_col)[price_col].transform(
        lambda x: x.shift(1).rolling(window=14, min_periods=1).mean()
    )
    df['price_roll_mean_30'] = df.groupby(vehicle_col)[price_col].transform(
        lambda x: x.shift(1).rolling(window=30, min_periods=1).mean()
    )
    
    # Rolling std
    df['price_roll_std_7'] = df.groupby(vehicle_col)[price_col].transform(
        lambda x: x.shift(1).rolling(window=7, min_periods=1).std()
    )
    df['price_roll_std_30'] = df.groupby(vehicle_col)[price_col].transform(
        lambda x: x.shift(1).rolling(window=30, min_periods=1).std()
    )
    
    # Price changes
    df['price_change_7d'] = df.groupby(vehicle_col)[price_col].transform(
        lambda x: x.shift(1) - x.shift(8)
    )
    df['price_change_30d'] = df.groupby(vehicle_col)[price_col].transform(
        lambda x: x.shift(1) - x.shift(31)
    )
    
    return df

df_qualified = create_price_prediction_features(df_qualified)

# Create target variables
df_qualified['price_next_week'] = df_qualified.groupby('Vehicle_Name')['Price'].shift(-7)
df_qualified['price_next_month'] = df_qualified.groupby('Vehicle_Name')['Price'].shift(-30)

print(f"Non-null next week targets: {df_qualified['price_next_week'].notna().sum()}")
print(f"Non-null next month targets: {df_qualified['price_next_month'].notna().sum()}")

# Encode categorical variables
print("\n[Step 6] Encoding categorical variables...")
le_vehicle = LabelEncoder()
le_district = LabelEncoder()
le_vehicle_type = LabelEncoder()

df_qualified['vehicle_encoded'] = le_vehicle.fit_transform(df_qualified['Vehicle_Name'])
df_qualified['district_encoded'] = le_district.fit_transform(df_qualified['District'].fillna('Unknown'))
df_qualified['vehicle_type_encoded'] = le_vehicle_type.fit_transform(df_qualified['Vehicle Type'].fillna('Unknown'))

# Select features
feature_columns = [
    'vehicle_encoded', 'district_encoded', 'vehicle_type_encoded',
    'Year', 'Milleage', 'vehicle_age',
    'day_of_week', 'month', 'day_of_month', 'week_of_year', 'days_since_start',
    'price_mean', 'price_std', 'price_median', 'price_min', 'price_max',
    'year_mean', 'milleage_mean', 'age_mean',
    'price_lag_1', 'price_lag_7', 'price_lag_14', 'price_lag_30',
    'price_roll_mean_7', 'price_roll_mean_14', 'price_roll_mean_30',
    'price_roll_std_7', 'price_roll_std_30',
    'price_change_7d', 'price_change_30d'
]

print(f"Selected {len(feature_columns)} features for modeling")

# ==================== NEXT WEEK MODEL ====================
print("\n" + "="*70)
print("TRAINING NEXT WEEK PRICE PREDICTION MODEL")
print("="*70)

df_next_week = df_qualified[feature_columns + ['price_next_week']].dropna()
X_week = df_next_week[feature_columns]
y_week = df_next_week['price_next_week']

print(f"\nDataset shape: {X_week.shape}")

# Split data (80-20, maintaining temporal order)
split_idx = int(len(X_week) * 0.8)
X_week_train = X_week.iloc[:split_idx]
y_week_train = y_week.iloc[:split_idx]
X_week_test = X_week.iloc[split_idx:]
y_week_test = y_week.iloc[split_idx:]

print(f"Training set: {X_week_train.shape}")
print(f"Testing set: {X_week_test.shape}")

# Train model
print("\nTraining XGBoost model...")
model_next_week = xgb.XGBRegressor(
    objective='reg:squarederror',
    n_estimators=200,
    max_depth=6,
    learning_rate=0.1,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42,
    n_jobs=-1
)

model_next_week.fit(X_week_train, y_week_train)

# Evaluate
y_week_pred_train = model_next_week.predict(X_week_train)
y_week_pred_test = model_next_week.predict(X_week_test)

train_rmse_week = np.sqrt(mean_squared_error(y_week_train, y_week_pred_train))
test_rmse_week = np.sqrt(mean_squared_error(y_week_test, y_week_pred_test))
train_r2_week = r2_score(y_week_train, y_week_pred_train)
test_r2_week = r2_score(y_week_test, y_week_pred_test)
train_mae_week = mean_absolute_error(y_week_train, y_week_pred_train)
test_mae_week = mean_absolute_error(y_week_test, y_week_pred_test)

print("\n" + "="*70)
print("NEXT WEEK MODEL PERFORMANCE")
print("="*70)
print(f"\nTraining Metrics:")
print(f"  RMSE: ${train_rmse_week:,.2f}")
print(f"  MAE:  ${train_mae_week:,.2f}")
print(f"  R²:   {train_r2_week:.4f}")
print(f"\nTesting Metrics:")
print(f"  RMSE: ${test_rmse_week:,.2f}")
print(f"  MAE:  ${test_mae_week:,.2f}")
print(f"  R²:   {test_r2_week:.4f}")

# ==================== NEXT MONTH MODEL ====================
print("\n" + "="*70)
print("TRAINING NEXT MONTH PRICE PREDICTION MODEL")
print("="*70)

df_next_month = df_qualified[feature_columns + ['price_next_month']].dropna()
X_month = df_next_month[feature_columns]
y_month = df_next_month['price_next_month']

print(f"\nDataset shape: {X_month.shape}")

# Split data
split_idx = int(len(X_month) * 0.8)
X_month_train = X_month.iloc[:split_idx]
y_month_train = y_month.iloc[:split_idx]
X_month_test = X_month.iloc[split_idx:]
y_month_test = y_month.iloc[split_idx:]

print(f"Training set: {X_month_train.shape}")
print(f"Testing set: {X_month_test.shape}")

# Train model
print("\nTraining XGBoost model...")
model_next_month = xgb.XGBRegressor(
    objective='reg:squarederror',
    n_estimators=200,
    max_depth=6,
    learning_rate=0.1,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42,
    n_jobs=-1
)

model_next_month.fit(X_month_train, y_month_train)

# Evaluate
y_month_pred_train = model_next_month.predict(X_month_train)
y_month_pred_test = model_next_month.predict(X_month_test)

train_rmse_month = np.sqrt(mean_squared_error(y_month_train, y_month_pred_train))
test_rmse_month = np.sqrt(mean_squared_error(y_month_test, y_month_pred_test))
train_r2_month = r2_score(y_month_train, y_month_pred_train)
test_r2_month = r2_score(y_month_test, y_month_pred_test)
train_mae_month = mean_absolute_error(y_month_train, y_month_pred_train)
test_mae_month = mean_absolute_error(y_month_test, y_month_pred_test)

print("\n" + "="*70)
print("NEXT MONTH MODEL PERFORMANCE")
print("="*70)
print(f"\nTraining Metrics:")
print(f"  RMSE: ${train_rmse_month:,.2f}")
print(f"  MAE:  ${train_mae_month:,.2f}")
print(f"  R²:   {train_r2_month:.4f}")
print(f"\nTesting Metrics:")
print(f"  RMSE: ${test_rmse_month:,.2f}")
print(f"  MAE:  ${test_mae_month:,.2f}")
print(f"  R²:   {test_r2_month:.4f}")

# Feature importance
print("\n" + "="*70)
print("FEATURE IMPORTANCE - NEXT WEEK MODEL")
print("="*70)
importance_week = pd.DataFrame({
    'feature': feature_columns,
    'importance': model_next_week.feature_importances_
}).sort_values('importance', ascending=False)
print(importance_week.head(10))

print("\n" + "="*70)
print("FEATURE IMPORTANCE - NEXT MONTH MODEL")
print("="*70)
importance_month = pd.DataFrame({
    'feature': feature_columns,
    'importance': model_next_month.feature_importances_
}).sort_values('importance', ascending=False)
print(importance_month.head(10))

# Save models
print("\n" + "="*70)
print("SAVING MODELS")
print("="*70)

with open('xgboost_next_week_model.pkl', 'wb') as f:
    pickle.dump(model_next_week, f)

with open('xgboost_next_month_model.pkl', 'wb') as f:
    pickle.dump(model_next_month, f)

with open('label_encoders.pkl', 'wb') as f:
    pickle.dump({
        'vehicle': le_vehicle,
        'district': le_district,
        'vehicle_type': le_vehicle_type
    }, f)

print("\nModels saved successfully:")
print("  - xgboost_next_week_model.pkl")
print("  - xgboost_next_month_model.pkl")
print("  - label_encoders.pkl")

# Summary
print("\n" + "="*70)
print("FINAL SUMMARY")
print("="*70)
print(f"\nTotal vehicles with ≥20 listings: {len(qualifying_vehicles)}")
print(f"Total records used: {len(df_qualified):,}")
print(f"\nNext Week Model:")
print(f"  - Test R²: {test_r2_week:.4f}")
print(f"  - Test MAE: ${test_mae_week:,.2f}")
print(f"\nNext Month Model:")
print(f"  - Test R²: {test_r2_month:.4f}")
print(f"  - Test MAE: ${test_mae_month:,.2f}")

print("\n" + "="*70)
print("MODELING COMPLETE!")
print("="*70)
