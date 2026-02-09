# העלאה ל-GitHub ועדכון ב-Vercel

**Repository:** https://github.com/SagiNevet/Meta-Trends-Analyzer  
**Branch ב-GitHub:** `master` (חשוב – הסקריפט דוחף ל-`master`).

---

## אופציה 1: הרצת הסקריפט (מומלץ)

1. **פתח PowerShell** (לא מתוך Cursor – Win+X → Windows PowerShell או חיפוש "PowerShell").
2. **עבור לתיקיית הפרויקט:**
   ```powershell
   cd "D:\ONEDRIVE\שולחן העבודה\cursorProjects\meta-trends-analyzerV2"
   ```
   (אם שם התיקייה שונה – התאם את הנתיב)
3. **הרץ:**
   ```powershell
   .\deploy-github.ps1
   ```
4. אם יתבקש – **התחבר ל-GitHub**: שם משתמש + **Personal Access Token** (לא סיסמה).  
   יצירת Token: GitHub → Settings → Developer settings → Personal access tokens → Generate new token (עם scope `repo`).

---

## אופציה 2: פקודות Git ידניות

אם הסקריפט לא רץ, הרץ **בתיקיית הפרויקט** (PowerShell):

```powershell
git init
git branch -M master
git remote remove origin
git remote add origin https://github.com/SagiNevet/Meta-Trends-Analyzer.git
git add .
git status
git commit -m "Update: UI improvements, date styling, free text frames"
git push -u origin master
```

**אם הפרויקט כבר מחובר ל-repo** (כבר הרצת `git clone` או `remote add` בעבר):
```powershell
git add .
git status
git commit -m "Update: UI improvements, date styling, free text frames"
git push origin master
```

**אם ה-push נדחה** (למשל "rejected – non-fast-forward"):
- אם אתה רוצה **להחליף** את מה שיש ב-GitHub בגרסה המקומית:  
  `git push -u origin master --force`  
  (זה מחליף את ההיסטוריה ב-GitHub – השתמש רק אם אתה בטוח.)

---

## אחרי ה-Push

- **Vercel** מעדכן אוטומטית אם הפרויקט מחובר ל-repo ב-GitHub.  
- בדוק ב-dashboard של Vercel: Deployments – אמור להופיע deployment חדש.  
- **חשוב:** ב-Vercel הוסף את משתני הסביבה (Environment Variables) כמו ב-`.env.local`:  
  `ALPHA_VANTAGE_API_KEY`, `GOOGLE_TRENDS_COOKIE` (אם רלוונטי) וכו'.

---

## אם ה-repo עדיין לא קיים ב-GitHub

1. היכנס ל-https://github.com/new  
2. צור repo חדש (למשל `Meta-Trends-Analyzer`).  
3. **אל** תסמן "Add a README" – תהיה כבר קומט מקומי.  
4. עדכן ב-`deploy-github.ps1` את `$remoteUrl` לכתובת ה-repo שלך, ואז הרץ שוב את הסקריפט או את הפקודות מאופציה 2.
