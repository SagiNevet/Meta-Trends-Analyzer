# 🚀 הוראות העלאה מהירה ל-GitHub ו-Vercel

## שלב 1: התקנת Git (אם לא מותקן)

1. הורד Git מ: https://git-scm.com/download/win
2. התקן עם כל ההגדרות המומלצות
3. פתח מחדש את PowerShell

## שלב 2: הרצת הסקריפט

פתח PowerShell בתיקיית הפרויקט והרץ:

```powershell
.\deploy-to-github.ps1
```

הסקריפט יאתחל Git repository ויכין את הכל.

## שלב 3: יצירת Repository ב-GitHub

1. לך ל-https://github.com/new
2. בחר שם ל-repository (למשל: `meta-trends-analyzer`)
3. **אל תסמן** "Initialize with README"
4. לחץ "Create repository"
5. העתק את ה-URL (למשל: `https://github.com/YOUR_USERNAME/YOUR_REPO.git`)

## שלב 4: חיבור ל-GitHub

הרץ את הפקודות הבאות (החלף `YOUR_USERNAME` ו-`YOUR_REPO`):

```powershell
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

אם תתבקש, הכנס את שם המשתמש והסיסמה של GitHub.

## שלב 5: חיבור ל-Vercel

1. לך ל-https://vercel.com
2. לחץ "Sign Up" והתחבר עם חשבון GitHub שלך
3. לחץ "Add New Project"
4. בחר את ה-repository שיצרת
5. Vercel יזהה אוטומטית שזה Next.js project
6. **הוסף Environment Variables:**
   - `ALPHA_VANTAGE_KEY` - המפתח שלך מ-Alpha Vantage
   - `GOOGLE_TRENDS_API_KEY` - המפתח שלך (אם יש)
7. לחץ "Deploy"

## ✅ סיום!

לאחר ה-deploy (2-3 דקות), תקבל קישור לאפליקציה החיה!

**דוגמה:** `https://your-project.vercel.app`

---

## 🔧 פתרון בעיות

### שגיאת Git לא נמצא:
- התקן Git מ-https://git-scm.com/download/win
- פתח מחדש את PowerShell

### שגיאת Authentication ב-GitHub:
- השתמש ב-Personal Access Token במקום סיסמה
- צור token ב: https://github.com/settings/tokens
- בחר scope: `repo`

### שגיאת Build ב-Vercel:
- ודא שה-Environment Variables מוגדרים
- בדוק את ה-Logs ב-Vercel Dashboard

