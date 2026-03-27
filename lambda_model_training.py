"""
AWS Lambda function to train ML model from cleaned data
Triggered after data cleaning completes
"""

import boto3
import json
import logging
import pickle
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from io import BytesIO, StringIO

import lightgbm as lgb
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
from sklearn.preprocessing import LabelEncoder

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3_client = boto3.client("s3")

# Configuration
S3_BUCKET = "autoinsight-data"  # Change to your bucket name
CLEANED_DATA_PREFIX = "cleaned-data/"
MODEL_PREFIX = "models/"
METADATA_PREFIX = "metadata/"

# Model training config
TEST_SPLIT_DAYS = 90
RANDOM_STATE = 42


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Create engineered features for model"""
    df = df.copy()
    
    # Parse date to extract temporal features
    if "published date" in df.columns:
        df["published date"] = pd.to_datetime(df["published date"], errors="coerce")
        df["year_published"] = df["published date"].dt.year
        df["month_published"] = df["published date"].dt.month
        df["day_of_week"] = df["published date"].dt.dayofweek
    
    # Age features
    df["vehicle_age"] = pd.to_numeric(df.get("Year", 0), errors="coerce")
    current_year = datetime.now().year
    df["vehicle_age"] = current_year - df["vehicle_age"]
    df["vehicle_age"] = df["vehicle_age"].clip(lower=0, upper=100)
    
    # Mileage features
    df["Milleage"] = pd.to_numeric(df.get("Milleage", 0), errors="coerce").fillna(0)
    df["Milleage"] = df["Milleage"].clip(lower=0, upper=1_000_000)
    
    # Volume features (count of same make/model combinations)
    if "Make" in df.columns and "Model" in df.columns:
        make_model_counts = df.groupby(["Make", "Model"]).size().to_dict()
        df["make_model_count"] = df.apply(
            lambda x: make_model_counts.get((x["Make"], x["Model"]), 1), axis=1
        )
    
    return df


def prepare_training_data(df: pd.DataFrame):
    """Prepare data for model training"""
    
    # Engineer features
    df = engineer_features(df)
    
    # Define feature columns
    feature_cols = [
        "Make", "Model", "Year", "Milleage", "District", "Vehicle Type",
        "vehicle_age", "month_published", "day_of_week", "make_model_count"
    ]
    
    # Ensure all columns exist
    for col in feature_cols:
        if col not in df.columns:
            logger.warning(f"Feature column '{col}' not found, creating with defaults")
            if col == "make_model_count":
                df[col] = 1
            else:
                df[col] = 0
    
    # Encode categorical variables
    label_encoders = {}
    categorical_cols = ["Make", "Model", "District", "Vehicle Type"]
    
    for col in categorical_cols:
        if col in df.columns:
            le = LabelEncoder()
            df[col] = le.fit_transform(df[col].astype(str))
            label_encoders[col] = le
    
    X = df[feature_cols].astype(np.float32)
    y = df["Price"].astype(np.float32)
    
    return X, y, label_encoders, feature_cols


def train_lightgbm_model(X_train, y_train, X_test, y_test):
    """Train LightGBM model"""
    
    logger.info(f"Training LightGBM with {len(X_train)} samples")
    
    # LightGBM parameters
    params = {
        "objective": "regression",
        "metric": "mse",
        "learning_rate": 0.1,
        "num_leaves": 31,
        "max_depth": 10,
        "feature_fraction": 0.8,
        "bagging_fraction": 0.8,
        "bagging_freq": 5,
        "verbose": -1,
    }
    
    # Create datasets
    train_data = lgb.Dataset(X_train, label=y_train)
    valid_data = lgb.Dataset(X_test, label=y_test, reference=train_data)
    
    # Train model
    model = lgb.train(
        params,
        train_data,
        num_boost_round=200,
        valid_sets=[train_data, valid_data],
        callbacks=[lgb.log_evaluation(period=50), lgb.early_stopping(50)],
    )
    
    # Evaluate
    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    
    logger.info(f"Model metrics - MAE: {mae:.2f}, RMSE: {rmse:.2f}, R²: {r2:.4f}")
    
    return model, {"mae": float(mae), "rmse": float(rmse), "r2": float(r2)}


def read_csv_from_s3(bucket: str, key: str) -> pd.DataFrame:
    """Read CSV from S3"""
    try:
        response = s3_client.get_object(Bucket=bucket, Key=key)
        df = pd.read_csv(response["Body"])
        return df
    except Exception as e:
        logger.error(f"Failed to read from S3: {e}")
        raise


def write_model_to_s3(model, bucket: str, prefix: str) -> str:
    """Serialize and save model to S3"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    model_key = f"{prefix}lgbm_model_{timestamp}.pkl"
    
    # Serialize model
    model_bytes = pickle.dumps(model)
    
    # Upload to S3
    s3_client.put_object(Bucket=bucket, Key=model_key, Body=model_bytes)
    
    logger.info(f"Model saved to S3: {model_key}")
    return model_key


