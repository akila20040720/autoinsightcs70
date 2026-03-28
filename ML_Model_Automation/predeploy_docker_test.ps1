param(
    [string]$ProjectDir = (Split-Path -Parent $MyInvocation.MyCommand.Path),
    [string]$ImageTag = "autoinsight-scraper-api:local",
    [string]$ContainerName = "autoinsight-scraper-api",
    [int]$HostPort = 8000,
    [int]$ContainerPort = 8000,
    [string]$TestMake = "Toyota",
    [int]$TestMaxPages = 2,
    [switch]$UseCache,
    [switch]$KeepContainer,
    [switch]$SkipScrape
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$results = @()

function Invoke-NativeChecked {
    param(
        [string]$FilePath,
        [string[]]$Arguments
    )

    & $FilePath @Arguments
    if ($LASTEXITCODE -ne 0) {
        $argsText = ($Arguments -join " ")
        throw "Command failed: $FilePath $argsText (exit code: $LASTEXITCODE)"
    }
}

function Add-Result {
    param(
        [string]$Name,
        [string]$Status,
        [string]$Detail
    )

    $script:results += [pscustomobject]@{
        Step = $Name
        Status = $Status
        Detail = $Detail
    }
}

function Invoke-Step {
    param(
        [string]$Name,
        [scriptblock]$Action
    )

    Write-Host "\n==> $Name" -ForegroundColor Cyan
    try {
        & $Action
        Add-Result -Name $Name -Status "PASS" -Detail "OK"
    }
    catch {
        Add-Result -Name $Name -Status "FAIL" -Detail $_.Exception.Message
        throw
    }
}

function Wait-ForHealth {
    param(
        [string]$Uri,
        [int]$Attempts = 20,
        [int]$SleepSeconds = 2
    )

    for ($i = 1; $i -le $Attempts; $i++) {
        try {
            $response = Invoke-RestMethod -Method Get -Uri $Uri -TimeoutSec 15
            if ($response.status -eq "ok") {
                return $true
            }
        }
        catch {
            Start-Sleep -Seconds $SleepSeconds
        }
    }

    throw "Health check failed after $Attempts attempts: $Uri"
}

$baseUri = "http://localhost:$HostPort"
$healthUri = "$baseUri/health"
$vehicleTypesUri = "$baseUri/vehicle-types"
$scrapeUri = "$baseUri/scrape"
$vehiclesUri = "$baseUri/vehicles?make=$TestMake&limit=20"

Push-Location $ProjectDir
try {
    Invoke-Step -Name "Check Docker CLI" -Action {
        Invoke-NativeChecked -FilePath "docker" -Arguments @("--version")
    }

    Invoke-Step -Name "Check Docker Engine" -Action {
        Invoke-NativeChecked -FilePath "docker" -Arguments @("info")
    }

    Invoke-Step -Name "Prepare output folder" -Action {
        $outputDir = Join-Path $ProjectDir "output"
        if (-not (Test-Path $outputDir)) {
            New-Item -ItemType Directory -Path $outputDir | Out-Null
        }
    }

    Invoke-Step -Name "Stop same-name container if exists" -Action {
        $existing = docker ps -a --filter "name=^/$ContainerName$" --format "{{.ID}}"
        if ($existing) {
            Invoke-NativeChecked -FilePath "docker" -Arguments @("stop", $ContainerName)
            Invoke-NativeChecked -FilePath "docker" -Arguments @("rm", $ContainerName)
        }
    }

    Invoke-Step -Name "Free requested host port" -Action {
        $portUsers = docker ps --filter "publish=$HostPort" --format "{{.Names}}"
        if ($portUsers) {
            foreach ($name in ($portUsers -split "`n" | Where-Object { $_.Trim() -ne "" })) {
                if ($name -ne $ContainerName) {
                    Invoke-NativeChecked -FilePath "docker" -Arguments @("stop", $name)
                    Invoke-NativeChecked -FilePath "docker" -Arguments @("rm", $name)
                }
            }
        }
    }

    Invoke-Step -Name "Build image" -Action {
        if ($UseCache) {
            Invoke-NativeChecked -FilePath "docker" -Arguments @("build", "-t", $ImageTag, ".")
        }
        else {
            Invoke-NativeChecked -FilePath "docker" -Arguments @("build", "--no-cache", "-t", $ImageTag, ".")
        }
    }

    Invoke-Step -Name "Run container" -Action {
        $outputDir = Join-Path $ProjectDir "output"
        Invoke-NativeChecked -FilePath "docker" -Arguments @(
            "run", "-d", "--name", $ContainerName,
            "-p", "${HostPort}:${ContainerPort}",
            "-v", "${outputDir}:/app/output",
            $ImageTag
        )
    }

    Invoke-Step -Name "Health check" -Action {
        Wait-ForHealth -Uri $healthUri | Out-Null
    }

    Invoke-Step -Name "Vehicle types endpoint" -Action {
        $typesResponse = Invoke-RestMethod -Method Get -Uri $vehicleTypesUri -TimeoutSec 30
        if (-not $typesResponse.types -or $typesResponse.types.Count -lt 1) {
            throw "No vehicle types returned"
        }
    }

    if (-not $SkipScrape) {
        Invoke-Step -Name "Scrape endpoint" -Action {
            $body = @{
                make = $TestMake
                max_pages_per_type = $TestMaxPages
                headless = $true
            } | ConvertTo-Json

            $scrapeResponse = Invoke-RestMethod -Method Post -Uri $scrapeUri -Body $body -ContentType "application/json" -TimeoutSec 600
            if ($null -eq $scrapeResponse.total) {
                throw "Scrape response missing total"
            }
        }

        Invoke-Step -Name "Vehicles endpoint" -Action {
            $vehiclesResponse = Invoke-RestMethod -Method Get -Uri $vehiclesUri -TimeoutSec 60
            if ($null -eq $vehiclesResponse.total -or $null -eq $vehiclesResponse.data) {
                throw "Vehicles response missing expected fields"
            }
        }

        Invoke-Step -Name "Output CSV exists" -Action {
            $latestCsv = Join-Path $ProjectDir "output/latest_all_vehicles.csv"
            if (-not (Test-Path $latestCsv)) {
                throw "latest_all_vehicles.csv not found"
            }

            $rows = Import-Csv $latestCsv
            if ($null -eq $rows) {
                throw "CSV import returned null"
            }
        }
    }
    else {
        Add-Result -Name "Scrape endpoint" -Status "SKIP" -Detail "Skipped by parameter"
        Add-Result -Name "Vehicles endpoint" -Status "SKIP" -Detail "Skipped by parameter"
        Add-Result -Name "Output CSV exists" -Status "SKIP" -Detail "Skipped by parameter"
    }

    Invoke-Step -Name "Restart container" -Action {
        Invoke-NativeChecked -FilePath "docker" -Arguments @("restart", $ContainerName)
        Wait-ForHealth -Uri $healthUri | Out-Null
    }

    Invoke-Step -Name "Basic load test" -Action {
        for ($i = 1; $i -le 20; $i++) {
            Invoke-RestMethod -Method Get -Uri $healthUri -TimeoutSec 15 | Out-Null
        }
    }

    Invoke-Step -Name "Check logs for critical errors" -Action {
        $logs = docker logs --tail 300 $ContainerName 2>&1
        $joined = ($logs | Out-String)
        if ($joined -match "Traceback" -or $joined -match "Unable to start Chrome/Edge webdriver") {
            throw "Critical error pattern found in logs"
        }
    }
}
catch {
    Write-Host "\nPre-deploy test ended with failure." -ForegroundColor Red
}
finally {
    Write-Host "\n=== Test Summary ===" -ForegroundColor Yellow
    $results | Format-Table -AutoSize

    $failed = @($results | Where-Object { $_.Status -eq "FAIL" }).Count
    Write-Host "\nTotal steps: $($results.Count) | Failed: $failed" -ForegroundColor Yellow

    if (-not $KeepContainer) {
        Write-Host "\nCleaning up container..." -ForegroundColor DarkYellow
        try {
            docker stop $ContainerName | Out-Null
        }
        catch {
        }
        try {
            docker rm $ContainerName | Out-Null
        }
        catch {
        }
    }

    Pop-Location

    if ($failed -gt 0) {
        exit 1
    }
    exit 0
}
