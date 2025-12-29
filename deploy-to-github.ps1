# סקריפט להעלאת הפרויקט ל-GitHub
# הרץ את הסקריפט הזה אחרי שיצרת repository ב-GitHub

Write-Host "🚀 מתחיל תהליך העלאה ל-GitHub..." -ForegroundColor Cyan

# בדוק אם Git מותקן
try {
    $gitVersion = git --version
    Write-Host "✅ Git מותקן: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git לא מותקן!" -ForegroundColor Red
    Write-Host "אנא התקן Git מ: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

# בדוק אם כבר יש Git repository
if (Test-Path .git) {
    Write-Host "⚠️  כבר יש Git repository כאן" -ForegroundColor Yellow
    $continue = Read-Host "האם להמשיך? (y/n)"
    if ($continue -ne "y") {
        exit 0
    }
} else {
    Write-Host "📦 מאתחל Git repository..." -ForegroundColor Cyan
    git init
}

# הוסף את כל הקבצים
Write-Host "📝 מוסיף קבצים ל-Git..." -ForegroundColor Cyan
git add .

# צור commit
Write-Host "💾 יוצר commit ראשוני..." -ForegroundColor Cyan
git commit -m "Initial commit: Meta Trends Analyzer with Alpha Vantage and Google Trends"

Write-Host ""
Write-Host "✅ הקוד מוכן להעלאה!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 השלבים הבאים:" -ForegroundColor Yellow
Write-Host "1. לך ל-https://github.com/new ויצור repository חדש" -ForegroundColor White
Write-Host "2. אל תסמן 'Initialize with README' (כי יש לנו כבר קבצים)" -ForegroundColor White
Write-Host "3. העתק את ה-URL של ה-repository (למשל: https://github.com/YOUR_USERNAME/YOUR_REPO.git)" -ForegroundColor White
Write-Host "4. הרץ את הפקודות הבאות (החלף YOUR_USERNAME ו-YOUR_REPO):" -ForegroundColor White
Write-Host ""
Write-Host "   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git" -ForegroundColor Cyan
Write-Host "   git branch -M main" -ForegroundColor Cyan
Write-Host "   git push -u origin main" -ForegroundColor Cyan
Write-Host ""

