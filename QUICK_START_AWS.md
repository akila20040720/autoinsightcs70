# AutoInsight AWS Migration - Complete Implementation Guide

## Quick Summary

You now have **4 AWS Lambda functions** that automate your entire ML pipeline:

```
📅 Daily at 2 AM → SCRAPE vehicles → CLEAN data → TRAIN model
                                                  ↓
                        🎯 On-demand API predictions (Make, Model, Year filters)
```

---

## What Was Created

### 1. **Lambda Functions** (4 total)

| Function | What It Does | When It Runs |
|----------|-------------|--------------|
| `lambda_scrape_to_s3.py` | Scrapes Riyasewana.com daily | EventBridge (2 AM daily) |
| `lambda_data_cleaning.py` | Cleans & validates CSV | After scraping completes |
| `lambda_model_training.py` | Trains LightGBM model | After cleaning completes |
| `lambda_prediction_api.py` | Serves price predictions via API | On-demand (called by frontend) |

### 2. **Documentation**

- `AWS_DEPLOYMENT_GUIDE.md` → Step-by-step deployment instructions
- `AWS_API_DOCUMENTATION.md` → Full API reference with code examples
- `test_lambdas_local.py` → Local testing before AWS deployment

### 3. **Deployment Automation**

- `deploy_lambdas.ps1` → Windows PowerShell script to package all Lambdas
- `requirements_lambda_*.txt` → Dependencies for each Lambda

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    AUTOINSIGHT ON AWS                        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  🌍 WEB SCRAPING (Daily)                                     │
│  ├─ EventBridge (cron: 0 2 * * ? *)                          │
│  └─ Lambda: lambda_scrape_to_s3 (15 min timeout, 3GB RAM)   │
│     Scrapes all vehicle types, saves to S3                   │
│     Output: s3://autoinsight-data/raw-data/                  │
│                                                               │
│  🧹 DATA CLEANING                                            │
│  ├─ Step Functions (triggered after scrape)                  │
│  └─ Lambda: lambda_data_cleaning (5 min timeout, 1GB RAM)    │
│     Removes duplicates, validates prices/mileage             │
│     Output: s3://autoinsight-data/cleaned-data/              │
│                                                               │
│  🤖 ML MODEL TRAINING                                        │
│  ├─ Step Functions (triggered after cleaning)                │
│  └─ Lambda: lambda_model_training (10 min timeout, 3GB RAM)  │
│     Trains LightGBM model on cleaned data                    │
│     Output: s3://autoinsight-data/models/                    │
│                                                               │
│  🎯 PREDICTION API (Real-time)                              │
│  ├─ API Gateway (REST endpoint)                              │
│  ├─ Lambda: lambda_prediction_api (1 min timeout, 1GB RAM)   │
│  └─ Query: ?make=Toyota&model=Prius&year=2020               │
│     Returns: Price prediction + Market analysis              │
│                                                               │
│  💾 STORAGE                                                  │
│  ├─ S3 Bucket: autoinsight-data                              │
│  ├─ Raw CSVs, Cleaned data, Models                           │
│  └─ Total cost: ~$2-3/month for 100GB                        │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 🚀 Deployment Checklist (Start Here!)

### Phase 1: AWS Setup (30 min)

- [ ] Create AWS account
- [ ] Create S3 bucket: `autoinsight-data`
- [ ] Create IAM role: `autoinsight-lambda-role` with S3 + Lambda permissions
- [ ] Enable billing alerts (avoid surprises)

### Phase 2: Package Lambdas (15 min)

```bash
# From PowerShell in the project root:
powershell -ExecutionPolicy Bypass -File deploy_lambdas.ps1
```

This creates 4 ZIP files in `lambda_deployment/` folder

### Phase 3: Test Locally (10 min)

```bash
# Optional but recommended - test all functions locally
python test_lambdas_local.py
```

### Phase 4: Deploy to AWS (45 min)

For each ZIP file (`lambda_scrape_to_s3.zip`, etc.):

1. Go to **AWS Lambda Console**
2. Click **Create Function**
3. Upload ZIP from `lambda_deployment/`
4. Set timeout, memory, environment variables (see guide)
5. Save

### Phase 5: Configure Triggers (30 min)

- **EventBridge:** Daily schedule → `lambda_scrape_to_s3`
- **Step Functions:** Chain scrape → clean → train
- **API Gateway:** Create REST endpoint → `lambda_prediction_api`

### Phase 6: Test End-to-End (15 min)

```bash
# Test scraping Lambda
aws lambda invoke --function-name autoinsight-scrape \
  --payload '{"types":["cars"],"max_pages_per_type":1}' \
  response.json

# Test prediction API
curl "https://YOUR_API_URL/predict?make=Toyota&model=Prius&year=2020"
```

### Phase 7: Connect Frontend (30 min)

Update `cs70/.env`:
```
REACT_APP_API_URL=https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com
```

Update `cs70/src/services/api.ts` (use code from AWS_API_DOCUMENTATION.md)

---

## 📊 Expected Monthly Costs

| Service | Cost |
|---------|------|
| Lambda (scrape 1x day) | $0.50 |
| Lambda (clean+train 1x day) | $0.50 |
| Lambda (100 API calls/day) | $0.10 |
| S3 Storage (100GB) | $2.30 |
| API Gateway | $3.50 |
| **Total** | **~$7-10/month** |

