# הוראות העלאה ל-GitHub - הרצה ידנית

## ⚠️ חשוב: הרץ את הפקודות הבאות ב-Git Bash או PowerShell רגיל

פתח **Git Bash** (או PowerShell רגיל) והרץ את הפקודות הבאות **בסדר**:

---

## שלב 1: עבור לתיקיית הפרויקט

```bash
cd "d:\ONEDRIVE\שולחן העבודה\cursorProjects\‏‏meta-trends-analyzerV2"
```

---

## שלב 2: אתחל Git repository (אם עדיין לא)

```bash
git init
```

---

## שלב 3: הגדר את פרטי המשתמש (אם עדיין לא הוגדר)

```bash
git config user.name "SagiNevet"
git config user.email "saginevet@users.noreply.github.com"
```

---

## שלב 4: הוסף את כל הקבצים

```bash
git add .
```

---

## שלב 5: צור commit ראשוני

```bash
git commit -m "Initial commit: Meta Trends Analyzer"
```

---

## שלב 6: הגדר את ה-branch הראשי

```bash
git branch -M main
```

---

## שלב 7: הוסף את ה-remote של GitHub

```bash
git remote add origin https://github.com/SagiNevet/Meta-Trends-Analyzer.git
```

**אם יש כבר remote בשם origin, הרץ:**
```bash
git remote remove origin
git remote add origin https://github.com/SagiNevet/Meta-Trends-Analyzer.git
```

---

## שלב 8: דחוף את הקוד ל-GitHub

```bash
git push -u origin main
```

**⚠️ הערה:** יתכן שתתבקש להזין את שם המשתמש והסיסמה של GitHub.
- אם יש לך **Personal Access Token**, השתמש בו במקום הסיסמה
- אם אין לך Personal Access Token, תוכל ליצור אחד כאן: https://github.com/settings/tokens

---

## ✅ אחרי שהקוד יעלה ל-GitHub:

1. **פתח את ה-repository** ב-GitHub: https://github.com/SagiNevet/Meta-Trends-Analyzer
2. **ודא** שהקוד עלה בהצלחה
3. **המשך להוראות Vercel** בקובץ `VERCEL_SETUP.md`

---

## 🆘 אם יש שגיאות:

### שגיאה: "fatal: not a git repository"
**פתרון:** הרץ `git init` שוב

### שגיאה: "remote origin already exists"
**פתרון:** הרץ `git remote remove origin` ואז `git remote add origin ...`

### שגיאה: "Authentication failed"
**פתרון:** 
1. צור Personal Access Token ב-GitHub: https://github.com/settings/tokens
2. השתמש ב-token במקום הסיסמה

### שגיאה: "Updates were rejected"
**פתרון:** אם יש כבר קוד ב-repository, הרץ:
```bash
git pull origin main --allow-unrelated-histories
git push -u origin main
```

---

**הרץ את כל הפקודות בסדר ואמור לי כשסיימת!**

