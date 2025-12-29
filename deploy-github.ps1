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

# Add all files
Write-Host "Adding all files to Git..." -ForegroundColor Cyan
git add .

# Check if there are changes to commit
$status = git status --porcelain
if ($status) {
    Write-Host "Committing changes..." -ForegroundColor Cyan
    git commit -m "Initial commit: Meta Trends Analyzer"
} else {
    Write-Host "No changes to commit" -ForegroundColor Yellow
}

# Set main branch
Write-Host "Setting main branch..." -ForegroundColor Cyan
git branch -M main

# Add remote (remove if exists, then add)
$remoteUrl = "https://github.com/SagiNevet/Meta-Trends-Analyzer.git"
Write-Host "Configuring remote: $remoteUrl" -ForegroundColor Cyan
git remote remove origin 2>$null
git remote add origin $remoteUrl

# Push to GitHub
Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
Write-Host "You may be prompted for GitHub credentials..." -ForegroundColor Yellow
git push -u origin main

Write-Host "=== Deployment Complete! ===" -ForegroundColor Green
Write-Host "Repository URL: $remoteUrl" -ForegroundColor Cyan

