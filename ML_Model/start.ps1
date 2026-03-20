# AutoInsight ML Pipeline - Quick Start Script
# Run this script to build and start the ML API

Write-Host "=" -NoNewline; Write-Host ("=" * 58)
Write-Host "🚀 AutoInsight ML Pipeline - Docker Setup"
Write-Host "=" -NoNewline; Write-Host ("=" * 58)
Write-Host ""

# Check if Docker is installed
Write-Host "🔍 Checking Docker installation..."
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker is installed: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Docker Desktop from https://www.docker.com/products/docker-desktop"
    exit 1
}

# Check if Docker Compose is installed
Write-Host "🔍 Checking Docker Compose installation..."
try {
    $composeVersion = docker-compose --version
    Write-Host "✅ Docker Compose is installed: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose is not installed" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Check if models exist
Write-Host "🔍 Checking for trained models..."
$modelsDir = ".\models"
$modelFiles = @(
    "best_model.pkl",
    "label_encoders.pkl",
    "scaler.pkl"
)

$missingModels = @()
foreach ($file in $modelFiles) {
    $path = Join-Path $modelsDir $file
    if (-Not (Test-Path $path)) {
        $missingModels += $file
    }
}

if ($missingModels.Count -gt 0) {
    Write-Host "⚠️  Warning: Missing model files:" -ForegroundColor Yellow
    foreach ($file in $missingModels) {
        Write-Host "   - $file" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "Please train the model first by running the notebook:" -ForegroundColor Yellow
    Write-Host "   web_scrapping/Automations/automate.ipynb" -ForegroundColor Yellow
    Write-Host ""
    
    $response = Read-Host "Continue anyway? (y/N)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "Exiting..."
        exit 0
    }
} else {
    Write-Host "✅ All model files found!" -ForegroundColor Green
}

Write-Host ""

# Setup environment file
Write-Host "🔧 Setting up environment..."
if (-Not (Test-Path ".\.env")) {
    Copy-Item ".\.env.example" ".\.env"
    Write-Host "✅ Created .env file from template" -ForegroundColor Green
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}

Write-Host ""

# Ask user what to do
Write-Host "Select an action:"
Write-Host "1. Build and start services (detached mode)"
Write-Host "2. Build and start services (with logs)"
Write-Host "3. Stop services"
Write-Host "4. View logs"
Write-Host "5. Restart services"
Write-Host "6. Run tests"
Write-Host "0. Exit"
Write-Host ""

$choice = Read-Host "Enter your choice"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🏗️  Building and starting services in detached mode..." -ForegroundColor Cyan
        docker-compose up -d --build
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✅ Services started successfully!" -ForegroundColor Green
            Write-Host ""
            Write-Host "🌐 API is available at:" -ForegroundColor Green
            Write-Host "   - API: http://localhost:5000" -ForegroundColor Green
            Write-Host "   - Swagger Docs: http://localhost:5000/docs" -ForegroundColor Green
            Write-Host "   - Health Check: http://localhost:5000/health" -ForegroundColor Green
            Write-Host ""
            Write-Host "📊 View logs with: docker-compose logs -f" -ForegroundColor Cyan
            Write-Host "🛑 Stop services with: docker-compose down" -ForegroundColor Cyan
        }
    }
    "2" {
        Write-Host ""
        Write-Host "🏗️  Building and starting services with logs..." -ForegroundColor Cyan
        Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
        docker-compose up --build
    }
    "3" {
        Write-Host ""
        Write-Host "🛑 Stopping services..." -ForegroundColor Cyan
        docker-compose down
        Write-Host "✅ Services stopped" -ForegroundColor Green
    }
    "4" {
        Write-Host ""
        Write-Host "📊 Viewing logs (Press Ctrl+C to exit)..." -ForegroundColor Cyan
        docker-compose logs -f
    }
    "5" {
        Write-Host ""
        Write-Host "🔄 Restarting services..." -ForegroundColor Cyan
        docker-compose restart
        Write-Host "✅ Services restarted" -ForegroundColor Green
    }
    "6" {
        Write-Host ""
        Write-Host "🧪 Running API tests..." -ForegroundColor Cyan
        Write-Host "Make sure the API is running first!" -ForegroundColor Yellow
        Write-Host ""
        python test_api.py
    }
    "0" {
        Write-Host "Exiting..."
        exit 0
    }
    default {
        Write-Host "Invalid choice" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "=" -NoNewline; Write-Host ("=" * 58)
Write-Host "Done!"
Write-Host "=" -NoNewline; Write-Host ("=" * 58)
