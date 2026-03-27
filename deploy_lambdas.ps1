# AWS Lambda Deployment Automation Script (Windows PowerShell)
# This script packages all Lambda functions and uploads them to S3
# Run: powershell -ExecutionPolicy Bypass -File deploy_lambdas.ps1

param(
    [string]$S3Bucket = "autoinsight-data",
    [string]$AWSProfile = "default",
    [string]$Region = "us-east-1"
)

$ErrorActionPreference = "Stop"

Write-Host "================================" -ForegroundColor Cyan
Write-Host "AWS Lambda Deployment Script" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Configuration
$ScriptDir = Get-Location
$DeployDir = "$ScriptDir\lambda_deployment"
$LambdaFunctions = @(
    @{
        Name = "scrape"
        Handler = "lambda_scrape_to_s3.lambda_handler"
        Requirements = "requirements_lambda_scrape.txt"
        Runtime = "python3.11"
        Timeout = 900
        Memory = 3008
    },
    @{
        Name = "clean"
        Handler = "lambda_data_cleaning.lambda_handler"
        Requirements = "requirements_lambda_clean.txt"
        Runtime = "python3.11"
        Timeout = 300
        Memory = 1024
    },
    @{
        Name = "train"
        Handler = "lambda_model_training.lambda_handler"
        Requirements = "requirements_lambda_train.txt"
        Runtime = "python3.11"
        Timeout = 600
        Memory = 3008
    },
    @{
        Name = "api"
        Handler = "lambda_prediction_api.lambda_handler"
        Requirements = "requirements_lambda_api.txt"
        Runtime = "python3.11"
        Timeout = 60
        Memory = 1024
    }
)

# Step 1: Create deployment directory
Write-Host "[1/5] Creating deployment directory..." -ForegroundColor Yellow
Remove-Item -Path $DeployDir -Recurse -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $DeployDir | Out-Null

foreach ($lambda in $LambdaFunctions) {
    $packageDir = "$DeployDir\$($lambda.Name)_package"
    New-Item -ItemType Directory -Path $packageDir | Out-Null
    Write-Host "  ✓ Created $packageDir"
}

# Step 2: Install dependencies
Write-Host "`n[2/5] Installing Python dependencies..." -ForegroundColor Yellow
foreach ($lambda in $LambdaFunctions) {
    $packageDir = "$DeployDir\$($lambda.Name)_package"
    $reqFile = "$ScriptDir\$($lambda.Requirements)"
    
    if (Test-Path $reqFile) {
        Write-Host "  Installing for $($lambda.Name)..." -ForegroundColor Gray
        pip install -q -t $packageDir -r $reqFile
        Write-Host "  ✓ Installed for $($lambda.Name)"
    } else {
        Write-Host "  ⚠ Requirements file not found: $reqFile" -ForegroundColor Yellow
    }
}

# Step 3: Copy Lambda handler files
Write-Host "`n[3/5] Copying Lambda handler files..." -ForegroundColor Yellow
foreach ($lambda in $LambdaFunctions) {
    $sourceFile = "$ScriptDir\lambda_$($lambda.Name)_*.py"
    $packageDir = "$DeployDir\$($lambda.Name)_package"
    
    $files = Get-ChildItem -Path $sourceFile -ErrorAction SilentlyContinue
    if ($files) {
        Copy-Item -Path $files[0] -Destination $packageDir -Force
        Write-Host "  ✓ Copied $($files[0].Name)"
    } else {
        Write-Host "  ⚠ Handler file not found: $sourceFile" -ForegroundColor Yellow
    }
}

# Step 4: Create deployment ZIPs
Write-Host "`n[4/5] Creating deployment ZIP files..." -ForegroundColor Yellow
foreach ($lambda in $LambdaFunctions) {
    $packageDir = "$DeployDir\$($lambda.Name)_package"
    $zipPath = "$DeployDir\lambda_$($lambda.Name).zip"
    
    # Remove existing ZIP
    if (Test-Path $zipPath) { Remove-Item $zipPath }
    
    # Compress-Archive requires absolute paths
    $absPackageDir = (Resolve-Path $packageDir).Path
    $absZipPath = (Resolve-Path $DeployDir).Path
    
    Push-Location $absPackageDir
    $files = Get-ChildItem -Recurse
    $files | Where-Object { !$_.PSIsContainer } | ForEach-Object {
        $relativePath = $_.FullName.Substring($absPackageDir.Length + 1)
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        [System.IO.Compression.ZipFile]::CreateFromDirectory($absPackageDir, "$absZipPath\lambda_$($lambda.Name).zip")
    }
    Pop-Location
    
    # Alternative using 7z if available
    if (Get-Command 7z -ErrorAction SilentlyContinue) {
        & 7z a -r "$zipPath" "$packageDir\*" | Out-Null
        Write-Host "  ✓ Created $zipPath"
    } else {
        Write-Host "  ⚠ 7-Zip not found, using Compress-Archive (may be slower)"
        Compress-Archive -Path "$packageDir\*" -DestinationPath $zipPath -Force
        Write-Host "  ✓ Created $zipPath"
    }
}

# Step 5: Upload to S3 (optional)
Write-Host "`n[5/5] S3 Upload Configuration..." -ForegroundColor Yellow
Write-Host "  ZIPs ready in: $DeployDir" -ForegroundColor Gray
Write-Host "  Upload manually to S3 or use AWS CLI:" -ForegroundColor Gray
Write-Host ""
foreach ($lambda in $LambdaFunctions) {
    Write-Host "    aws s3 cp '$DeployDir\lambda_$($lambda.Name).zip' s3://$S3Bucket/lambda-deployments/ --profile $AWSProfile --region $Region" -ForegroundColor Green
}

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "✓ Deployment packages created!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Go to AWS Lambda Console" -ForegroundColor Gray
Write-Host "2. For each function, upload the corresponding ZIP file" -ForegroundColor Gray
Write-Host "3. Set environment variables and configure triggers" -ForegroundColor Gray
Write-Host ""
Write-Host "Deploy time: $(Get-Date)" -ForegroundColor Gray
