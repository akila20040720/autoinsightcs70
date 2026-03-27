"""
AWS Lambda function to serve vehicle price predictions via API
Triggered by API Gateway REST requests
"""

import boto3
import json
import logging
import pickle
import pandas as pd
import numpy as np
from datetime import datetime
from sklearn.preprocessing import LabelEncoder

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3_client = boto3.client("s3")

# Configuration
S3_BUCKET = "autoinsight-data"  # Change to your bucket name
MODEL_PREFIX = "models/"
CLEANED_DATA_PREFIX = "cleaned-data/"

# Global cache for model and data
_model_cache = None
_data_cache = None
_cache_time = None
_cache_ttl_seconds = 3600  # 1 hour


def get_latest_s3_object(bucket: str, prefix: str) -> str | None:
    """Get the latest object key in S3 prefix"""
    try:
        response = s3_client.list_objects_v2(Bucket=bucket, Prefix=prefix)
        if "Contents" not in response:
            return None
        
        # Sort by LastModified descending and get latest
        latest = max(response["Contents"], key=lambda x: x["LastModified"])
        return latest["Key"]
    except Exception as e:
        logger.error(f"Failed to list S3 objects: {e}")
        return None


def load_model_from_s3(bucket: str, model_key: str):
    """Load pickled model from S3"""
    try:
        response = s3_client.get_object(Bucket=bucket, Key=model_key)
        model_bytes = response["Body"].read()
        model = pickle.loads(model_bytes)
        logger.info(f"Loaded model from {model_key}")
        return model
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        raise


def load_data_from_s3(bucket: str, data_key: str) -> pd.DataFrame:
    """Load cleaned data from S3 for reference statistics"""
    try:
        response = s3_client.get_object(Bucket=bucket, Key=data_key)
        df = pd.read_csv(response["Body"])
        logger.info(f"Loaded {len(df)} rows from {data_key}")
        return df
    except Exception as e:
        logger.error(f"Failed to load data: {e}")
        raise


def get_model_and_data(bucket: str, models_prefix: str, data_prefix: str):
    """Get cached model and data, or load from S3"""
    global _model_cache, _data_cache, _cache_time
    
    # Check cache validity
    now = datetime.now().timestamp()
    if _cache_time is not None and (now - _cache_time) < _cache_ttl_seconds:
        logger.info("Using cached model and data")
        return _model_cache, _data_cache
    
    # Load latest model
    model_key = get_latest_s3_object(bucket, models_prefix)
    if not model_key:
        raise RuntimeError("No model found in S3")
    
    model = load_model_from_s3(bucket, model_key)
    
    # Load latest cleaned data
    data_key = get_latest_s3_object(bucket, data_prefix)
    if not data_key:
        logger.warning("No data found in S3 for statistics")
        data = None
    else:
        data = load_data_from_s3(bucket, data_key)
    
    # Update cache
    _model_cache = model
    _data_cache = data
    _cache_time = now
    
    return model, data


def encode_feature(value: str, feature_name: str, all_values: list) -> int:
    """Encode categorical feature"""
    unique_vals = sorted(set(all_values))
    if value in unique_vals:
        return unique_vals.index(value)
    return 0  # Default to first category


def prepare_prediction_input(
    make: str,
    model: str,
    year: int,
    mileage: int | None,
    district: str | None,
    vehicle_type: str | None,
    reference_data: pd.DataFrame,
) -> np.ndarray:
    """Prepare input features for prediction"""
    
    # Get reference statistics from data
    if reference_data is not None:
        makes = reference_data["Make"].dropna().unique().tolist()
        models = reference_data["Model"].dropna().unique().tolist()
        districts = reference_data["District"].dropna().unique().tolist()
        vehicle_types = reference_data["Vehicle Type"].dropna().unique().tolist()
    else:
        makes = [make]
        models = [model]
        districts = [district or "Unknown"]
        vehicle_types = [vehicle_type or "Car"]
    
    # Encode features
    make_encoded = encode_feature(make, "Make", makes)
    model_encoded = encode_feature(model, "Model", models)
    district_encoded = encode_feature(district or "Unknown", "District", districts)
    vehicle_type_encoded = encode_feature(vehicle_type or "Car", "Vehicle Type", vehicle_types)
    
    # Calculate derived features
    vehicle_age = datetime.now().year - year if year else 0
    vehicle_age = max(0, min(vehicle_age, 100))
    
    month_published = datetime.now().month
    day_of_week = datetime.now().weekday()
    
    # Count occurrences in data
    if reference_data is not None:
        make_model_count = len(
            reference_data[
                (reference_data["Make"] == make) & (reference_data["Model"] == model)
            ]
        )
    else:
        make_model_count = 1
    
    # Feature vector (must match training)
    features = np.array([
        make_encoded,
        model_encoded,
        year,
        mileage or 0,
        district_encoded,
        vehicle_type_encoded,
        vehicle_age,
        month_published,
        day_of_week,
        make_model_count,
    ], dtype=np.float32)
    
    return features.reshape(1, -1)


