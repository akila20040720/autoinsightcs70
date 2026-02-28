# Vehicle Price Prediction ML Model

This directory contains the machine learning model and API for predicting vehicle prices based on scraped data from AutoInsight.

## 📁 Directory Structure

```
ML_Model/
├── app.py                  # Flask API application
├── Dockerfile              # Docker container configuration
├── docker-compose.yml      # Multi-container orchestration
├── requirements.txt        # Python dependencies
├── nginx.conf             # Nginx reverse proxy config
├── .env.example           # Environment variables template
├── .dockerignore          # Docker ignore patterns
├── models/                # Trained models directory
│   ├── best_model.pkl
│   ├── random_forest_model.pkl
│   ├── xgboost_model.pkl
│   ├── label_encoders.pkl
│   ├── scaler.pkl
│   └── model_metadata.json
├── data/                  # Training data directory
└── logs/                  # Application logs

```

## 🚀 Quick Start with Docker

### Prerequisites
- Docker Desktop installed
- Docker Compose installed

### 1. Setup Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env file if needed
notepad .env
```

### 2. Train the Model

Before running the API, train the model using the notebook:
- Open `web_scrapping/Automations/automate.ipynb`
- Run all cells in the ML Pipeline section
- This will generate model files in the `models/` directory

### 3. Build and Run with Docker

```bash
# Navigate to ML_Model directory
cd ML_Model

# Build and start services
docker-compose up --build

# Or run in detached mode
docker-compose up -d
```

The API will be available at:
- API: http://localhost:5000
- Swagger Docs: http://localhost:5000/docs
- Health Check: http://localhost:5000/health
- Nginx (if enabled): http://localhost:80

### 4. Stop Services

```bash
# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## 📊 API Endpoints

### Health Check
```bash
GET /health
```

### Model Information
```bash
GET /model/info
```

### Single Prediction
```bash
POST /predict
Content-Type: application/json

{
  "vehicle_type": "Car",
  "make": "Toyota",
  "model": "Axio",
  "year": 2018,
  "mileage": 45000,
  "district": "Colombo",
  "condition": "Used"
}
```

### Batch Prediction
```bash
POST /predict/batch
Content-Type: application/json

{
  "vehicles": [
    {
      "vehicle_type": "Car",
      "make": "Toyota",
      "model": "Axio",
      "year": 2018,
      "mileage": 45000,
      "district": "Colombo",
      "condition": "Used"
    },
    {
      "vehicle_type": "Car",
      "make": "Honda",
      "model": "Civic",
      "year": 2020,
      "mileage": 25000,
      "district": "Kandy",
      "condition": "Reconditioned"
    }
  ]
}
```

### Get Encoder Values
```bash
GET /encoders/values
```

## 💻 Testing the API

### Using cURL

```bash
# Health check
curl http://localhost:5000/health

# Predict price
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "vehicle_type": "Car",
    "make": "Toyota",
    "model": "Axio",
    "year": 2018,
    "mileage": 45000,
    "district": "Colombo",
    "condition": "Used"
  }'
```

### Using PowerShell

```powershell
# Health check
Invoke-RestMethod -Uri "http://localhost:5000/health" -Method Get

# Predict price
$body = @{
    vehicle_type = "Car"
    make = "Toyota"
    model = "Axio"
    year = 2018
    mileage = 45000
    district = "Colombo"
    condition = "Used"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/predict" -Method Post -Body $body -ContentType "application/json"
```

### Using Python

```python
import requests

# Predict price
url = "http://localhost:5000/predict"
data = {
    "vehicle_type": "Car",
    "make": "Toyota",
    "model": "Axio",
    "year": 2018,
    "mileage": 45000,
    "district": "Colombo",
    "condition": "Used"
}

response = requests.post(url, json=data)
print(response.json())
```

## 🔧 Development

### Run without Docker (Local Development)

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
$env:FLASK_APP="app.py"
$env:MODEL_PATH="./models"

# Run the app
python app.py
```

### View Logs

```bash
# View API logs
docker-compose logs -f ml-api

# View all logs
docker-compose logs -f
```

### Update Models

When you retrain the model:
1. Run the notebook cells to generate new model files
2. Restart the Docker container:
```bash
docker-compose restart ml-api
```

## 📈 Model Performance

The current model uses either Random Forest or XGBoost (best performer) with the following features:
- Vehicle Type (encoded)
- Make (encoded)
- Model (encoded)
- District (encoded)
- Condition (encoded)
- Year
- Mileage
- Vehicle Age
- Mileage per Year

Performance metrics are saved in `models/model_metadata.json`.

## 🔒 Security Notes

For production deployment:
1. Set a strong `SECRET_KEY` in `.env`
2. Enable API key authentication
3. Use HTTPS with proper SSL certificates
4. Restrict CORS origins
5. Implement rate limiting
6. Use environment-specific configurations

## 🐛 Troubleshooting

### Models not loading
- Ensure you've run the training notebook first
- Check that model files exist in the `models/` directory
- Verify file permissions

### Port already in use
```bash
# Change port in docker-compose.yml or .env
ports:
  - "5001:5000"  # Use 5001 instead
```

### Container won't start
```bash
# Check logs
docker-compose logs ml-api

# Rebuild without cache
docker-compose build --no-cache
docker-compose up
```

## 📝 License

Part of the AutoInsight Dashboard project.

## 🤝 Contributing

For issues or improvements, please refer to the main project repository.
