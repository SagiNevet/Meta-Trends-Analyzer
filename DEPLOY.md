# הוראות העלאה ל-GitHub ו-Vercel

## שלב 1: התקנת Git

אם Git לא מותקן במחשב שלך:

1. הורד Git מ: https://git-scm.com/download/win
2. התקן עם כל ההגדרות המומלצות
3. פתח מחדש את הטרמינל

## שלב 2: יצירת Repository ב-GitHub

1. לך ל-https://github.com/new
2. בחר שם ל-repository (למשל: `meta-trends-analyzer`)
3. **אל תסמן** "Initialize with README" (כי יש לנו כבר קבצים)
4. לחץ "Create repository"

## שלב 3: העלאת הקוד ל-GitHub

פתח PowerShell בתיקיית הפרויקט והרץ:

```powershell
# אתחל Git repository
git init

# הוסף את כל הקבצים
git add .

# צור commit ראשוני
git commit -m "Initial commit: Meta Trends Analyzer with Alpha Vantage and Google Trends"

# חבר ל-GitHub (החלף YOUR_USERNAME ו-YOUR_REPO בשם שלך)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# שנה את שם ה-branch ל-main
git branch -M main

# העלה את הקוד
git push -u origin main
```

## שלב 4: חיבור ל-Vercel

1. לך ל-https://vercel.com
2. התחבר עם חשבון GitHub שלך
3. לחץ "Add New Project"
4. בחר את ה-repository שיצרת
5. Vercel יזהה אוטומטית שזה Next.js project
6. **הוסף Environment Variables:**
   - `ALPHA_VANTAGE_KEY` - המפתח שלך מ-Alpha Vantage
   - `GOOGLE_TRENDS_API_KEY` - המפתח שלך מ-Google Trends (אם יש)
7. לחץ "Deploy"

## שלב 5: הוספת CSV Data (אופציונלי)

אם יש לך קובץ `data/alpha_listings_all.csv` גדול:

1. אפשר להעלות אותו דרך Vercel Dashboard → Storage
2. או להריץ את הסקריפט `npm run alpha:download` ב-build time
3. או להעלות אותו ל-GitHub LFS (Large File Storage)

## הערות חשובות:

- **Environment Variables** חייבים להיות מוגדרים ב-Vercel כדי שהאפליקציה תעבוד
- הקובץ `data/alpha_listings_all.csv` לא יועלה ל-GitHub (כי הוא ב-.gitignore)
- אם צריך את הקובץ, אפשר להריץ `npm run alpha:download` ב-Vercel build command

## בדיקה:

לאחר ה-deploy, תקבל קישור לאפליקציה החיה (למשל: `https://your-project.vercel.app`)

