"""
Test script for ML API
Run this to verify the API is working correctly
"""

import requests
import json

# API base URL
BASE_URL = "http://localhost:5000"

def test_health():
    """Test health endpoint"""
    print("🔍 Testing /health endpoint...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print()

def test_model_info():
    """Test model info endpoint"""
    print("🔍 Testing /model/info endpoint...")
    response = requests.get(f"{BASE_URL}/model/info")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    else:
        print(f"Error: {response.text}")
    print()

def test_encoder_values():
    """Test encoder values endpoint"""
    print("🔍 Testing /encoders/values endpoint...")
    response = requests.get(f"{BASE_URL}/encoders/values")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print("Available values for categorical features:")
        for key, values in data.items():
            print(f"  {key}: {len(values)} options")
            print(f"    Examples: {values[:5]}")
    else:
        print(f"Error: {response.text}")
    print()

def test_single_prediction():
    """Test single prediction"""
    print("🔍 Testing /predict endpoint...")
    
    test_data = {
        "vehicle_type": "Car",
        "make": "Toyota",
        "model": "Axio",
        "year": 2018,
        "mileage": 45000,
        "district": "Colombo",
        "condition": "Used"
    }
    
    print(f"Input data: {json.dumps(test_data, indent=2)}")
    
    response = requests.post(f"{BASE_URL}/predict", json=test_data)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"\n✅ Prediction successful!")
        print(f"Predicted Price: {result['predicted_price_formatted']}")
        print(f"Full response: {json.dumps(result, indent=2)}")
    else:
        print(f"❌ Error: {response.text}")
    print()

def test_batch_prediction():
    """Test batch prediction"""
    print("🔍 Testing /predict/batch endpoint...")
    
    test_data = {
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
    
    print(f"Number of vehicles: {len(test_data['vehicles'])}")
    
    response = requests.post(f"{BASE_URL}/predict/batch", json=test_data)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"\n✅ Batch prediction successful!")
        print(f"Total predictions: {result['total']}")
        for pred in result['predictions']:
            if 'error' not in pred:
                print(f"  - {pred['vehicle']}: {pred['predicted_price_formatted']}")
            else:
                print(f"  - Error: {pred['error']}")
    else:
        print(f"❌ Error: {response.text}")
    print()

def test_invalid_input():
    """Test with invalid input"""
    print("🔍 Testing /predict with invalid input...")
    
    test_data = {
        "vehicle_type": "InvalidType",
        "make": "Toyota",
        "model": "Axio",
        "year": 2018,
        "mileage": 45000,
        "district": "Colombo",
        "condition": "Used"
    }
    
    response = requests.post(f"{BASE_URL}/predict", json=test_data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    print()

def main():
    """Run all tests"""
    print("=" * 60)
    print("🧪 ML API Test Suite")
    print("=" * 60)
    print()
    
    try:
        # Basic tests
        test_health()
        test_model_info()
        test_encoder_values()
        
        # Prediction tests
        test_single_prediction()
        test_batch_prediction()
        
        # Error handling
        test_invalid_input()
        
        print("=" * 60)
        print("✅ All tests completed!")
        print("=" * 60)
        
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to API")
        print("Make sure the API is running at", BASE_URL)
        print("Run: docker-compose up")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    main()
