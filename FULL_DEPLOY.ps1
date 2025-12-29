# 🚀 סקריפט העלאה מלא ל-GitHub ו-Vercel
# סקריפט זה יעשה את כל העבודה עד השלב שבו תצטרך להזין credentials

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🚀 העלאה אוטומטית ל-GitHub ו-Vercel" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# בדוק אם Git מותקן
Write-Host "📦 בודק אם Git מותקן..." -ForegroundColor Yellow
try {
    $gitVersion = git --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Git מותקן: $gitVersion" -ForegroundColor Green
    } else {
        throw "Git not found"
    }
} catch {
    Write-Host "❌ Git לא מותקן!" -ForegroundColor Red
    Write-Host ""
    Write-Host "אנא התקן Git מ: https://git-scm.com/download/win" -ForegroundColor Yellow
    Write-Host "לאחר ההתקנה, פתח מחדש את PowerShell והרץ את הסקריפט שוב." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "לחץ Enter כדי לסגור"
    exit 1
}

# בדוק אם כבר יש Git repository
if (Test-Path .git) {
    Write-Host "⚠️  כבר יש Git repository כאן" -ForegroundColor Yellow
    $continue = Read-Host "האם להמשיך? (y/n)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        exit 0
    }
} else {
    Write-Host "📦 מאתחל Git repository..." -ForegroundColor Cyan
    git init
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ שגיאה באתחול Git repository" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Git repository נוצר בהצלחה" -ForegroundColor Green
}

# הוסף את כל הקבצים
Write-Host ""
Write-Host "📝 מוסיף קבצים ל-Git..." -ForegroundColor Cyan
git add .
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ שגיאה בהוספת קבצים" -ForegroundColor Red
    exit 1
}
Write-Host "✅ כל הקבצים נוספו" -ForegroundColor Green

# בדוק אם יש שינויים ל-commit
$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "ℹ️  אין שינויים חדשים ל-commit" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "💾 יוצר commit ראשוני..." -ForegroundColor Cyan
    git commit -m "Initial commit: Meta Trends Analyzer with Alpha Vantage and Google Trends"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ שגיאה ביצירת commit" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Commit נוצר בהצלחה" -ForegroundColor Green
}

# בדוק אם כבר יש remote
$remote = git remote get-url origin 2>&1
if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($remote)) {
    Write-Host ""
    Write-Host "ℹ️  כבר יש remote מוגדר: $remote" -ForegroundColor Yellow
    $changeRemote = Read-Host "האם לשנות? (y/n)"
    if ($changeRemote -eq "y" -or $changeRemote -eq "Y") {
        git remote remove origin
    } else {
        Write-Host ""
        Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host "  ✅ הכל מוכן! הרץ את הפקודות הבאות:" -ForegroundColor Green
        Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host ""
        Write-Host "git push -u origin main" -ForegroundColor Cyan
        Write-Host ""
        exit 0
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  📋 שלב 1: יצירת Repository ב-GitHub" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. לך ל-https://github.com/new" -ForegroundColor White
Write-Host "2. בחר שם ל-repository (למשל: meta-trends-analyzer)" -ForegroundColor White
Write-Host "3. אל תסמן 'Initialize with README'" -ForegroundColor White
Write-Host "4. לחץ 'Create repository'" -ForegroundColor White
Write-Host "5. העתק את ה-URL של ה-repository" -ForegroundColor White
Write-Host ""
$repoUrl = Read-Host "הדבק כאן את ה-URL של ה-repository (למשל: https://github.com/username/repo.git)"

if ([string]::IsNullOrWhiteSpace($repoUrl)) {
    Write-Host "❌ לא הוזן URL" -ForegroundColor Red
    exit 1
}

# הוסף remote
Write-Host ""
Write-Host "🔗 מחבר ל-GitHub..." -ForegroundColor Cyan
git remote add origin $repoUrl
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ שגיאה בחיבור ל-GitHub" -ForegroundColor Red
    Write-Host "ייתכן שה-URL לא תקין או שכבר יש remote" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ חובר ל-GitHub בהצלחה" -ForegroundColor Green

# שנה branch ל-main
Write-Host ""
Write-Host "🌿 משנה branch ל-main..." -ForegroundColor Cyan
git branch -M main
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  לא הצלחתי לשנות branch (אולי כבר main)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  📤 שלב 2: העלאת הקוד ל-GitHub" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "עכשיו אעלה את הקוד ל-GitHub..." -ForegroundColor Yellow
Write-Host "תתבקש להזין את שם המשתמש והסיסמה (או Personal Access Token)" -ForegroundColor Yellow
Write-Host ""
Read-Host "לחץ Enter כדי להמשיך"

git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "  ✅ הקוד הועלה ל-GitHub בהצלחה!" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  🚀 שלב 3: חיבור ל-Vercel" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "עכשיו צריך לחבר את ה-repository ל-Vercel:" -ForegroundColor White
    Write-Host ""
    Write-Host "1. לך ל-https://vercel.com" -ForegroundColor White
    Write-Host "2. התחבר עם חשבון GitHub שלך" -ForegroundColor White
    Write-Host "3. לחץ 'Add New Project'" -ForegroundColor White
    Write-Host "4. בחר את ה-repository: $repoUrl" -ForegroundColor White
    Write-Host "5. הוסף Environment Variables:" -ForegroundColor White
    Write-Host "   - ALPHA_VANTAGE_KEY (המפתח שלך מ-Alpha Vantage)" -ForegroundColor Yellow
    Write-Host "   - GOOGLE_TRENDS_API_KEY (אם יש)" -ForegroundColor Yellow
    Write-Host "6. לחץ 'Deploy'" -ForegroundColor White
    Write-Host ""
    Write-Host "✅ לאחר ה-Deploy, כל שינוי ב-GitHub יעדכן אוטומטית את Vercel!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ שגיאה בהעלאת הקוד" -ForegroundColor Red
    Write-Host ""
    Write-Host "אם יש בעיית authentication:" -ForegroundColor Yellow
    Write-Host "1. השתמש ב-Personal Access Token במקום סיסמה" -ForegroundColor White
    Write-Host "2. צור token ב: https://github.com/settings/tokens" -ForegroundColor White
    Write-Host "3. בחר scope: repo" -ForegroundColor White
    Write-Host ""
    Write-Host "נסה שוב עם הפקודה:" -ForegroundColor Yellow
    Write-Host "git push -u origin main" -ForegroundColor Cyan
    Write-Host ""
}

Read-Host "לחץ Enter כדי לסגור"