def get_market_statistics(
    make: str,
    model: str,
    year: int | None,
    reference_data: pd.DataFrame,
) -> dict:
    """Get market statistics for a vehicle"""
    
    if reference_data is None or len(reference_data) == 0:
        return {
            "avg_price": 0,
            "prev_month_price": 0,
            "price_trend": "N/A",
            "total_listings": 0,
        }
    
    # Filter data
    filtered = reference_data[
        (reference_data["Make"].str.upper() == make.upper()) &
        (reference_data["Model"].str.upper() == model.upper())
    ]
    
    if year and "Year" in reference_data.columns:
        filtered = filtered[filtered["Year"] == year]
    
    if len(filtered) == 0:
        return {
            "avg_price": 0,
            "prev_month_price": 0,
            "price_trend": "N/A",
            "total_listings": 0,
        }
    
    # Calculate statistics
    avg_price = filtered["Price"].mean()
    
    # Try to get previous month price
    if "published date" in filtered.columns:
        filtered["published date"] = pd.to_datetime(filtered["published date"], errors="coerce")
        current_month = filtered[
            filtered["published date"] >= pd.Timestamp.now().replace(day=1)
        ]
        prev_month = filtered[
            (filtered["published date"] >= pd.Timestamp.now().replace(day=1) - pd.DateOffset(months=1))
            & (filtered["published date"] < pd.Timestamp.now().replace(day=1))
        ]
        
        prev_month_price = prev_month["Price"].mean() if len(prev_month) > 0 else avg_price
    else:
        prev_month_price = avg_price
    
    # Determine trend
    if prev_month_price > 0:
        price_change = ((avg_price - prev_month_price) / prev_month_price) * 100
        if price_change > 2:
            trend = "RISING"
        elif price_change < -2:
            trend = "FALLING"
        else:
            trend = "STABLE"
    else:
        trend = "N/A"
    
    return {
        "avg_price": float(avg_price),
        "prev_month_price": float(prev_month_price),
        "price_trend": trend,
        "total_listings": len(filtered),
        "avg_mileage": float(filtered["Milleage"].mean()) if "Milleage" in filtered.columns else 0,
    }


def lambda_handler(event, context):
    """
    API Gateway handler for price predictions
    
    Query parameters:
    - make: Vehicle make (required)
    - model: Vehicle model (required)
    - year: Vehicle year (required)
    - mileage: Optional mileage (km)
    - district: Optional district
    - vehicle_type: Optional vehicle type
    """
    try:
        logger.info(f"Received request: {event}")
        
        # Parse query parameters
        query_params = event.get("queryStringParameters") or {}
        
        make = query_params.get("make")
        model = query_params.get("model")
        year = query_params.get("year")
        
        if not make or not model or not year:
            return {
                "statusCode": 400,
                "body": json.dumps({
                    "error": "Missing required parameters: make, model, year"
                }),
            }
        
        try:
            year = int(year)
        except ValueError:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "Year must be numeric"}),
            }
        
        mileage = query_params.get("mileage")
        if mileage:
            try:
                mileage = int(mileage)
            except ValueError:
                mileage = None
        
        district = query_params.get("district")
        vehicle_type = query_params.get("vehicle_type")
        
        # Load ML model and reference data
        ml_model, reference_data = get_model_and_data(
            S3_BUCKET, MODEL_PREFIX, CLEANED_DATA_PREFIX
        )
        
        # Prepare input features
        features = prepare_prediction_input(
            make, model, year, mileage, district, vehicle_type, reference_data
        )
        
        # Predict price using the ML model
        predicted_price = float(ml_model.predict(features)[0])
        predicted_price = max(predicted_price, 100000)  # Enforce price floor
        
        # Get market statistics
        market_stats = get_market_statistics(make, model, year, reference_data)
        
        response = {
            "statusCode": 200,
            "body": json.dumps({
                "success": True,
                "prediction": {
                    "make": make,
                    "model": model,
                    "year": year,
                    "mileage": mileage,
                    "predicted_price": predicted_price,
                    "predicted_price_formatted": f"{predicted_price:,.0f} LKR",
                },
                "market_analysis": market_stats,
                "timestamp": datetime.now().isoformat(),
            }),
        }
        
        return response
    
    except Exception as e:
        logger.error(f"Prediction failed: {e}", exc_info=True)
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)}),
        }


# For testing locally
if __name__ == "__main__":
    test_event = {
        "queryStringParameters": {
            "make": "Toyota",
            "model": "Prius",
            "year": "2020",
            "mileage": "50000",
        }
    }
    print(json.dumps(json.loads(lambda_handler(test_event, None)["body"]), indent=2))
