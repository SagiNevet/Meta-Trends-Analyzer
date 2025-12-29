# 📋 הוראות העלאה ל-GitHub ו-Vercel

## ⚠️ חשוב: לפני שמתחילים

1. **התקן Git** (אם לא מותקן):
   - הורד מ: https://git-scm.com/download/win
   - התקן עם כל ההגדרות המומלצות
   - פתח מחדש את PowerShell

2. **צור חשבון GitHub** (אם אין):
   - לך ל-https://github.com/signup
   - הירשם בחינם

---

## שלב 1: אתחול Git Repository

פתח **PowerShell** בתיקיית הפרויקט והרץ את הפקודות הבאות:

```powershell
# עבור לתיקיית הפרויקט
cd "d:\ONEDRIVE\שולחן העבודה\cursorProjects\‏‏meta-trends-analyzerV2"

# אתחל Git repository
git init

# הוסף את כל הקבצים
git add .

# צור commit ראשוני
git commit -m "Initial commit: Meta Trends Analyzer with Alpha Vantage and Google Trends"
```

---

## שלב 2: יצירת Repository ב-GitHub

1. לך ל-https://github.com/new
2. בחר שם ל-repository (למשל: `meta-trends-analyzer`)
3. **אל תסמן** "Initialize with README" (כי יש לנו כבר קבצים)
4. **אל תסמן** "Add .gitignore" (כי יש לנו כבר)
5. לחץ **"Create repository"**
6. **העתק את ה-URL** של ה-repository (למשל: `https://github.com/YOUR_USERNAME/YOUR_REPO.git`)

---

## שלב 3: חיבור המקומי ל-GitHub

חזור ל-PowerShell והרץ (החלף `YOUR_USERNAME` ו-`YOUR_REPO`):

```powershell
# חבר את המקומי ל-GitHub
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# שנה את שם ה-branch ל-main
git branch -M main

# העלה את הקוד
git push -u origin main
```

**אם תתבקש להזין credentials:**
- **Username**: שם המשתמש שלך ב-GitHub
- **Password**: השתמש ב-**Personal Access Token** (לא הסיסמה!)

### יצירת Personal Access Token:

1. לך ל-https://github.com/settings/tokens
2. לחץ "Generate new token" → "Generate new token (classic)"
3. תן שם (למשל: "Vercel Deploy")
4. בחר scope: **`repo`** (כל התיבות)
5. לחץ "Generate token"
6. **העתק את ה-token** (תראה אותו רק פעם אחת!)
7. השתמש ב-token הזה במקום הסיסמה

---

## שלב 4: חיבור ל-Vercel

1. לך ל-https://vercel.com
2. לחץ **"Sign Up"** והתחבר עם חשבון **GitHub** שלך
3. לחץ **"Add New Project"**
4. בחר את ה-repository שיצרת (`meta-trends-analyzer`)
5. Vercel יזהה אוטומטית שזה Next.js project ✅

### הוסף Environment Variables:

לפני ה-Deploy, לחץ על **"Environment Variables"** והוסף:

| Variable Name | Value |
|--------------|-------|
| `ALPHA_VANTAGE_KEY` | המפתח שלך מ-Alpha Vantage |
| `GOOGLE_TRENDS_API_KEY` | המפתח שלך (אם יש) |

6. לחץ **"Deploy"**

---

## ✅ סיום!

לאחר 2-3 דקות, Vercel יסיים את ה-build ותקבל קישור לאפליקציה החיה!

**דוגמה:** `https://your-project.vercel.app`

---

## 🔄 עדכונים עתידיים

כל פעם שתרצה לעדכן את האפליקציה:

```powershell
git add .
git commit -m "תיאור השינוי"
git push
```

Vercel יעדכן אוטומטית! 🚀

---

## 🔧 פתרון בעיות

### שגיאת "Git לא נמצא":
- התקן Git מ-https://git-scm.com/download/win
- פתח מחדש את PowerShell

### שגיאת Authentication:
- השתמש ב-Personal Access Token במקום סיסמה
- ודא שה-token כולל scope `repo`

### שגיאת Build ב-Vercel:
- בדוק שה-Environment Variables מוגדרים
- בדוק את ה-Logs ב-Vercel Dashboard → Deployments → [הדפלוי האחרון] → Build Logs

### הקובץ `data/alpha_listings_all.csv` לא קיים:
- זה בסדר! הקובץ לא יועלה ל-GitHub (כי הוא ב-.gitignore)
- אם צריך, אפשר להריץ `npm run alpha:download` ב-Vercel build command

---

**בהצלחה! 🎉**

