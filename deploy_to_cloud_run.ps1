# deploy_to_cloud_run.ps1
param(
    [string]$ProjectId,
    [string]$Region = "us-central1",
    [string]$ServiceName = "foam-pro-app"
)

if ([string]::IsNullOrEmpty($ProjectId)) {
    Write-Host "Please provide your Google Cloud Project ID."
    $ProjectId = Read-Host "Project ID"
}

if ([string]::IsNullOrEmpty($ProjectId)) {
    Write-Error "Project ID is required."
    exit 1
}

# 1. Enable necessary services
Write-Host "Enabling Cloud Build and Cloud Run services..."
gcloud services enable cloudbuild.googleapis.com run.googleapis.com --project $ProjectId

# 2. Get GEMINI_API_KEY from .env.local if not set in environment
if (-not $env:GEMINI_API_KEY) {
    if (Test-Path ".env.local") {
        Write-Host "Reading GEMINI_API_KEY from .env.local..."
        Get-Content ".env.local" | ForEach-Object {
            if ($_ -match "GEMINI_API_KEY=(.*)") {
                $env:GEMINI_API_KEY = $matches[1]
            }
        }
    }
}

if (-not $env:GEMINI_API_KEY) {
    Write-Warning "GEMINI_API_KEY not found in environment or .env.local. Build might fail or app might not work."
}

# 3. Build and Push Container Image using Cloud Build
Write-Host "Building and pushing container image to gcr.io..."
gcloud builds submit --config cloudbuild.yaml --substitutions=_GEMINI_API_KEY="$env:GEMINI_API_KEY" --project $ProjectId

if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed."
    exit 1
}

# 4. Deploy to Cloud Run
$ImageUri = "gcr.io/$ProjectId/$ServiceName"
Write-Host "Deploying to Cloud Run..."
gcloud run deploy $ServiceName `
    --image $ImageUri `
    --platform managed `
    --region $Region `
    --allow-unauthenticated `
    --port 8080 `
    --project $ProjectId

Write-Host "Deployment complete!"
