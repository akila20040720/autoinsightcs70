# AWS Lambda Deployment Guide for AutoInsight

## Overview

Your AutoInsight system will run on AWS using 4 Lambda functions in a coordinated pipeline:

```
1. Daily Scrape (EventBridge triggered)
   ↓
2. Data Cleaning (triggered by Step Functions)
   ↓
3. Model Training (triggered by Step Functions)
   ↓
4. Prediction API (always running, triggered by API requests)
```

---

## Architecture Components

### Storage (S3)
- **Bucket:** `autoinsight-data`
- **Folders:**
  - `raw-data/` → Raw scraped CSV files
  - `cleaned-data/` → Cleaned and validated CSV files
  - `models/` → Trained LightGBM model pickle files
  - `metadata/` → Training metadata and statistics

### Compute (Lambda)
| Function | Trigger | Timeout | Memory |
|----------|---------|---------|--------|
| `lambda_scrape_to_s3` | EventBridge (daily 2 AM) | 900s (15 min) | 3GB |
| `lambda_data_cleaning` | Step Functions | 300s (5 min) | 1GB |
| `lambda_model_training` | Step Functions | 600s (10 min) | 3GB |
| `lambda_prediction_api` | API Gateway | 60s | 1GB |

### API Gateway
- **Endpoint:** `/predict`
- **Method:** GET
- **Query Parameters:** `make`, `model`, `year`, `mileage`, `district`, `vehicle_type`

### Workflow Orchestration (Step Functions)
Chains: Scrape → Clean → Train (automatically)

---

## Step 1: Prerequisites

### A. AWS Account Setup
```bash
# Install AWS CLI
pip install awscli

# Configure credentials
aws configure
# Enter: Access Key ID, Secret Access Key, Region (us-east-1), Format (json)
```

### B. Create S3 Bucket
```bash
aws s3 mb s3://autoinsight-data --region us-east-1
```

### C. Create IAM Role for Lambda
```bash
# 1. Go to AWS Console → IAM → Roles → Create Role
# 2. Select "Lambda" as service
# 3. Attach policies:
#    - AWSLambdaFullAccess
#    - AmazonS3FullAccess
#    - CloudWatchLogsFullAccess
# 4. Name it: autoinsight-lambda-role
```

---

## Step 2: Prepare Lambda Deployment Packages

### For Each Lambda Function:

1. **Create deployment folder:**
```bash
mkdir lambda_deployment
cd lambda_deployment
```

2. **Install dependencies in folder:**
```bash
# For scraping Lambda (requires Selenium + Chrome/Chromium)
pip install -t ./scrape_package \
  boto3 \
  selenium==4.20.0 \
  beautifulsoup4==4.12.0 \
  webdriver-manager==4.0.0

# For cleaning Lambda
pip install -t ./clean_package \
  boto3 \
  pandas \
  numpy

# For training Lambda
pip install -t ./train_package \
  boto3 \
  pandas \
  numpy \
  lightgbm \
  scikit-learn

# For API Lambda
pip install -t ./api_package \
  boto3 \
  pandas \
  numpy \
  lightgbm \
  scikit-learn
```

3. **Copy Lambda handler file:**
```bash
cp lambda_scrape_to_s3.py scrape_package/
cp lambda_data_cleaning.py clean_package/
cp lambda_model_training.py train_package/
cp lambda_prediction_api.py api_package/
```

4. **Create deployment ZIP:**
```bash
cd scrape_package && zip -r ../lambda_scrape_to_s3.zip . && cd ..
cd clean_package && zip -r ../lambda_data_cleaning.zip . && cd ..
cd train_package && zip -r ../lambda_model_training.zip . && cd ..
cd api_package && zip -r ../lambda_prediction_api.zip . && cd ..
```

---

## Step 3: Deploy Lambda Functions via AWS Console

For each Lambda function:

1. **Go to AWS Lambda Console**
2. **Click "Create Function"**
3. **Configuration:**
   - Name: `autoinsight-scrape` (or clean/train/api)
   - Runtime: `Python 3.11`
   - Role: Select the role created earlier
4. **Upload ZIP file** (Code section)
5. **Configuration:**
   - Timeout: See table above
   - Memory: See table above
   - Environment variables:
     ```
     S3_BUCKET = autoinsight-data
     ```
6. **Handler:** `lambda_scrape_to_s3.lambda_handler` (adjust for each)

---

## Step 4: Setup EventBridge for Daily Scheduling

1. **Go to EventBridge Console**
2. **Create Rule:**
   - Name: `autoinsight-daily-scrape`
   - Schedule: `cron(0 2 * * ? *)` (Daily at 2 AM UTC)