---

## 🔧 Key Configuration Files

### lambda_scrape_to_s3.py
```python
S3_BUCKET = "autoinsight-data"
ALLOWED_TYPES = ["cars", "vans", "pickups", "suvs"]
# Scrapes up to 5 pages per type (adjust for cost/data tradeoff)
```

### lambda_data_cleaning.py
```python
PRICE_CAP = 30_000_000    # Remove listings > 30M LKR
MILEAGE_CAP = 1_000_000   # Remove listings > 1M km
PRICE_FLOOR = 100_000     # Remove listings < 100K LKR
```

### lambda_model_training.py
```python
TEST_SPLIT_DAYS = 90      # Use last 90 days as test set
RANDOM_STATE = 42         # Reproducible results
```

### lambda_prediction_api.py
```python
MODEL_CACHE_TTL = 3600    # Cache model for 1 hour
# Uses latest model from S3 automatically
```

---

## 🧪 Testing Your Setup

### 1. Manual Test (Before going live)

```bash
# Test via AWS CLI
aws lambda invoke \
  --function-name autoinsight-scrape \
  --payload '{"types": ["cars"], "max_pages_per_type": 1}' \
  /tmp/response.json

# View response
type \tmp\response.json
```

### 2. Monitor Logs

```bash
# Watch scraping Lambda logs
aws logs tail /aws/lambda/autoinsight-scrape --follow

# Filter for errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/autoinsight-scrape \
  --filter-pattern "ERROR"
```

### 3. Test Full Pipeline

- Trigger scrape manually
- Wait 5 minutes, check S3 for `raw-data/latest_all_vehicles.csv`
- Run cleaning Lambda
- Wait 5 minutes, check S3 for `cleaned-data/latest_cleaned_vehicles.csv`
- Run training Lambda
- Wait 10 minutes, check S3 for `models/lgbm_model_*.pkl`
- Test API endpoint: `curl "https://your-api/predict?make=Toyota&model=Prius&year=2020"`

---

## 📝 Frontend Integration Examples

See `AWS_API_DOCUMENTATION.md` for complete examples with:
- React component code
- CSS styling
- Error handling
- Retry logic

Quick preview:
```typescript
import { predictVehiclePrice } from './services/api';

function MarketAnalysis() {
  const [result, setResult] = useState(null);
  
  async function analyze(make, model, year) {
    const data = await predictVehiclePrice({ make, model, year });
    setResult(data.market_analysis);
  }
  
  return (
    <div>
      <h3>Price: {result?.prediction.predicted_price_formatted}</h3>
      <p>Trend: {result?.market_analysis.price_trend}</p>
    </div>
  );
}
```

---

## 🆘 Troubleshooting

### Issue: Lambda timeout
**Solution:** Increase timeout in Lambda configuration or reduce `max_pages_per_type`

### Issue: S3 permission denied
**Solution:** Check IAM role has `s3:GetObject` + `s3:PutObject` permissions

### Issue: Model not found in predictions
**Solution:** Run training Lambda first; ensure model files exist in S3

### Issue: API returns 500 error
**Solution:** Check CloudWatch logs:
```bash
aws logs tail /aws/lambda/autoinsight-api --follow
```

### Issue: Predictions seem inaccurate
**Solution:** Check data cleaning thresholds (PRICE_CAP, etc.) might be filtering out training data

---

## 🎯 Next Steps After Deployment

1. **Day 1:** Monitor logs for 24 hours
2. **Week 1:** Let system scrape and train for full week; verify trends make sense
3. **Week 2:** Tune model parameters (learning_rate, num_leaves) if needed
4. **Month 1:** Review cost dashboard; adjust `max_pages_per_type` if needed
5. **Ongoing:** Monitor prediction accuracy; retrain weekly or monthly

---

## 📚 Documentation Reference

| Document | Purpose |
|----------|---------|
| `AWS_DEPLOYMENT_GUIDE.md` | Step-by-step AWS setup instructions |
| `AWS_API_DOCUMENTATION.md` | API reference + frontend code examples |
| `test_lambdas_local.py` | Local testing before deployment |
| `lambda_*.py` | The actual Lambda function code |

---

## 💡 Key Features After Deployment

✅ **Automatic Daily Scraping** - No manual intervention needed
✅ **Real-time Predictions** - API responds in <1 second
✅ **Market Analysis** - Shows price trends, avg listings, demand
✅ **Filter by Make/Model/Year** - Exactly what you need for dashboard
✅ **Runs in AWS** - Fully serverless, scales automatically
✅ **Cost ~$10/month** - Cheaper than most cloud solutions

---

## 🔐 Security Notes

- Store AWS credentials in `~/.aws/credentials`, never in code
- Use IAM roles to restrict Lambda permissions
- Enable S3 versioning for data backup
- Monitor AWS CloudTrail for unauthorized access
- Set up AWS Budget alerts to prevent surprise charges

---

## 📞 Support Resources

- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [AWS API Gateway Guide](https://docs.aws.amazon.com/apigateway/)
- [LightGBM Documentation](https://lightgbm.readthedocs.io/)
- [Boto3 (AWS SDK for Python)](https://boto3.amazonaws.com/v1/documentation/api/latest/index.html)

---

**Ready to deploy?** Start with Phase 1 of the checklist above! 🚀
