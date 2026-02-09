# 🚀 הוראות חיבור ל-Vercel

## אחרי שהקוד הועלה ל-GitHub:

### שלב 1: התחברות ל-Vercel

1. לך ל-https://vercel.com
2. לחץ **"Sign Up"** (או "Log In" אם כבר יש לך חשבון)
3. בחר **"Continue with GitHub"**
4. אשר את ההרשאות

### שלב 2: יצירת Project חדש

1. לחץ **"Add New Project"** (או **"New Project"**)
2. בחר את ה-repository שיצרת (`meta-trends-analyzer` או השם שבחרת)
3. Vercel יזהה אוטומטית שזה Next.js project ✅

### שלב 3: הגדרת Environment Variables

**לפני ה-Deploy**, לחץ על **"Environment Variables"** והוסף:

| Variable Name | Value | Required |
|--------------|-------|----------|
| `ALPHA_VANTAGE_API_KEY` | המפתח שלך מ-Alpha Vantage | ✅ כן |
| `SEARCHAPI_API_KEY` | המפתח שלך מ-SearchAPI.io (ל-Google Trends) | ⚠️ אופציונלי |

**איך להוסיף:**
1. לחץ על **"Environment Variables"**
2. לחץ **"Add New"**
3. הזן את השם (למשל: `ALPHA_VANTAGE_API_KEY`)
4. הזן את הערך (המפתח שלך)
5. בחר **"Production"**, **"Preview"**, ו-**"Development"**
6. לחץ **"Save"**
7. חזור על הפעולה לכל variable

**⚠️ חשוב:** 
- `ALPHA_VANTAGE_API_KEY` - **חובה** (ללא זה האפליקציה לא תעבוד)
- `SEARCHAPI_API_KEY` - **אופציונלי** (רק אם אתה רוצה להשתמש ב-Google Trends)

### שלב 4: Deploy!

1. לחץ **"Deploy"**
2. חכה 2-3 דקות
3. ✅ תקבל קישור לאפליקציה החיה!

**דוגמה:** `https://your-project.vercel.app`

---

## 🔄 עדכונים אוטומטיים

מעכשיו, כל פעם שתעשה:
```bash
git push
```

Vercel יעדכן אוטומטית את האפליקציה! 🚀

---

## 🔧 פתרון בעיות

### Build נכשל:
- בדוק שה-Environment Variables מוגדרים
- בדוק את ה-Logs: Vercel Dashboard → Deployments → [הדפלוי] → Build Logs

### שגיאת API:
- ודא שה-`ALPHA_VANTAGE_API_KEY` נכון
- בדוק שהמפתח פעיל ב-Alpha Vantage
- אם אתה משתמש ב-Google Trends, ודא ש-`SEARCHAPI_API_KEY` מוגדר

### הקובץ `data/alpha_listings_all.csv` לא קיים:
- זה בסדר! הקובץ לא יועלה ל-GitHub (כי הוא ב-.gitignore)
- אם צריך, אפשר להריץ `npm run alpha:download` ב-Vercel build command

---

**בהצלחה! 🎉**