3. **Add Target:**
   - Type: Lambda function
   - Function: `autoinsight-scrape`
   - Input: 
     ```json
     {
       "types": ["cars", "vans", "pickups", "suvs"],
       "max_pages_per_type": 10
     }
     ```

---

## Step 5: Setup Step Functions Workflow

Create a workflow (State Machine) that chains: Scrape → Clean → Train

```json
{
  "Comment": "AutoInsight ML Pipeline",
  "StartAt": "ScrapeData",
  "States": {
    "ScrapeData": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:YOUR_ACCOUNT:function:autoinsight-scrape",
      "Next": "CleanData"
    },
    "CleanData": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:YOUR_ACCOUNT:function:autoinsight-clean",
      "Next": "TrainModel"
    },
    "TrainModel": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:YOUR_ACCOUNT:function:autoinsight-train",
      "End": true
    }
  }
}
```

---

## Step 6: Setup API Gateway

1. **Go to API Gateway Console**
2. **Create API:**
   - Type: REST API
   - Name: `autoinsight-api`
3. **Create Resource:**
   - Path: `/predict`
4. **Create GET Method:**
   - Integration type: Lambda Function
   - Function: `autoinsight-api`
5. **Enable CORS** (for frontend calls)
6. **Deploy:**
   - Stage: `prod`
   - Copy Invoke URL

---

## Step 7: Update Frontend to Use API

In your React frontend ([cs70/src/](file:///d%3A/AutoInsight%20Dashboard/autoinsightcs70/cs70/src/)):

```typescript
// Create api/predictions.ts
export async function getPricePredictor(
  make: string,
  model: string,
  year: number,
  mileage?: number
) {
  const params = new URLSearchParams({
    make,
    model,
    year: year.toString(),
    ...(mileage && { mileage: mileage.toString() }),
  });

  const response = await fetch(
    `${process.env.REACT_APP_API_URL}/predict?${params}`,
    { method: 'GET' }
  );

  return response.json();
}
```

In `.env`:
```
REACT_APP_API_URL=https://YOUR_API_GATEWAY_URL
```

---

## Step 8: Monitor & Troubleshoot

### View Logs
```bash
aws logs tail /aws/lambda/autoinsight-scrape --follow
aws logs tail /aws/lambda/autoinsight-clean --follow
aws logs tail /aws/lambda/autoinsight-train --follow
```

### Test Scrape Lambda
```bash
aws lambda invoke \
  --function-name autoinsight-scrape \
  --payload '{"types": ["cars"], "max_pages_per_type": 1}' \
  response.json
```

### Test Prediction
```bash
curl "https://YOUR_API_URL/predict?make=Toyota&model=Prius&year=2020&mileage=50000"
```

---

## Cost Estimation (Monthly)

| Service | Estimate |
|---------|----------|
| Lambda (scrape: 1x/day × 10min) | $0.50 |
| Lambda (clean: 1x/day × 3min) | $0.10 |
| Lambda (train: 1x/day × 8min) | $0.40 |
| Lambda (API: 100 calls/day × 0.5s) | $0.10 |
| S3 Storage (100GB) | $2.30 |
| S3 Requests | $0.40 |
| API Gateway | $3.50 |
| EventBridge | Free |
| **Total** | **~$7-10/month** |

---

## Critical Environment Variables

Update in each Lambda:

```bash
# All Lambdas
S3_BUCKET="autoinsight-data"

# Training Lambda
PRICE_CAP="30000000"          # Max price in LKR
MILEAGE_CAP="1000000"         # Max mileage in km
PRICE_FLOOR="100000"          # Min price in LKR

# API Lambda
MODEL_CACHE_TTL="3600"        # Model cache validity (seconds)
```

---

## Deployment Checklist

- [ ] AWS account created
- [ ] S3 bucket `autoinsight-data` created
- [ ] IAM role `autoinsight-lambda-role` created
- [ ] All 4 Lambda functions deployed
- [ ] EventBridge rule for daily scraping created
- [ ] Step Functions workflow created
- [ ] API Gateway endpoint created
- [ ] Frontend environment variables updated
- [ ] Test scraping Lambda manually
- [ ] Test prediction API endpoint
- [ ] Monitor CloudWatch logs for errors

---

## Next Steps

1. **Deploy today** with this guide
2. **First scrape:** Manually trigger to verify data flows to S3
3. **Monitor:** Check CloudWatch logs for 24 hours
4. **Adjust:** Fine-tune `max_pages_per_type` based on cost/data ratio
5. **Integrate:** Update frontend to call the prediction API

Need help? Check CloudWatch Logs for specific error messages.
