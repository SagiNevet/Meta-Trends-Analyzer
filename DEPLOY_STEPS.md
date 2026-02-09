# הוראות העלאה ל-GitHub ו-Vercel

## שלב 1: יצירת Repository ב-GitHub

1. **פתח את GitHub** בדפדפן: https://github.com
2. **התחבר** לחשבון שלך
3. **לחץ על הכפתור הירוק** `+` בפינה הימנית העליונה
4. **בחר** `New repository`
5. **מלא את הפרטים:**
   - **Repository name:** `meta-trends-analyzer` (או כל שם שתרצה)
   - **Description:** `Advanced trend analysis tool for stocks and Google Trends`
   - **בחר:** `Public` או `Private` (כפי שאתה מעדיף)
   - **אל תסמן** `Add a README file` (כי יש לנו כבר קוד)
   - **אל תסמן** `Add .gitignore` (כי יש לנו כבר)
   - **אל תסמן** `Choose a license`
6. **לחץ** `Create repository`

## שלב 2: העתק את ה-URL של ה-Repository

לאחר יצירת ה-repository, GitHub יציג לך דף עם הוראות. **העתק את ה-URL** שנראה כך:
```
https://github.com/שם-המשתמש-שלך/meta-trends-analyzer.git
```

**שלח לי את ה-URL הזה** ואני אמשיך עם החיבור!

---

## שלב 3: חיבור הפרויקט ל-GitHub (אחרי שתשלח לי את ה-URL)

אחרי שתשלח לי את ה-URL, אני אריץ את הפקודות הבאות:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin [ה-URL שתשלח]
git push -u origin main
```

---

## שלב 4: חיבור ל-Vercel

לאחר שהקוד יעלה ל-GitHub:

1. **פתח את Vercel:** https://vercel.com
2. **התחבר** עם חשבון GitHub שלך
3. **לחץ** `Add New...` → `Project`
4. **בחר** את ה-repository `meta-trends-analyzer`
5. **Vercel יזהה אוטומטית** שזה Next.js project
6. **הוסף Environment Variables:**
   - לחץ על `Environment Variables`
   - הוסף:
     - `ALPHA_VANTAGE_API_KEY` = [המפתח שלך מ-Alpha Vantage]
     - `GOOGLE_TRENDS_API_KEY` = [המפתח שלך מ-Google Trends] (אם יש)
7. **לחץ** `Deploy`
8. **חכה** כמה דקות עד שההעלאה תסתיים
9. **קבל את ה-URL** של האתר החי!

---

## הערות חשובות:

- **Environment Variables:** ודא שיש לך את המפתחות של Alpha Vantage ו-Google Trends
- **המפתחות לא יעלו ל-GitHub** כי הם ב-`.env` שנמצא ב-`.gitignore`
- **Vercel יבנה את הפרויקט אוטומטית** ויספק לך URL פעיל

---

**תתחיל בשלב 1 ושלח לי את ה-URL של ה-repository!**

