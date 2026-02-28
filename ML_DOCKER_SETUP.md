# 🚀 ML Pipeline Docker Setup - Quick Start Guide

This guide will help you set up and run the ML Pipeline for vehicle price prediction using Docker.

## 📋 Prerequisites

1. **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop)
   - Includes both Docker and Docker Compose
   - Available for Windows, Mac, and Linux

2. **Python 3.10+** (for training the model)
3. **Jupyter Notebook** (for training)

## 🎯 Step-by-Step Guide

### Step 1: Train the ML Model

Before deploying the API, you need to train the model:

1. Open the Jupyter notebook:
   ```
   web_scrapping/Automations/automate.ipynb
   ```

2. Run all cells in the **"🤖 ML Pipeline for Vehicle Price Prediction"** section
   - Cell 1: Web scraping (already there)
   - Cell 2: Data cleaning (already there)
   - Cell 3: Feature engineering
   - Cell 4: Encoding
   - Cell 5: Train/test split
   - Cell 6: Random Forest training
   - Cell 7: XGBoost training
   - Cell 8: Save models

3. After running all cells, you should have these files in `ML_Model/models/`:
   - `best_model.pkl`
   - `random_forest_model.pkl`
   - `xgboost_model.pkl`
   - `label_encoders.pkl`
   - `scaler.pkl`
   - `model_metadata.json`

### Step 2: Navigate to ML_Model Directory

```powershell
cd "d:\AutoInsight Dashboard\autoinsightcs70\ML_Model"
```

### Step 3: Run the Setup Script

**Windows (PowerShell):**
```powershell
.\start.ps1
```

**Linux/Mac:**
```bash
chmod +x start.sh
./start.sh
```

The script will:
- ✅ Check Docker installation
- ✅ Check for trained models
- ✅ Setup environment variables
- ✅ Give you options to start/stop services

### Step 4: Choose an Action

When prompted, select:
- **Option 1**: Build and start in background (recommended for first time)
- **Option 2**: Build and start with live logs
- **Option 3**: Stop services
- **Option 4**: View logs
- **Option 5**: Restart services
- **Option 6**: Run tests

### Step 5: Access the API

Once services are running:

- **API Base URL**: http://localhost:5000
- **Swagger Documentation**: http://localhost:5000/docs
- **Health Check**: http://localhost:5000/health
- **Model Info**: http://localhost:5000/model/info

## 🧪 Test the API

### Option 1: Use the Test Script

```powershell
python test_api.py
```

### Option 2: Use PowerShell

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

### Option 3: Use Swagger UI

1. Open browser: http://localhost:5000/docs
2. Click on `/predict` endpoint
3. Click "Try it out"
4. Enter values
5. Click "Execute"

## 📊 Example API Requests

### Single Prediction

```json
POST http://localhost:5000/predict
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

**Response:**
```json
{
  "predicted_price": 4250000.50,
  "predicted_price_formatted": "Rs. 4,250,000.50",
  "input_data": {
    "vehicle_type": "Car",
    "make": "Toyota",
    "model": "Axio",
    "year": 2018,
    "mileage": 45000,
    "district": "Colombo",
    "condition": "Used",
    "vehicle_age": 8
  },
  "timestamp": "2026-02-26T15:30:45"
}
```

### Batch Prediction

```json
POST http://localhost:5000/predict/batch
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

## 🛠️ Manual Docker Commands

If you prefer not to use the script:

```powershell
# Build and start in detached mode
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View running containers
docker-compose ps

# Remove everything (including volumes)
docker-compose down -v
```

## 🔧 Development Mode

To run without Docker (for development):

```powershell
# Install dependencies
pip install -r requirements.txt

# Set environment variables
$env:FLASK_APP="app.py"
$env:MODEL_PATH="./models"
$env:DEBUG="True"

# Run the app
python app.py
```

## 📁 Project Structure

```
ML_Model/
├── app.py                  # Flask API application
├── Dockerfile              # Docker container config
├── docker-compose.yml      # Multi-container orchestration
├── requirements.txt        # Python dependencies
├── nginx.conf             # Nginx config (optional)
├── start.ps1              # Windows startup script
├── start.sh               # Linux/Mac startup script
├── test_api.py            # API test suite
├── .env.example           # Environment template
├── .dockerignore          # Docker ignore patterns
├── README.md              # Detailed documentation
├── models/                # Trained ML models
│   ├── best_model.pkl
│   ├── label_encoders.pkl
│   └── scaler.pkl
├── data/                  # Training data
└── logs/                  # Application logs
```

## 🔍 Troubleshooting

### Issue: Models not loading

**Solution:**
- Ensure you've trained the model first (run notebook)
- Check that model files exist in `ML_Model/models/`
- Verify file paths in `app.py`

### Issue: Port 5000 already in use

**Solution:**
Edit `docker-compose.yml`:
```yaml
ports:
  - "5001:5000"  # Change left side to any available port
```

### Issue: Docker container won't start

**Solution:**
```powershell
# View detailed logs
docker-compose logs ml-api

# Rebuild without cache
docker-compose build --no-cache
docker-compose up
```

### Issue: "Cannot connect to Docker daemon"

**Solution:**
- Make sure Docker Desktop is running
- On Windows, check that Docker Desktop is set to use Windows containers or WSL2

### Issue: Permission denied on Linux/Mac

**Solution:**
```bash
# Make script executable
chmod +x start.sh

# Or run with sudo
sudo docker-compose up
```

## 🔒 Security Best Practices

For production deployment:

1. **Change default ports**
2. **Set strong SECRET_KEY** in `.env`
3. **Enable API authentication**
4. **Use HTTPS** with SSL certificates
5. **Restrict CORS origins** (don't use `*`)
6. **Implement rate limiting**
7. **Set up proper logging and monitoring**

## 📈 Performance Optimization

- Use **gunicorn** for production (already configured)
- Enable **Redis caching** for repeated predictions
- Scale with multiple containers: `docker-compose up --scale ml-api=3`
- Use **Nginx** as reverse proxy (included in docker-compose)

## 🎓 Next Steps

1. ✅ Train and deploy model
2. ✅ Test API endpoints
3. 📊 Integrate with frontend/dashboard
4. 🔄 Set up CI/CD pipeline
5. 📈 Monitor model performance
6. 🔄 Retrain model periodically with new data

## 📞 Support

For issues or questions:
- Check the detailed README in `ML_Model/README.md`
- View API docs: http://localhost:5000/docs
- Check logs: `docker-compose logs -f`

## ✨ Features

- ✅ RESTful API with Flask
- ✅ Swagger/OpenAPI documentation
- ✅ Docker containerization
- ✅ Health checks
- ✅ Model versioning
- ✅ Batch predictions
- ✅ Error handling
- ✅ CORS support
- ✅ Logging
- ✅ Easy deployment

---

**Happy Predicting! 🚗💰**
