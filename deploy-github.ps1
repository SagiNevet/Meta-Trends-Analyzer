# Deploy to GitHub Script
$ErrorActionPreference = "Stop"

# Get the project directory (where this script is located)
$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectDir

Write-Host "=== Deploying to GitHub ===" -ForegroundColor Green
Write-Host "Project directory: $projectDir" -ForegroundColor Cyan

# Check if Git is installed
try {
    $gitVersion = git --version
    Write-Host "Git found: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Git is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check if already a git repository
if (Test-Path ".git") {
    Write-Host "Git repository already initialized" -ForegroundColor Yellow
} else {
    Write-Host "Initializing Git repository..." -ForegroundColor Cyan
    git init
}

# Configure Git user (if not already configured)
$gitUser = git config user.name
$gitEmail = git config user.email

if (-not $gitUser) {
    Write-Host "Git user not configured. Using default values..." -ForegroundColor Yellow
    git config user.name "SagiNevet"
    git config user.email "saginevet@users.noreply.github.com"
}

# Use master to match GitHub repo (https://github.com/SagiNevet/Meta-Trends-Analyzer)
$branch = "master"
git branch -M $branch 2>$null

# Remote URL - must match your repository
$remoteUrl = "https://github.com/SagiNevet/Meta-Trends-Analyzer.git"
if (-not (git remote get-url origin 2>$null)) {
    Write-Host "Adding remote: $remoteUrl" -ForegroundColor Cyan
    git remote add origin $remoteUrl
} else {
    git remote set-url origin $remoteUrl 2>$null
}

# Add all files (respects .gitignore - .env.local not included)
Write-Host "Adding all files..." -ForegroundColor Cyan
git add .

# Check if there are changes to commit
$status = git status --porcelain
if ($status) {
    Write-Host "Committing changes..." -ForegroundColor Cyan
    git commit -m "Update project"
} else {
    Write-Host "No changes to commit (working tree clean)" -ForegroundColor Yellow
}

# Push to GitHub (triggers Vercel deploy if connected)
Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
Write-Host "If prompted: use GitHub username + Personal Access Token (not password)" -ForegroundColor Yellow
$pushResult = git push -u origin $branch 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Push failed. If rejected, run: git push origin master --force" -ForegroundColor Yellow
    Write-Host $pushResult
    exit 1
}

Write-Host "=== Deployment Complete! ===" -ForegroundColor Green
Write-Host "Repository URL: $remoteUrl" -ForegroundColor Cyan