def write_metadata_to_s3(metadata: dict, bucket: str, prefix: str) -> str:
    """Save model metadata to S3"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    metadata_key = f"{prefix}model_metadata_{timestamp}.json"
    
    metadata_json = json.dumps(metadata, indent=2)
    s3_client.put_object(Bucket=bucket, Key=metadata_key, Body=metadata_json)
    
    logger.info(f"Metadata saved to S3: {metadata_key}")
    return metadata_key


def lambda_handler(event, context):
    """
    Lambda handler - train ML model from cleaned data
    """
    try:
        logger.info("Starting model training Lambda")
        
        # Get parameters
        input_bucket = event.get("bucket", S3_BUCKET)
        input_key = event.get("cleaned_data_key", f"{CLEANED_DATA_PREFIX}latest_cleaned_vehicles.csv")
        
        # Read cleaned data
        df = read_csv_from_s3(input_bucket, input_key)
        logger.info(f"Loaded {len(df)} rows from {input_key}")
        
        if len(df) < 100:
            logger.warning(f"Not enough data for training: {len(df)} rows")
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "Insufficient data for training"}),
            }
        
        # Split into train/test based on date
        if "published date" in df.columns:
            df["published date"] = pd.to_datetime(df["published date"], errors="coerce")
            split_date = df["published date"].max() - timedelta(days=TEST_SPLIT_DAYS)
            test_mask = df["published date"] >= split_date
        else:
            # Random split if no date
            test_mask = np.random.rand(len(df)) < 0.2
        
        df_train = df[~test_mask]
        df_test = df[test_mask]
        
        logger.info(f"Train: {len(df_train)}, Test: {len(df_test)}")
        
        # Prepare data
        X_train, y_train, label_encoders, feature_cols = prepare_training_data(df_train)
        X_test, y_test, _, _ = prepare_training_data(df_test)
        
        # Ensure X_test has same columns
        X_test = X_test[feature_cols]
        
        # Train model
        model, metrics = train_lightgbm_model(X_train, y_train, X_test, y_test)
        
        # Save model
        model_key = write_model_to_s3(model, input_bucket, MODEL_PREFIX)
        
        # Save metadata
        metadata = {
            "model_type": "LightGBM",
            "training_date": datetime.now().isoformat(),
            "train_rows": len(df_train),
            "test_rows": len(df_test),
            "total_rows": len(df),
            "feature_columns": feature_cols,
            "metrics": metrics,
            "label_encoders_keys": list(label_encoders.keys()),
        }
        metadata_key = write_metadata_to_s3(metadata, input_bucket, METADATA_PREFIX)
        
        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": "Model training completed",
                "model_file": model_key,
                "metadata_file": metadata_key,
                "train_rows": len(df_train),
                "test_rows": len(df_test),
                "metrics": metrics,
            }),
        }
    
    except Exception as e:
        logger.error(f"Lambda execution failed: {e}", exc_info=True)
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)}),
        }
