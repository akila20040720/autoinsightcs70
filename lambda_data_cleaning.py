"""
AWS Lambda function to clean vehicle data from S3
Triggered after scraping completes
"""

import boto3
import csv
import json
import logging
import re
import pandas as pd
from datetime import datetime, timedelta
from io import StringIO, BytesIO

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3_client = boto3.client("s3")

# Configuration
S3_BUCKET = "autoinsight-data"  # Change to your bucket name
RAW_DATA_PREFIX = "raw-data/"
CLEANED_DATA_PREFIX = "cleaned-data/"

# Data cleaning thresholds
PRICE_CAP = 30_000_000  # Remove listings > 30M LKR
MILEAGE_CAP = 1_000_000  # Remove listings > 1M km
PRICE_FLOOR = 100_000  # Remove listings < 100K LKR


def parse_price(price_str: str) -> int | None:
    """Parse price string and return numeric value"""
    if not price_str or pd.isna(price_str):
        return None
    
    price_str = str(price_str).strip().lower()
    
    if "negotiable" in price_str:
        return None
    
    # Extract numeric part
    match = re.search(r"[\d,]+", price_str.replace(",", ""))
    if match:
        try:
            return int(float(match.group()))
        except ValueError:
            return None
    
    return None


def parse_mileage(mileage_val: int | float | None) -> int | None:
    """Parse and validate mileage"""
    if not mileage_val or pd.isna(mileage_val):
        return None
    
    try:
        mileage = int(float(mileage_val))
        return mileage if mileage >= 0 else None
    except (ValueError, TypeError):
        return None


def parse_date(date_str: str) -> str | None:
    """Parse various date formats from scraper"""
    if not date_str or pd.isna(date_str):
        return None
    
    date_str = str(date_str).strip()
    
    # Already in YYYY-MM-DD format
    if re.match(r"\d{4}-\d{2}-\d{2}", date_str):
        return date_str
    
    # DD/MM/YYYY format
    if re.match(r"\d{2}/\d{2}/\d{4}", date_str):
        try:
            date_obj = datetime.strptime(date_str, "%d/%m/%Y")
            return date_obj.strftime("%Y-%m-%d")
        except ValueError:
            return None
    
    return None


def clean_vehicles_data(df: pd.DataFrame) -> pd.DataFrame:
    """Apply all cleaning logic"""
    
    logger.info(f"Starting with {len(df)} rows")
    
    # Parse numeric fields
    df["Price"] = df["Price"].apply(parse_price)
    df["Milleage"] = df["Milleage"].apply(parse_mileage)
    df["published date"] = df["published date"].apply(parse_date)
    
    # Convert Year to numeric
    df["Year"] = pd.to_numeric(df["Year"], errors="coerce")
    
    # Remove rows with missing critical fields
    df = df.dropna(subset=["Make", "Model", "Year", "Price"])
    logger.info(f"After dropping nulls: {len(df)} rows")
    
    # Apply price thresholds
    df = df[
        (df["Price"] >= PRICE_FLOOR) &
        (df["Price"] <= PRICE_CAP)
    ]
    logger.info(f"After price filtering ({PRICE_FLOOR}-{PRICE_CAP}): {len(df)} rows")
    
    # Apply mileage threshold
    df = df[
        (df["Milleage"].isna()) |
        ((df["Milleage"] >= 0) & (df["Milleage"] <= MILEAGE_CAP))
    ]
    logger.info(f"After mileage filtering: {len(df)} rows")
    
    # Remove duplicates by Vehicle URL
    df = df.drop_duplicates(subset=["Vehicle URL"], keep="first")
    logger.info(f"After removing duplicates: {len(df)} rows")
    
    # Remove rows with invalid year
    df = df[
        (df["Year"] >= 1900) &
        (df["Year"] <= datetime.now().year + 1)
    ]
    logger.info(f"After year filtering: {len(df)} rows")
    
    # Fill empty values
    df["District"] = df["District"].fillna("Unknown")
    df["published date"] = df["published date"].fillna(datetime.now().strftime("%Y-%m-%d"))
    
    # Reset index
    df = df.reset_index(drop=True)
    
    return df


def read_csv_from_s3(bucket: str, key: str) -> pd.DataFrame:
    """Read CSV file from S3"""
    logger.info(f"Reading from S3: s3://{bucket}/{key}")
    
    try:
        response = s3_client.get_object(Bucket=bucket, Key=key)
        df = pd.read_csv(response["Body"])
        logger.info(f"Loaded {len(df)} rows")
        return df
    except Exception as e:
        logger.error(f"Failed to read from S3: {e}")
        raise


def write_csv_to_s3(df: pd.DataFrame, bucket: str, prefix: str) -> tuple[str, str]:
    """Write cleaned CSV to S3"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Convert to CSV
    csv_buffer = StringIO()
    df.to_csv(csv_buffer, index=False)
    csv_content = csv_buffer.getvalue()
    
    # Save timestamped version
    dated_key = f"{prefix}cleaned_vehicles_{timestamp}.csv"
    s3_client.put_object(Bucket=bucket, Key=dated_key, Body=csv_content)
    
    # Save latest version
    latest_key = f"{prefix}latest_cleaned_vehicles.csv"
    s3_client.put_object(Bucket=bucket, Key=latest_key, Body=csv_content)
    
    logger.info(f"Saved {len(df)} cleaned rows to: {dated_key} and {latest_key}")
    return dated_key, latest_key


def lambda_handler(event, context):
    """
    Lambda handler - clean raw vehicle data
    Triggered after scraping completes
    """
    try:
        logger.info("Starting data cleaning Lambda")
        
        # Get input parameters
        input_bucket = event.get("bucket", S3_BUCKET)
        input_key = event.get("raw_data_key", f"{RAW_DATA_PREFIX}latest_all_vehicles.csv")
        
        # Read raw data
        df_raw = read_csv_from_s3(input_bucket, input_key)
        
        # Clean data
        df_cleaned = clean_vehicles_data(df_raw)
        
        if len(df_cleaned) == 0:
            logger.warning("No data after cleaning")
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "No valid data after cleaning"}),
            }
        
        # Save cleaned data
        dated_key, latest_key = write_csv_to_s3(df_cleaned, input_bucket, CLEANED_DATA_PREFIX)
        
        logger.info(f"Cleaning complete: {len(df_raw)} → {len(df_cleaned)} rows")
        
        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": "Data cleaning completed",
                "input_rows": len(df_raw),
                "output_rows": len(df_cleaned),
                "dated_file": dated_key,
                "latest_file": latest_key,
            }),
        }
    
    except Exception as e:
        logger.error(f"Lambda execution failed: {e}", exc_info=True)
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)}),
        }
