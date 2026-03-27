# AutoInsight AWS API Documentation

## Base URL
```
https://{API_GATEWAY_URL}/predict
```

## Endpoints

### GET /predict - Vehicle Price Prediction

**Description:** Get predicted price and market analysis for a vehicle

**Query Parameters:**

| Parameter | Type | Required | Example | Description |
|-----------|------|----------|---------|-------------|
| `make` | string | Yes | `Toyota` | Vehicle manufacturer |
| `model` | string | Yes | `Prius` | Vehicle model |
| `year` | integer | Yes | `2020` | Manufacturing year |
| `mileage` | integer | No | `50000` | Current mileage in km |
| `district` | string | No | `Colombo` | Vehicle location |
| `vehicle_type` | string | No | `Car` | Type of vehicle |

**Example Request:**
```bash
GET /predict?make=Toyota&model=Prius&year=2020&mileage=50000
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "prediction": {
    "make": "Toyota",
    "model": "Prius",
    "year": 2020,
    "mileage": 50000,
    "predicted_price": 5850000,
    "predicted_price_formatted": "5,850,000 LKR"
  },
  "market_analysis": {
    "avg_price": 5930000,
    "prev_month_price": 5860000,
    "price_trend": "RISING",
    "total_listings": 12,
    "avg_mileage": 52000
  },
  "timestamp": "2026-03-27T14:35:22.123456"
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Missing required parameters: make, model, year"
}
```

**Error Response (500 Server Error):**
```json
{
  "error": "Model not found in S3"
}
```

---

## Response Fields

### prediction object
- `make` (string): Vehicle make
- `model` (string): Vehicle model
- `year` (integer): Vehicle year
- `mileage` (integer): Mileage in km or null
- `predicted_price` (float): Model prediction in LKR
- `predicted_price_formatted` (string): Human-readable format

### market_analysis object
- `avg_price` (float): Average market price for this make/model/year
- `prev_month_price` (float): Average price from previous month
- `price_trend` (string): One of `RISING`, `FALLING`, `STABLE`, or `N/A`
- `total_listings` (integer): Number of similar vehicles in market
- `avg_mileage` (float): Average mileage of similar vehicles

---

## Example Usage

### JavaScript/TypeScript Frontend

```typescript
// services/api.ts
export interface PriceRequest {
  make: string;
  model: string;
  year: number;
  mileage?: number;
  district?: string;
}

export interface PredictionResponse {
  success: boolean;
  prediction: {
    make: string;
    model: string;
    year: number;
    mileage: number | null;
    predicted_price: number;
    predicted_price_formatted: string;
  };
  market_analysis: {
    avg_price: number;
    prev_month_price: number;
    price_trend: "RISING" | "FALLING" | "STABLE" | "N/A";
    total_listings: number;
    avg_mileage: number;
  };
  timestamp: string;
}

const API_URL = process.env.REACT_APP_API_URL || "https://api.example.com";

export async function predictVehiclePrice(
  request: PriceRequest
): Promise<PredictionResponse> {
  const params = new URLSearchParams({
    make: request.make,
    model: request.model,
    year: request.year.toString(),
    ...(request.mileage && { mileage: request.mileage.toString() }),
    ...(request.district && { district: request.district }),
  });

  const response = await fetch(`${API_URL}/predict?${params}`);

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusCode}`);
  }

  const data = await response.json();
  return JSON.parse(data.body);
}
```

**Usage in Component:**
```typescript
const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
const [loading, setLoading] = useState(false);

async function handlePredict(make: string, model: string, year: number) {
  setLoading(true);
  try {
    const result = await predictVehiclePrice({
      make,
      model,
      year,
      mileage: 50000,
    });
    setPrediction(result);
  } catch (error) {
    console.error("Prediction failed:", error);
  } finally {
    setLoading(false);
  }
}
```

### React Component Display

```typescript
import React from "react";

export function PriceAnalysis({ prediction }) {
  if (!prediction) return null;

  const { prediction: pred, market_analysis: market } = prediction;

  return (
    <div className="price-analysis">
      <div className="prediction-card">
        <h3>Predicted Price</h3>
        <p className="price">
          <span className="value">{pred.predicted_price_formatted}</span>
        </p>
      </div>

      <div className="market-card">
        <h3>Market Analysis</h3>
        <div className="stat">
          <label>Average Market Price:</label>
          <span>{Math.round(market.avg_price).toLocaleString()} LKR</span>
        </div>
        <div className="stat">
          <label>Previous Month:</label>
          <span>{Math.round(market.prev_month_price).toLocaleString()} LKR</span>
        </div>
        <div className="stat">
          <label>Price Trend:</label>
          <span
            className={`trend ${market.price_trend.toLowerCase()}`}
          >
            {market.price_trend}
          </span>
        </div>
        <div className="stat">
          <label>Listings Available:</label>
          <span>{market.total_listings}</span>
        </div>
        <div className="stat">
          <label>Avg Mileage (Similar):</label>
          <span>{Math.round(market.avg_mileage).toLocaleString()} km</span>
        </div>
      </div>
    </div>
  );
}
```

**CSS Styling:**
```css
.price-analysis {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  padding: 20px;
}

.prediction-card,
.market-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.prediction-card h3,
.market-card h3 {
  margin-top: 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.prediction-card .price {
  margin: 20px 0;
  font-size: 28px;
  font-weight: bold;
  color: #2ecc71;
}

.market-card .stat {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.market-card .stat label {
  font-weight: 500;
  color: #555;
}

.market-card .stat span {
  color: #333;
}

.trend {
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
}

.trend.rising {
  color: #2ecc71;
  background: #d5f4e6;
}

.trend.falling {
  color: #e74c3c;
  background: #fadbd8;
}

.trend.stable {
  color: #f39c12;
  background: #fef5e7;
}

.trend.n-a {
  color: #95a5a6;
  background: #ecf0f1;
}
```

---

## Error Handling

### Common Errors

| Status | Error | Solution |
|--------|-------|----------|
| 400 | Missing required parameters | Ensure make, model, year are provided |
| 400 | Year must be numeric | Year must be a valid integer |
| 500 | Model not found in S3 | Train the model first (wait for daily training) |
| 500 | Insufficient data for prediction | Need at least 100 training samples |
| 503 | Lambda timeout | The prediction is taking too long; retry |

### Retry Logic

```typescript
async function predictWithRetry(
  request: PriceRequest,
  maxRetries = 3
): Promise<PredictionResponse> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await predictVehiclePrice(request);
    } catch (error) {
      if (attempt === maxRetries) throw error;
      // Exponential backoff
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }
}
```

---

## Rate Limiting

- **Free Tier:** 1,000 requests/month per API Gateway
- **Pro Tier:** 10,000 requests/month
- Contact AWS support for higher limits

---

## Pricing

| Resource | Cost |
|----------|------|
| API Gateway | $0.0035 per request (first 600M/month free) |
| Lambda | $0.0000002 per second |
| Data transfer | $0.09 per GB (first 1 GB free) |

**Example:** 1,000 predictions/month at 0.5s each:
- API Gateway: $3.50 (monthly minimum)
- Lambda: $0.17

---

## Support & Monitoring

### CloudWatch Logs
```bash
# View API Lambda logs
aws logs tail /aws/lambda/autoinsight-api --follow

# View specific errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/autoinsight-api \
  --filter-pattern "ERROR"
```

### Metrics Dashboard
Check AWS CloudWatch for:
- Request count
- Average duration
- Error rate
- Throttled requests

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-27 | Initial release |
| 1.1 | (TBD) | Add historical price trends |
| 1.2 | (TBD) | Add recommendation engine |
