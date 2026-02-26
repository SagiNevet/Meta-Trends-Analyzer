# Meta Trends Analyzer

**ניתוח מגמות מתקדם** : חיבור בין מגמות חיפוש (Google Trends) למחיר מניה (Alpha Vantage) להערכת תזמון מוצרים.

**[▶ Live App](https://meta-trends-analyzer.vercel.app/)**

---

## מה האפליקציה עושה

- **Google Trends** : מזין מוצרים (למשל iPhone 13, iPhone 14), בוחר אזור ותקופת זמן, ומקבל גרפי עניין חיפוש לפי מקור (רשת, YouTube, תמונות, חדשות, קניות).
- **Alpha Vantage** : בוחר מניה (למשל AAPL), בוחר תקופת ניתוח, ומקבל מחירי סגירה, תשואה, תנודתיות וגרף מחירים.
- **ציר זמן מאוחד** : בתחתית: אותם גרפי Google Trends, ובריחוף על תאריך מופיע מחיר המניה בתאריך הקרוב (לא קו מניה על הגרף).
- **Global Insights** : תקופות ירידה והתאוששות במגמות, עם אחוזים ויזואליים (מילוי אנכי) והמלצות למוצר חדש.
- **ייצוא** : הורדת נתונים כ-CSV או JSON.

---

## טכנולוגיות

| רכיב | טכנולוגיה |
|------|-----------|
| Framework | Next.js 15 (App Router) |
| שפה | TypeScript |
| עיצוב | Tailwind CSS |
| גרפים | Recharts |
| APIs | SearchAPI.io (Google Trends), Alpha Vantage |

---

## הרצה מקומית

1. **Clone והתקנת תלויות**
   ```bash
   git clone <repo-url>
   cd Meta-Trends-Analyzer
   npm install
   ```

2. **משתני סביבה**  
   צור `.env.local` בשורש הפרויקט:

   ```env
   # Google Trends (SearchAPI.io) - https://www.searchapi.io/
   SEARCHAPI_API_KEY=your_key

   # Alpha Vantage - https://www.alphavantage.co/support/#api-key
   ALPHA_VANTAGE_API_KEY=your_key
   ```

3. **הפעלת שרת פיתוח**
   ```bash
   npm run dev
   ```
   פתח [http://localhost:3000](http://localhost:3000).

---

## מבנה הממשק

### מקורות נתונים
- **השתמש ב-Google Trends** : מפעיל שדות מוצרים, אזור ותקופת זמן.
- **השתמש ב-Alpha Vantage** : מפעיל בחירת חברה (סימבול) ותקופת ניתוח.

### Google Trends
- **מוצרים** : עד כמה מוצרים (שורה אחת = מוצר). תמיכה בגרירת קובץ `.txt`.
- **אזור** : רשימת מדינות (עולמי, ארה"ב, UK, וכו').
- **תקופת זמן** : כפתורי pills: 7 ימים, 30 יום, 12 חודשים, 5 שנים, כל התקופה.
- **מקור** : אחד בלבד: חיפוש ברשת, YouTube, תמונות, חדשות, קניות, Froogle.

### Alpha Vantage
- **בחר חברה** : חיפוש אוטומטי (למשל AAPL, MSFT). רשימה מקומית + API לחיפוש סימבולים.
- **תקופת ניתוח** : pills: שנה, 3 שנים, 5 שנים, 10 שנים, מקס'.

### אחרי "ניתוח מגמות"
- **Global Insights** : מגמה כללית, תקופות ירידה (אדום + מילוי אחוזים), תקופות התאוששות (ירוק), המלצות (צהוב).
- **כרטיסי מגמות** : גרף לכל מקור Google Trends, עם lifecycle (Rising/Peak/Declining/Stable), שאילתות ואזור.
- **מחיר מניה** : כותרת בסגנון Stock Quote, גרף מחירים (שבועי/יומי), מדדי תשואה ותנודתיות.
- **מגמות + מחיר מניה, ציר זמן מאוחד** : שכפול גרפי Google Trends; בריחוף על תאריך מוצג גם מחיר המניה בתאריך הקרוב (ותאריך המחיר מצוין).
- **הורד CSV / JSON** : בפוטר.

---

## API Routes

| Endpoint | תיאור |
|----------|--------|
| `POST /api/analyze` | שליחת מוצרים + פרמטרי Alpha Vantage; מחזיר מגמות ומדדי מניה |
| `GET /api/symbol-search?q=` | חיפוש סימבולים (Alpha Vantage) לאוטוקומפליט |
| `GET /api/listings` | רשימת סימבולים מקדימה (למילוי אוטומטי) |
| `POST /api/export-excel` | החזרת קובץ CSV של התוצאות |

---

## מבנה פרויקט (עיקרי)

```
Meta-Trends-Analyzer/
├── app/
│   ├── api/
│   │   ├── analyze/route.ts    # ניתוח מגמות + מניה
│   │   ├── export-excel/route.ts
│   │   ├── listings/route.ts
│   │   └── symbol-search/route.ts
│   ├── layout.tsx
│   ├── page.tsx                # דף ראשי + כל הקומפוננטות
│   ├── globals.css
│   └── icon.svg                # Favicon
├── components/
│   └── SymbolAutocomplete.tsx  # בחירת סימבול מניה
├── lib/
│   ├── types.ts
│   ├── lifecycle.ts            # ניתוח lifecycle + Global Insights
│   ├── alphaVantage.ts
│   ├── alphaListings.ts
│   └── ...
├── .env.local                  # מפתחות API (לא ב-git)
└── package.json
```

---

## משתני סביבה

| משתנה | חובה | תיאור |
|--------|------|--------|
| `SEARCHAPI_API_KEY` | כן (ל־Trends) | מפתח מ־[SearchAPI.io](https://www.searchapi.io/) |
| `ALPHA_VANTAGE_API_KEY` | כן (ל־מניה) | מפתח מ־[Alpha Vantage](https://www.alphavantage.co/support/#api-key) |

---

## רישיון

MIT.

---

**[▶ Open Live App](https://meta-trends-analyzer.vercel.app/)**
