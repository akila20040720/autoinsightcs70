"""
Vehicle Price Prediction API
Flask application for serving ML model predictions
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from flasgger import Swagger
import joblib
import numpy as np
import pandas as pd
import json
import os
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Swagger configuration
swagger_config = {
    "headers": [],
    "specs": [
        {
            "endpoint": 'apispec',
            "route": '/apispec.json',
            "rule_filter": lambda rule: True,
            "model_filter": lambda tag: True,
        }
    ],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
    "specs_route": "/docs"
}
swagger = Swagger(app, config=swagger_config)

# Model paths
MODEL_DIR = os.getenv('MODEL_PATH', './models')
BEST_MODEL_PATH = os.path.join(MODEL_DIR, 'best_model.pkl')
ENCODERS_PATH = os.path.join(MODEL_DIR, 'label_encoders.pkl')
SCALER_PATH = os.path.join(MODEL_DIR, 'scaler.pkl')
METADATA_PATH = os.path.join(MODEL_DIR, 'model_metadata.json')

# Global variables for loaded models
model = None
encoders = None
scaler = None
metadata = None

def load_models():
    """Load all required models and artifacts"""
    global model, encoders, scaler, metadata
    
    try:
        logger.info("Loading models...")
        
        if os.path.exists(BEST_MODEL_PATH):
            model = joblib.load(BEST_MODEL_PATH)
            logger.info("✅ Model loaded successfully")
        else:
            logger.error(f"Model not found at {BEST_MODEL_PATH}")
            
        if os.path.exists(ENCODERS_PATH):
            encoders = joblib.load(ENCODERS_PATH)
            logger.info("✅ Encoders loaded successfully")
        else:
            logger.error(f"Encoders not found at {ENCODERS_PATH}")
            
        if os.path.exists(SCALER_PATH):
            scaler = joblib.load(SCALER_PATH)
            logger.info("✅ Scaler loaded successfully")
        else:
            logger.error(f"Scaler not found at {SCALER_PATH}")
            
        if os.path.exists(METADATA_PATH):
            with open(METADATA_PATH, 'r') as f:
                metadata = json.load(f)
            logger.info("✅ Metadata loaded successfully")
        else:
            logger.warning(f"Metadata not found at {METADATA_PATH}")
            
        return True
    except Exception as e:
        logger.error(f"Error loading models: {str(e)}")
        return False

# Load models on startup
load_models()

@app.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    ---
    responses:
      200:
        description: Service is healthy
    """
    status = {
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'model_loaded': model is not None,
        'encoders_loaded': encoders is not None,
        'scaler_loaded': scaler is not None
    }
    return jsonify(status), 200

@app.route('/model/info', methods=['GET'])
def model_info():
    """
    Get model information and metadata
    ---
    responses:
      200:
        description: Model information
    """
    if metadata is None:
        return jsonify({'error': 'Model metadata not available'}), 404
    
    return jsonify(metadata), 200

@app.route('/predict', methods=['POST'])
def predict():
    """
    Predict vehicle price
    ---
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            vehicle_type:
              type: string
              example: "Car"
            make:
              type: string
              example: "Toyota"
            model:
              type: string
              example: "Axio"
            year:
              type: integer
              example: 2018
            mileage:
              type: integer
              example: 45000
            district:
              type: string
              example: "Colombo"
            condition:
              type: string
              example: "Used"
    responses:
      200:
        description: Prediction successful
      400:
        description: Invalid input
      500:
        description: Prediction error
    """
    try:
        # Get input data
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No input data provided'}), 400
        
        # Validate required fields
        required_fields = ['vehicle_type', 'make', 'model', 'year', 'mileage', 'district', 'condition']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400
        
        # Check if models are loaded
        if model is None or encoders is None or scaler is None:
            return jsonify({'error': 'Models not loaded. Please contact administrator.'}), 500
        
        # Feature engineering
        current_year = datetime.now().year
        vehicle_age = current_year - int(data['year'])
        mileage_per_year = int(data['mileage']) / (vehicle_age + 1)
        
        # Encode categorical features
        try:
            vehicle_type_encoded = encoders['Vehicle Type'].transform([data['vehicle_type']])[0]
            make_encoded = encoders['Make'].transform([data['make']])[0]
            model_encoded = encoders['Model'].transform([data['model']])[0]
            district_encoded = encoders['District'].transform([data['district']])[0]
            condition_encoded = encoders['Condition'].transform([data['condition']])[0]
        except ValueError as e:
            return jsonify({'error': f'Unknown categorical value: {str(e)}'}), 400
        
        # Create feature array
        features = np.array([[
            vehicle_type_encoded,
            make_encoded,
            model_encoded,
            district_encoded,
            condition_encoded,
            int(data['year']),
            int(data['mileage']),
            vehicle_age,
            mileage_per_year
        ]])
        
        # Scale features
        features_scaled = scaler.transform(features)
        
        # Make prediction
        prediction = model.predict(features_scaled)[0]
        
        # Format response
        response = {
            'predicted_price': float(prediction),
            'predicted_price_formatted': f"Rs. {prediction:,.2f}",
            'input_data': {
                'vehicle_type': data['vehicle_type'],
                'make': data['make'],
                'model': data['model'],
                'year': int(data['year']),
                'mileage': int(data['mileage']),
                'district': data['district'],
                'condition': data['condition'],
                'vehicle_age': vehicle_age
            },
            'timestamp': datetime.now().isoformat()
        }
        
        logger.info(f"Prediction made: {data['make']} {data['model']} ({data['year']}) -> Rs. {prediction:,.2f}")
        
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        return jsonify({'error': f'Prediction failed: {str(e)}'}), 500

