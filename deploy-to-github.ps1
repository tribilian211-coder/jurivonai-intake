# ============================================================
#  JurivonAI — Deploy to GitHub (Windows PowerShell Script)
# ============================================================
#  This script uploads ALL files and folders (including src/,
#  prisma/, public/) to your GitHub repo in one click.
#
#  HOW TO USE:
#  1. Right-click this file → "Run with PowerShell"
#     (OR open PowerShell and run: powershell -ExecutionPolicy Bypass -File deploy-to-github.ps1)
#  2. When asked, paste your GitHub repo URL
#     (looks like: https://github.com/your-username/jurivonai-intake.git)
#  3. Wait — it will upload everything and push to GitHub
#
#  REQUIREMENTS:
#  - Git must be installed (download free from https://git-scm.com)
#  - You must have created an EMPTY repo on GitHub already
#    (github.com → New repository → DO NOT check any "initialize" boxes)
# ============================================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  JurivonAI — Deploy to GitHub" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# ─── Check: are we in the right folder? ──────────────────────
if (-not (Test-Path "package.json")) {
    Write-Host "ERROR: package.json not found in the current folder." -ForegroundColor Red
    Write-Host ""
    Write-Host "You must run this script FROM INSIDE the jurivonai-intake folder." -ForegroundColor Yellow
    Write-Host "The script file itself lives in that folder, so if you can see this" -ForegroundColor Yellow
    Write-Host "file in File Explorer, right-click it there → 'Run with PowerShell'." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Current folder: $(Get-Location)" -ForegroundColor Gray
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "OK: Found package.json — you're in the right folder." -ForegroundColor Green
Write-Host ""

# ─── Check: is git installed? ────────────────────────────────
$gitInstalled = $false
try {
    $gitVersion = git --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        $gitInstalled = $true
        Write-Host "OK: Git is installed ($gitVersion)" -ForegroundColor Green
    }
} catch {
    $gitInstalled = $false
}

if (-not $gitInstalled) {
    Write-Host ""
    Write-Host "ERROR: Git is not installed on your computer." -ForegroundColor Red
    Write-Host ""
    Write-Host "Git is a free tool. Install it from:" -ForegroundColor Yellow
    Write-Host "  https://git-scm.com/download/win" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "After installing:" -ForegroundColor Yellow
    Write-Host "  1. CLOSE this PowerShell window" -ForegroundColor Yellow
    Write-Host "  2. OPEN a new one (so Git gets detected)" -ForegroundColor Yellow
    Write-Host "  3. Run this script again" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# ─── Ask for the GitHub repo URL ─────────────────────────────
Write-Host "Paste your GitHub repository URL below." -ForegroundColor White
Write-Host "(Get this from your GitHub repo page → click the green 'Code' button → copy the URL)" -ForegroundColor Gray
Write-Host "It looks like: https://github.com/your-username/jurivonai-intake.git" -ForegroundColor Gray
Write-Host ""
$repoUrl = Read-Host "GitHub repo URL"

if ([string]::IsNullOrWhiteSpace($repoUrl)) {
    Write-Host "ERROR: No URL provided. Exiting." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Ensure URL ends with .git
if (-not $repoUrl.EndsWith(".git")) {
    $repoUrl = "$repoUrl.git"
}

Write-Host ""
Write-Host "Repository URL: $repoUrl" -ForegroundColor Cyan
Write-Host ""

# ─── Initialize git and add all files ────────────────────────
Write-Host "Step 1/4: Initializing git repository..." -ForegroundColor Yellow
if (Test-Path ".git") {
    Write-Host "  (git already initialized — skipping)" -ForegroundColor Gray
} else {
    git init 2>&1 | Out-Null
}
Write-Host "  Done." -ForegroundColor Green
Write-Host ""

Write-Host "Step 2/4: Adding all files and folders..." -ForegroundColor Yellow
git add -A 2>&1 | Out-Null
$addedCount = (git status --porcelain 2>$null | Measure-Object).Count
Write-Host "  $addedCount files staged for upload." -ForegroundColor Green
Write-Host ""

Write-Host "Step 3/4: Committing files..." -ForegroundColor Yellow
git commit -m "Deploy JurivonAI intake app" 2>&1 | Out-Null
Write-Host "  Done." -ForegroundColor Green
Write-Host ""

# ─── Set the branch to main and push ─────────────────────────
Write-Host "Step 4/4: Pushing to GitHub (this uploads everything)..." -ForegroundColor Yellow
try {
    git branch -M main 2>&1 | Out-Null
    git remote remove origin 2>$null | Out-Null
    git remote add origin $repoUrl 2>&1 | Out-Null

    Write-Host "  Uploading... (this may take 1-2 minutes)" -ForegroundColor Gray
    git push -u origin main 2>&1 | ForEach-Object {
        Write-Host "  $_" -ForegroundColor DarkGray
    }

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "============================================================" -ForegroundColor Green
        Write-Host "  SUCCESS! Your code is now on GitHub." -ForegroundColor Green
        Write-Host "============================================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor White
        Write-Host "  1. Go to your Vercel dashboard" -ForegroundColor Yellow
        Write-Host "  2. Your project should auto-redeploy (it watches GitHub)" -ForegroundColor Yellow
        Write-Host "  3. If not, click 'Redeploy' on the latest deployment" -ForegroundColor Yellow
        Write-Host "  4. Visit your Vercel URL → it should now work" -ForegroundColor Yellow
        Write-Host "  5. Admin dashboard: add #admin to your URL" -ForegroundColor Yellow
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "============================================================" -ForegroundColor Red
        Write-Host "  PUSH FAILED" -ForegroundColor Red
        Write-Host "============================================================" -ForegroundColor Red
        Write-Host ""
        Write-Host "Common causes:" -ForegroundColor Yellow
        Write-Host "  - You need to authenticate with GitHub" -ForegroundColor White
        Write-Host "    A window may have popped up asking you to sign in." -ForegroundColor Gray
        Write-Host "    If you closed it, run: git push -u origin main" -ForegroundColor Gray
        Write-Host "    and sign in when prompted." -ForegroundColor Gray
        Write-Host ""
        Write-Host "  - The repo URL is wrong" -ForegroundColor White
        Write-Host "    Check that the URL matches your GitHub repo exactly." -ForegroundColor Gray
        Write-Host ""
        Write-Host "  - The repo is not empty" -ForegroundColor White
        Write-Host "    If GitHub added a README when you created it, run:" -ForegroundColor Gray
        Write-Host "    git push -u origin main --force" -ForegroundColor Gray
        Write-Host ""
    }
} catch {
    Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Read-Host "Press Enter to exit"
