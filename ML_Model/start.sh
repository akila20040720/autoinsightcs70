#!/bin/bash
# AutoInsight ML Pipeline - Quick Start Script (Linux/Mac)
# Run this script to build and start the ML API

echo "============================================================"
echo "🚀 AutoInsight ML Pipeline - Docker Setup"
echo "============================================================"
echo ""

# Check if Docker is installed
echo "🔍 Checking Docker installation..."
if command -v docker &> /dev/null; then
    echo "✅ Docker is installed: $(docker --version)"
else
    echo "❌ Docker is not installed"
    echo "Please install Docker from https://www.docker.com/"
    exit 1
fi

# Check if Docker Compose is installed
echo "🔍 Checking Docker Compose installation..."
if command -v docker-compose &> /dev/null; then
    echo "✅ Docker Compose is installed: $(docker-compose --version)"
else
    echo "❌ Docker Compose is not installed"
    exit 1
fi

echo ""

# Check if models exist
echo "🔍 Checking for trained models..."
MODELS_DIR="./models"
MODEL_FILES=("best_model.pkl" "label_encoders.pkl" "scaler.pkl")
MISSING_MODELS=()

for file in "${MODEL_FILES[@]}"; do
    if [ ! -f "$MODELS_DIR/$file" ]; then
        MISSING_MODELS+=("$file")
    fi
done

if [ ${#MISSING_MODELS[@]} -gt 0 ]; then
    echo "⚠️  Warning: Missing model files:"
    for file in "${MISSING_MODELS[@]}"; do
        echo "   - $file"
    done
    echo ""
    echo "Please train the model first by running the notebook:"
    echo "   web_scrapping/Automations/automate.ipynb"
    echo ""
    
    read -p "Continue anyway? (y/N): " response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "Exiting..."
        exit 0
    fi
else
    echo "✅ All model files found!"
fi

echo ""

# Setup environment file
echo "🔧 Setting up environment..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ Created .env file from template"
else
    echo "✅ .env file already exists"
fi

echo ""

# Ask user what to do
echo "Select an action:"
echo "1. Build and start services (detached mode)"
echo "2. Build and start services (with logs)"
echo "3. Stop services"
echo "4. View logs"
echo "5. Restart services"
echo "6. Run tests"
echo "0. Exit"
echo ""

read -p "Enter your choice: " choice

case $choice in
    1)
        echo ""
        echo "🏗️  Building and starting services in detached mode..."
        docker-compose up -d --build
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ Services started successfully!"
            echo ""
            echo "🌐 API is available at:"
            echo "   - API: http://localhost:5000"
            echo "   - Swagger Docs: http://localhost:5000/docs"
            echo "   - Health Check: http://localhost:5000/health"
            echo ""
            echo "📊 View logs with: docker-compose logs -f"
            echo "🛑 Stop services with: docker-compose down"
        fi
        ;;
    2)
        echo ""
        echo "🏗️  Building and starting services with logs..."
        echo "Press Ctrl+C to stop"
        docker-compose up --build
        ;;
    3)
        echo ""
        echo "🛑 Stopping services..."
        docker-compose down
        echo "✅ Services stopped"
        ;;
    4)
        echo ""
        echo "📊 Viewing logs (Press Ctrl+C to exit)..."
        docker-compose logs -f
        ;;
    5)
        echo ""
        echo "🔄 Restarting services..."
        docker-compose restart
        echo "✅ Services restarted"
        ;;
    6)
        echo ""
        echo "🧪 Running API tests..."
        echo "Make sure the API is running first!"
        echo ""
        python3 test_api.py
        ;;
    0)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "============================================================"
echo "Done!"
echo "============================================================"