@app.route('/predict/batch', methods=['POST'])
def predict_batch():
    """
    Predict prices for multiple vehicles
    ---
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            vehicles:
              type: array
              items:
                type: object
    responses:
      200:
        description: Batch prediction successful
      400:
        description: Invalid input
      500:
        description: Prediction error
    """
    try:
        data = request.get_json()
        
        if not data or 'vehicles' not in data:
            return jsonify({'error': 'No vehicles data provided'}), 400
        
        vehicles = data['vehicles']
        predictions = []
        
        for idx, vehicle in enumerate(vehicles):
            # Make single prediction for each vehicle
            response = predict_single_vehicle(vehicle)
            if 'error' in response:
                predictions.append({
                    'index': idx,
                    'error': response['error']
                })
            else:
                predictions.append({
                    'index': idx,
                    **response
                })
        
        return jsonify({
            'predictions': predictions,
            'total': len(vehicles),
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Batch prediction error: {str(e)}")
        return jsonify({'error': f'Batch prediction failed: {str(e)}'}), 500

def predict_single_vehicle(data):
    """Helper function to predict single vehicle price"""
    try:
        current_year = datetime.now().year
        vehicle_age = current_year - int(data['year'])
        mileage_per_year = int(data['mileage']) / (vehicle_age + 1)
        
        vehicle_type_encoded = encoders['Vehicle Type'].transform([data['vehicle_type']])[0]
        make_encoded = encoders['Make'].transform([data['make']])[0]
        model_encoded = encoders['Model'].transform([data['model']])[0]
        district_encoded = encoders['District'].transform([data['district']])[0]
        condition_encoded = encoders['Condition'].transform([data['condition']])[0]
        
        features = np.array([[
            vehicle_type_encoded, make_encoded, model_encoded,
            district_encoded, condition_encoded,
            int(data['year']), int(data['mileage']),
            vehicle_age, mileage_per_year
        ]])
        
        features_scaled = scaler.transform(features)
        prediction = model.predict(features_scaled)[0]
        
        return {
            'predicted_price': float(prediction),
            'predicted_price_formatted': f"Rs. {prediction:,.2f}",
            'vehicle': f"{data['make']} {data['model']} ({data['year']})"
        }
    except Exception as e:
        return {'error': str(e)}

@app.route('/encoders/values', methods=['GET'])
def get_encoder_values():
    """
    Get all possible values for categorical features
    ---
    responses:
      200:
        description: Encoder values
    """
    if encoders is None:
        return jsonify({'error': 'Encoders not loaded'}), 500
    
    encoder_values = {}
    for key, encoder in encoders.items():
        encoder_values[key] = encoder.classes_.tolist()
    
    return jsonify(encoder_values), 200

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('DEBUG', 'False').lower() == 'true'
    
    logger.info(f"Starting ML API server on port {port}")
    logger.info(f"Swagger docs available at http://localhost:{port}/docs")
    
    app.run(host='0.0.0.0', port=port, debug=debug)
